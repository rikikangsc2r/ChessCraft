"use client";

import { Chessboard } from "react-chessboard";
import type { Square } from 'chess.js';

interface ChessboardProps {
  fen: string;
  playerColor: 'w' | 'b';
  onMove: (from: Square, to: Square) => boolean;
  isGameOver: boolean;
  lastMove: { from: Square, to: Square } | null;
  validMoves: Square[];
  onSquareClick: (square: Square) => void;
  selectedSquare: Square | null;
}

export function ChessboardWrapper({ 
  fen, 
  playerColor, 
  onMove, 
  isGameOver,
  lastMove,
  validMoves,
  onSquareClick,
  selectedSquare
}: ChessboardProps) {
  
  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (selectedSquare) {
      onSquareClick(targetSquare);
      return true;
    }
    return onMove(sourceSquare, targetSquare);
  }

  const squareStyles: { [key in Square]?: React.CSSProperties } = {};

  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }

  validMoves.forEach(square => {
    squareStyles[square] = {
      background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
      borderRadius: '50%',
    };
  });
  
  if (selectedSquare) {
      squareStyles[selectedSquare] = { backgroundColor: 'rgba(30, 144, 255, 0.5)' };
  }


  return (
    <div className="w-full aspect-square shadow-2xl border-4 border-card rounded-lg overflow-hidden">
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
        arePiecesDraggable={!isGameOver && playerColor !== null}
        customSquareStyles={squareStyles}
      />
    </div>
  );
}
