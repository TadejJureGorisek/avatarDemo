import { countSymbol, type SlotEngine, type SpinResult } from '../../engine/SlotEngine';
import type { GameState } from './StateMachine';

const REEL_STAGGER_S = 0.11;
const ANTICIPATION_EXTRA_S = 0.9;

/** Takes the stake, gets the result from the engine and drops the reels, with bonus anticipation. */
export const SpinState: GameState = {
  async enter(ctx) {
    const { engine, board, wins, character, message, updateHud } = ctx;
    const result = (ctx.result = engine.spin(ctx.bet()));
    updateHud({
      balance: engine.balance - result.totalWin, // the win is added in WinState
      freeSpinsLeft: engine.freeSpinsLeft - result.freeSpinsAwarded,
    });
    message.text = result.isFreeSpin ? 'Free spin!' : 'Good luck!';

    // Once one more scatter would trigger free spins, slow the remaining reels and play anticipation.
    const anticipationReel = findAnticipationReel(engine, result);
    const delays = result.grid.map((_, reel) =>
      reel * REEL_STAGGER_S + (anticipationReel >= 0 && reel > anticipationReel ? (reel - anticipationReel) * ANTICIPATION_EXTRA_S : 0));

    wins.clear();
    await board.spin(result.grid, delays, (reel) => reel === anticipationReel && character.startAnticipation());
    if (anticipationReel >= 0) {
      await character.play(result.freeSpinsAwarded ? 'bonus_anticipation_win' : 'bonus_anticipation_lose');
    }

    if (result.totalWin || result.freeSpinsAwarded) return 'win';
    updateHud({ freeSpinsLeft: engine.freeSpinsLeft });
    message.text = result.isFreeSpin && !engine.freeSpinsLeft
      ? `Free spins total: ${engine.freeSpinsTotal.toFixed(2)}`
      : 'Press SPIN to play';
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
