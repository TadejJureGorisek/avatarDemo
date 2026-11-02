import type { CSSProperties } from 'react';
import { AUTOPLAY_COUNTS } from '../AutoplayButton';
import { BetControl } from '../BetControl';
import { colors, disabledLook } from '../theme';
import { Section, TabTitle } from './Section';

interface Props {
  bet: number;
  atMinBet: boolean;
  atMaxBet: boolean;
  onBetChange: (direction: 1 | -1) => void;
  autoplayLeft: number;
  /** Autoplay can only start from the bet state. */
  canStart: boolean;
  onStart: (spins: number) => void;
  onStop: () => void;
}

export function Autoplay({ bet, atMinBet, atMaxBet, onBetChange, autoplayLeft, canStart, onStart, onStop }: Props) {
  if (autoplayLeft > 0) {
    return (
      <>
        <TabTitle>AUTOPLAY</TabTitle>
        <Section subtitle="Running">
          <p style={{ margin: '0 0 12px' }}>{autoplayLeft} spins left.</p>
          <button style={button} onClick={onStop}>Stop autoplay</button>
        </Section>
      </>
    );
  }
  return (
    <>
      <TabTitle>AUTOPLAY</TabTitle>
      <Section subtitle="How it works">
        Spins play automatically at this bet. Autoplay stops if your balance runs out; free spins play
        first, then autoplay carries on.
      </Section>
      <Section subtitle="Bet">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BetControl bet={bet} disabled={!canStart} atMin={atMinBet} atMax={atMaxBet} onChange={onBetChange} />
        </div>
      </Section>
      <Section subtitle="Number of spins">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {AUTOPLAY_COUNTS.map((n) => (
            <button key={n} style={{ ...button, ...disabledLook(!canStart) }} disabled={!canStart} onClick={() => onStart(n)}>
              {n} spins
            </button>
          ))}
        </div>
        {!canStart && <p style={{ margin: '10px 0 0' }}>Wait for the current spin to finish.</p>}
      </Section>
    </>
  );
}

const button: CSSProperties = {
  padding: '10px 18px', borderRadius: 10, border: 'none', fontWeight: 800,
  background: colors.gold, color: colors.dark, cursor: 'pointer',
};
