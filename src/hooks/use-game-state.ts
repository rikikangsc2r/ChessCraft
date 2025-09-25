
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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);

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
    if (currentGame.isCheck()) newStatus = `Check! ${newStatus}`;
    
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
          setHistory(roomData.game.history || []);
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
    // Create a copy of the game to simulate the move.
    const gameCopy = new Chess(game.fen());
    
    let moveResult;
    try {
        // Attempt the move
        moveResult = gameCopy.move({ from, to, promotion: 'q' });
    } catch(e) {
        // This can happen if the move is illegal for any reason.
        console.error("Invalid move:", {from, to, promotion: 'q'});
        return false;
    }
    
    // If the move is illegal, chess.js returns null
    if (moveResult === null) return false;

    // For online games, check turns and update Firebase.
    if (!playerColor || game.turn() !== playerColor) {
        toast({ variant: 'destructive', title: 'Not your turn!' });
        return false;
    }
    if (!players.white || !players.black) {
        toast({ variant: 'destructive', title: 'Waiting for opponent', description: 'An opponent must join before you can move.' });
        return false;
    }
    if (gameRef) {
        const newGameState = {
            fen: gameCopy.fen(),
            history: gameCopy.history(),
            lastMove: { from: moveResult.from, to: moveResult.to },
            turn: gameCopy.turn(),
        };
        // Update the game state in Firebase.
        set(ref(database, `rooms/${roomId}/game`), newGameState);
    }
    
    // Reset selection after a successful move
    setSelectedSquare(null);
    setValidMoves([]);
    return true;
  }, [game, playerColor, gameRef, roomId, players, toast]);

  const handleSquareClick = useCallback((square: Square) => {
    if (!playerColor) return;

    // Function to clear selections
    const resetSelection = () => {
        setSelectedSquare(null);
        setValidMoves([]);
    };

    const piece = game.get(square);

    if (selectedSquare) {
        // A square is already selected, try to move
        const moveSuccess = makeMove(selectedSquare, square);
        
        if (!moveSuccess) {
            // If move failed, check if the user is selecting another one of their pieces
            if (piece && piece.color === playerColor) {
                const newMoves = game.moves({ square, verbose: true }).map(m => m.to);
                setSelectedSquare(square);
                setValidMoves(newMoves);
            } else {
                // Clicked on an invalid square or opponent's piece, so deselect
                resetSelection();
            }
        }
        // if move was successful, makeMove already resets selection.
    } else {
      // No square selected, select one if it's a valid piece for the current player
      if (piece && piece.color === playerColor && piece.color === game.turn()) {
        const moves = game.moves({ square, verbose: true }).map(m => m.to);
        setSelectedSquare(square);
        setValidMoves(moves);
      }
    }
  }, [game, makeMove, selectedSquare, playerColor]);

  return {
    fen,
    status,
    history,
    players,
    playerColor,
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
