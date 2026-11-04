import { sound } from '../Sound';
import type { GameState } from './StateMachine';

export const WinState: GameState = {
  async enter(ctx) {
    const { engine, background, wins, character, message, popup, bigWin, bet, updateHud, result } = ctx;
    const r = result!;
    const big = bigWin.tierFor(r.totalWin, bet());
    wins.show(r.wins, r.totalWin, !big);
    if (r.totalWin && !big) sound.play('win');
    if (r.totalWin && !r.freeSpinsAwarded) void character.play('small_win');
    if (big) {
      updateHud({ bigWinCounting: true });
      const coins = sound.play('bigWin', { loop: true });
      const counting = bigWin.play(r.totalWin, bet(), () => {
        coins.stop(0.6);
        sound.play('win');
        updateHud({ bigWinCounting: false });
      });
      if (ctx.holding()) bigWin.skip();
      await counting;
      wins.showAmount(r.totalWin);
    }

    updateHud({
      balance: engine.balance - (r.isFreeSpin ? engine.freeSpinsTotal : 0),
      freeSpinsLeft: engine.freeSpinsLeft,
    });
    const ways = r.wins.reduce((n, w) => n + w.ways, 0);
    if (r.freeSpinsAwarded) message.text = `${r.freeSpinsAwarded} FREE SPINS!`;
    else if (r.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal, !engine.freeSpinsLeft);
    else message.text = `Win on ${ways} way${ways > 1 ? 's' : ''}!`;

    if (!r.freeSpinsAwarded) return 'bet';
    sound.play('freeSpins');
    const announcement = r.isFreeSpin
      ? `CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} ADDITIONAL FREE SPINS!`
      : `CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} FREE SPINS`;

    if (r.isFreeSpin) {
      await popup.show(announcement);
      background.setFreeSpins(true);
      sound.music('musicFreeSpins');
      return 'bet';
    }

    if (ctx.autoplayRunning()) ctx.pauseAutoplay();
    await popup.open(announcement);
    message.text = 'Press SPIN to start free spins!';
    updateHud({ freeSpinsReady: true });
    const cheat = await ctx.waitForSpin();
    if (cheat) engine.forceNext(cheat);
    updateHud({ freeSpinsReady: false });
    void popup.close();
    background.setFreeSpins(true);
    sound.music('musicFreeSpins');
    return 'spin';
  },
};
