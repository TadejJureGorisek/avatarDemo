import gsap from 'gsap';
import { Container, Text } from 'pixi.js';
import type { Win } from '../engine/SlotEngine';
import type { Board } from './board/Board';
import type { Cell } from './board/Cell';

/** Win presentation: winning cells pop (scale up and down) until the next spin, with the amount over the symbols. */
export class Wins extends Container {
  private winning: Cell[] = [];
  private amount = new Text({
    text: '',
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 72, fontWeight: '900', fill: 0xffe27a,
      stroke: { color: 0x3a1500, width: 10 }, dropShadow: { blur: 8, distance: 4, alpha: 0.6 } },
  });

  constructor(private board: Board) {
    super();
    this.amount.anchor.set(0.5);
    this.amount.position.set(board.boardWidth / 2, board.boardHeight / 2);
    this.addChild(this.amount);
  }

  show(wins: Win[], total: number) {
    this.clear();
    if (!wins.length) return;
    this.winning = [...new Set(wins.flatMap((w) => w.positions.map((p) => this.board.cell(p.reel, p.row))))];
    for (const cell of this.winning) {
      gsap.to(cell.scale, { x: cell.scale.x * 1.1, y: cell.scale.y * 1.1, duration: 0.3, ease: 'sine.inOut',
        yoyo: true, repeat: -1 });
    }
    this.amount.text = `WIN ${total.toFixed(2)}`;
    gsap.fromTo(this.amount.scale, { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
  }

  clear() {
    for (const cell of this.winning) {
      gsap.killTweensOf(cell.scale);
      cell.fit();
    }
    this.winning = [];
    this.amount.text = '';
  }
}
