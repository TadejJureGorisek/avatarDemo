import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';

export const CHARACTER_ASSETS = [
  { alias: 'characterSkeleton', src: 'assets/character/character.json' },
  { alias: 'characterAtlas', src: 'assets/character/character.atlas' },
];

/** Spine 4.2. Track 0 loops idle; reactions play once and queue idle back in. */
export class Character extends Container {
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
