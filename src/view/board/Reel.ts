import gsap from 'gsap';
import { Container } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import { Cell } from './Cell';

/** Full spinning speed in px per second. */
const SPEED = 2600;

/**
 * One column. Holds `rows` visible cells plus one buffer cell. While spinning, cells scroll down
 * and each one that leaves the bottom is recycled to the top with a filler symbol. On stop, the
 * stop symbols are fed in instead (bottom row first) and land with a bounce.
 */
export class Reel extends Container {
  /** The landed symbols, top to bottom. Set to the next result as soon as `stop()` is called. */
  stopSymbols: string[];
  /** Top to bottom. When landed: rows 0..rows-1, then the hidden buffer cell. */
  private cells: Cell[];
  private speed = { value: 0 };
  /** Stop symbols still waiting to enter from the top. */
  private queue: string[] = [];
  private landed?: () => void;

  constructor(
    private rows: number,
    private cellSize: number,
    private getSymbol: (id: string) => SymbolDef,
    private fillerSymbol: () => string,
    stopSymbols: string[],
  ) {
    super();
    this.stopSymbols = stopSymbols;
    this.cells = [...stopSymbols, fillerSymbol()].map((id, row) => {
      const cell = this.addChild(new Cell(getSymbol(id), cellSize));
      cell.position.set(cellSize / 2, this.rowY(row));
      return cell;
    });
  }

  /** The cells currently showing the stop symbols. */
  get visibleCells() {
    return this.cells.slice(0, this.rows);
  }

  private rowY(row: number) {
    return row * this.cellSize + this.cellSize / 2;
  }

  start() {
    // Put the buffer above the reel so new symbols flow in from the top.
    const buffer = this.cells.pop()!;
    buffer.y = this.rowY(-1);
    this.cells.unshift(buffer);
    gsap.to(this.speed, { value: SPEED, duration: 0.25, ease: 'power2.in' });
    gsap.ticker.add(this.scroll);
  }

  /** Feeds `stopSymbols` in and resolves once they've landed. */
  stop(stopSymbols: string[]) {
    this.stopSymbols = stopSymbols;
    this.queue = [...stopSymbols].reverse();
    return new Promise<void>((resolve) => (this.landed = resolve));
  }

  private scroll = (_time: number, deltaMs: number) => {
    for (const cell of this.cells) cell.y += (this.speed.value * deltaMs) / 1000;

    // Recycle every cell that has fully left the bottom.
    while (this.cells[this.cells.length - 1].y >= this.rowY(this.rows)) {
      const cell = this.cells.pop()!;
      cell.y = this.cells[0].y - this.cellSize;
      const isStopSymbol = this.queue.length > 0;
      cell.setSymbol(this.getSymbol(isStopSymbol ? this.queue.shift()! : this.fillerSymbol()));
      this.cells.unshift(cell);
      // The row-0 stop symbol just entered: all stop symbols are on the strip, so land.
      if (isStopSymbol && !this.queue.length) return this.land();
    }
  };

  private land() {
    gsap.ticker.remove(this.scroll);
    gsap.killTweensOf(this.speed);
    this.speed.value = 0;
    const distance = this.rowY(0) - this.cells[0].y;
    gsap.to(this.cells, {
      y: `+=${distance}`, duration: 0.35, ease: 'back.out(1.6)',
      onComplete: () => this.landed?.(),
    });
  }
}
