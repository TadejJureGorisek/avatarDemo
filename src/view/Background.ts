import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

const ART = {
  base: { url: 'assets/backgrounds/base.webp', floor: 0.71 },
  freeSpins: { url: 'assets/backgrounds/free-spins.webp', floor: 0.755 },
  splash: { url: 'assets/backgrounds/splash.webp', floor: 0.755 },
};
export type ArtName = keyof typeof ART;
export const artUrl = (name: ArtName) => ART[name].url;

export class Background extends Container {
  private gradient = new Graphics();
  private fill = new FillGradient({
    type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }],
  });
  private art: Record<ArtName, Sprite> = { base: new Sprite(), splash: new Sprite(), freeSpins: new Sprite() };
  private last: [number, number, number] = [0, 0, 0];

  constructor() {
    super();
    this.art.freeSpins.alpha = 0;
    this.addChild(this.gradient, this.art.base, this.art.splash, this.art.freeSpins);
  }

  /** Shows art once it has loaded (`artUrl`). */
  addArt(...names: ArtName[]) {
    for (const name of names) this.art[name].texture = Assets.get(artUrl(name));
    this.resize(...this.last);
  }

  resize(width: number, height: number, floorY: number) {
    this.last = [width, height, floorY];
    this.gradient.clear().rect(0, 0, width, height).fill(this.fill);
    for (const [key, sprite] of Object.entries(this.art)) {
      const { width: w, height: h } = sprite.texture;
      const { floor } = ART[key as ArtName];
      const scale = Math.max(width / w, floorY / (floor * h), (height - floorY) / ((1 - floor) * h));
      sprite.scale.set(scale);
      sprite.position.set((width - w * scale) / 2, floorY - floor * h * scale);
    }
  }

  setFreeSpins(on: boolean) {
    this.setGold(on ? 1 : 0, 0.8);
  }

  setGold(amount: number, duration = 1.5) {
    gsap.to(this.art.freeSpins, { alpha: amount, duration, ease: 'sine.inOut', overwrite: true });
  }

  setSplash(on: boolean, duration = 0.8) {
    gsap.to(this.art.splash, { alpha: on ? 1 : 0, duration, ease: 'sine.inOut' });
  }
}
