import gsap from 'gsap';
import type { GameState } from './StateMachine';

const FREE_SPIN_PAUSE_S = 1.1;
const AUTOPLAY_PAUSE_S = 0.8;

const pause = (seconds: number) => new Promise((resolve) => gsap.delayedCall(seconds, resolve));

/**
 * Idle: the player can change the bet and press SPIN. Free spins and autoplay move on by
 * themselves (free spins first; autoplay carries on after them).
 */
export const BetState: GameState = {
  async enter({ engine, result, bet, message, popup, updateHud, waitForSpin, takeAutoSpin, stopAutoplay }) {
    if (engine.freeSpinsLeft) {
      await pause(FREE_SPIN_PAUSE_S);
      return 'spin';
    }

    // The last free spin just finished: announce the round's total.
    if (result?.isFreeSpin) {
      const total = engine.freeSpinsTotal;
      await popup.show(total > 0 ? `CONGRATULATIONS,\nYOU WON: ${total.toFixed(2)} $` : 'Free spins complete!');
    }

    updateHud({ freeSpin: false });
    if (takeAutoSpin()) {
      if (engine.canSpin(bet())) {
        await pause(AUTOPLAY_PAUSE_S);
        return 'spin';
      }
      stopAutoplay();
    }

    for (;;) {
      const cheat = await waitForSpin();
      if (engine.canSpin(bet())) {
        if (cheat) engine.forceNext(cheat);
        return 'spin';
      }
      stopAutoplay();
      message.text = 'Not enough balance, lower your bet';
    }
  },
};
