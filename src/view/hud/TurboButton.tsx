import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import { colors, disabledLook } from './theme';

interface Props {
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function TurboButton({ on, disabled, onToggle }: Props) {
  return (
    <button
      style={{ ...styles.toggle, ...(on ? styles.on : {}), ...disabledLook(disabled) }}
      disabled={disabled}
      onClick={onToggle}
      data-sound="toggle"
      aria-label={on ? 'Turbo on' : 'Turbo off'}
      aria-pressed={on}
    >
      <Icon name="turbo" size={26} />
    </button>
  );
}

const styles = {
  toggle: {
    width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', padding: 0,
    border: `3px solid ${colors.gold}`, background: colors.panel, color: colors.gold,
  },
  on: { background: colors.gold, color: colors.dark, boxShadow: `0 0 16px ${colors.gold}` },
} satisfies Record<string, CSSProperties>;
