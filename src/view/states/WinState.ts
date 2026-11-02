import type { GameState } from './StateMachine';

/**
 * Shows the win (symbols keep popping until the next spin), plays the big win count-up when the
 * win reaches a tier, pays it into the balance (free spin wins wait for the end of the round),
 * then back to Bet. Newly won free spins wait for the player to press SPIN, then start right away.
 */
export const WinState: GameState = {
  async enter(ctx) {
    const { engine, background, wins, character, message, popup, bigWin, bet, updateHud, result } = ctx;
    const r = result!;
    // On a big win the "WIN X" text waits until the count-up is done, so it never shows through its panel.
    const big = bigWin.tierFor(r.totalWin, bet());
    wins.show(r.wins, r.totalWin, !big);
    if (r.totalWin && !r.freeSpinsAwarded) void character.play('small_win');
    if (big) {
      await bigWin.play(r.totalWin, bet());
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
    const announcement = r.isFreeSpin
      ? `CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} ADDITIONAL FREE SPINS!`
      : `CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} FREE SPINS`;

    // A retrigger mid-round, or autoplay (which presses SPIN by itself): announce and carry on.
    if (r.isFreeSpin || ctx.autoplayRunning()) {
      await popup.show(announcement);
      background.setFreeSpins(true);
      return 'bet';
    }

    // First award: the pop-up stays up until the player presses SPIN (a cheat counts, and applies to
    // the first free spin), then it closes as the background turns gold and the round starts.
    await popup.open(announcement);
    message.text = 'Press SPIN to start free spins!';
    updateHud({ freeSpinsReady: true });
    const cheat = await ctx.waitForSpin();
    if (cheat) engine.forceNext(cheat);
    updateHud({ freeSpinsReady: false });
    void popup.close();
    background.setFreeSpins(true);
    return 'spin';
  },
};
