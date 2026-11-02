import gsap from 'gsap';
import type { GameContext, GameState } from './StateMachine';

/** Pause (s) before a free or autoplay spin. */
const AUTO_SPIN_PAUSE_S = 1;

const pause = (seconds: number) => new Promise((resolve) => gsap.delayedCall(seconds, resolve));

/** Free spins come first and don't use up autoplay spins; autoplay stops when the balance runs out. */
function nextAutoSpin({ engine, bet, takeAutoSpin, stopAutoplay }: GameContext): 'free' | 'autoplay' | undefined {
  if (engine.freeSpinsLeft) return 'free';
  if (!takeAutoSpin()) return undefined;
  if (engine.canSpin(bet())) return 'autoplay';
  stopAutoplay();
  return undefined;
}

export const BetState: GameState = {
  async enter(ctx) {
    const { engine, background, result, bet, message, popup, updateHud, waitForSpin, stopAutoplay } = ctx;

    // Last free spin done: the round's total is now in the balance.
    if (result?.isFreeSpin && !engine.freeSpinsLeft) {
      const total = engine.freeSpinsTotal;
      const announcement = total > 0 ? `CONGRATULATIONS,\nYOU WON: ${total.toFixed(2)} $` : 'Free spins complete!';
      updateHud({ balance: engine.balance });
      if (ctx.autoplayRunning()) {
        await popup.show(announcement);
      } else {
        // A cheat picked here lines up the next spin instead of starting it.
        await popup.open(announcement);
        message.text = 'Press SPIN to continue!';
        updateHud({ continueReady: true });
        const cheat = await waitForSpin();
        if (cheat) engine.forceNext(cheat);
        updateHud({ continueReady: false });
        void popup.close();
        message.text = 'Press SPIN to play';
      }
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
