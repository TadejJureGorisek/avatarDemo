import { Assets, Sprite } from 'pixi.js';

export const LOGO_URL = 'assets/logo/logo.webp';

export function logo(height: number, maxWidth = Infinity) {
  const sprite = new Sprite(Assets.get(LOGO_URL));
  sprite.anchor.set(0.5);
  sprite.scale.set(Math.min(height / sprite.texture.height, maxWidth / sprite.texture.width));
  return sprite;
}
