import { Assets, Sprite } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';

export const symbolUrl = (id: string) => `assets/symbols/${id}.png`;
/** The lit-up version shown on winning symbols. */
export const litSymbolUrl = (id: string) => `assets/symbols/${id}_connect.png`;

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

  setLit(lit: boolean) {
    const url = lit ? litSymbolUrl(this.def.id) : symbolUrl(this.def.id);
    if (Assets.cache.has(url)) this.texture = Assets.get(url);
  }

  fit() {
    this.scale.set((this.size * 0.96) / Math.max(this.texture.width, this.texture.height));
  }
}
