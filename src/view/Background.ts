import { FillGradient, Graphics } from 'pixi.js';

/** Full-screen vertical gradient behind the scene. */
export class Background extends Graphics {
  private gradient = new FillGradient({
    type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }],
  });

  resize(width: number, height: number) {
    this.clear().rect(0, 0, width, height).fill(this.gradient);
  }
}
