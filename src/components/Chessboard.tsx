"use client";

import type { Square, Move } from 'chess.js';
import type { ChessPiece } from '@/lib/types';
import PieceComponent from './Piece';
import { cn } from '@/lib/utils';

interface ChessboardProps {
  board: (ChessPiece | null)[][];
  turn: 'w' | 'b';
  playerColor: 'w' | 'b';
  onMove: (from: Square, to: Square) => void;
  selectedPiece: Square | null;
  setSelectedPiece: (square: Square | null) => void;
  legalMoves: Move[];
  lastMove: { from: Square; to: Square } | null;
  isGameOver: boolean;
}

export function Chessboard({
  board,
  playerColor,
  onMove,
  selectedPiece,
  setSelectedPiece,
  legalMoves,
  lastMove,
  isGameOver,
}: ChessboardProps) {
  
  const handleSquareClick = (square: Square) => {
    if (isGameOver) return;

    if (selectedPiece) {
      const isLegal = legalMoves.some(move => move.from === selectedPiece && move.to === square);
      if (isLegal) {
        onMove(selectedPiece, square);
      } else {
        setSelectedPiece(square === selectedPiece ? null : square);
      }
    } else {
      setSelectedPiece(square);
    }
  };

  const getSquareName = (row: number, col: number): Square => {
    if (playerColor === 'w') {
      return `${String.fromCharCode(97 + col)}${8 - row}` as Square;
    }
    return `${String.fromCharCode(104 - col)}${row + 1}` as Square;
  };
  
  const getPiece = (row: number, col: number): ChessPiece | null => {
    if (playerColor === 'w') {
      return board[row][col];
    }
    return board[7-row][7-col];
  }

  return (
    <div className="w-full aspect-square grid grid-cols-8 shadow-2xl border-4 border-card rounded-lg overflow-hidden">
      {Array(8).fill(0).map((_, row) =>
        Array(8).fill(0).map((_, col) => {
          const squareName = getSquareName(row, col);
          const piece = getPiece(row, col);
          const isLightSquare = (row + col) % 2 !== 0;

          const isLastMove = lastMove && (lastMove.from === squareName || lastMove.to === squareName);
          const isSelected = selectedPiece === squareName;
          const isLegalMove = legalMoves.some(move => move.to === squareName);

          return (
            <div
              key={squareName}
              onClick={() => handleSquareClick(squareName)}
              className={cn(
                'flex justify-center items-center relative',
                isLightSquare ? 'bg-primary/20' : 'bg-primary/60',
              )}
            >
              {piece && <PieceComponent piece={piece} />}
              
              {isSelected && (
                <div className="absolute inset-0 bg-yellow-400/50" />
              )}
              {isLastMove && (
                <div className="absolute inset-0 bg-accent/40" />
              )}
              {isLegalMove && (
                 <div className="absolute w-1/3 h-1/3 rounded-full bg-black/20" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
