"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square, type Move, type Piece } from 'chess.js';
import { ref, onValue, set, get, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import useLocalStorage from './use-local-storage';
import { useToast } from './use-toast';
import type { GameRoom } from '@/lib/types';

export function useGameState(roomId: string) {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [fen, setFen] = useState(game.fen());
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [players, setPlayers] = useState<{ white: string | null, black: string | null }>({ white: null, black: null });
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username] = useLocalStorage('chess-username', '');
  const { toast } = useToast();
  const router = useRouter();

  const gameRef = useMemo(() => ref(database, `rooms/${roomId}`), [roomId]);
  
  useEffect(() => {
    const assignPlayer = async () => {
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) {
            toast({ variant: 'destructive', title: 'Error', description: 'This room does not exist.' });
            router.push('/');
            return;
        }

        const roomData: GameRoom = snapshot.val();
        
        // Room Expiry Check
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - roomData.createdAt > oneHour) {
          toast({ variant: 'destructive', title: 'Room Expired', description: 'This room is over an hour old and has expired.' });
          set(gameRef, null);
          router.push('/');
          return;
        }

        let assignedColor: 'w' | 'b' | null = null;
        if (roomData.players.white === username) assignedColor = 'w';
        else if (roomData.players.black === username) assignedColor = 'b';
        else if (roomData.players.white === null) {
            await set(ref(database, `rooms/${roomId}/players/white`), username);
            assignedColor = 'w';
        } else if (roomData.players.black === null) {
            await set(ref(database, `rooms/${roomId}/players/black`), username);
            assignedColor = 'b';
        }

        if (assignedColor) {
            setPlayerColor(assignedColor);
        } else {
            // Spectator or room full
            if (roomData.players.white !== username && roomData.players.black !== username) {
                toast({ title: "Room is full", description: "You are now a spectator." });
                setPlayerColor('w'); // Default to white view for spectators
            }
        }
    };
    
    assignPlayer();

    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData: GameRoom = snapshot.val();
        const newGame = new Chess(roomData.game.fen);
        setGame(newGame);
        setBoard(newGame.board());
        setFen(newGame.fen());
        setHistory(newGame.history());
        setPlayers(roomData.players);
        setLastMove(roomData.game.lastMove || null);

        let currentStatus = '';
        if (newGame.isCheckmate()) currentStatus = `Checkmate! ${newGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
        else if (newGame.isDraw()) currentStatus = 'Draw!';
        else if (newGame.isStalemate()) currentStatus = 'Stalemate!';
        else if (newGame.isCheck()) currentStatus = 'Check!';
        else currentStatus = `${newGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
        setStatus(currentStatus);
        
        if (newGame.isGameOver() && status !== currentStatus) {
            toast({ title: 'Game Over', description: currentStatus });
        }
      } else {
        toast({ title: 'Room closed', description: 'The game room no longer exists.' });
        router.push('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [gameRef, roomId, username, router, toast]);

  const legalMoves = useMemo(() => {
    if (!selectedPiece) return [];
    return game.moves({ square: selectedPiece, verbose: true });
  }, [game, selectedPiece]);

  const makeMove = useCallback((from: Square, to: Square) => {
    if (game.turn() !== playerColor) {
      toast({ variant: 'destructive', title: 'Not your turn!' });
      return;
    }
    
    try {
      const move = game.move({ from, to, promotion: 'q' }); // Auto-promote to queen for simplicity
      if (move) {
        set(ref(database, `rooms/${roomId}/game`), {
            fen: game.fen(),
            history: game.history(),
            lastMove: { from: move.from, to: move.to },
            status: status,
            turn: game.turn()
        });
        setSelectedPiece(null);
      }
    } catch (e) {
      console.log('Invalid move:', e);
      setSelectedPiece(null); // Deselect on invalid move attempt
    }
  }, [game, playerColor, roomId, status, toast]);

  return {
    board,
    fen,
    status,
    history,
    players,
    playerColor,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    lastMove,
    selectedPiece,
    setSelectedPiece,
    legalMoves,
    makeMove,
    isLoading
  };
}
