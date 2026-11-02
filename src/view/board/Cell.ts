import { Assets, Sprite } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';

export const symbolUrl = (id: string) => `assets/symbols/${id}.png`;

/** Anchored at its centre so it can pop in place. */
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

  /** Fits by the longer side (BONUS is 200x208). */
  fit() {
    this.scale.set((this.size * 0.96) / Math.max(this.texture.width, this.texture.height));
  }
}
