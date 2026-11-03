import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import { Paint, painted } from './Paint';
import { colors, disabledLook, looks } from './theme';

export const AUTOPLAY_COUNTS = [10, 25, 50, 100];

interface Props {
  open: boolean;
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
            <button key={n} style={styles.option} onClick={() => onChoose(n)}>
              <Paint look={n === choice
                ? { radius: 8, fill: colors.gold, text: { value: String(n), color: colors.dark, font: '800 16px system-ui, sans-serif' } }
                : { radius: 8, border: { width: 2, color: colors.border } }} />
              {n === choice ? ' ' : n}
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
        <Paint look={looks.ring} />
        <Icon name={open ? 'close' : 'autoplay'} size={open ? 20 : 26} />
      </button>
    </div>
  );
}

const styles = {
  wrap: { position: 'relative' },
  toggle: {
    width: 52, height: 52, borderRadius: '50%', fontSize: 18, fontWeight: 900,
    display: 'grid', placeItems: 'center', padding: 0,
    ...painted, color: colors.gold,
  },
  popup: {
    position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 12,
    background: colors.panel, border: `2px solid ${colors.border}`,
  },
  option: {
    width: 56, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 16,
    ...painted, color: colors.gold,
  },
} satisfies Record<string, CSSProperties>;
