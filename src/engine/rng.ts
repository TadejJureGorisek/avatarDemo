/** Source of uniform random numbers in [0, 1). Swap implementations for tests or a server RNG. */
export interface Rng {
  next(): number;
}

/** Cryptographically strong RNG for play. */
export class CryptoRng implements Rng {
  private buffer = new Uint32Array(1);

  next(): number {
    crypto.getRandomValues(this.buffer);
    return this.buffer[0] / 0x1_0000_0000;
  }
}

/** Deterministic Mulberry32 RNG, used by tests and simulations. */
export class SeededRng implements Rng {
  constructor(private state: number) {}

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  }
}

export function pickWeighted<T extends { weight: number }>(items: readonly T[], rng: Rng): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng.next() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}
