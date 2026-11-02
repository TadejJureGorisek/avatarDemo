import gsap from 'gsap';
import { Assets, Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent } from 'pixi.js';
import type { GameConfig } from '../engine/config';
import { BigWin } from './BigWin';
import { symbolUrl } from './board/Cell';
import { Character } from './Character';
import { logo } from './Logo';

/** How far a swipe has to go (design px) to change the slide. */
const SWIPE = 60;
/** How far a slide moves as it fades in or out. */
const SLIDE_SHIFT = 300;
const FREE_SPINS_SLIDE = 2;
/** The logo across the top, above the slides (design px). */
const LOGO_HEIGHT = 170;

interface Slide extends Container {
  /** Starts the slide's showcase animation, if it has one. */
  onShow?: () => void;
}

/**
 * Game intro shown once after loading: the logo on top, then three slides (the character, big wins,
 * free spins), each with a title above and a short description below its picture. Swipe, the side
 * arrows, the dots or the arrow keys change slides (looping around at the ends); `onFreeSpins` says
 * when the free spins slide comes and goes (for a hint of gold).
 * `top`, `bottom` and `width` are the area it fills; the dots go at `dotsY`, in line with the message.
 */
export class Splash extends Container {
  onFreeSpins?: (showing: boolean) => void;
  private slides: Slide[];
  private dots: Graphics[];
  private index = 0;

  constructor(config: GameConfig, width: number, top: number, bottom: number, dotsY: number) {
    super();
    // The logo stays put while the slides change below it.
    const title = logo(LOGO_HEIGHT, width - 400);
    title.position.set(width / 2, top + LOGO_HEIGHT / 2);
    const titleY = top + LOGO_HEIGHT + 40;
    const textY = bottom - 50;
    // The picture fits between the title and the description.
    const box = { y: (titleY + textY) / 2, height: textY - titleY - 140 };
    const { awarded, minScatters } = config.freeSpins;
    this.slides = [
      slide(width / 2, titleY, textY, 'MEET THE BOSS', 'Chains, shades and a pocket full of gold.\n243 ways to win on every spin!',
        fit(new Character(), box.height)),
      this.bigWinSlide(width / 2, titleY, textY, box.height, config),
      slide(width / 2, titleY, textY, 'FREE SPINS', `Land a BONUS on all ${minScatters} reels for ${awarded} free spins.\nHit them again for even more!`,
        bonusRow(minScatters, Math.min(box.height * 0.7, (width - 400) / minScatters))),
    ];
    this.slides.forEach((s, i) => {
      s.y = box.y;
      s.visible = i === 0;
    });

    this.dots = this.slides.map((_, i) => {
      const dot = new Graphics().circle(0, 0, 9).fill(0xffffff);
      dot.position.set(width / 2 + (i - (this.slides.length - 1) / 2) * 36, dotsY);
      button(dot, () => this.go(i), 18);
      return dot;
    });
    const prev = arrow(-1, 80, box.y, () => this.step(-1));
    const next = arrow(1, width - 80, box.y, () => this.step(1));
    this.addChild(title, ...this.slides, ...this.dots, prev, next);

    // Swipe anywhere on the splash: left for the next slide, right for the previous one.
    this.eventMode = 'static';
    this.hitArea = new Rectangle(0, top, width, bottom - top);
    // Zooms about its middle on the way out.
    this.pivot.set(width / 2, (top + bottom) / 2);
    this.position.copyFrom(this.pivot);
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
    this.updateDots();
  }

  /** Moves the dots, to stay in line with the message. */
  setDotsY(y: number) {
    this.dots.forEach((d) => (d.y = y));
  }

  /** Shows the first slide and listens for the arrow keys until `close()`. */
  open() {
    this.visible = true;
    this.alpha = 1;
    window.addEventListener('keydown', this.onKey);
    this.slides[this.index].onShow?.();
  }

  async close() {
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

  /** The next (1) or previous (−1) slide, looping around at either end. */
  private step(dir: 1 | -1) {
    const count = this.slides.length;
    this.go((this.index + dir + count) % count, dir);
  }

  /** Moves to slide `to`: the old one slides out and the new one in from the side it comes from. */
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

  /** The big win count-up on repeat, from the first tier up to the top one, while its slide is showing. */
  private bigWinSlide(x: number, titleY: number, textY: number, height: number, { bigWins }: GameConfig) {
    const bigWin = new BigWin(bigWins);
    const top = bigWins[bigWins.length - 1];
    // The count-up animates the panel's own scale, so the fit goes on the slide's picture holder instead.
    const s: Slide = slide(x, titleY, textY, 'BIG WINS',
      `Win ${bigWins[0].x}× your bet or more for a big win.\nGo all the way to ${top.title}!`, bigWin, Math.min(1, height / 420));
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

/** A slide: title above, `picture` (scaled by `scale`) centred at y 0, description below. */
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

/** A BONUS on every reel, the way free spins are won, bobbing one after another. */
function bonusRow(count: number, size: number) {
  const row = new Container();
  for (let i = 0; i < count; i++) {
    const bonus = new Sprite(Assets.get(symbolUrl('BONUS')));
    bonus.anchor.set(0.5);
    bonus.scale.set((size * 0.92) / Math.max(bonus.texture.width, bonus.texture.height));
    bonus.x = (i - (count - 1) / 2) * size;
    gsap.to(bonus, { y: -size * 0.12, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.12 });
    row.addChild(bonus);
  }
  return row;
}

/** Round button with a chevron pointing `dir` (−1 left, 1 right). */
function arrow(dir: -1 | 1, x: number, y: number, onTap: () => void) {
  const g = new Graphics()
    .circle(0, 0, 44).fill({ color: 0x1a0b3d, alpha: 0.85 }).stroke({ color: 0xffc94a, width: 4 })
    .moveTo(-8 * dir, -18).lineTo(10 * dir, 0).lineTo(-8 * dir, 18)
    .stroke({ color: 0xffe27a, width: 8, cap: 'round', join: 'round' });
  g.position.set(x, y);
  return button(g, onTap, 44);
}

/** Makes `g` a round, clickable button that doesn't start a swipe. */
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
