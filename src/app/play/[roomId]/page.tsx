"use client";

import { useParams } from 'next/navigation';
import { useGameState } from '@/hooks/use-game-state';
import { ChessboardWrapper } from '@/components/Chessboard';
import { GameInfo } from '@/components/GameInfo';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function GamePage() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const { toast } = useToast();

  const {
    fen,
    status,
    history,
    players,
    playerColor,
    turn,
    isGameOver,
    makeMove,
    isLoading,
    lastMove,
    handleSquareClick,
    selectedSquare,
    validMoves,
  } = useGameState(roomId);

  useEffect(() => {
    // Online/offline detection for online games
    const handleOnline = () => toast({ title: "You are back online!", description: "Game sync has resumed." });
    const handleOffline = () => toast({ variant: 'destructive', title: "You are offline", description: "You can't make moves until you reconnect." });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
          <div>
            <Skeleton className="w-full h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  const roomTitle = `Room: ${roomId}`;
  const playerInfo = playerColor 
      ? `You are playing as ${playerColor === 'w' ? 'White' : 'Black'}`
      : "You are a spectator.";

  return (
    <div className="container mx-auto p-4 max-w-5xl">
       <div className="text-center mb-4">
        <h1 className="text-2xl font-headline">{roomTitle}</h1>
        <p className="text-muted-foreground">{playerInfo}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChessboardWrapper
            fen={fen}
            playerColor={playerColor || 'w'}
            onMove={makeMove}
            isGameOver={isGameOver}
            lastMove={lastMove}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
          />
        </div>
        <div className="lg:col-span-1">
          <GameInfo
            status={status}
            turn={turn}
            history={history}
            playerColor={playerColor}
            players={players}
          />
        </div>
      </div>
    </div>
  );
}
