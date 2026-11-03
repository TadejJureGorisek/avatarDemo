import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { settings } from '../settings';
import { Paint, painted } from './Paint';
import { colors, disabledLook, looks } from './theme';

interface Props {
  label: ReactNode;
  ariaLabel: string;
  disabled: boolean;
  onPress: () => void;
}

export function SpinButton({ label, ariaLabel, disabled, onPress }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !settings.get().spaceToSpin) return;
      e.preventDefault();
      if (!disabled) onPress();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onPress]);

  return (
    <button style={{ ...style, ...disabledLook(disabled) }} onClick={onPress} disabled={disabled} aria-label={ariaLabel}>
      <Paint look={typeof label === 'number' || typeof label === 'string'
        ? { ...looks.spin, text: { value: String(label), color: colors.dark, font: '900 30px system-ui, sans-serif' } }
        : looks.spin} />
      {typeof label === 'number' || typeof label === 'string' ? null : label}
    </button>
  );
}

const style: CSSProperties = {
  width: 100, aspectRatio: '1', borderRadius: '50%',
  display: 'grid', placeItems: 'center', padding: 0,
  ...painted, color: colors.dark, fontSize: 30, fontWeight: 900,
  boxShadow: '0 6px 24px rgb(0 0 0 / 0.5)',
};
