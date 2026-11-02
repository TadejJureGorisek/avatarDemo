import gsap from 'gsap';
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import type { Grid } from '../../engine/SlotEngine';
import { Reel } from './Reel';

const FRAME_PAD = 18;
/** Seconds between one reel starting and the next. */
const REEL_START_STAGGER = 0.06;

/** The symbols area: a frame, a mask and `reels` Reel columns of `rows` cells each. */
export class Board extends Container {
  readonly reels: Reel[];
  readonly boardWidth: number;
  readonly boardHeight: number;
  /** One glow per reel, lit while that reel is in bonus anticipation. */
  private glows: Graphics[];
  /** Width including the frame around the reels. */
  get frameWidth() {
    return this.boardWidth + FRAME_PAD * 2;
  }

  constructor(
    reels: number,
    rows: number,
    readonly cellSize: number,
    getSymbol: (id: string) => SymbolDef,
    fillerSymbol: () => string,
    grid: Grid,
  ) {
    super();
    this.boardWidth = reels * cellSize;
    this.boardHeight = rows * cellSize;

    const reelLayer = new Container();
    const mask = new Graphics().rect(0, 0, this.boardWidth, this.boardHeight).fill(0xffffff);
    reelLayer.mask = mask;
    this.addChild(
      new Graphics().roundRect(-FRAME_PAD, -FRAME_PAD, this.frameWidth, this.boardHeight + FRAME_PAD * 2, 28)
        .fill({ color: 0x1a0b3d, alpha: 0.85 }).stroke({ color: 0xffc94a, width: 6 }),
      reelLayer,
      mask,
    );

    this.reels = Array.from({ length: reels }, (_, i) => {
      const reel = reelLayer.addChild(new Reel(rows, cellSize, getSymbol, fillerSymbol, grid[i]));
      reel.x = i * cellSize;
      return reel;
    });

    // Anticipation glow: a gold frame and soft tint over the whole reel, drawn above the symbols.
    this.glows = this.reels.map((reel) => {
      const glow = new Graphics()
        .roundRect(reel.x + 4, 4, cellSize - 8, this.boardHeight - 8, 18)
        .fill({ color: 0xffc94a, alpha: 0.16 })
        .stroke({ color: 0xffe27a, width: 8 });
      glow.visible = false;
      return this.addChild(glow);
    });

    // Clicks are mapped to a cell by position, since cells are recycled while the reels spin.
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(0, 0, this.boardWidth, this.boardHeight);
    this.on('pointertap', (e) => {
      e.stopPropagation();
      const p = this.toLocal(e.global);
      this.onCellTap?.(Math.floor(p.x / cellSize), Math.floor(p.y / cellSize));
    });
  }

  onCellTap?: (reel: number, row: number) => void;

  /** The landed stop symbols, reel by reel. */
  get stopSymbols(): Grid {
    return this.reels.map((r) => r.stopSymbols);
  }

  cell(reel: number, row: number) {
    return this.reels[reel].visibleCells[row];
  }

  get cells() {
    return this.reels.flatMap((r) => r.visibleCells);
  }

  /** Starts the reels one after another, each with its springy wind-up. */
  start() {
    this.reels.forEach((reel, i) => reel.start(i * REEL_START_STAGGER));
  }

  /** Bonus anticipation on a reel: it speeds up then slows down, and its glow blinks until it lands. */
  anticipate(reel: number) {
    this.reels[reel].anticipate();
    const glow = this.glows[reel];
    glow.visible = true;
    gsap.fromTo(glow, { alpha: 0.25 }, { alpha: 1, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  private endAnticipation(reel: number) {
    const glow = this.glows[reel];
    gsap.killTweensOf(glow);
    glow.visible = false;
  }

  /**
   * Lands `grid` reel by reel; reel i starts stopping `delays[i]` seconds from now.
   * Once `skip` resolves (player pressed STOP), every reel still waiting stops straight away.
   */
  stop(grid: Grid, delays: number[], onReelLanded: (reel: number) => void, skip: Promise<void>) {
    return Promise.all(
      this.reels.map(async (reel, i) => {
        await Promise.race([new Promise((resolve) => gsap.delayedCall(delays[i], resolve)), skip]);
        await reel.stop(grid[i]);
        this.endAnticipation(i);
        onReelLanded(i);
      }),
    );
  }
}
