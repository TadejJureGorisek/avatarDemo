import { Assets, Sprite } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';

export const symbolUrl = (id: string) => `assets/symbols/${id}.png`;

/** One symbol on a reel. Anchored at its centre so it can pop in place. Reused as the reel spins. */
export class Cell extends Sprite {
  def!: SymbolDef;

  constructor(def: SymbolDef, private size: number) {
    super();
    this.anchor.set(0.5);
    this.setSymbol(def);
  }

  setSymbol(def: SymbolDef) {
    this.def = def;
    this.texture = Assets.get(symbolUrl(def.id));
    this.fit();
  }

  /** Fits the cell; BONUS is 200x208, so by the longer side. */
  fit() {
    this.scale.set((this.size * 0.96) / Math.max(this.texture.width, this.texture.height));
  }
}
