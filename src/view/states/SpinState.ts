import gsap from 'gsap';
import type { SlotEngine, SpinResult } from '../../engine/SlotEngine';
import { freeSpinsMessage } from './freeSpinsMessage';
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
    ctx.symbolInfo.hide();
    board.start();
    const stopPressed = ctx.waitForStop();
    const result = (ctx.result = engine.spin(ctx.bet()));
    updateHud({
      balance: engine.balance - result.totalWin, // the win is added in WinState
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
      freeSpin: result.isFreeSpin,
    });
    // The engine already counted this spin's win, so show the total from before it.
    message.text = result.isFreeSpin ? freeSpinsMessage(engine.freeSpinsTotal - result.totalWin) : 'Good luck!';

    // STOP cuts the minimum spin time short, and below makes every reel stop straight away.
    await Promise.race([new Promise((resolve) => gsap.delayedCall(minSpinTime, resolve)), stopPressed]);

    // Anticipation: once reels 1 and 2 both land a scatter, each next reel slows down and spins
    // longer, for as long as every reel so far has landed one.
    const chain = scatterChain(engine, result);
    const anticipated = (reel: number) => chain >= 2 && reel >= 2 && reel <= chain && reel < result.grid.length;
    let extra = 0;
    const delays = result.grid.map((_, reel) => reel * reelStopStagger + (extra += anticipated(reel) ? anticipationExtra : 0));
    await board.stop(result.grid, delays, (reel) => {
      if (!anticipated(reel + 1)) return;
      if (reel === 1) character.startAnticipation();
      board.reels[reel + 1].slowDown();
    }, stopPressed);
    if (chain >= 2) {
      await character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
    }
    ctx.recordSpin({
      time: new Date(), bet: ctx.bet(), win: result.totalWin,
      freeSpin: result.isFreeSpin, freeSpinsAwarded: result.freeSpinsAwarded,
    });

    if (result.totalWin || result.freeSpinsAwarded) return 'win';
    updateHud({ freeSpinsLeft: engine.freeSpinsLeft });
    message.text = !result.isFreeSpin
      ? 'Press SPIN to play'
      : engine.freeSpinsLeft
        ? freeSpinsMessage(engine.freeSpinsTotal) // free spins play themselves, so no "Press SPIN"
        : `Free spins total: ${engine.freeSpinsTotal.toFixed(2)}`;
    return 'bet';
  },
};

/** How many reels in a row, from the left, landed a scatter. */
function scatterChain(engine: SlotEngine, { grid }: SpinResult) {
  const id = engine.scatter?.id;
  const chain = grid.findIndex((column) => !column.includes(id!));
  return id ? (chain < 0 ? grid.length : chain) : 0;
}
