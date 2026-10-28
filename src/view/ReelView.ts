import { Container } from 'pixi.js';
import type { SymbolDef } from '../config/gameConfig';
import { SymbolView } from './SymbolView';
import { animate, ease, lerp } from './tween';

const ROW_STAGGER_MS = 50;
const FALL_OUT_MS = 260;
const FALL_IN_MS = 380;

/** A single column. Spins by dropping its current symbols out and the new ones in. */
export class ReelView extends Container {
  symbols: SymbolView[];

  constructor(
    initial: SymbolDef[],
    private readonly cellSize: number,
  ) {
    super();
    this.symbols = initial.map((def, row) => this.createSymbol(def, row));
  }

  private get height_(): number {
    return this.symbols.length * this.cellSize;
  }

  private rowY(row: number): number {
    return row * this.cellSize + this.cellSize / 2;
  }

  private createSymbol(def: SymbolDef, row: number): SymbolView {
    const view = new SymbolView(def, this.cellSize);
    view.position.set(this.cellSize / 2, this.rowY(row));
    this.addChild(view);
    return view;
  }

  async drop(next: SymbolDef[]): Promise<void> {
    const old = this.symbols;
    const distance = this.height_ + this.cellSize;
    const lastRow = old.length - 1;

    // Bottom row leaves first, then the ones above it.
    const fallOut = old.map((view, row) => {
      const startY = view.y;
      return animate(FALL_OUT_MS, (t) => (view.y = lerp(startY, startY + distance, t)), ease.inQuad,
        (lastRow - row) * ROW_STAGGER_MS);
    });

    this.symbols = next.map((def, row) => {
      const view = this.createSymbol(def, row);
      view.y -= distance;
      return view;
    });
    const fallIn = this.symbols.map((view, row) => {
      const targetY = this.rowY(row);
      const startY = view.y;
      return animate(FALL_IN_MS, (t) => (view.y = lerp(startY, targetY, t)), ease.outBack,
        FALL_OUT_MS * 0.5 + (lastRow - row) * ROW_STAGGER_MS);
    });

    await Promise.all(fallOut);
    old.forEach((view) => view.destroy());
    await Promise.all(fallIn);
  }
}
