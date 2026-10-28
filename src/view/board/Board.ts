import { Container, Graphics } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import type { Grid } from '../../engine/SlotEngine';
import { Reel } from './Reel';

/** The symbols area: a frame, a mask and `reels` Reel columns of `rows` cells each. */
export class Board extends Container {
  readonly reels: Reel[];
  readonly boardWidth: number;
  readonly boardHeight: number;

  constructor(reels: number, rows: number, readonly cellSize: number, getSymbol: (id: string) => SymbolDef, grid: Grid) {
    super();
    this.boardWidth = reels * cellSize;
    this.boardHeight = rows * cellSize;

    const reelLayer = new Container();
    const mask = new Graphics().rect(0, 0, this.boardWidth, this.boardHeight).fill(0xffffff);
    reelLayer.mask = mask;
    this.addChild(
      new Graphics().roundRect(-18, -18, this.boardWidth + 36, this.boardHeight + 36, 28)
        .fill({ color: 0x1a0b3d, alpha: 0.85 }).stroke({ color: 0xffc94a, width: 6 }),
      reelLayer,
      mask,
    );

    this.reels = Array.from({ length: reels }, (_, i) => {
      const reel = reelLayer.addChild(new Reel(rows, cellSize, getSymbol, grid[i]));
      reel.x = i * cellSize;
      return reel;
    });
  }

  cell(reel: number, row: number) {
    return this.reels[reel].cells[row];
  }

  get cells() {
    return this.reels.flatMap((r) => r.cells);
  }

  /** Drops reels one after another; `delays[reel]` (seconds) lets the caller slow reels down for anticipation. */
  spin(grid: Grid, delays: number[], onReelLanded: (reel: number) => void) {
    return Promise.all(
      this.reels.map(async (reel, i) => {
        await reel.drop(grid[i], delays[i]);
        onReelLanded(i);
      }),
    );
  }
}
