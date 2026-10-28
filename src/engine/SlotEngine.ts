import type { GameConfig, SymbolDef } from '../config/gameConfig';
import { pickWeighted, type Rng } from './rng';
import type { Grid, SpinResult } from './types';
import { countSymbol, evaluateWays } from './waysEvaluator';

/**
 * Pure game logic: wallet, grid generation, evaluation and free spins state.
 * Knows nothing about rendering, so it can run headless (tests, simulations) or move server side.
 */
export class SlotEngine {
  balance: number;
  freeSpinsRemaining = 0;
  /** Accumulated win across the current free spins round. */
  freeSpinsTotal = 0;

  private readonly scatter?: SymbolDef;
  /** Dev/QA hook: the next spin lands on this grid instead of a random one. */
  private forcedGrid?: Grid;

  constructor(
    readonly config: GameConfig,
    private readonly rng: Rng,
  ) {
    this.balance = config.startingBalance;
    this.scatter = config.symbols.find((s) => s.kind === 'scatter');
  }

  get inFreeSpins(): boolean {
    return this.freeSpinsRemaining > 0;
  }

  canSpin(bet: number): boolean {
    return this.inFreeSpins || this.balance >= bet;
  }

  spin(bet: number): SpinResult {
    if (!this.canSpin(bet)) throw new Error('Insufficient balance');

    const isFreeSpin = this.inFreeSpins;
    if (isFreeSpin) {
      this.freeSpinsRemaining--;
    } else {
      this.balance = round(this.balance - bet);
      this.freeSpinsTotal = 0;
    }

    const grid = this.forcedGrid ?? this.generateGrid();
    this.forcedGrid = undefined;
    const wins = evaluateWays(grid, this.config.symbols, bet);
    const totalWin = round(wins.reduce((sum, w) => sum + w.amount, 0));
    this.balance = round(this.balance + totalWin);
    if (isFreeSpin) this.freeSpinsTotal = round(this.freeSpinsTotal + totalWin);

    let freeSpinsAwarded = 0;
    if (this.scatter && countSymbol(grid, this.scatter.id) >= this.config.freeSpins.minScatters) {
      freeSpinsAwarded = this.config.freeSpins.spinsAwarded;
      this.freeSpinsRemaining += freeSpinsAwarded;
    }

    return { grid, wins, totalWin, bet, isFreeSpin, freeSpinsAwarded };
  }

  forceNextGrid(grid: Grid): void {
    this.forcedGrid = grid;
  }

  generateGrid(): Grid {
    const { reels, rows, symbols, maxScattersPerReel } = this.config;
    const grid: Grid = [];
    for (let reel = 0; reel < reels; reel++) {
      const column: string[] = [];
      let scatters = 0;
      while (column.length < rows) {
        const symbol = pickWeighted(symbols, this.rng);
        if (symbol.kind === 'scatter') {
          if (scatters >= maxScattersPerReel) continue;
          scatters++;
        }
        column.push(symbol.id);
      }
      grid.push(column);
    }
    return grid;
  }
}

const round = (value: number) => Math.round(value * 100) / 100;
