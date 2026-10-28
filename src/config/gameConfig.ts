/**
 * All tunable game data lives here. Board size, symbols, weights and pays can be changed
 * without touching the engine or the view.
 */

export type SymbolKind = 'regular' | 'scatter' | 'wild';

export interface SymbolDef {
  id: string;
  kind: SymbolKind;
  /** Relative chance of landing in any cell. */
  weight: number;
  /** Pay multipliers of the total bet, per way, keyed by match count (3, 4, 5...). */
  pays: Record<number, number>;
  /** Texture shown while the symbol is part of a win; falls back to the base texture. */
  hasConnect: boolean;
}

export interface FreeSpinsConfig {
  /** Minimum number of scatters (anywhere) that awards free spins. */
  minScatters: number;
  spinsAwarded: number;
}

export interface GameConfig {
  reels: number;
  rows: number;
  symbols: SymbolDef[];
  /** Max copies of the scatter allowed on a single reel. */
  maxScattersPerReel: number;
  freeSpins: FreeSpinsConfig;
  bets: number[];
  defaultBetIndex: number;
  startingBalance: number;
}

const low = (id: string, weight: number, p3: number, p4: number, p5: number): SymbolDef => ({
  id,
  kind: 'regular',
  weight,
  pays: { 3: p3, 4: p4, 5: p5 },
  hasConnect: true,
});

export const gameConfig: GameConfig = {
  reels: 5,
  rows: 3,
  symbols: [
    low('H1', 2, 17.5, 87.5, 350),
    low('H2', 2, 14, 70, 280),
    low('H3', 3, 10.5, 52.5, 210),
    low('H4', 3, 10.5, 42, 175),
    low('H5', 3, 8.75, 35, 140),
    low('H6', 3, 8.75, 35, 140),
    low('M1', 5, 7, 21, 87.5),
    low('M2', 5, 7, 21, 87.5),
    low('M3', 5, 5.25, 17.5, 70),
    low('M4', 5, 5.25, 17.5, 70),
    low('M5', 6, 3.5, 14, 52.5),
    low('M6', 6, 3.5, 14, 52.5),
    low('A', 12, 1.75, 8.75, 35),
    low('K', 12, 1.75, 8.75, 35),
    low('Q', 13, 1.4, 7, 28),
    low('J', 13, 1.4, 7, 28),
    low('10', 14, 1.05, 5.25, 21),
    low('9', 14, 1.05, 5.25, 21),
    {
      id: 'BONUS',
      kind: 'scatter',
      weight: 3,
      // Scatter pays are multipliers of the total bet, counted anywhere on the board.
      pays: { 3: 2, 4: 10, 5: 50 },
      hasConnect: false,
    },
  ],
  maxScattersPerReel: 1,
  freeSpins: { minScatters: 3, spinsAwarded: 8 },
  bets: [0.2, 0.5, 1, 2, 5, 10],
  defaultBetIndex: 2,
  startingBalance: 1000,
};
