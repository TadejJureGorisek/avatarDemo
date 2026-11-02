import type { Sprite } from 'pixi.js';
import type { SlotEngine, SpinResult } from '../../engine/SlotEngine';
import type { Background } from '../Background';
import type { BigWin } from '../BigWin';
import type { Board } from '../board/Board';
import type { Character } from '../Character';
import type { Cheat } from '../hud/CheatMenu';
import type { HudState } from '../hud/Hud';
import type { HistoryEntry } from '../hud/menu/History';
import type { Message } from '../Message';
import type { Popup } from '../Popup';
import type { Splash } from '../Splash';
import type { SymbolInfo } from '../SymbolInfo';
import type { Wins } from '../Wins';

export type StateName = 'splash' | 'bet' | 'spin' | 'win';

/** Everything a state needs, shared across states. */
export interface GameContext {
  engine: SlotEngine;
  background: Background;
  board: Board;
  wins: Wins;
  character: Character;
  logo: Sprite;
  message: Message;
  popup: Popup;
  bigWin: BigWin;
  symbolInfo: SymbolInfo;
  splash: Splash;
  bet: () => number;
  updateHud: (patch: Partial<HudState>) => void;
  /** Resolves when the player presses SPIN, or picks a cheat from the cheat menu. */
  waitForSpin: () => Promise<Cheat | undefined>;
  /** Resolves when the player presses STOP during the spin. */
  waitForStop: () => Promise<void>;
  /** Uses up one autoplay spin; false when autoplay is off or finished. */
  takeAutoSpin: () => boolean;
  /** True while TURBO is on: spins run faster. */
  turbo: () => boolean;
  /** True while more autoplay spins are still to come. */
  autoplayRunning: () => boolean;
  stopAutoplay: () => void;
  /** Adds a finished spin to the HISTORY tab. */
  recordSpin: (entry: HistoryEntry) => void;
  /** Result of the last spin, set by SpinState for WinState. */
  result?: SpinResult;
}

export interface GameState {
  /** Runs the state and resolves with the next one. */
  enter(ctx: GameContext): Promise<StateName>;
}

/** Splash once, then loops Bet → Spin → Win (only when something was won) → Bet. */
export class StateMachine {
  current: StateName = 'splash';

  constructor(
    private states: Record<StateName, GameState>,
    private ctx: GameContext,
    private onChange: (state: StateName) => void,
  ) {}

  async run() {
    for (;;) {
      this.onChange(this.current);
      this.current = await this.states[this.current].enter(this.ctx);
    }
  }
}
