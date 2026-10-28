import gsap from 'gsap';
import { Container } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import { Cell } from './Cell';

/** One column of `rows` cells. Spins by dropping its cells out and the new ones in. */
export class Reel extends Container {
  cells: Cell[];

  constructor(
    private rows: number,
    private cellSize: number,
    private getSymbol: (id: string) => SymbolDef,
    ids: string[],
  ) {
    super();
    this.cells = this.createCells(ids, 0);
  }

  private createCells(ids: string[], offsetY: number) {
    return Array.from({ length: this.rows }, (_, row) => {
      const cell = this.addChild(new Cell(this.getSymbol(ids[row]), this.cellSize));
      cell.position.set(this.cellSize / 2, row * this.cellSize + this.cellSize / 2 + offsetY);
      return cell;
    });
  }

  /** Drops the current cells out and `ids` in, bottom row first, after `delay` seconds. */
  async drop(ids: string[], delay: number) {
    const fall = (this.rows + 1) * this.cellSize;
    const old = this.cells;
    this.cells = this.createCells(ids, -fall);

    const timeline = gsap.timeline({ delay });
    timeline.to([...old].reverse(), { y: `+=${fall}`, duration: 0.26, ease: 'power2.in', stagger: 0.05 });
    timeline.to([...this.cells].reverse(), { y: `+=${fall}`, duration: 0.38, ease: 'back.out(1.4)', stagger: 0.05 }, 0.13);
    await timeline;
    old.forEach((cell) => cell.destroy());
  }
}
