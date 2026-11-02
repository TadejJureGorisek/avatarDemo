import gsap from 'gsap';
import { Container } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import { Cell } from './Cell';

/** Full spinning speed in symbols per second (independent of symbol size). */
const SPEED = 13;
/** Wind-up before launching, in symbols. */
const WINDUP = 0.15;
/** Landing overshoot, in symbols. */
const BOUNCE = 0.2;
/** Speed multiplier after STOP. */
const HURRY = 4;

/**
 * `rows` visible cells plus one spare below. Cells leaving the bottom are recycled to the top with a
 * filler symbol; on stop, the stop symbols are fed in instead (bottom row first).
 */
export class Reel extends Container {
  /** Top to bottom; set to the next result as soon as `stop()` is called. */
  private stopSymbols: string[];
  /** Top to bottom. When landed: rows 0..rows-1, then the hidden spare cell. */
  private cells: Cell[];
  private speed = { value: 0 };
  /** Px per second, turbo included. */
  private fullSpeed = 0;
  private queue: string[] = [];
  /** Cells recycled since `start()`: the spare goes first, so the old landed symbols are gone after `rows + 1`. */
  private recycled = 0;
  private landed?: () => void;
  private hurried = false;
  /** STOP during a turbo spin: land on the stop symbols straight away. */
  private instant = false;
  private starting?: gsap.core.Timeline;

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

  get visibleCells() {
    return this.cells.slice(0, this.rows);
  }

  private rowY(row: number) {
    return row * this.cellSize + this.cellSize / 2;
  }

  start(delay = 0, turbo = 1) {
    this.recycled = 0;
    this.fullSpeed = SPEED * this.cellSize * turbo;
    this.hurried = false;
    this.instant = false;
    this.starting = gsap.timeline({ delay })
      .to(this.cells, { y: `-=${this.cellSize * WINDUP}`, duration: 0.15, ease: 'power2.out' })
      .call(() => {
        gsap.ticker.add(this.scroll);
      })
      .to(this.speed, { value: this.fullSpeed, duration: 0.25, ease: 'power2.in' });
  }

  anticipate() {
    gsap.killTweensOf(this.speed);
    gsap.timeline()
      .to(this.speed, { value: this.fullSpeed * 1.7, duration: 0.3, ease: 'power1.out' })
      .to(this.speed, { value: this.fullSpeed * 0.35, duration: 0.6, ease: 'power2.inOut' });
  }

  /** STOP: race in at `HURRY` × speed, or when `instant` (turbo) land right away. */
  hurry(instant = false) {
    this.hurried = true;
    this.instant = instant;
    if (instant && this.landed) this.snap();
    gsap.killTweensOf(this.speed);
    this.speed.value = this.fullSpeed * HURRY;
  }

  /** Resolves once `stopSymbols` have landed. */
  stop(stopSymbols: string[]) {
    this.stopSymbols = stopSymbols;
    this.queue = [...stopSymbols].reverse();
    const landed = new Promise<void>((resolve) => (this.landed = resolve));
    if (this.instant) this.snap();
    return landed;
  }

  private snap() {
    this.starting?.kill();
    gsap.ticker.remove(this.scroll);
    gsap.killTweensOf([this.speed, this.cells]);
    this.speed.value = 0;
    this.queue = [];
    this.cells.forEach((cell, row) => {
      cell.setSymbol(this.getSymbol(row < this.rows ? this.stopSymbols[row] : this.fillerSymbol()));
      cell.y = this.rowY(row);
    });
    this.finish();
  }

  private finish() {
    const landed = this.landed;
    this.landed = undefined;
    landed?.();
  }

  private scroll = (_time: number, deltaMs: number) => {
    for (const cell of this.cells) cell.y += (this.speed.value * deltaMs) / 1000;

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

  private land() {
    gsap.ticker.remove(this.scroll);
    gsap.killTweensOf(this.speed);
    const speed = Math.max(this.speed.value, this.fullSpeed * 0.3);
    this.speed.value = 0;
    const distance = this.rowY(0) - this.cells[0].y;
    const bounce = this.cellSize * BOUNCE * (this.hurried ? 0.4 : 1);
    const [overshoot, settle] = this.hurried ? [0.06, 0.12] : [0.12, 0.3];
    const spare = this.cells[this.cells.length - 1];

    gsap.timeline({ onComplete: () => this.finish() })
      .to(this.cells, { y: `+=${distance}`, duration: distance / speed, ease: 'none' })
      // The spare cell has just left the bottom: put it above row 0 so the overshoot shows a symbol there.
      .call(() => {
        spare.setSymbol(this.getSymbol(this.fillerSymbol()));
        spare.y = this.rowY(-1);
      })
      .to(this.cells, { y: `+=${bounce}`, duration: overshoot, ease: 'power2.out' })
      .to(this.cells, { y: `-=${bounce}`, duration: settle, ease: 'power2.inOut' })
      .call(() => {
        spare.y = this.rowY(this.rows);
      });
  }
}
