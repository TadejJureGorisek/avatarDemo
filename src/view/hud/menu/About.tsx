import type { GameConfig } from '../../../engine/config';

/** Game facts for the player. */
export function About({ config }: { config: GameConfig }) {
  const { reels, rows, bets, freeSpins } = config;
  return (
    <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
      <li>Ways Slot, a {reels}×{rows} video slot with {rows ** reels} ways to win.</li>
      <li>Bets from {bets[0].toFixed(2)} to {bets[bets.length - 1].toFixed(2)}.</li>
      <li>Free spins: {freeSpins.awarded} spins for {freeSpins.minScatters} BONUS, retriggerable.</li>
      <li>Return to player (RTP): about 96%, from simulation.</li>
      <li>Wins are paid on the result shown on the reels; malfunction voids all pays and plays.</li>
      <li>Built with TypeScript, PixiJS, React and Spine 4.2 as a game developer test.</li>
    </ul>
  );
}
