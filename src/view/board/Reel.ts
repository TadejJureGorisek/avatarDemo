import gsap from 'gsap';
import { Container } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import { Cell } from './Cell';

/** Full spinning speed in symbols per second, so it looks the same whatever the symbol size. */
const SPEED = 13;
/** Springy start: how far (in symbols) the reel pulls up before it launches. */
const WINDUP = 0.15;
/** Landing: how far (in symbols) the reel overshoots before it springs back. */
const BOUNCE = 0.2;

/**
 * One column. Holds `rows` visible cells plus one spare cell below them. While spinning, cells
 * scroll down and each one that leaves the bottom is recycled to the top with a filler symbol. On
 * stop, the stop symbols are fed in instead (bottom row first) and land with a bounce.
 */
export class Reel extends Container {
  /** The landed symbols, top to bottom. Set to the next result as soon as `stop()` is called. */
  stopSymbols: string[];
  /** Top to bottom. When landed: rows 0..rows-1, then the hidden spare cell. */
  private cells: Cell[];
  private speed = { value: 0 };
  /** Stop symbols still waiting to enter from the top. */
  private queue: string[] = [];
  /** Cells recycled since `start()`: the spare goes first, so the old landed symbols are gone after `rows + 1`. */
  private recycled = 0;
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

  /**
   * Springy start, after `delay` seconds: the reel pulls up a little (the spare cell below peeks
   * in), then launches down into the spin. The spare is recycled to the top first as it scrolls out.
   */
  start(delay = 0) {
    this.recycled = 0;
    gsap.timeline({ delay })
      .to(this.cells, { y: `-=${this.cellSize * WINDUP}`, duration: 0.15, ease: 'power2.out' })
      .call(() => {
        gsap.ticker.add(this.scroll);
      })
      .to(this.speed, { value: SPEED * this.cellSize, duration: 0.25, ease: 'power2.in' });
  }

  /** Bonus anticipation: rev up to well above full speed, then ease down to a slow crawl until it lands. */
  anticipate() {
    gsap.killTweensOf(this.speed);
    gsap.timeline()
      .to(this.speed, { value: SPEED * this.cellSize * 1.7, duration: 0.3, ease: 'power1.out' })
      .to(this.speed, { value: SPEED * this.cellSize * 0.35, duration: 0.6, ease: 'power2.inOut' });
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
      // Only feed stop symbols once every previously landed symbol has scrolled away, so an early
      // STOP can never show an old and a new symbol together (e.g. two BONUS on one reel).
      const isStopSymbol = this.queue.length > 0 && this.recycled > this.rows;
      cell.setSymbol(this.getSymbol(isStopSymbol ? this.queue.shift()! : this.fillerSymbol()));
      this.cells.unshift(cell);
      this.recycled++;
      // The row-0 stop symbol just entered: all stop symbols are on the strip, so land.
      if (isStopSymbol && !this.queue.length) return this.land();
    }
  };

  /**
   * Keeps rolling at the current speed until the stop symbols are in place, then overshoots by a
   * fraction of a symbol (the spare cell, moved above row 0, peeks in) and springs back.
   */
  private land() {
    gsap.ticker.remove(this.scroll);
    gsap.killTweensOf(this.speed);
    const speed = Math.max(this.speed.value, SPEED * this.cellSize * 0.3);
    this.speed.value = 0;
    const distance = this.rowY(0) - this.cells[0].y;
    const bounce = this.cellSize * BOUNCE;
    const spare = this.cells[this.cells.length - 1];

    gsap.timeline({ onComplete: () => this.landed?.() })
      .to(this.cells, { y: `+=${distance}`, duration: distance / speed, ease: 'none' })
      // The spare cell has just left the bottom: put it above row 0 so the overshoot shows a symbol there.
      .call(() => {
        spare.setSymbol(this.getSymbol(this.fillerSymbol()));
        spare.y = this.rowY(-1);
      })
      .to(this.cells, { y: `+=${bounce}`, duration: 0.12, ease: 'power2.out' })
      .to(this.cells, { y: `-=${bounce}`, duration: 0.3, ease: 'power2.inOut' })
      // Back to the resting layout: rows 0..rows-1, then the spare below the reel.
      .call(() => {
        spare.y = this.rowY(this.rows);
      });
  }
}
