import gsap from 'gsap';
import type { GameState } from './StateMachine';

const FREE_SPIN_PAUSE_S = 1.1;

/** Idle: the player can change the bet and press SPIN. During free spins it moves on by itself. */
export const BetState: GameState = {
  async enter({ engine, result, bet, message, popup, updateHud, waitForSpin }) {
    if (engine.freeSpinsLeft) {
      await new Promise((resolve) => gsap.delayedCall(FREE_SPIN_PAUSE_S, resolve));
      return 'spin';
    }

    // The last free spin just finished: announce the round's total.
    if (result?.isFreeSpin) {
      const total = engine.freeSpinsTotal;
      await popup.show(total > 0 ? `CONGRATULATIONS,\nYOU WON: ${total.toFixed(2)} $` : 'Free spins complete!');
    }

    updateHud({ freeSpin: false });
    for (;;) {
      const cheat = await waitForSpin();
      if (engine.canSpin(bet())) {
        if (cheat) engine.forceNext(cheat);
        return 'spin';
      }
      message.text = 'Not enough balance, lower your bet';
    }
  },
};
