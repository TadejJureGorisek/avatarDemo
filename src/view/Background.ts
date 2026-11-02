import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

export type Orientation = 'landscape' | 'portrait';

/** The art for each part of the game, landscape (16:9) and portrait (9:16). */
const ART = {
  base: { landscape: 'assets/backgrounds/base.webp', portrait: 'assets/backgrounds/base-portrait.webp' },
  freeSpins: { landscape: 'assets/backgrounds/free-spins.webp', portrait: 'assets/backgrounds/free-spins-portrait.webp' },
  splash: { landscape: 'assets/backgrounds/splash.webp', portrait: 'assets/backgrounds/splash-portrait.webp' },
};
export const BACKGROUND_URLS = Object.values(ART).flatMap((a) => Object.values(a));

/**
 * Full-window background behind the scene. A purple gradient shows while loading; then the art
 * (base game, free spins, splash) for the window's orientation covers the whole window, centred
 * and cropped to fit, and cross-fades: the free spins art on top of the rest, so a partial blend
 * of it gives the splash a hint of gold.
 */
export class Background extends Container {
  private gradient = new Graphics();
  private fill = new FillGradient({
    type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }],
  });
  private art?: Record<keyof typeof ART, Sprite>;
  private last: [number, number, Orientation] = [0, 0, 'landscape'];

  constructor() {
    super();
    this.addChild(this.gradient);
  }

  /** Adds the art once it has loaded (`BACKGROUND_URLS`); the splash art shows first. */
  addArt() {
    this.art = { base: new Sprite(), splash: new Sprite(), freeSpins: new Sprite() };
    this.art.freeSpins.alpha = 0;
    this.addChild(this.art.base, this.art.splash, this.art.freeSpins);
    this.resize(...this.last);
  }

  resize(width: number, height: number, orientation: Orientation) {
    this.last = [width, height, orientation];
    this.gradient.clear().rect(0, 0, width, height).fill(this.fill);
    for (const [key, sprite] of Object.entries(this.art ?? {})) {
      sprite.texture = Assets.get(ART[key as keyof typeof ART][orientation]);
      const scale = Math.max(width / sprite.texture.width, height / sprite.texture.height);
      sprite.scale.set(scale);
      sprite.position.set((width - sprite.texture.width * scale) / 2, (height - sprite.texture.height * scale) / 2);
    }
  }

  setFreeSpins(on: boolean) {
    this.setGold(on ? 1 : 0, 0.8);
  }

  /** Blends in `amount` (0–1) of the free spins art; a slow partial blend gives the splash a hint of it. */
  setGold(amount: number, duration = 1.5) {
    if (this.art) gsap.to(this.art.freeSpins, { alpha: amount, duration, ease: 'sine.inOut', overwrite: true });
  }

  /** Fades the splash art out to the base game's (or back in). */
  setSplash(on: boolean, duration = 0.8) {
    if (this.art) gsap.to(this.art.splash, { alpha: on ? 1 : 0, duration, ease: 'sine.inOut' });
  }
}
