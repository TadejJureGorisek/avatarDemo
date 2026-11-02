import { freeSpinsMessage } from './freeSpinsMessage';
import type { GameState } from './StateMachine';

/** Shows the win (symbols keep popping until the next spin), pays it into the balance, then back to Bet. */
export const WinState: GameState = {
  async enter({ engine, wins, character, message, popup, updateHud, result }) {
    const r = result!;
    wins.show(r.wins, r.totalWin);
    if (r.totalWin && !r.freeSpinsAwarded) void character.play('small_win');

    updateHud({ balance: engine.balance, freeSpinsLeft: engine.freeSpinsLeft, freeSpinsTotal: engine.freeSpinsTotal });
    const ways = r.wins.reduce((n, w) => n + w.ways, 0);
    message.text = r.freeSpinsAwarded
      ? `${r.freeSpinsAwarded} FREE SPINS!`
      : !r.isFreeSpin
        ? `Win on ${ways} way${ways > 1 ? 's' : ''}!`
        : engine.freeSpinsLeft
          ? freeSpinsMessage(engine.freeSpinsTotal)
          : `Free spins total: ${engine.freeSpinsTotal.toFixed(2)}`;

    if (r.freeSpinsAwarded) await popup.show(`CONGRATULATIONS,\nYOU WON ${r.freeSpinsAwarded} FREE SPINS`);
    return 'bet';
  },
};
