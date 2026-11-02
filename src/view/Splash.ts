import gsap from 'gsap';
import { Assets, Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent } from 'pixi.js';
import type { GameConfig } from '../engine/config';
import { BigWin, BIG_WIN_SIZE } from './BigWin';
import { symbolUrl } from './board/Cell';
import { Character } from './Character';
import { logo } from './Logo';

/** How far a swipe has to go (design px) to change the slide. */
const SWIPE = 60;
const SLIDE_SHIFT = 300;
const FREE_SPINS_SLIDE = 2;
/** Room kept for the arrows at either side of the pictures. */
const SIDE = 150;
/** From the slide's top (design px): title centre, picture top, and description centre below the picture. */
const TITLE_ABOVE = 35;
const PICTURE_TOP = 85;
const TEXT_BELOW = 50;
/** The block's height besides the picture. */
const BLOCK_EXTRA = PICTURE_TOP + TEXT_BELOW + 45;
/** Share of the room a slide's picture takes: a little less than all, so the group sits lower. */
const PICTURE_SHARE = 0.85;
const LOGO_GAP = 20;

interface SplashLayout {
  width: number;
  top: number;
  bottom: number;
  dotsY: number;
  logoHeight: number;
}

interface Slide extends Container {
  onShow?: () => void;
}

/** `layout()` can be called again on resize; it rebuilds everything but stays on the same slide. */
export class Splash extends Container {
  onFreeSpins?: (showing: boolean) => void;
  private slides: Slide[] = [];
  private dots: Graphics[] = [];
  private index = 0;
  /** The top of the area it was last built for; MainView moves it from there instead of rebuilding. */
  builtTop = 0;
  private isOpen = false;
  /** The BONUS row's endless bobbing: stopped before the slides are rebuilt or destroyed. */
  private loops: gsap.core.Tween[] = [];

  constructor(private config: GameConfig) {
    super();
    this.eventMode = 'static';
    let startX: number | undefined;
    const end = (e: FederatedPointerEvent) => {
      if (startX === undefined) return;
      const dx = this.toLocal(e.global).x - startX;
      startX = undefined;
      if (Math.abs(dx) >= SWIPE) this.step(dx < 0 ? 1 : -1);
    };
    this.on('pointerdown', (e) => (startX = this.toLocal(e.global).x));
    this.on('pointerup', end);
    this.on('pointerupoutside', end);
  }

  layout({ width, top, bottom, dotsY, logoHeight }: SplashLayout) {
    this.stopLoops();
    for (const child of this.removeChildren()) {
      killTweens(child);
      child.destroy({ children: true });
    }
    // Logo, title, picture and description are centred as one group; the picture is as big as fits between the arrows.
    const pictureHeight = PICTURE_SHARE * Math.min(bottom - top - logoHeight - LOGO_GAP - BLOCK_EXTRA, width - 2 * SIDE);
    const groupTop = top + (bottom - top - (logoHeight + LOGO_GAP + pictureHeight + BLOCK_EXTRA)) / 2;
    const title = logo(logoHeight, width - 2 * SIDE);
    title.position.set(width / 2, groupTop + logoHeight / 2);
    const blockTop = groupTop + logoHeight + LOGO_GAP;
    const titleY = blockTop + TITLE_ABOVE;
    const textY = blockTop + PICTURE_TOP + pictureHeight + TEXT_BELOW;
    const box = { y: (titleY + textY) / 2, width: width - 2 * SIDE, height: pictureHeight };
    const { awarded, minScatters } = this.config.freeSpins;
    this.slides = [
      slide(width / 2, titleY, textY, 'MEET THE BOSS', 'Chains, shades and a pocket full of gold.\n243 ways to win on every spin!',
        fit(new Character(), box.height)),
      this.bigWinSlide(width / 2, titleY, textY, box),
      slide(width / 2, titleY, textY, 'FREE SPINS', `Land a BONUS on all ${minScatters} reels for ${awarded} free spins.\nHit them again for even more!`,
        bonusRow(minScatters, Math.min(box.height * 0.7, box.width / minScatters), this.loops)),
    ];
    this.slides.forEach((s, i) => {
      s.y = box.y;
      s.visible = i === this.index;
    });

    this.dots = this.slides.map((_, i) => {
      const dot = new Graphics().circle(0, 0, 9).fill(0xffffff);
      dot.position.set(width / 2 + (i - (this.slides.length - 1) / 2) * 36, dotsY);
      button(dot, () => this.go(i), 18);
      return dot;
    });
    const prev = arrow(-1, SIDE / 2, box.y, () => this.step(-1));
    const next = arrow(1, width - SIDE / 2, box.y, () => this.step(1));
    this.addChild(title, ...this.slides, ...this.dots, prev, next);
    this.hitArea = new Rectangle(0, top, width, bottom - top);
    // Zooms about its middle on the way out.
    this.pivot.set(width / 2, (top + bottom) / 2);
    this.position.copyFrom(this.pivot);
    this.updateDots();
    if (this.isOpen) this.slides[this.index].onShow?.();
  }

  /** Also stops the BONUS row's endless bobbing. */
  override destroy(options?: Parameters<Container['destroy']>[0]) {
    window.removeEventListener('keydown', this.onKey);
    this.stopLoops();
    killTweens(this);
    super.destroy(options);
  }

  private stopLoops() {
    this.loops.forEach((t) => t.kill());
    this.loops = [];
  }

  open() {
    this.visible = true;
    this.alpha = 1;
    this.isOpen = true;
    window.addEventListener('keydown', this.onKey);
    this.slides[this.index].onShow?.();
  }

  async close() {
    this.isOpen = false;
    window.removeEventListener('keydown', this.onKey);
    // Zooms towards the player as it fades, as if the game comes through it.
    gsap.to(this.scale, { x: 1.3, y: 1.3, duration: 0.6, ease: 'power2.in' });
    await gsap.to(this, { alpha: 0, duration: 0.6, ease: 'power2.in' });
    this.visible = false;
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft') this.step(-1);
    if (e.code === 'ArrowRight') this.step(1);
  };

  private step(dir: 1 | -1) {
    const count = this.slides.length;
    this.go((this.index + dir + count) % count, dir);
  }

  private go(to: number, dir = Math.sign(to - this.index)) {
    if (to === this.index) return;
    const from = this.slides[this.index];
    const next = this.slides[to];
    this.index = to;
    gsap.killTweensOf([from, next]);
    gsap.to(from, { x: -dir * SLIDE_SHIFT, alpha: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { from.visible = false; } });
    next.visible = true;
    gsap.fromTo(next, { x: dir * SLIDE_SHIFT, alpha: 0 }, { x: 0, alpha: 1, duration: 0.45, delay: 0.15, ease: 'power2.out' });
    next.onShow?.();
    this.updateDots();
    this.onFreeSpins?.(to === FREE_SPINS_SLIDE);
  }

  private updateDots() {
    this.dots.forEach((d, i) => (d.alpha = i === this.index ? 1 : 0.35));
  }

  /** Loops the big win count-up while its slide is showing. */
  private bigWinSlide(x: number, titleY: number, textY: number, box: { width: number; height: number }) {
    const { bigWins } = this.config;
    const bigWin = new BigWin(bigWins);
    const top = bigWins[bigWins.length - 1];
    // The count-up animates the panel's own scale, so the fit goes on the slide's picture holder instead.
    const s: Slide = slide(x, titleY, textY, 'BIG WINS',
      `Win ${bigWins[0].x}× your bet or more for a big win.\nGo all the way to ${top.title}!`, bigWin,
      Math.min(1, box.height / BIG_WIN_SIZE.height, box.width / BIG_WIN_SIZE.width));
    let looping = false;
    s.onShow = async () => {
      if (looping) return;
      looping = true;
      while (this.visible && this.slides[this.index] === s) await bigWin.play(top.x * 1.2, 1);
      looping = false;
    };
    return s;
  }
}

/** Kills tweens on `node`, its descendants and their scales, so none run on destroyed objects. */
function killTweens(node: Container) {
  gsap.killTweensOf([node, node.scale]);
  for (const child of node.children) killTweens(child);
}

/** `picture` (scaled by `scale`) is centred at y 0. */
function slide(x: number, titleY: number, textY: number, title: string, description: string, picture: Container, scale = 1): Slide {
  const s = new Container();
  const mid = (titleY + textY) / 2;
  const heading = new Text({
    text: title,
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 60, fontWeight: '900', fill: 0xffe27a,
      stroke: { color: 0x3a1500, width: 10 }, dropShadow: { blur: 8, distance: 4, alpha: 0.5 } },
  });
  heading.anchor.set(0.5);
  heading.position.set(x, titleY - mid);
  const text = new Text({
    text: description,
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 32, fontWeight: '700', fill: 0xffffff, align: 'center',
      lineHeight: 42, dropShadow: { blur: 4, distance: 2, alpha: 0.5 } },
  });
  text.anchor.set(0.5);
  text.position.set(x, textY - mid);
  const holder = new Container();
  holder.addChild(picture);
  holder.x = x;
  holder.scale.set(scale);
  s.addChild(heading, text, holder);
  return s;
}

/** Scales `picture` to `height` and centres it on (0, 0). */
function fit(picture: Container, height: number) {
  const b = picture.getLocalBounds();
  const scale = height / b.height;
  picture.scale.set(scale);
  picture.position.set(-(b.x + b.width / 2) * scale, -(b.y + b.height / 2) * scale);
  return picture;
}

/** The bobbing tweens are pushed to `loops` so they can be killed. */
function bonusRow(count: number, size: number, loops: gsap.core.Tween[]) {
  const row = new Container();
  for (let i = 0; i < count; i++) {
    const bonus = new Sprite(Assets.get(symbolUrl('BONUS')));
    bonus.anchor.set(0.5);
    bonus.scale.set((size * 0.92) / Math.max(bonus.texture.width, bonus.texture.height));
    bonus.x = (i - (count - 1) / 2) * size;
    loops.push(gsap.to(bonus, { y: -size * 0.12, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.12 }));
    row.addChild(bonus);
  }
  return row;
}

function arrow(dir: -1 | 1, x: number, y: number, onTap: () => void) {
  const g = new Graphics()
    .circle(0, 0, 44).fill({ color: 0x1a0b3d, alpha: 0.85 }).stroke({ color: 0xffc94a, width: 4 })
    .moveTo(-8 * dir, -18).lineTo(10 * dir, 0).lineTo(-8 * dir, 18)
    .stroke({ color: 0xffe27a, width: 8, cap: 'round', join: 'round' });
  g.position.set(x, y);
  return button(g, onTap, 44);
}

/** Stops pointer events from also starting a swipe on the splash. */
function button(g: Graphics, onTap: () => void, radius: number) {
  g.eventMode = 'static';
  g.cursor = 'pointer';
  g.hitArea = new Rectangle(-radius, -radius, radius * 2, radius * 2);
  g.on('pointerdown', (e) => e.stopPropagation());
  g.on('pointertap', (e) => {
    e.stopPropagation();
    onTap();
  });
  return g;
}
