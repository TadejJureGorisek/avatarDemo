/** grid[reel][row] = symbol id. Reel-major so each reel is a column. */
export type Grid = string[][];

export interface Position {
  reel: number;
  row: number;
}

export interface Win {
  symbol: string;
  /** Number of consecutive reels matched from the left (or scatter count). */
  count: number;
  /** Number of ways (1 for scatter wins). */
  ways: number;
  amount: number;
  positions: Position[];
  type: 'ways' | 'scatter';
}

export interface SpinResult {
  grid: Grid;
  wins: Win[];
  totalWin: number;
  bet: number;
  /** True when this spin was a free spin (no stake taken). */
  isFreeSpin: boolean;
  freeSpinsAwarded: number;
}
