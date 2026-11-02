import type { CSSProperties } from 'react';
import { AutoplayIcon } from './icons';
import { colors, disabledLook } from './theme';

export const AUTOPLAY_COUNTS = [10, 25, 50, 100];

interface Props {
  open: boolean;
  /** Spins picked in the pop-up; SPIN shows it and starts autoplay with it. */
  choice: number;
  disabled: boolean;
  onToggle: () => void;
  onChoose: (spins: number) => void;
}

export function AutoplayButton({ open, choice, disabled, onToggle, onChoose }: Props) {
  return (
    <div style={styles.wrap}>
      {open && (
        <div style={styles.popup}>
          {AUTOPLAY_COUNTS.map((n) => (
            <button key={n} style={{ ...styles.option, ...(n === choice ? styles.chosen : {}) }} onClick={() => onChoose(n)}>
              {n}
            </button>
          ))}
        </div>
      )}
      <button
        style={{ ...styles.toggle, ...disabledLook(disabled && !open) }}
        disabled={disabled && !open}
        onClick={onToggle}
        aria-label={open ? 'Close autoplay' : 'Autoplay'}
      >
        {open ? '✕' : <AutoplayIcon />}
      </button>
    </div>
  );
}

const styles = {
  wrap: { position: 'relative' },
  toggle: {
    width: 52, height: 52, borderRadius: '50%', fontSize: 18, fontWeight: 900,
    display: 'grid', placeItems: 'center', padding: 0,
    border: `3px solid ${colors.gold}`, background: colors.panel, color: colors.gold,
  },
  // Opens upwards, since the button sits in the bottom bar.
  popup: {
    position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 12,
    background: colors.panel, border: `2px solid ${colors.border}`,
  },
  option: {
    width: 56, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 16,
    border: `2px solid ${colors.border}`, background: 'transparent', color: colors.gold,
  },
  chosen: { background: colors.gold, color: colors.dark, borderColor: colors.gold },
} satisfies Record<string, CSSProperties>;
