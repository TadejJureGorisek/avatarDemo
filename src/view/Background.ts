import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

/** The art for each part of the game, with where its floor is (of its height). */
const ART = {
  base: 'assets/backgrounds/base.webp',
  freeSpins: 'assets/backgrounds/free-spins.webp',
  splash: 'assets/backgrounds/splash.webp',
};
const ART_FLOOR = 0.755;
export const BACKGROUND_URLS = Object.values(ART);

/**
 * Full-window background behind the scene. A purple gradient shows while loading; then the art
 * (base game, free spins, splash) covers the window, cropped to fit, and placed so its floor stays
 * under the character's feet whatever the window's shape. It cross-fades: the free spins art on top
 * of the rest, so a partial blend of it gives the splash a hint of gold.
 */
export class Background extends Container {
  private gradient = new Graphics();
  private fill = new FillGradient({
    type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }],
  });
  private art?: Record<keyof typeof ART, Sprite>;
  private last: [number, number, number] = [0, 0, 0];

  constructor() {
    super();
    this.addChild(this.gradient);
  }

  /** Adds the art once it has loaded (`BACKGROUND_URLS`); the splash art shows first. */
  addArt() {
    const sprite = (url: string) => new Sprite(Assets.get(url));
    this.art = { base: sprite(ART.base), splash: sprite(ART.splash), freeSpins: sprite(ART.freeSpins) };
    this.art.freeSpins.alpha = 0;
    this.addChild(this.art.base, this.art.splash, this.art.freeSpins);
    this.resize(...this.last);
  }

  /** Covers a `width` × `height` window with the art's floor at `floorY` (px from the top). */
  resize(width: number, height: number, floorY: number) {
    this.last = [width, height, floorY];
    this.gradient.clear().rect(0, 0, width, height).fill(this.fill);
    for (const sprite of Object.values(this.art ?? {})) {
      const { width: w, height: h } = sprite.texture;
      // As big as it takes to span the width, and to reach both the top (above the floor) and the
      // bottom (below it) of the window.
      const scale = Math.max(width / w, floorY / (ART_FLOOR * h), (height - floorY) / ((1 - ART_FLOOR) * h));
      sprite.scale.set(scale);
      sprite.position.set((width - w * scale) / 2, floorY - ART_FLOOR * h * scale);
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
