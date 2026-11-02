import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { colors, disabledLook } from './theme';

interface Props {
  /** An icon (spin / stop) or a number (free spins left, autoplay spins). */
  label: ReactNode;
  /** Spoken name for screen readers, since the label is often just an icon. */
  ariaLabel: string;
  disabled: boolean;
  onPress: () => void;
}

/** The main button; also pressed with Space. */
export function SpinButton({ label, ariaLabel, disabled, onPress }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!disabled) onPress();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onPress]);

  return (
    <button style={{ ...style, ...disabledLook(disabled) }} onClick={onPress} disabled={disabled} aria-label={ariaLabel}>
      {label}
    </button>
  );
}

const style: CSSProperties = {
  width: 'clamp(80px, 13vw, 100px)', aspectRatio: '1', borderRadius: '50%',
  marginTop: 'clamp(-20px, calc(40px - 8vw), 0px)', // raised on desktop, flush on phones
  display: 'grid', placeItems: 'center', padding: 0,
  border: '5px solid #fff3c4', color: colors.dark, fontSize: 30, fontWeight: 900,
  background: 'radial-gradient(circle at 35% 30%, #ffe27a, #f39a0f 60%, #b25e00)',
  boxShadow: '0 6px 24px rgb(0 0 0 / 0.5)',
};
