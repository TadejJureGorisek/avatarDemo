import gsap from 'gsap';
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import type { Grid } from '../../engine/SlotEngine';
import { goldFrame } from '../Frame';
import { Reel } from './Reel';

export const FRAME_PAD = 70;
const SEE_THROUGH = 0.4;
const REEL_START_STAGGER = 0.06;

export class Board extends Container {
  readonly reels: Reel[];
  readonly boardWidth: number;
  readonly boardHeight: number;
  private glows: Graphics[];
  private hurried = false;
  private turbo = false;

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
    const back = new Graphics().roundRect(-8, -8, this.boardWidth + 16, this.boardHeight + 16, 24)
      .fill({ color: 0x1a0b3d, alpha: 1 - SEE_THROUGH });
    this.addChild(back, reelLayer, mask, goldFrame(this.boardWidth, this.boardHeight, FRAME_PAD));

    this.reels = Array.from({ length: reels }, (_, i) => {
      const reel = reelLayer.addChild(new Reel(rows, cellSize, getSymbol, fillerSymbol, grid[i]));
      reel.x = i * cellSize;
      return reel;
    });

    this.glows = this.reels.map((reel) => {
      const glow = new Graphics()
        .roundRect(reel.x + 4, 4, cellSize - 8, this.boardHeight - 8, 18)
        .fill({ color: 0xffc94a, alpha: 0.16 })
        .stroke({ color: 0xffe27a, width: 8 });
      glow.visible = false;
      return this.addChild(glow);
    });

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

  cell(reel: number, row: number) {
    return this.reels[reel].visibleCells[row];
  }

  start(turbo = 1) {
    this.hurried = false;
    this.turbo = turbo > 1;
    this.reels.forEach((reel, i) => reel.start((i * REEL_START_STAGGER) / turbo, turbo));
  }

  anticipate(reel: number) {
    if (this.hurried) return;
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

  stop(grid: Grid, delays: number[], onReelLanded: (reel: number) => void, skip: Promise<void>) {
    void skip.then(() => {
      this.hurried = true;
      this.reels.forEach((reel, i) => {
        reel.hurry(this.turbo);
        this.endAnticipation(i);
      });
    });
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
