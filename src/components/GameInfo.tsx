"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player } from '@/lib/types';

interface GameInfoProps {
  status: string;
  turn: 'w' | 'b';
  history: string[];
  playerColor: 'w' | 'b' | null;
  players: { white: Player | null, black: Player | null };
}

export function GameInfo({ status, turn, history, playerColor, players }: GameInfoProps) {
  const isMyTurn = turn === playerColor;

  // Group history into pairs of moves [white, black]
  const movePairs: [string, string | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }
  
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
      <CardContent className="h-full">
        <h3 className="font-semibold mb-2">Move History</h3>
        <ScrollArea className="h-48 md:h-64 border rounded-md">
          <ol className="p-2 text-sm font-mono">
            {movePairs.map(([whiteMove, blackMove], index) => (
              <li key={index} className="grid grid-cols-[2rem_1fr_1fr] gap-2 p-1 rounded hover:bg-muted">
                <span className="text-muted-foreground">{index + 1}.</span>
                <span>{whiteMove}</span>
                <span>{blackMove || ''}</span>
              </li>
            ))}
            {history.length === 0 && (
              <li className="p-2 text-muted-foreground">No moves yet.</li>
            )}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
