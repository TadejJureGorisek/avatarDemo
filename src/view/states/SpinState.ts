import gsap from 'gsap';
import { countSymbol, type SlotEngine, type SpinResult } from '../../engine/SlotEngine';
import type { GameState } from './StateMachine';

/**
 * Starts the reels, takes the stake and gets the result, keeps spinning for at least
 * `timing.minSpinTime`, then lands the stop symbols reel by reel, with bonus anticipation.
 */
export const SpinState: GameState = {
  async enter(ctx) {
    const { engine, board, wins, character, message, updateHud } = ctx;
    const { minSpinTime, reelStopStagger, anticipationExtra } = engine.config.timing;

    wins.clear();
    board.start();
    const result = (ctx.result = engine.spin(ctx.bet()));
    updateHud({
      balance: engine.balance - result.totalWin, // the win is added in WinState
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
    });
    message.text = result.isFreeSpin ? 'Free spin!' : 'Good luck!';

    await new Promise((resolve) => gsap.delayedCall(minSpinTime, resolve));

    // Once one more scatter would trigger free spins, the remaining reels spin longer while the character anticipates.
    const anticipationReel = findAnticipationReel(engine, result);
    const delays = result.grid.map((_, reel) =>
      reel * reelStopStagger + (anticipationReel >= 0 && reel > anticipationReel ? (reel - anticipationReel) * anticipationExtra : 0));
    await board.stop(result.grid, delays, (reel) => reel === anticipationReel && character.startAnticipation());
    if (anticipationReel >= 0) {
      await character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
    }

    if (result.totalWin || result.freeSpinsAwarded) return 'win';
    updateHud({ freeSpinsLeft: engine.freeSpinsLeft });
    message.text = !result.isFreeSpin
      ? 'Press SPIN to play'
      : engine.freeSpinsLeft
        ? `${engine.freeSpinsLeft} free spins left` // free spins play themselves, so no "Press SPIN"
        : `Free spins total: ${engine.freeSpinsTotal.toFixed(2)}`;
    return 'bet';
  },
};

function findAnticipationReel(engine: SlotEngine, { grid }: SpinResult) {
  if (!engine.scatter) return -1;
  for (let reel = 0; reel < grid.length - 1; reel++) {
    if (countSymbol(grid, engine.scatter.id, reel) >= engine.config.freeSpins.minScatters - 1) return reel;
  }
  return -1;
}
