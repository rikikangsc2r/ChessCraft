"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
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
  const deviceId = useDeviceId();
  const { toast } = useToast();
  const router = useRouter();

  const gameRef = useMemo(() => ref(database, `rooms/${roomId}`), [roomId]);
  
  useEffect(() => {
    if (!deviceId) return;

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

        let assignedColor: 'w' | 'b' | null = null;
        if (roomData.players.white?.id === deviceId) {
          assignedColor = 'w';
        } else if (roomData.players.black?.id === deviceId) {
          assignedColor = 'b';
        }
        
        setPlayerColor(assignedColor);

        if (!assignedColor && roomData.players.white && roomData.players.black) {
          toast({ title: "Room is full", description: "You are now a spectator." });
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
          
          // Re-check player color on each update to handle joining players
          if (roomData.players.white?.id === deviceId) {
            setPlayerColor('w');
          } else if (roomData.players.black?.id === deviceId) {
            setPlayerColor('b');
          } else {
            setPlayerColor(null); // Spectator
          }

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
          else if (!roomData.players.white || !roomData.players.black) currentStatus = 'Waiting for opponent...';
          else currentStatus = `${newGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
          
          if (status !== currentStatus) {
            setStatus(currentStatus);
          }
          
          if (newGame.isGameOver() && !status.includes('Checkmate') && !status.includes('Draw') && !status.includes('Stalemate')) {
              toast({ title: 'Game Over', description: currentStatus });
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
  }, [gameRef, roomId, deviceId, router, toast, status]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
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
      if (move) {
        set(ref(database, `rooms/${roomId}/game`), {
            fen: gameCopy.fen(),
            history: gameCopy.history(),
            lastMove: { from: move.from, to: move.to },
            status: status, // status is now managed by onValue
            turn: gameCopy.turn()
        });
        return true;
      }
      return false;
    } catch (e) {
      console.log('Invalid move:', e);
      return false;
    }
  }, [game, playerColor, roomId, toast, players, status]);

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
