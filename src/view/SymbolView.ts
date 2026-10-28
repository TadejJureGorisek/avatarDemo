import { Assets, Container, Sprite, Texture } from 'pixi.js';
import type { SymbolDef } from '../config/gameConfig';

export const symbolTexturePath = (id: string, connect = false) =>
  `assets/symbols/${id}${connect ? '_connect' : ''}.png`;

export function symbolAssetUrls(symbols: readonly SymbolDef[]): string[] {
  return symbols.flatMap((s) =>
    s.hasConnect ? [symbolTexturePath(s.id), symbolTexturePath(s.id, true)] : [symbolTexturePath(s.id)],
  );
}

/** One cell on the board. Anchored at its centre so it can pulse in place. */
export class SymbolView extends Container {
  private readonly sprite = new Sprite();
  private def!: SymbolDef;
  private pulsePhase = 0;
  private pulsing = false;

  constructor(
    def: SymbolDef,
    private readonly cellSize: number,
  ) {
    super();
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
    this.setSymbol(def);
  }

  get symbolId(): string {
    return this.def.id;
  }

  setSymbol(def: SymbolDef): void {
    this.def = def;
    this.setHighlight(false);
  }

  setHighlight(on: boolean): void {
    const connect = on && this.def.hasConnect;
    this.sprite.texture = Assets.get<Texture>(symbolTexturePath(this.def.id, connect));
    // Fit within the cell (BONUS is slightly taller than the regular 200x200 symbols).
    const scale = (this.cellSize * 0.96) / Math.max(this.sprite.texture.width, this.sprite.texture.height);
    this.sprite.scale.set(scale);
    this.pulsing = on;
    this.alpha = 1;
    if (!on) this.scale.set(1);
  }

  setDimmed(dimmed: boolean): void {
    this.alpha = dimmed ? 0.35 : 1;
  }

  /** Called every frame by the board while wins are shown. */
  update(deltaMs: number): void {
    if (!this.pulsing) return;
    this.pulsePhase += deltaMs / 1000;
    this.scale.set(1 + Math.sin(this.pulsePhase * Math.PI * 2 * 1.5) * 0.06);
  }
}
