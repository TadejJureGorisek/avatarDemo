import { Assets, Sprite } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';

export const symbolUrl = (id: string) => `assets/symbols/${id}.png`;

/** One symbol on a reel. Anchored at its centre so it can pop in place. */
export class Cell extends Sprite {
  constructor(readonly def: SymbolDef, private size: number) {
    super(Assets.get(symbolUrl(def.id)));
    this.anchor.set(0.5);
    this.fit();
  }

  /** Fits the cell; BONUS is 200x208, so by the longer side. */
  fit() {
    this.scale.set((this.size * 0.96) / Math.max(this.texture.width, this.texture.height));
  }
}
