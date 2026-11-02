import gsap from 'gsap';
import { Container, FillGradient, Graphics } from 'pixi.js';

const gradient = (top: number, bottom: number) => new FillGradient({
  type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
  colorStops: [{ offset: 0, color: top }, { offset: 1, color: bottom }],
});

/**
 * Full-screen vertical gradient behind the scene: purple normally, and the gold of the
 * character's chain (darkening to bronze) during free spins, cross-faded between the two.
 */
export class Background extends Container {
  private normal = new Graphics();
  private gold = new Graphics();
  private normalFill = gradient(0x3b0f8c, 0x12052e);
  private goldFill = gradient(0xe0a526, 0x4a2a05);

  constructor() {
    super();
    this.gold.alpha = 0;
    this.addChild(this.normal, this.gold);
  }

  resize(width: number, height: number) {
    this.normal.clear().rect(0, 0, width, height).fill(this.normalFill);
    this.gold.clear().rect(0, 0, width, height).fill(this.goldFill);
  }

  setFreeSpins(on: boolean) {
    gsap.to(this.gold, { alpha: on ? 1 : 0, duration: 0.8, ease: 'sine.inOut' });
  }
}
