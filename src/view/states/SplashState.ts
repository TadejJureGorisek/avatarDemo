import gsap from 'gsap';
import type { GameState } from './StateMachine';

export const SplashState: GameState = {
  async enter({ splash, background, logo, character, board, wins, message, updateHud, waitForSpin }) {
    const game = [logo, character, board, wins, message];
    game.forEach((o) => (o.visible = false));
    // Just a hint of the free spins gold, eased slowly so flicking past the slide doesn't flash.
    splash.onFreeSpins = (showing) => background.setGold(showing ? 0.35 : 0);
    splash.open();
    await waitForSpin();
    // Switch the HUD now, with the game coming in; a SPIN press before Bet is waiting does nothing.
    updateHud({ state: 'bet' });
    background.setFreeSpins(false);
    background.setSplash(false);
    // The game starts coming in halfway through the splash zooming away.
    void splash.close();
    game.forEach((o) => (o.visible = true));
    const ease = 'power3.out';
    await gsap.timeline({ delay: 0.3 })
      .from(character, { x: character.x - 400, alpha: 0, duration: 0.7, ease })
      .from([board, wins], { y: board.y + 120, alpha: 0, duration: 0.7, ease }, 0.1)
      .from(logo, { y: logo.y - 150, alpha: 0, duration: 0.7, ease: 'back.out(1.4)' }, 0.2)
      .from(message, { alpha: 0, duration: 0.4 }, 0.5);
    return 'bet';
  },
};
