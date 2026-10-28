// All game data. Board size, symbols, weights and pays change here without touching code.

export interface SymbolDef {
  id: string;
  kind: 'regular' | 'scatter' | 'wild';
  /** Relative chance of landing in a cell. */
  weight: number;
  /** Pay multipliers of the bet by match count. Regular symbols pay per way. */
  pays: Record<number, number>;
  /** Has a `<id>_connect.png` highlight texture. */
  hasConnect: boolean;
}

const sym = (id: string, weight: number, p3: number, p4: number, p5: number): SymbolDef => ({
  id, kind: 'regular', weight, pays: { 3: p3, 4: p4, 5: p5 }, hasConnect: true,
});

export const config = {
  reels: 5,
  rows: 3,
  symbols: [
    sym('H1', 2, 17.5, 87.5, 350),
    sym('H2', 2, 14, 70, 280),
    sym('H3', 3, 10.5, 52.5, 210),
    sym('H4', 3, 10.5, 42, 175),
    sym('H5', 3, 8.75, 35, 140),
    sym('H6', 3, 8.75, 35, 140),
    sym('M1', 5, 7, 21, 87.5),
    sym('M2', 5, 7, 21, 87.5),
    sym('M3', 5, 5.25, 17.5, 70),
    sym('M4', 5, 5.25, 17.5, 70),
    sym('M5', 6, 3.5, 14, 52.5),
    sym('M6', 6, 3.5, 14, 52.5),
    sym('A', 12, 1.75, 8.75, 35),
    sym('K', 12, 1.75, 8.75, 35),
    sym('Q', 13, 1.4, 7, 28),
    sym('J', 13, 1.4, 7, 28),
    sym('10', 14, 1.05, 5.25, 21),
    sym('9', 14, 1.05, 5.25, 21),
    // Scatter: pays anywhere, multiplier of the bet.
    { id: 'BONUS', kind: 'scatter', weight: 3, pays: { 3: 2, 4: 10, 5: 50 }, hasConnect: false },
  ] as SymbolDef[],
  maxScattersPerReel: 1,
  freeSpins: { minScatters: 3, awarded: 8 },
  bets: [0.2, 0.5, 1, 2, 5, 10],
  defaultBetIndex: 2,
  startingBalance: 1000,
};

export type GameConfig = typeof config;
