import gsap from 'gsap';
import type { GameState } from './StateMachine';

const FREE_SPIN_PAUSE_S = 1.1;

/** Idle: the player can change the bet and press SPIN. During free spins it moves on by itself. */
export const BetState: GameState = {
  async enter({ engine, result, bet, message, waitForSpin }) {
    if (engine.freeSpinsLeft) {
      // Hold a newly awarded round a little longer so the message can be read.
      const pause = result?.freeSpinsAwarded ? FREE_SPIN_PAUSE_S * 2 : FREE_SPIN_PAUSE_S;
      await new Promise((resolve) => gsap.delayedCall(pause, resolve));
      return 'spin';
    }

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
