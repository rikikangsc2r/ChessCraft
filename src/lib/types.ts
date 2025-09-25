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
    white: Player | null;
    black: Player | null;
  };
  rematch: {
    white: boolean;
    black: boolean;
  };
  createdAt: number;
};

export type ChessPiece = Piece;
