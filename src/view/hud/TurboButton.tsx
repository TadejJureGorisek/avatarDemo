import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import { Paint, painted } from './Paint';
import { colors, disabledLook, looks } from './theme';

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
      <Paint look={on ? looks.ringOn : looks.ring} />
      <Icon name="turbo" size={26} color={on ? colors.dark : colors.gold} />
    </button>
  );
}

const styles = {
  toggle: {
    width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', padding: 0,
    ...painted, color: colors.gold,
  },
  on: { color: colors.dark, boxShadow: `0 0 16px ${colors.gold}` },
} satisfies Record<string, CSSProperties>;
