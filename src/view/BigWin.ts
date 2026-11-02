import gsap from 'gsap';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';

export interface BigWinTier {
  title: string;
  /** Minimum win, in multiples of the bet. */
  x: number;
}

const WIDTH = 900;
const HEIGHT = 420;
const HOLD_S = 1.5;

/**
 * Big win count-up over the board. The amount counts up fast in the middle and slow at both ends,
 * the title steps up (NICE → BIG → MEGA → EPIC) as each threshold is passed, and a click skips to the end.
 */
export class BigWin extends Container {
  private title = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 96, fontWeight: '900', fill: 0xffe27a,
      stroke: { color: 0x3a1500, width: 12 }, dropShadow: { blur: 10, distance: 5, alpha: 0.6 } },
  });
  private amount = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 110, fontWeight: '900', fill: 0xffffff,
      stroke: { color: 0x3a1500, width: 12 } },
  });
  private tween?: gsap.core.Tween;

  constructor(private tiers: BigWinTier[]) {
    super();
    this.title.anchor.set(0.5);
    this.title.y = -80;
    this.amount.anchor.set(0.5);
    this.amount.y = 70;
    this.addChild(
      new Graphics().roundRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 40)
        .fill({ color: 0x12052e, alpha: 0.9 }).stroke({ color: 0xffc94a, width: 8 }),
      this.title,
      this.amount,
    );
    this.visible = false;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    this.on('pointertap', (e) => {
      e.stopPropagation();
      this.tween?.progress(1); // skip the count-up
    });
  }

  /** The highest tier this win reaches, or undefined when it's not a big win. */
  tierFor(win: number, bet: number) {
    return [...this.tiers].reverse().find((t) => win >= t.x * bet);
  }

  /** Counts `win` up, stepping through the tiers it passes; resolves after it has faded out. */
  async play(win: number, bet: number) {
    const top = this.tiers.indexOf(this.tierFor(win, bet)!);
    let shown = -1;
    const counter = { value: 0 };
    const update = () => {
      this.amount.text = counter.value.toFixed(2);
      const tier = this.tierFor(counter.value, bet) ?? this.tiers[0];
      const index = this.tiers.indexOf(tier);
      if (index !== shown) {
        shown = index;
        this.title.text = tier.title;
        gsap.fromTo(this.title.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
      }
    };

    this.visible = true;
    gsap.fromTo(this, { alpha: 0 }, { alpha: 1, duration: 0.25 });
    gsap.fromTo(this.scale, { x: 0.7, y: 0.7 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.7)' });
    update();
    // Longer count-ups for bigger tiers; power2.inOut speeds up, then slows down at the end.
    this.tween = gsap.to(counter, { value: win, duration: 2 + top * 1.2, ease: 'power2.inOut', onUpdate: update });
    await this.tween;
    this.tween = undefined;
    counter.value = win;
    update();
    gsap.fromTo(this.amount.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
    await gsap.to(this, { alpha: 0, duration: 0.3, delay: HOLD_S });
    this.visible = false;
  }
}
