"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { ref, onValue, set, get, runTransaction } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useDeviceId } from './use-device-id';
import { useToast } from './use-toast';
import type { GameRoom, Player } from '@/lib/types';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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
  const [gameKey, setGameKey] = useState(Date.now());
  const isGameOver = useMemo(() => game.isGameOver(), [game]);

  const deviceId = useDeviceId();
  const { toast } = useToast();
  const router = useRouter();

  const gameRef = useMemo(() => ref(database, `rooms/${roomId}`), [roomId]);

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
        // Initial check and setup
        try {
            const snapshot = await get(gameRef);
            if (!snapshot.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'This room does not exist.' });
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
                if (newGame.fen() === STARTING_FEN && fen !== STARTING_FEN) {
                    setGameKey(Date.now()); // Force re-render on rematch
                    toast({ title: "Rematch started!", description: "The board has been reset." });
                }

                setGame(newGame);
                setFen(newGame.fen());
                setPlayers(roomData.players);
                setLastMove(roomData.game.lastMove || null);
                updateStatus(newGame, roomData.players);

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
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [gameRef, roomId, deviceId, router, toast, updateStatus, fen]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    if (!playerColor || game.turn() !== playerColor) {
      if(playerColor) toast({ variant: 'destructive', title: 'Not your turn!' });
      return false;
    }
    if (!players.white || !players.black) {
        toast({ variant: 'destructive', title: 'Waiting for opponent' });
        return false;
    }
    
    const gameCopy = new Chess(fen);
    const moveResult = gameCopy.move({ from, to, promotion: 'q' });

    if (moveResult === null) return false;
    
    if (gameRef) {
        const updates = {
            [`rooms/${roomId}/game/fen`]: gameCopy.fen(),
            [`rooms/${roomId}/game/lastMove`]: { from: moveResult.from, to: moveResult.to },
            [`rooms/${roomId}/game/turn`]: gameCopy.turn(),
        };
        set(ref(database), updates);
    }

    setSelectedSquare(null);
    setValidMoves([]);
    return true;
  }, [game, playerColor, fen, gameRef, roomId, players, toast]);

  const sendRematch = useCallback(() => {
    if (!playerColor) return;
    const playerRematchRef = ref(database, `rooms/${roomId}/rematch/${playerColor === 'w' ? 'white' : 'black'}`);
    set(playerRematchRef, true);

    // Check if opponent has also requested rematch
    runTransaction(ref(database, `rooms/${roomId}`), (room) => {
        if (room && room.rematch.white && room.rematch.black) {
            room.game = {
                fen: STARTING_FEN,
                history: [],
                lastMove: null,
                status: 'White to move.',
                turn: 'w'
            };
            room.rematch = { white: false, black: false };
        }
        return room;
    });
  }, [playerColor, roomId]);

  const handleSquareClick = useCallback((square: Square) => {
    if (!playerColor || isGameOver) return;

    if (selectedSquare) {
      if (validMoves.includes(square)) {
        makeMove(selectedSquare, square);
        return;
      }
    }
      
    if (game.get(square)?.color === playerColor && game.turn() === playerColor) {
      setSelectedSquare(square);
      setValidMoves(game.moves({ square, verbose: true }).map(m => m.to));
    } else {
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
    sendRematch,
    isLoading,
    handleSquareClick,
    selectedSquare,
    validMoves,
    gameKey
  };
}
