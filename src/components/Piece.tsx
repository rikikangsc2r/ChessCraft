import React from 'react';
import type { ChessPiece } from '@/lib/types';

// SVG components for each chess piece
const Pawn = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 32c-1.28 0-2.5.5-3.5 1.5-1 1-1.5 2.22-1.5 3.5 0 1.28.5 2.5 1.5 3.5 1 1 2.22 1.5 3.5 1.5s2.5-.5 3.5-1.5c1-1 1.5-2.22 1.5-3.5 0-1.28-.5-2.5-1.5-3.5-1-1-2.22-1.5-3.5-1.5z M22.5 9.5c-2.28 0-4.5.5-6.5 1.5-2 1-3.5 2.5-4.5 4.5-1 2-1.5 4.5-1.5 6.5 0 2.5.5 5 1.5 7.5h22c1-2.5 1.5-5 1.5-7.5 0-2-.5-4.5-1.5-6.5-1-2-2.5-3.5-4.5-4.5-2-1-4.22-1.5-6.5-1.5z" />
  </svg>
);

const Knight = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 38c-1.4 0-2.8-.5-4-1.5s-2-2.5-2-4c0-1.5.5-2.8 1.5-4 .5-.5 1-1 1.5-1.5-1-2-1.5-4-1.5-6 0-2.5 1-5 2.5-7s3.5-3.5 6-4.5c2.5-1 5-1.5 7.5-1.5 1.25 0 2.5.25 3.75.75s2.5 1.25 3.75 2.25c.5.5 1 1.25 1.5 2s.75 1.5.75 2.25c0 1.5-.5 3-1.5 4.5s-2 2.5-3 3c-2.5 1-5 1-7.5 0-1.5-.5-2.5-1.5-3.5-2.5-1.5-1.5-2.5-3-3-4.5s-1-3.5-.5-5.5c.5-2 .5-4 0-6" />
  </svg>
);

const Bishop = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 38c-1.4 0-2.8-.5-4-1.5s-2-2.5-2-4c0-1.5.5-2.8 1.5-4 .5-.5 1-1 1.5-1.5-1.5-1.5-2.5-3.5-3-5.5-.5-2-1-4-1-6 0-1.5.5-3 1.5-4s2-1.5 3-1.5c1 0 2 .5 3 1.5s1.5 2.5 1.5 4c0 1.5-.5 3-1.5 4s-2 1.5-3 1.5h1c1 0 2 .5 3 1.5s1.5 2.5 1.5 4c0 1.5-.5 3-1.5 4s-2 1.5-3 1.5z" />
  </svg>
);

const Rook = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 38c-1.4 0-2.8-.5-4-1.5s-2-2.5-2-4c0-1.5.5-2.8 1.5-4 .5-.5 1-1 1.5-1.5H10V9.5h25v17H27c.5.5 1 1 1.5 1.5.5.5 1 1.25 1.5 2 .5.75.75 1.5.75 2.25 0 1.5-.5 3-1.5 4s-2 1.5-3 1.5z M12.5 9.5h5v2.5h-5z m7.5 0h5v2.5h-5z m7.5 0h5v2.5h-5z" />
  </svg>
);

const Queen = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 38c-1.4 0-2.8-.5-4-1.5s-2-2.5-2-4c0-1.5.5-2.8 1.5-4 .5-.5 1-1 1.5-1.5-1-1-1.5-2-2-3s-1-2.5-1-4c0-1.5.5-3 1.5-4.5s2-2.5 3.5-3.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5 1 2.5 2 3.5 3.5s1.5 3 1.5 4.5c0 1.5-.5 3-1.5 4s-2 2.5-3.5 3.5c-.5.5-1 1-1.5 1.5.5.5 1 1.25 1.5 2 .5.75.75 1.5.75 2.25 0 1.5-.5 3-1.5 4s-2 1.5-3 1.5z M12.5 8s1.5 1 4 1 4-1 4-1-1.5-1-4-1-4 1-4 1z m10 0s1.5 1 4 1 4-1 4-1-1.5-1-4-1-4 1-4 1z" />
  </svg>
);

const King = ({ color }: { color: string }) => (
  <svg viewBox="0 0 45 45" className={`w-full h-full stroke-black ${color === 'w' ? 'fill-white' : 'fill-gray-700'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.5 38c-1.4 0-2.8-.5-4-1.5s-2-2.5-2-4c0-1.5.5-2.8 1.5-4 .5-.5 1-1 1.5-1.5-1.5-1-2.5-2.5-3-4s-1-3-1-4.5c0-1.5.5-3 1.5-4.5s2-2.5 3.5-3.5c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5c1.5 1 2.5 2 3.5 3.5s1.5 3 1.5 4.5c0 1.5-.5 3-1.5 4s-2 2.5-3.5 3.5c-.5.5-1 1-1.5 1.5.5.5 1 1.25 1.5 2 .5.75.75 1.5.75 2.25 0 1.5-.5 3-1.5 4s-2 1.5-3 1.5z M22.5 10.5h-2.5v-3h-3v-2.5h3v-3h2.5v3h3v2.5h-3z" />
  </svg>
);

const pieceMap: { [key: string]: React.ElementType } = {
  p: Pawn,
  n: Knight,
  b: Bishop,
  r: Rook,
  q: Queen,
  k: King,
};

const PieceComponent = ({ piece }: { piece: ChessPiece | null }) => {
  if (!piece) return null;

  const Piece = pieceMap[piece.type];
  if (!Piece) return null;

  return (
    <div className="w-full h-full cursor-pointer flex justify-center items-center p-1 drop-shadow-lg">
      <Piece color={piece.color} />
    </div>
  );
};

export default PieceComponent;
