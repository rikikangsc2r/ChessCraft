
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
  const [players, setPlayers] = useState<{ white: Player | null, black: Player | null }>({ white: null, black: null });
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square, to: Square } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const isGameOver = game.isGameOver();

  const deviceId = useDeviceId();
  const { toast } = useToast();
  const router = useRouter();

  const gameRef = useMemo(() => ref(database, `rooms/${roomId}`), [roomId]);
  
  const moveSound = useMemo(() => typeof window !== 'undefined' ? new Audio('https://listudy.org/sounds/standard/Move.mp3') : null, []);
  const captureSound = useMemo(() => typeof window !== 'undefined' ? new Audio('https://listudy.org/sounds/standard/Capture.mp3') : null, []);
  const gameEndSound = useMemo(() => typeof window !== 'undefined' ? new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_WEBM_/default/game-end.webm') : null, []);

  useEffect(() => {
    if (isGameOver) {
      gameEndSound?.play().catch(e => console.error("Error playing game end sound:", e));
    }
  }, [isGameOver, gameEndSound]);
  
  const updateStatus = useCallback((currentGame: Chess, currentPlayers: { white: Player | null, black: Player | null }) => {
    let newStatus = '';
    if (currentGame.isCheckmate()) newStatus = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins.`;
    else if (currentGame.isDraw()) newStatus = 'Draw!';
    else if (currentGame.isStalemate()) newStatus = 'Stalemate!';
    else if (!currentPlayers.white || !currentPlayers.black) newStatus = 'Waiting for opponent...';
    else newStatus = `${currentGame.turn() === 'w' ? 'White' : 'Black'} to move.`;
    
    if (currentGame.isCheck()) {
        newStatus = `Check! ${newStatus}`;
    }
    
    setStatus(newStatus);
  }, []);

  useEffect(() => {
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
  }, [gameRef, roomId, deviceId, router, toast, updateStatus, status]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    if (!playerColor || game.turn() !== playerColor) {
      if(playerColor) toast({ variant: 'destructive', title: 'Not your turn!' });
      return false;
    }
    if (!players.white || !players.black) {
        toast({ variant: 'destructive', title: 'Waiting for opponent', description: 'An opponent must join before you can move.' });
        return false;
    }
    
    const gameCopy = new Chess(fen);
    let moveResult = null;

    try {
      moveResult = gameCopy.move({ from, to, promotion: 'q' });
    } catch (e) {
      // This case should ideally not be reached with proper UI validation
      console.error("Invalid move:", e instanceof Error ? e.message : String(e));
      return false;
    }

    if (moveResult === null) {
      return false;
    }
    
    if (gameRef) {
        const newGameState = {
            fen: gameCopy.fen(),
            lastMove: { from: moveResult.from, to: moveResult.to },
            turn: gameCopy.turn(),
        };
        set(ref(database, `rooms/${roomId}/game`), newGameState);
    }
    
    if (moveResult.captured) {
        captureSound?.play().catch(e => console.error("Error playing capture sound:", e));
    } else {
        moveSound?.play().catch(e => console.error("Error playing move sound:", e));
    }

    setSelectedSquare(null);
    setValidMoves([]);
    return true;
  }, [game, playerColor, fen, gameRef, roomId, players, toast, captureSound, moveSound]);

  const handleSquareClick = useCallback((square: Square) => {
    if (!playerColor || isGameOver) return;

    const piece = game.get(square);

    // If a square is already selected, try to move
    if (selectedSquare) {
      // Check if the clicked square is a valid move for the selected piece
      const isMoveValid = validMoves.includes(square);
      if (isMoveValid) {
        makeMove(selectedSquare, square);
        // State will be reset inside makeMove
        return;
      }
    }
      
    // If the clicked square has a piece of the current player's color, select it
    if (piece && piece.color === playerColor && piece.color === game.turn()) {
      const newMoves = game.moves({ square, verbose: true }).map(m => m.to);
      setSelectedSquare(square);
      setValidMoves(newMoves);
    } else {
      // Otherwise, deselect
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [game, playerColor, selectedSquare, validMoves, makeMove, isGameOver]);

  return {
    fen,
    status,
    players,
    playerColor,
    turn: game.turn(),
    isGameOver,
    lastMove,
    makeMove,
    isLoading,
    handleSquareClick,
    selectedSquare,
    validMoves
  };
}
