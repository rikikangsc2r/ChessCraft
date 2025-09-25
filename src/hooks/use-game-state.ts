"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import useLocalStorage from './use-local-storage';
import { useToast } from './use-toast';
import type { GameRoom } from '@/lib/types';

export function useGameState(roomId: string) {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [players, setPlayers] = useState<{ white: string | null, black: string | null }>({ white: null, black: null });
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);
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
        
        const oneHour = 60 * 60 * 1000;
        if (roomData.createdAt && (Date.now() - roomData.createdAt > oneHour)) {
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
            if (roomData.players.white !== username && roomData.players.black !== username) {
                toast({ title: "Room is full", description: "You are now a spectator." });
                setPlayerColor('w'); 
            }
        }
    };
    
    assignPlayer();

    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData: GameRoom = snapshot.val();
        const newGame = new Chess(roomData.game.fen);
        setGame(newGame);
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
  }, [gameRef, roomId, username, router, toast, status]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    if (game.turn() !== playerColor) {
      toast({ variant: 'destructive', title: 'Not your turn!' });
      return false;
    }
    
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from, to, promotion: 'q' });
      if (move) {
        set(ref(database, `rooms/${roomId}/game`), {
            fen: gameCopy.fen(),
            history: gameCopy.history(),
            lastMove: { from: move.from, to: move.to },
            status: status,
            turn: gameCopy.turn()
        });
        return true;
      }
      return false;
    } catch (e) {
      console.log('Invalid move:', e);
      return false;
    }
  }, [game, playerColor, roomId, status, toast]);

  return {
    board: game.board(),
    fen,
    status,
    history,
    players,
    playerColor,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    lastMove,
    makeMove,
    isLoading
  };
}
