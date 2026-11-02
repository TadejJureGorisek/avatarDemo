import type { CSSProperties } from 'react';
import { TurboIcon } from './icons';
import { colors, disabledLook } from './theme';

interface Props {
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/** Small button on SPIN's left, the twin of autoplay on its right: turns TURBO (faster spins) on and off. */
export function TurboButton({ on, disabled, onToggle }: Props) {
  return (
    <button
      style={{ ...styles.toggle, ...(on ? styles.on : {}), ...disabledLook(disabled) }}
      disabled={disabled}
      onClick={onToggle}
      aria-label={on ? 'Turbo on' : 'Turbo off'}
      aria-pressed={on}
    >
      <TurboIcon />
    </button>
  );
}

const styles = {
  toggle: {
    width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', padding: 0,
    border: `3px solid ${colors.gold}`, background: colors.panel, color: colors.gold,
  },
  // Lit up while it's on.
  on: { background: colors.gold, color: colors.dark, boxShadow: `0 0 16px ${colors.gold}` },
} satisfies Record<string, CSSProperties>;
