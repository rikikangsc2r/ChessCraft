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
  } = useGameState(roomId);

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => toast({ title: "You are back online!", description: "Game sync has resumed." });
    const handleOffline = () => toast({ variant: 'destructive', title: "You are offline", description: "You can play locally, but moves won't be synced." });

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
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
       <div className="text-center mb-4">
        <h1 className="text-2xl font-headline">Room: {roomId}</h1>
        {playerColor && (
          <p className="text-muted-foreground">You are playing as {playerColor === 'w' ? 'White' : 'Black'}</p>
        )}
        {!playerColor && (
          <p className="text-muted-foreground">You are a spectator.</p>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChessboardWrapper
            fen={fen}
            playerColor={playerColor || 'w'}
            onMove={makeMove}
            isGameOver={isGameOver}
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
