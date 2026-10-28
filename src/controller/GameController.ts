import type { GameConfig } from '../config/gameConfig';
import type { Rng } from '../engine/rng';
import { SlotEngine } from '../engine/SlotEngine';
import type { Grid, SpinResult, Win } from '../engine/types';
import { countSymbol } from '../engine/waysEvaluator';
import { CharacterAnim } from '../view/CharacterView';
import { GameStage } from '../view/GameStage';
import { wait } from '../view/tween';
import { Store } from './Store';

export interface UiState {
  ready: boolean;
  balance: number;
  betIndex: number;
  bet: number;
  lastWin: number;
  wins: Win[];
  spinning: boolean;
  freeSpinsRemaining: number;
  freeSpinsTotal: number;
  message: string;
}

const REEL_STAGGER_MS = 110;
const ANTICIPATION_EXTRA_MS = 900;
const FREE_SPIN_PAUSE_MS = 1100;

/**
 * Glue between the pure engine, the Pixi stage and the React UI. The UI only calls the public
 * methods here and reads `store`; it never touches Pixi or the engine directly.
 */
export class GameController {
  readonly store: Store<UiState>;
  private readonly engine: SlotEngine;
  private readonly stage = new GameStage();
  private readonly scatterId?: string;

  constructor(
    private readonly config: GameConfig,
    rng: Rng,
  ) {
    this.engine = new SlotEngine(config, rng);
    this.scatterId = config.symbols.find((s) => s.kind === 'scatter')?.id;
    this.store = new Store<UiState>({
      ready: false,
      balance: this.engine.balance,
      betIndex: config.defaultBetIndex,
      bet: config.bets[config.defaultBetIndex],
      lastWin: 0,
      wins: [],
      spinning: false,
      freeSpinsRemaining: 0,
      freeSpinsTotal: 0,
      message: 'Press SPIN to play',
    });
  }

  async mount(host: HTMLElement): Promise<void> {
    await this.stage.init(host, this.config, this.initialGrid());
    this.store.set({ ready: true });
  }

  destroy(): void {
    this.stage.destroy();
  }

  /** Dev/QA cheat, exposed on `window.game` in dev builds. */
  forceNextGrid(grid: Grid): void {
    this.engine.forceNextGrid(grid);
  }

  changeBet(direction: 1 | -1): void {
    const { betIndex, spinning, freeSpinsRemaining } = this.store.get();
    if (spinning || freeSpinsRemaining > 0) return;
    const next = Math.max(0, Math.min(this.config.bets.length - 1, betIndex + direction));
    this.store.set({ betIndex: next, bet: this.config.bets[next] });
  }

  async spin(): Promise<void> {
    const { spinning, bet, ready } = this.store.get();
    if (!ready || spinning) return;
    if (!this.engine.canSpin(bet)) {
      this.store.set({ message: 'Insufficient balance - lower your bet' });
      return;
    }

    const result = this.engine.spin(bet);
    this.store.set({
      spinning: true,
      lastWin: 0,
      wins: [],
      // Show the stake taken now; the win is added once the reels have landed.
      balance: this.engine.balance - result.totalWin,
      // Don't reveal newly awarded free spins before the scatters have landed.
      freeSpinsRemaining: this.engine.freeSpinsRemaining - result.freeSpinsAwarded,
      message: result.isFreeSpin ? 'Free spin!' : 'Good luck!',
    });

    await this.presentSpin(result);

    this.store.set({
      spinning: false,
      lastWin: result.totalWin,
      wins: result.wins,
      balance: this.engine.balance,
      freeSpinsRemaining: this.engine.freeSpinsRemaining,
      freeSpinsTotal: this.engine.freeSpinsTotal,
      message: this.resultMessage(result),
    });

    if (this.engine.inFreeSpins) {
      // Hold the trigger a little longer so the award message can be read.
      await wait(result.freeSpinsAwarded ? FREE_SPIN_PAUSE_MS * 2 : FREE_SPIN_PAUSE_MS);
      void this.spin();
    }
  }

  private async presentSpin(result: SpinResult): Promise<void> {
    const { board, character } = this.stage;
    const anticipationReel = this.findAnticipationReel(result.grid);
    const reelDelays = result.grid.map((_, reel) => {
      const extra = anticipationReel >= 0 && reel > anticipationReel ? (reel - anticipationReel) * ANTICIPATION_EXTRA_MS : 0;
      return reel * REEL_STAGGER_MS + extra;
    });

    await board.spin(result.grid, {
      reelDelays,
      onReelLanded: (reel) => {
        if (reel === anticipationReel) character.startAnticipation();
      },
    });

    board.showWins(result.wins);
    if (anticipationReel >= 0) {
      await character.resolveAnticipation(result.freeSpinsAwarded > 0);
    } else if (result.totalWin > 0) {
      void character.react(CharacterAnim.smallWin);
    }
  }

  /**
   * Reel after which one more scatter would trigger free spins, or -1. The remaining reels are
   * slowed down while the character plays the anticipation animation.
   */
  private findAnticipationReel(grid: Grid): number {
    if (!this.scatterId) return -1;
    const needed = this.config.freeSpins.minScatters - 1;
    for (let reel = 0; reel < grid.length - 1; reel++) {
      if (countSymbol(grid, this.scatterId, reel) >= needed) return reel;
    }
    return -1;
  }

  private resultMessage(result: SpinResult): string {
    if (result.freeSpinsAwarded) return `${result.freeSpinsAwarded} FREE SPINS awarded!`;
    if (result.isFreeSpin && !this.engine.inFreeSpins) {
      return `Free spins complete - total win ${this.engine.freeSpinsTotal.toFixed(2)}`;
    }
    if (result.totalWin > 0) {
      const ways = result.wins.filter((w) => w.type === 'ways').reduce((n, w) => n + w.ways, 0);
      return ways ? `Win on ${ways} way${ways > 1 ? 's' : ''}!` : 'Scatter win!';
    }
    return result.isFreeSpin ? 'Free spin' : 'Press SPIN to play';
  }

  private initialGrid(): Grid {
    return this.engine.generateGrid();
  }
}
