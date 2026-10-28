import type { SymbolDef } from '../config/gameConfig';
import type { Grid, Position, Win } from './types';

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Left-to-right "all ways" evaluation. A symbol wins when it (or a wild) appears on reels
 * 1..n consecutively, n >= the lowest paying count. Ways = product of matching cells per reel.
 * Scatters pay by total count anywhere on the board.
 */
export function evaluateWays(grid: Grid, symbols: readonly SymbolDef[], bet: number): Win[] {
  const wins: Win[] = [];
  const wildIds = new Set(symbols.filter((s) => s.kind === 'wild').map((s) => s.id));

  for (const symbol of symbols) {
    if (symbol.kind === 'regular') {
      const win = evaluateRegular(grid, symbol, wildIds, bet);
      if (win) wins.push(win);
    } else if (symbol.kind === 'scatter') {
      const win = evaluateScatter(grid, symbol, bet);
      if (win) wins.push(win);
    }
  }
  return wins;
}

function evaluateRegular(
  grid: Grid,
  symbol: SymbolDef,
  wildIds: Set<string>,
  bet: number,
): Win | null {
  const positions: Position[] = [];
  let ways = 1;
  let count = 0;

  for (let reel = 0; reel < grid.length; reel++) {
    const matches: Position[] = [];
    grid[reel].forEach((id, row) => {
      if (id === symbol.id || wildIds.has(id)) matches.push({ reel, row });
    });
    if (matches.length === 0) break;
    ways *= matches.length;
    count++;
    positions.push(...matches);
  }

  const pay = symbol.pays[count];
  if (!pay) return null;
  return { symbol: symbol.id, count, ways, amount: round(pay * bet * ways), positions, type: 'ways' };
}

function evaluateScatter(grid: Grid, symbol: SymbolDef, bet: number): Win | null {
  const positions: Position[] = [];
  grid.forEach((column, reel) =>
    column.forEach((id, row) => {
      if (id === symbol.id) positions.push({ reel, row });
    }),
  );

  const counts = Object.keys(symbol.pays).map(Number);
  const payCount = Math.min(positions.length, Math.max(...counts));
  const pay = symbol.pays[payCount];
  if (!pay) return null;
  return {
    symbol: symbol.id,
    count: positions.length,
    ways: 1,
    amount: round(pay * bet),
    positions,
    type: 'scatter',
  };
}

export function countSymbol(grid: Grid, id: string, upToReel = grid.length - 1): number {
  let total = 0;
  for (let reel = 0; reel <= upToReel; reel++) total += grid[reel].filter((s) => s === id).length;
  return total;
}
