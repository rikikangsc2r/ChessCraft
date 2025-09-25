"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameInfoProps {
  status: string;
  turn: 'w' | 'b';
  history: string[];
  playerColor: 'w' | 'b';
  players: { white: string | null, black: string | null };
}

export function GameInfo({ status, turn, history, playerColor, players }: GameInfoProps) {
  const isMyTurn = turn === playerColor;
  
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Game Info</CardTitle>
        <div className="pt-2">
            <Badge variant={isMyTurn ? "default" : "secondary"}>
                {isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </Badge>
            <p className="text-muted-foreground pt-2">{status}</p>
        </div>
        <div className="pt-2 text-sm">
            <p><strong>White:</strong> {players.white || '...'}</p>
            <p><strong>Black:</strong> {players.black || '...'}</p>
        </div>
      </CardHeader>
      <CardContent className="h-full">
        <h3 className="font-semibold mb-2">Move History</h3>
        <ScrollArea className="h-48 md:h-64 border rounded-md">
          <ol className="p-2 text-sm">
            {history.map((move, index) => (
              <li key={index} className="flex gap-4 p-1 rounded hover:bg-muted">
                <span className="text-muted-foreground w-6">{Math.floor(index / 2) + 1}.</span>
                <span>{move}</span>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
