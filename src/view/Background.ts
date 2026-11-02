import gsap from 'gsap';
import { Assets, Container, FillGradient, Graphics, Sprite } from 'pixi.js';

export type Orientation = 'landscape' | 'portrait';

/**
 * The art for each part of the game, landscape (16:9) and portrait (9:16), with the average colour
 * along its top and bottom edges: the bars around the stage take those colours.
 */
const ART = {
  base: {
    landscape: { url: 'assets/backgrounds/base.webp', top: 0x20056f, bottom: 0x240673 },
    portrait: { url: 'assets/backgrounds/base-portrait.webp', top: 0x2b0392, bottom: 0x120650 },
  },
  freeSpins: {
    landscape: { url: 'assets/backgrounds/free-spins.webp', top: 0xc66807, bottom: 0x9e4c0c },
    portrait: { url: 'assets/backgrounds/free-spins-portrait.webp', top: 0xca6202, bottom: 0x973601 },
  },
  splash: {
    landscape: { url: 'assets/backgrounds/splash.webp', top: 0x6103b4, bottom: 0x5104b8 },
    portrait: { url: 'assets/backgrounds/splash-portrait.webp', top: 0x3e059e, bottom: 0x774505 },
  },
};
type Art = (typeof ART)['base'];
export const BACKGROUND_URLS = Object.values(ART).flatMap((a) => [a.landscape.url, a.portrait.url]);

/** Of the stage's height (or width), how far the bars' colour fades into the picture. */
const FEATHER = 0.05;

const rgba = (color: number, alpha: number) => `rgba(${color >> 16}, ${(color >> 8) & 255}, ${color & 255}, ${alpha})`;

/** A gradient through `stops` along x (or y), in the filled shape's own space. */
const along = (vertical: boolean, stops: [number, string][]) => new FillGradient({
  type: 'linear', start: { x: 0, y: 0 }, end: vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }, textureSpace: 'local',
  colorStops: stops.map(([offset, color]) => ({ offset, color })),
});

/** The stage's box in the window. */
export interface StageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One picture filling the stage, and the bars beside it in its edge colours, fading into it. */
class Layer extends Container {
  private picture = new Sprite();
  private bars = new Graphics();

  constructor(private art: Art) {
    super();
    this.addChild(this.picture, this.bars);
  }

  layout(window: { width: number; height: number }, stage: StageBox, orientation: Orientation) {
    const { url, top, bottom } = this.art[orientation];
    this.picture.texture = Assets.get(url);
    this.picture.position.set(stage.x, stage.y);
    this.picture.setSize(stage.width, stage.height);
    const g = this.bars.clear();
    if (stage.height < window.height) {
      // Above and below: solid, then fading out over the picture's edge.
      const f = stage.height * FEATHER;
      const aboveTo = stage.y + f;
      g.rect(stage.x, 0, stage.width, aboveTo).fill(along(true, [[0, rgba(top, 1)], [stage.y / aboveTo, rgba(top, 1)], [1, rgba(top, 0)]]));
      const belowFrom = stage.y + stage.height - f;
      const belowSolid = f / (window.height - belowFrom);
      g.rect(stage.x, belowFrom, stage.width, window.height - belowFrom)
        .fill(along(true, [[0, rgba(bottom, 0)], [belowSolid, rgba(bottom, 1)], [1, rgba(bottom, 1)]]));
    } else if (stage.width < window.width) {
      // At the sides: the top edge's colour running into the bottom edge's, then a short fade (in
      // the two colours' mix) over the picture's sides.
      const f = stage.width * FEATHER;
      const sides = along(true, [[0, rgba(top, 1)], [1, rgba(bottom, 1)]]);
      g.rect(0, stage.y, stage.x, stage.height).fill(sides);
      g.rect(stage.x + stage.width, stage.y, window.width - stage.x - stage.width, stage.height).fill(sides);
      const middle = mix(top, bottom);
      g.rect(stage.x, stage.y, f, stage.height).fill(along(false, [[0, rgba(middle, 1)], [1, rgba(middle, 0)]]));
      g.rect(stage.x + stage.width - f, stage.y, f, stage.height).fill(along(false, [[0, rgba(middle, 0)], [1, rgba(middle, 1)]]));
    }
  }
}

/** Halfway between two colours. */
const mix = (a: number, b: number) =>
  (((a >> 16) + (b >> 16)) >> 1) << 16 | ((((a >> 8) & 255) + ((b >> 8) & 255)) >> 1) << 8 | (((a & 255) + (b & 255)) >> 1);

/**
 * The background behind the scene. A purple gradient shows while loading; then the art (base game,
 * free spins, splash) for the stage's orientation fills the stage, and the bars around it (where
 * the window is wider or taller than the stage) take the colours along the picture's top and
 * bottom. The art cross-fades: the free spins art on top of the rest, so a partial blend of it
 * gives the splash a hint of gold.
 */
export class Background extends Container {
  private gradient = new Graphics();
  private fill = new FillGradient({
    type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
    colorStops: [{ offset: 0, color: 0x3b0f8c }, { offset: 1, color: 0x12052e }],
  });
  private art?: { base: Layer; freeSpins: Layer; splash: Layer };
  private last?: [{ width: number; height: number }, StageBox, Orientation];

  constructor() {
    super();
    this.addChild(this.gradient);
  }

  /** Adds the art once it has loaded (`BACKGROUND_URLS`); the splash art shows first. */
  addArt() {
    this.art = { base: new Layer(ART.base), splash: new Layer(ART.splash), freeSpins: new Layer(ART.freeSpins) };
    this.art.freeSpins.alpha = 0;
    this.addChild(this.art.base, this.art.splash, this.art.freeSpins);
    if (this.last) this.resize(...this.last);
  }

  resize(window: { width: number; height: number }, stage: StageBox, orientation: Orientation) {
    this.last = [window, stage, orientation];
    this.gradient.clear().rect(stage.x, stage.y, stage.width, stage.height).fill(this.fill);
    for (const layer of Object.values(this.art ?? {})) layer.layout(window, stage, orientation);
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
