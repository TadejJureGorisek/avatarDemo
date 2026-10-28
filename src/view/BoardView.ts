import { Container, Graphics, Ticker } from 'pixi.js';
import type { GameConfig, SymbolDef } from '../config/gameConfig';
import type { Grid, Win } from '../engine/types';
import { ReelView } from './ReelView';
import { wait } from './tween';

export interface SpinAnimationOptions {
  /** Start delay per reel in ms; lets the controller stretch reels for anticipation. */
  reelDelays: number[];
  onReelLanded?: (reel: number) => void;
}

/** The reel area: frame, mask and one ReelView per column. Board size comes from config. */
export class BoardView extends Container {
  readonly reels: ReelView[] = [];
  readonly boardWidth: number;
  readonly boardHeight: number;
  private readonly defs: Map<string, SymbolDef>;

  constructor(
    config: GameConfig,
    initial: Grid,
    readonly cellSize = 200,
  ) {
    super();
    this.defs = new Map(config.symbols.map((s) => [s.id, s]));
    this.boardWidth = config.reels * cellSize;
    this.boardHeight = config.rows * cellSize;

    const pad = 18;
    const frame = new Graphics()
      .roundRect(-pad, -pad, this.boardWidth + pad * 2, this.boardHeight + pad * 2, 28)
      .fill({ color: 0x1a0b3d, alpha: 0.85 })
      .stroke({ color: 0xffc94a, width: 6 });
    this.addChild(frame);

    const reelLayer = new Container();
    const mask = new Graphics().rect(0, 0, this.boardWidth, this.boardHeight).fill(0xffffff);
    reelLayer.mask = mask;
    this.addChild(reelLayer, mask);

    for (let i = 0; i < config.reels; i++) {
      if (i > 0) {
        reelLayer.addChild(
          new Graphics().rect(i * cellSize - 1, 0, 2, this.boardHeight).fill({ color: 0xffffff, alpha: 0.08 }),
        );
      }
      const reel = new ReelView(initial[i].map((id) => this.def(id)), cellSize);
      reel.x = i * cellSize;
      reelLayer.addChild(reel);
      this.reels.push(reel);
    }

    Ticker.shared.add(this.tick, this);
  }

  private def(id: string): SymbolDef {
    const def = this.defs.get(id);
    if (!def) throw new Error(`Unknown symbol ${id}`);
    return def;
  }

  private tick(ticker: Ticker): void {
    for (const reel of this.reels) for (const symbol of reel.symbols) symbol.update(ticker.deltaMS);
  }

  async spin(grid: Grid, { reelDelays, onReelLanded }: SpinAnimationOptions): Promise<void> {
    this.clearWins();
    await Promise.all(
      this.reels.map(async (reel, i) => {
        await wait(reelDelays[i] ?? 0);
        await reel.drop(grid[i].map((id) => this.def(id)));
        onReelLanded?.(i);
      }),
    );
  }

  showWins(wins: Win[]): void {
    const winning = new Set(wins.flatMap((w) => w.positions.map((p) => `${p.reel}:${p.row}`)));
    this.reels.forEach((reel, r) =>
      reel.symbols.forEach((symbol, row) => {
        const on = winning.has(`${r}:${row}`);
        symbol.setHighlight(on);
        symbol.setDimmed(!on);
      }),
    );
  }

  clearWins(): void {
    for (const reel of this.reels) for (const symbol of reel.symbols) symbol.setHighlight(false);
  }

  override destroy(): void {
    Ticker.shared.remove(this.tick, this);
    super.destroy({ children: true });
  }
}
