import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

export const BACKGROUND_URLS = {
  base: 'assets/backgrounds/base.webp',
  freeSpins: 'assets/backgrounds/free-spins.webp',
  splash: 'assets/backgrounds/splash.webp',
};

const gradient = (top: number, bottom: number) => new FillGradient({
  type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
  colorStops: [{ offset: 0, color: top }, { offset: 1, color: bottom }],
});

/**
 * Full-screen background behind the scene. A purple gradient shows while loading; then the art
 * (base game, free spins, splash) covers the window, cropped to fit its shape, and cross-fades:
 * the free spins art on top of the rest, so a partial blend of it gives the splash a hint of gold.
 */
export class Background extends Container {
  private gradient = new Graphics();
  private fill = gradient(0x3b0f8c, 0x12052e);
  private art?: { base: Sprite; freeSpins: Sprite; splash: Sprite };
  private size = { width: 0, height: 0 };

  constructor() {
    super();
    this.addChild(this.gradient);
  }

  /** Adds the art once it has loaded (`BACKGROUND_URLS`); the splash art shows first. */
  addArt() {
    const sprite = (url: string) => new Sprite(Assets.get(url));
    this.art = { base: sprite(BACKGROUND_URLS.base), splash: sprite(BACKGROUND_URLS.splash), freeSpins: sprite(BACKGROUND_URLS.freeSpins) };
    this.art.freeSpins.alpha = 0;
    this.addChild(this.art.base, this.art.splash, this.art.freeSpins);
    this.resize(this.size.width, this.size.height);
  }

  resize(width: number, height: number) {
    this.size = { width, height };
    this.gradient.clear().rect(0, 0, width, height).fill(this.fill);
    // Each picture covers the whole window, centred, so only its edges get cropped.
    for (const s of Object.values(this.art ?? {})) {
      const scale = Math.max(width / s.texture.width, height / s.texture.height);
      s.scale.set(scale);
      s.position.set((width - s.texture.width * scale) / 2, (height - s.texture.height * scale) / 2);
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
