// All game data. Board size, symbols, weights and pays change here without touching code.

export interface SymbolDef {
  id: string;
  kind: 'regular' | 'scatter' | 'wild';
  /** Relative chance of landing in a cell. */
  weight: number;
  /** Pay multipliers of the bet by match count. Regular symbols pay per way. */
  pays: Record<number, number>;
}

const sym = (id: string, weight: number, p3: number, p4: number, p5: number): SymbolDef => ({
  id, kind: 'regular', weight, pays: { 3: p3, 4: p4, 5: p5 },
});

export const config = {
  reels: 5,
  rows: 3,
  symbols: [
    sym('H1', 2, 20.43, 102.13, 408.54),
    sym('H2', 2, 16.34, 81.71, 326.83),
    sym('H3', 3, 12.25, 61.28, 245.12),
    sym('H4', 3, 12.25, 49.02, 204.27),
    sym('H5', 3, 10.21, 40.85, 163.41),
    sym('H6', 3, 10.21, 40.85, 163.41),
    sym('M1', 5, 8.17, 24.51, 102.13),
    sym('M2', 5, 8.17, 24.51, 102.13),
    sym('M3', 5, 6.13, 20.43, 81.71),
    sym('M4', 5, 6.13, 20.43, 81.71),
    sym('M5', 6, 4.08, 16.34, 61.28),
    sym('M6', 6, 4.08, 16.34, 61.28),
    sym('A', 12, 2.04, 10.21, 40.85),
    sym('K', 12, 2.04, 10.21, 40.85),
    sym('Q', 13, 1.63, 8.17, 32.68),
    sym('J', 13, 1.63, 8.17, 32.68),
    sym('10', 14, 1.23, 6.13, 24.51),
    sym('9', 14, 1.23, 6.13, 24.51),
    // Scatter: pays anywhere, multiplier of the bet.
    { id: 'BONUS', kind: 'scatter', weight: 17, pays: { 3: 0.5, 4: 2, 5: 10 } },
  ] as SymbolDef[],
  /** At most one scatter on a reel, so `minScatters: 5` means one BONUS on every reel. */
  maxScattersPerReel: 1,
  freeSpins: { minScatters: 5, awarded: 8 },
  bets: [0.2, 0.5, 1, 2, 5, 10],
  defaultBetIndex: 2,
  startingBalance: 1000,
  /** Reel timing in seconds. */
  timing: {
    /** Every spin lasts at least this long before the first reel stops. */
    minSpinTime: 1,
    /** Gap between one reel stopping and the next. */
    reelStopStagger: 0.2,
    /** Extra spinning per remaining reel while the bonus anticipation plays. */
    anticipationExtra: 0.9,
  },
};

export type GameConfig = typeof config;
