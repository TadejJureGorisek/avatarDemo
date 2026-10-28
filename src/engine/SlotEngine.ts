// Pure game logic, no rendering: RNG, grid generation, ways evaluation, wallet and free spins.
import type { GameConfig, SymbolDef } from './config';

/** grid[reel][row] = symbol id. */
export type Grid = string[][];

export interface Win {
  symbol: string;
  count: number;
  ways: number;
  amount: number;
  positions: { reel: number; row: number }[];
}

export interface SpinResult {
  grid: Grid;
  wins: Win[];
  totalWin: number;
  isFreeSpin: boolean;
  freeSpinsAwarded: number;
}

/** Swap for a seeded or server-side RNG if needed. */
export const cryptoRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

const round = (n: number) => Math.round(n * 100) / 100;

function pickWeighted(symbols: SymbolDef[], random: () => number): SymbolDef {
  let roll = random() * symbols.reduce((sum, s) => sum + s.weight, 0);
  return symbols.find((s) => (roll -= s.weight) < 0) ?? symbols[symbols.length - 1];
}

export const countSymbol = (grid: Grid, id: string, upToReel = grid.length - 1) =>
  grid.slice(0, upToReel + 1).flat().filter((s) => s === id).length;

/** Left-to-right ways: a symbol (or wild) on consecutive reels from reel 1; ways = product of matches per reel. */
export function evaluate(grid: Grid, symbols: SymbolDef[], bet: number): Win[] {
  const wilds = new Set(symbols.filter((s) => s.kind === 'wild').map((s) => s.id));
  const wins: Win[] = [];

  for (const s of symbols) {
    const positions: Win['positions'] = [];
    let count = 0;
    let ways = 1;

    if (s.kind === 'regular') {
      for (const [reel, column] of grid.entries()) {
        const rows = column.flatMap((id, row) => (id === s.id || wilds.has(id) ? [row] : []));
        if (!rows.length) break;
        count++;
        ways *= rows.length;
        positions.push(...rows.map((row) => ({ reel, row })));
      }
    } else if (s.kind === 'scatter') {
      grid.forEach((column, reel) => column.forEach((id, row) => id === s.id && positions.push({ reel, row })));
      count = Math.min(positions.length, Math.max(...Object.keys(s.pays).map(Number)));
    }

    const pay = s.pays[count];
    if (pay) wins.push({ symbol: s.id, count, ways, amount: round(pay * bet * ways), positions });
  }
  return wins;
}

export class SlotEngine {
  balance: number;
  freeSpinsLeft = 0;
  freeSpinsTotal = 0;
  private scatter?: SymbolDef;

  constructor(private config: GameConfig, private random = cryptoRandom) {
    this.balance = config.startingBalance;
    this.scatter = config.symbols.find((s) => s.kind === 'scatter');
  }

  canSpin(bet: number) {
    return this.freeSpinsLeft > 0 || this.balance >= bet;
  }

  spin(bet: number): SpinResult {
    const isFreeSpin = this.freeSpinsLeft > 0;
    if (isFreeSpin) this.freeSpinsLeft--;
    else {
      this.balance = round(this.balance - bet);
      this.freeSpinsTotal = 0;
    }

    const grid = this.generateGrid();
    const wins = evaluate(grid, this.config.symbols, bet);
    const totalWin = round(wins.reduce((sum, w) => sum + w.amount, 0));
    this.balance = round(this.balance + totalWin);
    if (isFreeSpin) this.freeSpinsTotal = round(this.freeSpinsTotal + totalWin);

    const { minScatters, awarded } = this.config.freeSpins;
    const freeSpinsAwarded = this.scatter && countSymbol(grid, this.scatter.id) >= minScatters ? awarded : 0;
    this.freeSpinsLeft += freeSpinsAwarded;

    return { grid, wins, totalWin, isFreeSpin, freeSpinsAwarded };
  }

  generateGrid(): Grid {
    const { reels, rows, symbols, maxScattersPerReel } = this.config;
    return Array.from({ length: reels }, () => {
      const column: string[] = [];
      while (column.length < rows) {
        const s = pickWeighted(symbols, this.random);
        if (s.kind === 'scatter' && countSymbol([column], s.id) >= maxScattersPerReel) continue;
        column.push(s.id);
      }
      return column;
    });
  }
}
