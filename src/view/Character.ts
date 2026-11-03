import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import { sound, type Effect } from './Sound';

export const CHARACTER_ASSETS = [
  { alias: 'characterSkeleton', src: 'assets/character/character.json' },
  { alias: 'characterAtlas', src: 'assets/character/character.atlas' },
];

const EVENT_SOUNDS: Record<string, Effect> = {
  sfx_squat: 'squat', sfx_smile: 'smile', sfx_unsquat: 'unsquat', sfx_wiggle: 'wiggle',
  sfx_clink: 'clink', sfx_anticipation: 'celebrate',
};

export class Character extends Container {
  private spine = Spine.from({ skeleton: 'characterSkeleton', atlas: 'characterAtlas', scale: 0.95 });

  constructor() {
    super();
    this.spine.state.data.defaultMix = 0.2;
    this.spine.state.setAnimation(0, 'character_idle', true);
    this.spine.state.addListener({
      event: (_, e) => {
        const effect = EVENT_SOUNDS[e.data.name];
        if (effect) sound.play(effect);
      },
    });
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
