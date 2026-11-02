import type { GameState } from './StateMachine';

/**
 * Shows the win (symbols keep popping until the next spin), plays the big win count-up when the
 * win reaches a tier, pays it into the balance, then back to Bet.
 */
export const WinState: GameState = {
  async enter({ engine, wins, character, message, popup, bigWin, bet, updateHud, result }) {
    const r = result!;
    wins.show(r.wins, r.totalWin);
    if (r.totalWin && !r.freeSpinsAwarded) void character.play('small_win');
    if (bigWin.tierFor(r.totalWin, bet())) await bigWin.play(r.totalWin, bet());

    updateHud({ balance: engine.balance, freeSpinsLeft: engine.freeSpinsLeft, freeSpinsTotal: engine.freeSpinsTotal });
    const ways = r.wins.reduce((n, w) => n + w.ways, 0);
    if (r.freeSpinsAwarded) message.text = `${r.freeSpinsAwarded} FREE SPINS!`;
    else if (r.isFreeSpin) message.showFreeSpinsTotal(engine.freeSpinsTotal, !engine.freeSpinsLeft);
    else message.text = `Win on ${ways} way${ways > 1 ? 's' : ''}!`;

    if (r.freeSpinsAwarded) await popup.show(`CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} FREE SPINS`);
    return 'bet';
  },
};
