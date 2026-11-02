import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

const ART = {
  base: { url: 'assets/backgrounds/base.webp', floor: 0.71 },
  freeSpins: { url: 'assets/backgrounds/free-spins.webp', floor: 0.755 },
  splash: { url: 'assets/backgrounds/splash.webp', floor: 0.755 },
};
export const BACKGROUND_URLS = Object.values(ART).map((a) => a.url);

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

  addArt() {
    const sprite = (key: keyof typeof ART) => new Sprite(Assets.get(ART[key].url));
    this.art = { base: sprite('base'), splash: sprite('splash'), freeSpins: sprite('freeSpins') };
    this.art.freeSpins.alpha = 0;
    this.addChild(this.art.base, this.art.splash, this.art.freeSpins);
    this.resize(...this.last);
  }

  resize(width: number, height: number, floorY: number) {
    this.last = [width, height, floorY];
    this.gradient.clear().rect(0, 0, width, height).fill(this.fill);
    for (const [key, sprite] of Object.entries(this.art ?? {})) {
      const { width: w, height: h } = sprite.texture;
      const { floor } = ART[key as keyof typeof ART];
      const scale = Math.max(width / w, floorY / (floor * h), (height - floorY) / ((1 - floor) * h));
      sprite.scale.set(scale);
      sprite.position.set((width - w * scale) / 2, floorY - floor * h * scale);
    }
  }

  setFreeSpins(on: boolean) {
    this.setGold(on ? 1 : 0, 0.8);
  }

  setGold(amount: number, duration = 1.5) {
    if (this.art) gsap.to(this.art.freeSpins, { alpha: amount, duration, ease: 'sine.inOut', overwrite: true });
  }

  setSplash(on: boolean, duration = 0.8) {
    if (this.art) gsap.to(this.art.splash, { alpha: on ? 1 : 0, duration, ease: 'sine.inOut' });
  }
}
