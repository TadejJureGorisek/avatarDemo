import gsap from 'gsap';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import type { SymbolDef } from '../engine/config';
import { symbolUrl } from './board/Cell';

const WIDTH = 330;
const HEIGHT = 170;

/** Small pop-up next to a clicked symbol: its picture and what it pays at the current bet. */
export class SymbolInfo extends Container {
  private icon = new Sprite();
  private text = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 26, fontWeight: '700', fill: 0xffffff, lineHeight: 34 },
  });

  constructor() {
    super();
    this.icon.anchor.set(0.5);
    this.icon.position.set(80, HEIGHT / 2);
    this.text.anchor.set(0, 0.5);
    this.text.position.set(160, HEIGHT / 2);
    this.addChild(
      new Graphics().roundRect(0, 0, WIDTH, HEIGHT, 20).fill({ color: 0x1a0b3d, alpha: 0.95 }).stroke({ color: 0xffc94a, width: 4 }),
      this.icon,
      this.text,
    );
    this.visible = false;
  }

  /** `x`, `y` is the centre of the clicked cell; `right` puts the pop-up on its right, else on its left. */
  show(def: SymbolDef, bet: number, x: number, y: number, right: boolean) {
    this.icon.texture = Assets.get(symbolUrl(def.id));
    this.icon.scale.set(130 / Math.max(this.icon.texture.width, this.icon.texture.height));
    const pays = Object.entries(def.pays)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([count, pay]) => `${count}×  ${(pay * bet).toFixed(2)}`);
    this.text.text = def.kind === 'scatter' ? ['Pays anywhere', ...pays].join('\n') : pays.join('\n');
    this.position.set(right ? x + 110 : x - 110 - WIDTH, y - HEIGHT / 2);
    this.visible = true;
    gsap.fromTo(this, { alpha: 0 }, { alpha: 1, duration: 0.15 });
  }

  hide() {
    this.visible = false;
  }
}
