import { Text } from 'pixi.js';

/** Player message ("Press SPIN to play", "Win on 3 ways!"...) centred below the board. */
export class Message extends Text {
  constructor() {
    super({
      text: '',
      // The dark outline keeps it readable on the bright free spins background too.
      style: { fontFamily: 'system-ui, sans-serif', fontSize: 34, fontWeight: '700', fill: 0xffffff,
        stroke: { color: 0x1a0b3d, width: 6 }, dropShadow: { blur: 4, distance: 2, alpha: 0.5 } },
    });
    this.anchor.set(0.5);
  }

  /**
   * Free spins play themselves, so never "Press SPIN": the round's running total ("Good luck!"
   * while it's 0), or the final total once `roundOver`.
   */
  showFreeSpinsTotal(total: number, roundOver = false) {
    this.text = roundOver
      ? `Free spins total: ${total.toFixed(2)}`
      : total > 0 ? `Free spins win: ${total.toFixed(2)}` : 'Good luck!';
  }
}
