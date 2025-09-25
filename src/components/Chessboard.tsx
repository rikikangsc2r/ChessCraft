"use client";

import { Chessboard } from "react-chessboard";
import type { Square } from 'chess.js';

interface ChessboardProps {
  fen: string;
  playerColor: 'w' | 'b';
  onMove: (from: Square, to: Square) => boolean;
  isGameOver: boolean;
}

export function ChessboardWrapper({ fen, playerColor, onMove, isGameOver }: ChessboardProps) {
  
  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return onMove(sourceSquare, targetSquare);
  }

  return (
    <div className="w-full aspect-square shadow-2xl border-4 border-card rounded-lg overflow-hidden">
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
        arePiecesDraggable={!isGameOver}
      />
    </div>
  );
}
