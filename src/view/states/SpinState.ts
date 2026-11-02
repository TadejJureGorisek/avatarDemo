import gsap from 'gsap';
import type { SlotEngine, SpinResult } from '../../engine/SlotEngine';
import type { GameState } from './StateMachine';

/**
 * Starts the reels, takes the stake and gets the result, keeps spinning for at least
 * `timing.minSpinTime`, then lands the stop symbols reel by reel, with bonus anticipation. With
 * turbo on, all of it runs `timing.turboSpeed` × as fast.
 */
export const SpinState: GameState = {
  async enter(ctx) {
    const { engine, board, wins, character, message, updateHud } = ctx;
    // Turbo speeds the reels up and shortens every wait by the same factor.
    const { turboSpeed } = engine.config.timing;
    const turbo = ctx.turbo() ? turboSpeed : 1;
    const { minSpinTime, reelStopStagger, anticipationExtra } = engine.config.timing;

    wins.clear();
    ctx.symbolInfo.hide();
    board.start(turbo);
    const stopPressed = ctx.waitForStop();
    let stopped = false;
    void stopPressed.then(() => (stopped = true));
    const result = (ctx.result = engine.spin(ctx.bet()));
    updateHud({
      // Free spin wins are held back until the round ends (BetState); a base win is added in WinState.
      balance: engine.balance - (result.isFreeSpin ? engine.freeSpinsTotal : result.totalWin),
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
      freeSpin: result.isFreeSpin,
    });
    // The engine already counted this spin's win, so show the total from before it.
    if (result.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal - result.totalWin);
    else message.text = 'Good luck!';

    // STOP cuts the minimum spin time short, and below makes every reel stop straight away.
    await Promise.race([new Promise((resolve) => gsap.delayedCall(minSpinTime / turbo, resolve)), stopPressed]);

    // Anticipation: once reels 1 and 2 both land a scatter, each next reel slows down, spins longer
    // and glows, for as long as every reel so far has landed one.
    const chain = scatterChain(engine, result);
    const anticipated = (reel: number) => chain >= 2 && reel >= 2 && reel <= chain && reel < result.grid.length;
    let extra = 0;
    const delays = result.grid.map((_, reel) => (reel * reelStopStagger + (extra += anticipated(reel) ? anticipationExtra : 0)) / turbo);
    await board.stop(result.grid, delays, (reel) => {
      if (!anticipated(reel + 1)) return;
      if (reel === 1) character.startAnticipation();
      board.anticipate(reel + 1);
    }, stopPressed);
    if (chain >= 2) {
      const reaction = character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
      if (!stopped) await reaction; // after STOP, don't hold the spin up for the reaction
    }
    ctx.recordSpin({
      time: new Date(), bet: ctx.bet(), win: result.totalWin,
      freeSpin: result.isFreeSpin, freeSpinsAwarded: result.freeSpinsAwarded,
    });

    if (result.totalWin || result.freeSpinsAwarded) return 'win';
    updateHud({ freeSpinsLeft: engine.freeSpinsLeft });
    if (result.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal, !engine.freeSpinsLeft);
    // Autoplay presses SPIN by itself, so only ask the player once it has finished.
    else message.text = ctx.autoplayRunning() ? 'Good luck!' : 'Press SPIN to play';
    return 'bet';
  },
};

/** How many reels in a row, from the left, landed a scatter. */
function scatterChain(engine: SlotEngine, { grid }: SpinResult) {
  const id = engine.scatter?.id;
  const chain = grid.findIndex((column) => !column.includes(id!));
  return id ? (chain < 0 ? grid.length : chain) : 0;
}
