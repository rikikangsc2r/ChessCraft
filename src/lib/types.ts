import type { Square, Piece } from 'chess.js';

export type Player = {
  id: string;
  name: string;
};

export type GameRoom = {
  game: {
    fen: string;
    history: string[];
    lastMove: { from: Square; to: Square } | null;
    status: string;
    turn: 'w' | 'b';
  };
  players: {
    white: string | null;
    black: string | null;
  };
  createdAt: number;
};

export type ChessPiece = Piece;
