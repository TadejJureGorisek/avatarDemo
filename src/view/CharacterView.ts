import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';

export const CHARACTER_ASSETS = {
  skeleton: { alias: 'characterSkeleton', src: 'assets/character/character.json' },
  atlas: { alias: 'characterAtlas', src: 'assets/character/character.atlas' },
};

/** Animations available in character.json (Spine 4.2.43 export). */
export const CharacterAnim = {
  idle: 'character_idle',
  smallWin: 'character_small_win',
  anticipation: 'character_bonus_anticipation',
  anticipationWin: 'character_bonus_anticipation_win',
  anticipationLose: 'character_bonus_anticipation_lose',
  wildThrow: 'character_wild_throw',
  wildLanding: 'character_wild_landing',
} as const;

/**
 * Wraps the Spine character. Track 0 holds the looping idle; reactions are played on top of it
 * and then queue the idle back in, so the character never freezes between states.
 */
export class CharacterView extends Container {
  readonly spine: Spine;

  constructor(scale = 1) {
    super();
    this.spine = Spine.from({
      skeleton: CHARACTER_ASSETS.skeleton.alias,
      atlas: CHARACTER_ASSETS.atlas.alias,
      scale,
    });
    this.spine.state.data.defaultMix = 0.2;
    this.addChild(this.spine);
    this.idle();
  }

  idle(): void {
    this.spine.state.setAnimation(0, CharacterAnim.idle, true);
  }

  /** Plays a one-shot reaction, then returns to idle. Resolves when the reaction ends. */
  react(animation: string): Promise<void> {
    return new Promise((resolve) => {
      const entry = this.spine.state.setAnimation(0, animation, false);
      entry.listener = { complete: () => resolve() };
      this.spine.state.addAnimation(0, CharacterAnim.idle, true, 0);
    });
  }

  /** Loops the anticipation pose until `resolveAnticipation` is called. */
  startAnticipation(): void {
    this.spine.state.setAnimation(0, CharacterAnim.anticipation, true);
  }

  resolveAnticipation(won: boolean): Promise<void> {
    return this.react(won ? CharacterAnim.anticipationWin : CharacterAnim.anticipationLose);
  }
}
