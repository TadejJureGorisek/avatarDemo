import gsap from 'gsap';
import type { GameContext, GameState } from './StateMachine';

/** Pause between spins that play by themselves (free spins and autoplay). */
const AUTO_SPIN_PAUSE_S = 1;

const pause = (seconds: number) => new Promise((resolve) => gsap.delayedCall(seconds, resolve));

/**
 * The next spin that plays by itself, if any. Free spins and autoplay share this one mechanic:
 * free spins come first (and don't use up autoplay spins) and can't be stopped; autoplay carries
 * on after them and stops when the player presses the button or the balance runs out.
 */
function nextAutoSpin({ engine, bet, takeAutoSpin, stopAutoplay }: GameContext): 'free' | 'autoplay' | undefined {
  if (engine.freeSpinsLeft) return 'free';
  if (!takeAutoSpin()) return undefined;
  if (engine.canSpin(bet())) return 'autoplay';
  stopAutoplay();
  return undefined;
}

/** Idle: the player can change the bet and press SPIN, unless a spin plays by itself. */
export const BetState: GameState = {
  async enter(ctx) {
    const { engine, background, result, bet, message, popup, updateHud, waitForSpin, stopAutoplay } = ctx;

    // The last free spin just finished: pay the round's total into the balance and announce it.
    if (result?.isFreeSpin && !engine.freeSpinsLeft) {
      const total = engine.freeSpinsTotal;
      updateHud({ balance: engine.balance, freeSpin: false });
      await popup.show(total > 0 ? `CONGRATULATIONS,\nYOU WON: ${total.toFixed(2)} $` : 'Free spins complete!');
      background.setFreeSpins(false);
    }

    if (nextAutoSpin(ctx)) {
      await pause(AUTO_SPIN_PAUSE_S);
      return 'spin';
    }

    updateHud({ freeSpin: false });
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
