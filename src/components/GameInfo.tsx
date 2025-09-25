"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player } from '@/lib/types';

interface GameInfoProps {
  status: string;
  turn: 'w' | 'b';
  playerColor: 'w' | 'b' | null;
  players: { white: Player | null, black: Player | null };
}

export function GameInfo({ status, turn, playerColor, players }: GameInfoProps) {
  const isMyTurn = turn === playerColor;

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Game Info</CardTitle>
        <div className="pt-2">
            {playerColor && (
              <Badge variant={isMyTurn ? "default" : "secondary"}>
                  {isMyTurn ? "Your Turn" : "Opponent's Turn"}
              </Badge>
            )}
            <p className="text-muted-foreground pt-2">{status}</p>
        </div>
        <div className="pt-2 text-sm">
            <p><strong>White:</strong> {players.white?.name || '...'}</p>
            <p><strong>Black:</strong> {players.black?.name || '...'}</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Move History Removed */}
      </CardContent>
    </Card>
  );
}
