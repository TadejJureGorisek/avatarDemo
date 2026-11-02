import gsap from 'gsap';
import { Container, Rectangle, Text } from 'pixi.js';
import { goldPanel } from './Frame';

interface BigWinTier {
  title: string;
  x: number;
}

const WIDTH = 900;
const HEIGHT = 420;
const FRAME = 40;
export const BIG_WIN_SIZE = { width: WIDTH + 2 * FRAME, height: HEIGHT + 2 * FRAME };
const HOLD_S = 1.5;
/** How long the count-up spends on each tier, so every title stays up at least this long. */
const TIER_S = 2;

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
  private tween?: gsap.core.Timeline;

  constructor(private tiers: BigWinTier[]) {
    super();
    this.title.anchor.set(0.5);
    this.title.y = -80;
    this.amount.anchor.set(0.5);
    this.amount.y = 70;
    this.addChild(
      goldPanel(WIDTH, HEIGHT, FRAME),
      this.title,
      this.amount,
    );
    this.visible = false;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    this.on('pointertap', (e) => {
      e.stopPropagation();
      this.skip();
    });
  }

  get counting() {
    return !!this.tween;
  }

  /** Jumps the count-up to the final amount; it then holds and hides as usual. */
  skip() {
    this.tween?.progress(1);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    this.tween?.kill();
    gsap.killTweensOf([this, this.scale, this.title.scale, this.amount.scale]);
    super.destroy(options);
  }

  tierFor(win: number, bet: number) {
    return [...this.tiers].reverse().find((t) => win >= t.x * bet);
  }

  /** `onCounted` runs once the count-up is done (or skipped), before the hold and fade-out. */
  async play(win: number, bet: number, onCounted?: () => void) {
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
    // One stretch per tier: up to the next tier's threshold, and the last one up to the win.
    this.tween = gsap.timeline({ onUpdate: update });
    for (let i = 0; i <= top; i++) {
      const end = i < top ? this.tiers[i + 1].x * bet : win;
      this.tween.to(counter, { value: end, duration: TIER_S, ease: i < top ? 'none' : 'power2.out' });
    }
    await this.tween;
    this.tween = undefined;
    onCounted?.();
    counter.value = win;
    update();
    gsap.fromTo(this.amount.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
    await gsap.to(this, { alpha: 0, duration: 0.3, delay: HOLD_S });
    this.visible = false;
  }
}
