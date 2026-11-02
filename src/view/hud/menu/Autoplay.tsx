import type { CSSProperties } from 'react';
import { BetControl } from '../BetControl';
import { colors, disabledLook } from '../theme';

const COUNTS = [10, 25, 50, 100];

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

/** Set the bet and pick a number of spins to play automatically, or stop a running autoplay. */
export function Autoplay({ bet, atMinBet, atMaxBet, onBetChange, autoplayLeft, canStart, onStart, onStop }: Props) {
  if (autoplayLeft > 0) {
    return (
      <>
        <p>Autoplay running: {autoplayLeft} spins left.</p>
        <button style={button} onClick={onStop}>Stop autoplay</button>
      </>
    );
  }
  return (
    <>
      <p>Spins play automatically at this bet. Autoplay stops if your balance runs out; free spins play first, then autoplay carries on.</p>
      <div style={{ display: 'inline-flex', marginBottom: 14 }}>
        <BetControl bet={bet} disabled={!canStart} atMin={atMinBet} atMax={atMaxBet} onChange={onBetChange} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {COUNTS.map((n) => (
          <button key={n} style={{ ...button, ...disabledLook(!canStart) }} disabled={!canStart} onClick={() => onStart(n)}>
            {n} spins
          </button>
        ))}
      </div>
      {!canStart && <p style={{ opacity: 0.7 }}>Wait for the current spin to finish.</p>}
    </>
  );
}

const button: CSSProperties = {
  padding: '10px 18px', borderRadius: 10, border: 'none', fontWeight: 800,
  background: colors.gold, color: colors.dark, cursor: 'pointer',
};
