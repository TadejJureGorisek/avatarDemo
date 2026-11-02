import gsap from 'gsap';
import type { SlotEngine, SpinResult } from '../../engine/SlotEngine';
import type { GameState } from './StateMachine';

export const SpinState: GameState = {
  async enter(ctx) {
    const { engine, board, wins, character, message, updateHud } = ctx;
    const { turboSpeed, minSpinTime, reelStopStagger, anticipationExtra } = engine.config.timing;
    const turbo = ctx.turbo() ? turboSpeed : 1;

    wins.clear();
    ctx.symbolInfo.hide();
    board.start(turbo);
    const stopPressed = ctx.waitForStop();
    let stopped = false;
    void stopPressed.then(() => (stopped = true));
    const result = (ctx.result = engine.spin(ctx.bet()));
    updateHud({
      balance: engine.balance - (result.isFreeSpin ? engine.freeSpinsTotal : result.totalWin),
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
      freeSpin: result.isFreeSpin,
    });
    if (result.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal - result.totalWin);
    else message.text = 'Good luck!';

    await Promise.race([new Promise((resolve) => gsap.delayedCall(minSpinTime / turbo, resolve)), stopPressed]);

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
      if (!stopped) await reaction;
    }
    ctx.recordSpin({
      time: new Date(), bet: ctx.bet(), win: result.totalWin,
      freeSpin: result.isFreeSpin, freeSpinsAwarded: result.freeSpinsAwarded,
    });

    if (result.totalWin || result.freeSpinsAwarded) return 'win';
    updateHud({ freeSpinsLeft: engine.freeSpinsLeft });
    if (result.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal, !engine.freeSpinsLeft);
    else message.text = ctx.autoplayRunning() ? 'Good luck!' : 'Press SPIN to play';
    return 'bet';
  },
};

function scatterChain(engine: SlotEngine, { grid }: SpinResult) {
  const id = engine.scatter?.id;
  const chain = grid.findIndex((column) => !column.includes(id!));
  return id ? (chain < 0 ? grid.length : chain) : 0;
}
