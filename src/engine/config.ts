export interface SymbolDef {
  id: string;
  kind: 'regular' | 'scatter' | 'wild';
  weight: number;
  pays: Record<number, number>;
}

const sym = (id: string, weight: number, p3: number, p4: number, p5: number): SymbolDef => ({
  id, kind: 'regular', weight, pays: { 3: p3, 4: p4, 5: p5 },
});

export const config = {
  reels: 5,
  rows: 3,
  symbols: [
    sym('H1', 2, 20, 100, 400),
    sym('H2', 2, 16, 80, 320),
    sym('H3', 3, 12, 60, 250),
    sym('H4', 3, 12, 50, 200),
    sym('H5', 3, 10, 40, 160),
    sym('H6', 3, 10, 40, 160),
    sym('M1', 5, 8, 25, 100),
    sym('M2', 5, 8, 25, 100),
    sym('M3', 5, 6, 20, 80),
    sym('M4', 5, 6, 20, 80),
    sym('M5', 6, 4, 16, 60),
    sym('M6', 6, 4, 16, 60),
    sym('A', 12, 2, 10, 40),
    sym('K', 12, 2, 10, 40),
    sym('Q', 13, 1.8, 8, 35),
    sym('J', 13, 1.8, 8, 35),
    sym('10', 14, 1.2, 6, 25),
    sym('9', 14, 1.2, 6, 25),
    { id: 'BONUS', kind: 'scatter', weight: 17, pays: { 3: 0.5, 4: 2, 5: 10 } },
  ] as SymbolDef[],
  maxScattersPerReel: 1,
  freeSpins: { minScatters: 5, awarded: 8 },
  bets: [0.2, 0.5, 1, 2, 5, 10],
  defaultBetIndex: 2,
  startingBalance: 1000,
  bigWins: [
    { title: 'NICE WIN', x: 20 },
    { title: 'BIG WIN', x: 35 },
    { title: 'MEGA WIN', x: 50 },
    { title: 'EPIC WIN', x: 100 },
  ],
  winCheats: {
    nice: { symbol: 'H3', length: 3, ways: 2 },
    big: { symbol: 'H1', length: 3, ways: 2 },
    mega: { symbol: 'H2', length: 4, ways: 1 },
    epic: { symbol: 'H1', length: 5, ways: 1 },
  },
  timing: {
    minSpinTime: 1,
    reelStopStagger: 0.2,
    anticipationExtra: 0.9,
    turboSpeed: 2,
  },
};

export type GameConfig = typeof config;
