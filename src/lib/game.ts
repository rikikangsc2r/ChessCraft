import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Chess, Square } from 'chess.js';

function getStatus(chess: Chess) {
  let status = '';
  const turn = chess.turn() === 'w' ? 'White' : 'Black';

  if (chess.isCheckmate()) {
    status = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins.`;
  } else if (chess.isDraw()) {
    status = 'Draw!';
  } else if (chess.isStalemate()) {
    status = 'Stalemate!';
  } else {
    status = `${turn} to move.`;
    if (chess.isCheck()) {
      status += ' Check!';
    }
  }
  return status;
}

export const ChessGame: Game = {
  name: 'chess',
  
  setup: () => {
    const chess = new Chess();
    return {
      fen: chess.fen(),
      history: [],
      status: 'White to move.',
      turn: 'w',
    };
  },

  moves: {
    move: ({ G, playerID, ctx }, { from, to }: { from: Square, to: Square }) => {
      const chess = new Chess(G.fen);
      const playerColor = ctx.playOrder[parseInt(playerID, 10)] === 'white' ? 'w' : 'b';

      if (chess.turn() !== playerColor) {
        return INVALID_MOVE;
      }
      
      try {
        const result = chess.move({ from, to, promotion: 'q' });
        if (result === null) {
          return INVALID_MOVE;
        }

        G.fen = chess.fen();
        G.history = chess.history();
        G.status = getStatus(chess);
        G.turn = chess.turn();
      } catch {
        return INVALID_MOVE;
      }
    },
  },
  
  turn: {
    order: {
      first: () => 0,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
      playOrder: ( { ctx } ) => {
          const { matchData } = ctx;
          const whitePlayer = matchData?.find(p => p.name === 'white');
          const blackPlayer = matchData?.find(p => p.name === 'black');
          if (whitePlayer && blackPlayer) {
              return [whitePlayer.id.toString(), blackPlayer.id.toString()];
          }
          return [];
      }
    },
  },
  
  playerView: ( { G } ) => {
    return { ...G };
  },

  endIf: ({ G }) => {
    const chess = new Chess(G.fen);
    if (chess.isGameOver()) {
      return { winner: chess.turn() === 'w' ? 'black' : 'white' };
    }
  },
  
  ai: {
    enumerate: (G) => {
      const chess = new Chess(G.fen);
      const moves = [];
      const possibleMoves = chess.moves({ verbose: true });
      for (const move of possibleMoves) {
        moves.push({ move: 'move', args: [{ from: move.from, to: move.to }] });
      }
      return moves;
    },
  },
};
