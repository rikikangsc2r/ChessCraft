"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square, type Piece } from 'chess.js';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useDeviceId } from './use-device-id';
import { useToast } from './use-toast';
import type { GameRoom, Player } from '@/lib/types';

export function useGameState(roomId: string) {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [players, setPlayers] = useState<{ white: Player | null, black: Player | null }>({ white: null, black: null });
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);

  const deviceId = useDeviceId();
  const { toast } = useToast();
  const router = useRouter();

  const isOffline = roomId === 'offline';
  const gameRef = useMemo(() => isOffline ? null : ref(database, `rooms/${roomId}`), [roomId, isOffline]);
  
  const updateStatus = useCallback((currentGame: Chess, currentPlayers: { white: Player | null, black: Player | null }) => {
    let newStatus = '';
    if (currentGame.isCheckmate()) newStatus = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
    else if (currentGame.isDraw()) newStatus = 'Draw!';
    else if (currentGame.isStalemate()) newStatus = 'Stalemate!';
    else if (!currentPlayers.white || !currentPlayers.black) newStatus = 'Waiting for opponent...';
    else newStatus = `${currentGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
    if (currentGame.isCheck()) newStatus = `Check! ${newStatus}`;
    
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    if (isOffline) {
      const offlineGame = new Chess();
      setGame(offlineGame);
      setFen(offlineGame.fen());
      setPlayers({ white: {id: 'p1', name: 'White'}, black: {id: 'p2', name: 'Black'} });
      setPlayerColor('w'); // In offline, you can control both, start as white
      updateStatus(offlineGame, { white: {id: 'p1', name: 'White'}, black: {id: 'p2', name: 'Black'} });
      setIsLoading(false);
      return;
    }
    
    if (!deviceId || !gameRef) return;

    const assignPlayerAndSubscribe = async () => {
      try {
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
          await set(gameRef, null);
          router.push('/');
          return;
        }
      } catch (error) {
        console.error("Failed to initialize game state:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load game data.' });
        router.push('/');
        return;
      }

      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const roomData: GameRoom = snapshot.val();
          
          let myColor: 'w' | 'b' | null = null;
          if (roomData.players.white?.id === deviceId) myColor = 'w';
          else if (roomData.players.black?.id === deviceId) myColor = 'b';
          setPlayerColor(myColor);

          const newGame = new Chess(roomData.game.fen);
          setGame(newGame);
          setFen(newGame.fen());
          setHistory(newGame.history());
          setPlayers(roomData.players);
          setLastMove(roomData.game.lastMove || null);

          updateStatus(newGame, roomData.players);
          
          if (newGame.isGameOver() && !status.includes('Checkmate') && !status.includes('Draw') && !status.includes('Stalemate')) {
              toast({ title: 'Game Over' });
          }
        } else {
          toast({ title: 'Room closed', description: 'The game room no longer exists.' });
          router.push('/');
        }
        setIsLoading(false);
      });

      return unsubscribe;
    };
    
    let unsubscribe: (() => void) | undefined;
    assignPlayerAndSubscribe().then(unsub => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [gameRef, roomId, deviceId, router, toast, status, isOffline, updateStatus]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    if (isOffline) {
      const gameCopy = new Chess(fen);
      try {
        const move = gameCopy.move({ from, to, promotion: 'q' });
        if (move) {
          setFen(gameCopy.fen());
          setHistory(gameCopy.history());
          setLastMove({from: move.from, to: move.to});
          setGame(gameCopy);
          updateStatus(gameCopy, players);
          // In offline mode, automatically switch control
          setPlayerColor(gameCopy.turn());
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    
    // Online move logic
    if (!playerColor) {
      toast({ variant: 'destructive', title: 'You are a spectator!' });
      return false;
    }
    if (game.turn() !== playerColor) {
      toast({ variant: 'destructive', title: 'Not your turn!' });
      return false;
    }
    
    if (!players.white || !players.black) {
      toast({ variant: 'destructive', title: 'Waiting for opponent', description: 'An opponent must join before you can move.' });
      return false;
    }

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from, to, promotion: 'q' });
      if (move && gameRef) {
        set(ref(database, `rooms/${roomId}/game`), {
            fen: gameCopy.fen(),
            history: gameCopy.history(),
            lastMove: { from: move.from, to: move.to },
            turn: gameCopy.turn()
        });
        return true;
      }
      return false;
    } catch (e) {
      console.log('Invalid move:', e);
      return false;
    }
  }, [game, playerColor, roomId, toast, players, status, isOffline, fen, updateStatus, gameRef]);

  const handleSquareClick = useCallback((square: Square) => {
    const piece = game.get(square);

    // If no piece is selected, or if the user clicks on their own piece
    if (!selectedSquare || (piece && piece.color === playerColor)) {
      if (piece && piece.color === playerColor) {
        const moves = game.moves({ square, verbose: true }).map(m => m.to);
        setSelectedSquare(square);
        setValidMoves(moves);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else { // A piece is selected, and user clicks another square
      const moveSuccess = makeMove(selectedSquare, square);
      if (!moveSuccess) { // If move is invalid, maybe they want to select another piece
         if (piece && piece.color === playerColor) {
            const moves = game.moves({ square, verbose: true }).map(m => m.to);
            setSelectedSquare(square);
            setValidMoves(moves);
         } else {
            setSelectedSquare(null);
            setValidMoves([]);
         }
      } else { // Move was successful
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  }, [game, makeMove, selectedSquare, playerColor]);

  return {
    fen,
    status,
    history,
    players,
    playerColor: isOffline ? (game.turn()) : playerColor,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    lastMove,
    makeMove,
    isLoading,
    handleSquareClick,
    selectedSquare,
    validMoves
  };
}
