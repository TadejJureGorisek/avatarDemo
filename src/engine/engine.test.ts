import { describe, expect, it } from 'vitest';
import { gameConfig, type SymbolDef } from '../config/gameConfig';
import { SeededRng } from './rng';
import { SlotEngine } from './SlotEngine';
import { evaluateWays } from './waysEvaluator';

const symbols: SymbolDef[] = [
  { id: 'A', kind: 'regular', weight: 1, pays: { 3: 1, 4: 2, 5: 5 }, hasConnect: true },
  { id: 'B', kind: 'regular', weight: 1, pays: { 3: 1, 4: 2, 5: 5 }, hasConnect: true },
  { id: 'W', kind: 'wild', weight: 1, pays: {}, hasConnect: true },
  { id: 'S', kind: 'scatter', weight: 1, pays: { 3: 10 }, hasConnect: false },
];

describe('evaluateWays', () => {
  it('pays 3 of a kind from the left and multiplies ways', () => {
    const grid = [
      ['A', 'A', 'B'],
      ['A', 'B', 'B'],
      ['B', 'A', 'B'],
      ['B', 'B', 'B'],
      ['B', 'B', 'B'],
    ];
    const wins = evaluateWays(grid, symbols, 1);
    const a = wins.find((w) => w.symbol === 'A')!;
    expect(a).toMatchObject({ count: 3, ways: 2 * 1 * 1, amount: 2 });
    const b = wins.find((w) => w.symbol === 'B')!;
    expect(b).toMatchObject({ count: 5, ways: 1 * 2 * 2 * 3 * 3, amount: 180 });
  });

  it('does not pay when the run is broken before 3 reels', () => {
    const grid = [['A'], ['A'], ['B'], ['A'], ['A']];
    expect(evaluateWays(grid, symbols, 1).find((w) => w.symbol === 'A')).toBeUndefined();
  });

  it('substitutes wilds', () => {
    const grid = [['A'], ['W'], ['A'], ['B'], ['B']];
    expect(evaluateWays(grid, symbols, 2).find((w) => w.symbol === 'A')).toMatchObject({
      count: 3,
      amount: 2,
    });
  });

  it('pays scatters anywhere', () => {
    const grid = [['S'], ['B'], ['S'], ['A'], ['S']];
    expect(evaluateWays(grid, symbols, 1).find((w) => w.symbol === 'S')).toMatchObject({
      count: 3,
      amount: 10,
      type: 'scatter',
    });
  });
});

describe('SlotEngine', () => {
  it('debits the bet, credits wins and awards free spins', () => {
    const engine = new SlotEngine(gameConfig, new SeededRng(1));
    for (let i = 0; i < 2000; i++) {
      const before = engine.balance;
      const wasFree = engine.inFreeSpins;
      const result = engine.spin(1);
      expect(result.grid).toHaveLength(gameConfig.reels);
      const expected = before - (wasFree ? 0 : 1) + result.totalWin;
      expect(engine.balance).toBeCloseTo(expected, 2);
    }
  });

  it('has a sensible RTP', () => {
    const engine = new SlotEngine({ ...gameConfig, startingBalance: 1e9 }, new SeededRng(42));
    const spins = 200_000;
    let wagered = 0;
    let won = 0;
    let hits = 0;
    let bonuses = 0;
    for (let i = 0; i < spins; i++) {
      const free = engine.inFreeSpins;
      const r = engine.spin(1);
      if (!free) wagered += 1;
      won += r.totalWin;
      if (r.totalWin > 0) hits++;
      if (r.freeSpinsAwarded && !free) bonuses++;
    }
    const rtp = won / wagered;
    console.log(
      `RTP ${(rtp * 100).toFixed(2)}%  hit rate ${((hits / spins) * 100).toFixed(1)}%  bonus 1/${Math.round(wagered / bonuses)}`,
    );
    expect(rtp).toBeGreaterThan(0.85);
    expect(rtp).toBeLessThan(1.05);
  });
});
