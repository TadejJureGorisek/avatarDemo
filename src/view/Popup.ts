import gsap from 'gsap';
import { Container, Text } from 'pixi.js';
import { framedPanel } from './Frame';

const WIDTH = 760;
const HEIGHT = 260;
const FRAME = 44;
export const POPUP_SIZE = { width: WIDTH + 2 * FRAME, height: HEIGHT + 2 * FRAME };

export class Popup extends Container {
  private text = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 52, fontWeight: '900', fill: 0xffe27a, align: 'center',
      stroke: { color: 0x3a1500, width: 8 }, wordWrap: true, wordWrapWidth: WIDTH - 80 },
  });

  constructor() {
    super();
    this.addChild(
      framedPanel(WIDTH, HEIGHT, FRAME, 0x1a0b3d),
      this.text,
    );
    this.text.anchor.set(0.5);
    this.visible = false;
  }

  async show(message: string, holdSeconds = 2) {
    await this.open(message);
    await gsap.delayedCall(holdSeconds, () => {});
    await this.close();
  }

  async open(message: string) {
    this.text.text = message;
    this.visible = true;
    await gsap.timeline()
      .fromTo(this, { alpha: 0 }, { alpha: 1, duration: 0.2 })
      .fromTo(this.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' }, 0);
  }

  async close() {
    await gsap.to(this, { alpha: 0, duration: 0.3 });
    this.visible = false;
  }
}
