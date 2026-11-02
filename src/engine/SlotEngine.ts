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
  readonly scatter?: SymbolDef;
  private symbols: Map<string, SymbolDef>;
  private forcedGrid?: Grid;

  constructor(readonly config: GameConfig, private random = cryptoRandom) {
    this.balance = config.startingBalance;
    this.scatter = config.symbols.find((s) => s.kind === 'scatter');
    this.symbols = new Map(config.symbols.map((s) => [s.id, s]));
  }

  /** Board size, passed down to the view so nothing there hardcodes 5x3. */
  get reels() {
    return this.config.reels;
  }

  get rows() {
    return this.config.rows;
  }

  getSymbol = (id: string) => this.symbols.get(id)!;

  /** Random regular symbol for the blur of a spinning reel; never a scatter, so it can't fake a bonus. */
  fillerSymbol = () => pickWeighted(this.config.symbols.filter((s) => s.kind === 'regular'), this.random).id;

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

    const grid = this.forcedGrid ?? this.generateGrid();
    this.forcedGrid = undefined;
    const wins = evaluate(grid, this.config.symbols, bet);
    const totalWin = round(wins.reduce((sum, w) => sum + w.amount, 0));
    this.balance = round(this.balance + totalWin);
    if (isFreeSpin) this.freeSpinsTotal = round(this.freeSpinsTotal + totalWin);

    const { minScatters, awarded } = this.config.freeSpins;
    const freeSpinsAwarded = this.scatter && countSymbol(grid, this.scatter.id) >= minScatters ? awarded : 0;
    this.freeSpinsLeft += freeSpinsAwarded;

    return { grid, wins, totalWin, isFreeSpin, freeSpinsAwarded };
  }

  /** Demo cheat: the next spin lands the top symbol across the middle row, or enough BONUS for free spins. */
  forceNext(cheat: 'win' | 'freeSpins') {
    const grid = this.generateGrid();
    const middle = Math.floor(this.rows / 2);
    if (cheat === 'win') {
      const top = this.config.symbols.find((s) => s.kind === 'regular')!;
      grid.forEach((column) => (column[middle] = top.id));
    } else if (this.scatter) {
      // Spread the scatters out (one per reel when minScatters equals the reel count) so the anticipation plays.
      const { id } = this.scatter;
      const { minScatters } = this.config.freeSpins;
      for (let i = 0; i < minScatters; i++) {
        const column = grid[Math.round((i * (this.reels - 1)) / Math.max(1, minScatters - 1))];
        // Keep the one-scatter-per-reel rule: swap out any scatter the random board already had there.
        column.forEach((symbol, row) => symbol === id && (column[row] = this.fillerSymbol()));
        column[middle] = id;
      }
    }
    this.forcedGrid = grid;
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
