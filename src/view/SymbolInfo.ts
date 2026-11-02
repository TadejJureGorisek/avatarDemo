import gsap from 'gsap';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import type { SymbolDef } from '../engine/config';
import { symbolUrl } from './board/Cell';

const PAD = 20;
const ICON = 130;
const MIN_HEIGHT = 170;

/**
 * Small pop-up next to a clicked symbol: its picture and what it pays at the current bet. It sizes
 * itself to the text every time, so long lines ("Pays anywhere", big pays at high bets) always fit.
 */
export class SymbolInfo extends Container {
  private panel = new Graphics();
  private icon = new Sprite();
  private def?: SymbolDef;
  private bet = 0;
  /** Where the clicked cell is, to place the pop-up beside it; kept so a resize can re-place it. */
  private anchorAt = { x: 0, y: 0, cellSize: 0, right: true };
  private text = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 26, fontWeight: '700', fill: 0xffffff, lineHeight: 34 },
  });

  constructor() {
    super();
    this.icon.anchor.set(0.5);
    this.text.anchor.set(0, 0.5);
    this.addChild(this.panel, this.icon, this.text);
    this.visible = false;
  }

  /** `x`, `y` is the centre of the clicked cell (`cellSize` wide); `right` puts the pop-up on its right, else on its left. */
  show(def: SymbolDef, bet: number, x: number, y: number, cellSize: number, right: boolean) {
    this.def = def;
    this.anchorAt = { x, y, cellSize, right };
    this.icon.texture = Assets.get(symbolUrl(def.id));
    this.icon.scale.set(ICON / Math.max(this.icon.texture.width, this.icon.texture.height));
    this.setBet(bet);
    this.visible = true;
    gsap.fromTo(this, { alpha: 0 }, { alpha: 1, duration: 0.15 });
  }

  /** Re-prices the shown symbol, so the pays follow bet changes while the pop-up is open. */
  setBet(bet: number) {
    this.bet = bet;
    if (!this.def) return;
    const pays = Object.entries(this.def.pays)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([count, pay]) => `${count}×  ${(pay * this.bet).toFixed(2)}`);
    this.text.text = this.def.kind === 'scatter' ? ['Pays anywhere', ...pays].join('\n') : pays.join('\n');
    this.layout();
  }

  hide() {
    this.visible = false;
  }

  /** Grows the panel around the icon and text, then places it beside the clicked cell. */
  private layout() {
    const textX = PAD + ICON + PAD;
    const width = textX + this.text.width + PAD;
    const height = Math.max(MIN_HEIGHT, this.text.height + PAD * 2);
    this.panel.clear().roundRect(0, 0, width, height, 20)
      .fill({ color: 0x1a0b3d, alpha: 0.95 }).stroke({ color: 0xffc94a, width: 4 });
    this.icon.position.set(PAD + ICON / 2, height / 2);
    this.text.position.set(textX, height / 2);

    const { x, y, cellSize, right } = this.anchorAt;
    const offset = cellSize / 2 + 10;
    this.position.set(right ? x + offset : x - offset - width, y - height / 2);
  }
}
