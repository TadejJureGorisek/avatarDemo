import gsap from 'gsap';
import { Container } from 'pixi.js';
import type { SymbolDef } from '../../engine/config';
import { Cell } from './Cell';

const SPEED = 13;
const WINDUP = 0.15;
const BOUNCE = 0.2;
const HURRY = 4;

export class Reel extends Container {
  private stopSymbols: string[];
  private cells: Cell[];
  private speed = { value: 0 };
  private fullSpeed = 0;
  private queue: string[] = [];
  private recycled = 0;
  private landed?: () => void;
  private hurried = false;
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

  hurry(instant = false) {
    this.hurried = true;
    this.instant = instant;
    if (instant && this.landed) this.snap();
    gsap.killTweensOf(this.speed);
    this.speed.value = this.fullSpeed * HURRY;
  }

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
      const isStopSymbol = this.queue.length > 0 && this.recycled > this.rows;
      cell.setSymbol(this.getSymbol(isStopSymbol ? this.queue.shift()! : this.fillerSymbol()));
      this.cells.unshift(cell);
      this.recycled++;
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
