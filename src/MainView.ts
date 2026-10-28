// Everything on screen except the React HUD: board, win layer, Spine character, and the spin flow
// that drives them from the engine's results. Exposes a small store the HUD subscribes to.
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Application, Assets, Container, FillGradient, Graphics, Sprite, Ticker } from 'pixi.js';
import type { GameConfig, SymbolDef } from './engine/config';
import { countSymbol, SlotEngine, type Grid, type SpinResult, type Win } from './engine/SlotEngine';

const CELL = 200;
const DESIGN = { width: 1600, height: 900 };
const HUD_HEIGHT = 110;
const REEL_STAGGER_MS = 110;
const ANTICIPATION_EXTRA_MS = 900;
const FREE_SPIN_PAUSE_MS = 1100;

const symbolUrl = (id: string, connect = false) => `assets/symbols/${id}${connect ? '_connect' : ''}.png`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIn = (t: number) => t * t;
const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;

/** Calls `update(easedProgress)` every frame for `ms` after `delay`. */
function animate(ms: number, update: (t: number) => void = () => {}, ease = (t: number) => t, delay = 0) {
  return new Promise<void>((resolve) => {
    let elapsed = -delay;
    const tick = (ticker: Ticker) => {
      elapsed += ticker.deltaMS;
      if (elapsed < 0) return;
      const t = Math.min(elapsed / ms, 1);
      update(ease(t));
      if (t === 1) {
        Ticker.shared.remove(tick);
        resolve();
      }
    };
    Ticker.shared.add(tick);
  });
}

class Cell extends Sprite {
  constructor(readonly def: SymbolDef) {
    super(Assets.get(symbolUrl(def.id)));
    this.anchor.set(0.5);
    this.fit();
  }

  /** BONUS is 200x208, so fit by the longer side. */
  fit(pulse = 1) {
    this.scale.set(((CELL * 0.96) / Math.max(this.texture.width, this.texture.height)) * pulse);
  }
}

/** The reel area. Spins by dropping each reel's symbols out and the new ones in, reel by reel. */
class Board extends Container {
  columns: Cell[][];
  private reelLayer = new Container();

  constructor(private defs: Map<string, SymbolDef>, grid: Grid) {
    super();
    const w = grid.length * CELL;
    const h = grid[0].length * CELL;
    const mask = new Graphics().rect(0, 0, w, h).fill(0xffffff);
    this.reelLayer.mask = mask;
    this.addChild(
      new Graphics().roundRect(-18, -18, w + 36, h + 36, 28).fill({ color: 0x1a0b3d, alpha: 0.85 })
        .stroke({ color: 0xffc94a, width: 6 }),
      this.reelLayer,
      mask,
    );
    this.columns = grid.map((ids, reel) => ids.map((id, row) => this.addCell(id, reel, row, 0)));
  }

  private addCell(id: string, reel: number, row: number, offsetY: number) {
    const cell = new Cell(this.defs.get(id)!);
    cell.position.set(reel * CELL + CELL / 2, row * CELL + CELL / 2 + offsetY);
    this.reelLayer.addChild(cell);
    return cell;
  }

  /** `delays[reel]` is when each reel starts, so reels can be slowed down for anticipation. */
  spin(grid: Grid, delays: number[], onReelLanded: (reel: number) => void) {
    const fall = (grid[0].length + 1) * CELL;
    return Promise.all(
      grid.map(async (ids, reel) => {
        await animate(delays[reel]);
        const old = this.columns[reel];
        const last = old.length - 1;
        const out = old.map((cell, row) => {
          const y = cell.y;
          return animate(260, (t) => (cell.y = lerp(y, y + fall, t)), easeIn, (last - row) * 50);
        });
        this.columns[reel] = ids.map((id, row) => this.addCell(id, reel, row, -fall));
        const into = this.columns[reel].map((cell, row) => {
          const y = cell.y;
          return animate(380, (t) => (cell.y = lerp(y, y + fall, t)), easeOutBack, 130 + (last - row) * 50);
        });
        await Promise.all(out);
        old.forEach((cell) => cell.destroy());
        await Promise.all(into);
        onReelLanded(reel);
      }),
    );
  }
}

/** Win presentation: winning cells switch to their `_connect` art and pulse, the rest dim. */
class WinLayer {
  private winning: Cell[] = [];
  private time = 0;

  constructor(private board: Board) {
    Ticker.shared.add((ticker) => {
      this.time += ticker.deltaMS / 1000;
      const pulse = 1 + Math.sin(this.time * 9.4) * 0.06;
      this.winning.forEach((cell) => cell.fit(pulse));
    });
  }

  show(wins: Win[]) {
    this.clear();
    this.winning = [...new Set(wins.flatMap((w) => w.positions.map((p) => this.board.columns[p.reel][p.row])))];
    if (!wins.length) return;
    this.board.columns.flat().forEach((cell) => (cell.alpha = 0.35));
    for (const cell of this.winning) {
      cell.alpha = 1;
      if (cell.def.hasConnect) cell.texture = Assets.get(symbolUrl(cell.def.id, true));
    }
  }

  clear() {
    for (const cell of this.board.columns.flat()) {
      cell.alpha = 1;
      cell.texture = Assets.get(symbolUrl(cell.def.id));
      cell.fit();
    }
    this.winning = [];
  }
}

/** Spine character. Track 0 loops idle; reactions play once and queue idle back in. */
class Character extends Container {
  private spine = Spine.from({ skeleton: 'characterSkeleton', atlas: 'characterAtlas', scale: 0.95 });

  constructor() {
    super();
    this.spine.state.data.defaultMix = 0.2;
    this.spine.state.setAnimation(0, 'character_idle', true);
    this.addChild(this.spine);
  }

  play(name: 'small_win' | 'bonus_anticipation_win' | 'bonus_anticipation_lose') {
    return new Promise<void>((resolve) => {
      this.spine.state.setAnimation(0, `character_${name}`, false).listener = { complete: () => resolve() };
      this.spine.state.addAnimation(0, 'character_idle', true, 0);
    });
  }

  startAnticipation() {
    this.spine.state.setAnimation(0, 'character_bonus_anticipation', true);
  }
}

export interface HudState {
  ready: boolean;
  balance: number;
  bet: number;
  lastWin: number;
  spinning: boolean;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  message: string;
}

export class MainView {
  private engine: SlotEngine;
  private app = new Application();
  private board!: Board;
  private winLayer!: WinLayer;
  private character!: Character;
  private betIndex: number;
  private listeners = new Set<() => void>();
  private state: HudState;

  constructor(private config: GameConfig) {
    this.engine = new SlotEngine(config);
    this.betIndex = config.defaultBetIndex;
    this.state = {
      ready: false, balance: this.engine.balance, bet: config.bets[this.betIndex], lastWin: 0,
      spinning: false, freeSpinsLeft: 0, freeSpinsTotal: 0, message: 'Press SPIN to play',
    };
  }

  // Store API for React's useSyncExternalStore.
  getState = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
  private set(patch: Partial<HudState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  async mount(host: HTMLElement) {
    const { app, config } = this;
    await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true,
      resolution: Math.min(devicePixelRatio, 2) });
    host.appendChild(app.canvas);

    Assets.add([
      { alias: 'characterSkeleton', src: 'assets/character/character.json' },
      { alias: 'characterAtlas', src: 'assets/character/character.atlas' },
    ]);
    const textures = config.symbols.flatMap((s) => (s.hasConnect ? [symbolUrl(s.id), symbolUrl(s.id, true)] : [symbolUrl(s.id)]));
    await Assets.load([...textures, 'characterSkeleton', 'characterAtlas']);

    const background = new Graphics();
    const scene = new Container();
    this.board = new Board(new Map(config.symbols.map((s) => [s.id, s])), this.engine.generateGrid());
    this.board.position.set(90, (DESIGN.height - config.rows * CELL) / 2 - 40);
    this.winLayer = new WinLayer(this.board);
    this.character = new Character();
    this.character.position.set(1370, 560);
    scene.addChild(this.character, this.board);
    app.stage.addChild(background, scene);

    // Letterbox the 1600x900 scene above the HUD.
    const layout = () => {
      const { width, height } = app.screen;
      const fill = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
        colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }] });
      background.clear().rect(0, 0, width, height).fill(fill);
      const scale = Math.min(width / DESIGN.width, (height - HUD_HEIGHT) / DESIGN.height);
      scene.scale.set(scale);
      scene.position.set((width - DESIGN.width * scale) / 2, (height - HUD_HEIGHT - DESIGN.height * scale) / 2);
    };
    app.renderer.on('resize', layout);
    layout();

    this.set({ ready: true });
  }

  changeBet(direction: 1 | -1) {
    if (this.state.spinning || this.state.freeSpinsLeft) return;
    this.betIndex = Math.max(0, Math.min(this.config.bets.length - 1, this.betIndex + direction));
    this.set({ bet: this.config.bets[this.betIndex] });
  }

  async spin() {
    const { ready, spinning, bet } = this.state;
    if (!ready || spinning) return;
    if (!this.engine.canSpin(bet)) return this.set({ message: 'Not enough balance, lower your bet' });

    const result = this.engine.spin(bet);
    this.set({
      spinning: true,
      lastWin: 0,
      balance: this.engine.balance - result.totalWin, // show the stake now, the win once reels land
      freeSpinsLeft: this.engine.freeSpinsLeft - result.freeSpinsAwarded,
      message: result.isFreeSpin ? 'Free spin!' : 'Good luck!',
    });

    await this.present(result);

    this.set({
      spinning: false,
      lastWin: result.totalWin,
      balance: this.engine.balance,
      freeSpinsLeft: this.engine.freeSpinsLeft,
      freeSpinsTotal: this.engine.freeSpinsTotal,
      message: this.message(result),
    });

    if (this.engine.freeSpinsLeft) {
      await animate(result.freeSpinsAwarded ? FREE_SPIN_PAUSE_MS * 2 : FREE_SPIN_PAUSE_MS);
      void this.spin();
    }
  }

  private async present(result: SpinResult) {
    // Once one more scatter would trigger free spins, slow the remaining reels and play anticipation.
    const anticipationReel = this.anticipationReel(result.grid);
    const delays = result.grid.map((_, reel) =>
      reel * REEL_STAGGER_MS + (anticipationReel >= 0 && reel > anticipationReel ? (reel - anticipationReel) * ANTICIPATION_EXTRA_MS : 0));

    this.winLayer.clear();
    await this.board.spin(result.grid, delays, (reel) => reel === anticipationReel && this.character.startAnticipation());
    this.winLayer.show(result.wins);

    if (anticipationReel >= 0) {
      await this.character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
    } else if (result.totalWin) {
      void this.character.play('small_win');
    }
  }

  private anticipationReel(grid: Grid) {
    const scatter = this.config.symbols.find((s) => s.kind === 'scatter');
    if (!scatter) return -1;
    for (let reel = 0; reel < grid.length - 1; reel++) {
      if (countSymbol(grid, scatter.id, reel) >= this.config.freeSpins.minScatters - 1) return reel;
    }
    return -1;
  }

  private message(result: SpinResult) {
    if (result.freeSpinsAwarded) return `${result.freeSpinsAwarded} FREE SPINS!`;
    if (result.isFreeSpin && !this.engine.freeSpinsLeft) return `Free spins total: ${this.engine.freeSpinsTotal.toFixed(2)}`;
    const ways = result.wins.reduce((n, w) => n + w.ways, 0);
    return result.totalWin ? `Win on ${ways} way${ways > 1 ? 's' : ''}!` : 'Press SPIN to play';
  }
}
