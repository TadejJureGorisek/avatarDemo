import type { CSSProperties } from 'react';
import { colors, disabledLook } from '../theme';

const COUNTS = [10, 25, 50, 100];

interface Props {
  autoplayLeft: number;
  /** Autoplay can only start from the bet state. */
  canStart: boolean;
  onStart: (spins: number) => void;
  onStop: () => void;
}

/** Pick a number of spins to play automatically, or stop a running autoplay. */
export function Autoplay({ autoplayLeft, canStart, onStart, onStop }: Props) {
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
      <p>Spins play automatically at the current bet. Autoplay stops if your balance runs out; free spins play first, then autoplay carries on.</p>
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
