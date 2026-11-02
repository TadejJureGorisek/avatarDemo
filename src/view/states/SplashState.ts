import gsap from 'gsap';
import type { GameState } from './StateMachine';

/**
 * The intro right after loading: the splash slides, with SPIN as CONTINUE. Pressing it zooms the
 * splash away while the game comes in (the character from the left, the board rising up, the HUD
 * fading in), then on to Bet.
 */
export const SplashState: GameState = {
  async enter({ splash, background, character, board, wins, message, waitForSpin }) {
    const game = [character, board, wins, message];
    game.forEach((o) => (o.visible = false));
    // Just a hint of the free spins gold, eased slowly so flicking past the slide doesn't flash.
    splash.onFreeSpins = (showing) => background.setGold(showing ? 0.35 : 0);
    splash.open();
    await waitForSpin();
    background.setFreeSpins(false);
    // The game starts coming in halfway through the splash zooming away.
    void splash.close();
    game.forEach((o) => (o.visible = true));
    const ease = 'power3.out';
    await gsap.timeline({ delay: 0.3 })
      .from(character, { x: character.x - 400, alpha: 0, duration: 0.7, ease })
      .from([board, wins], { y: board.y + 120, alpha: 0, duration: 0.7, ease }, 0.1)
      .from(message, { alpha: 0, duration: 0.4 }, 0.5);
    return 'bet';
  },
};
