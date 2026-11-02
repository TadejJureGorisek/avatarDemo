import type { GameConfig } from '../../../engine/config';
import { Section, TabTitle } from './Section';

/** Game facts for the player. */
export function About({ config }: { config: GameConfig }) {
  const { reels, rows, bets, freeSpins } = config;
  return (
    <>
      <TabTitle>ABOUT THE GAME</TabTitle>
      <Section subtitle="The game">Ways Slot, a {reels}×{rows} video slot with {rows ** reels} ways to win.</Section>
      <Section subtitle="Bets">From {bets[0].toFixed(2)} to {bets[bets.length - 1].toFixed(2)}.</Section>
      <Section subtitle="Free spins">
        {freeSpins.awarded} free spins for {freeSpins.minScatters} BONUS, retriggerable.
      </Section>
      <Section subtitle="Return to player">About 96%, from simulation.</Section>
      <Section subtitle="Technology">Built with TypeScript, PixiJS, React and Spine 4.2 as a game developer test.</Section>
      <Section subtitle="Disclaimer">Malfunctions void all pays and plays.</Section>
    </>
  );
}
