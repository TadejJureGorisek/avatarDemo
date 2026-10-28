import { Ticker } from 'pixi.js';

export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  outBack: (t: number) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
} satisfies Record<string, Ease>;

/** Runs `update(progress)` every frame for `durationMs`, resolving when done. */
export function animate(
  durationMs: number,
  update: (t: number) => void,
  easing: Ease = ease.linear,
  delayMs = 0,
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = -delayMs;
    const tick = (ticker: Ticker) => {
      elapsed += ticker.deltaMS;
      if (elapsed < 0) return;
      const t = Math.min(elapsed / durationMs, 1);
      update(easing(t));
      if (t >= 1) {
        Ticker.shared.remove(tick);
        resolve();
      }
    };
    Ticker.shared.add(tick);
  });
}

export const wait = (ms: number) => animate(ms, () => {});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
