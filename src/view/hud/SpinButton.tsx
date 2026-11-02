import { useEffect, type CSSProperties } from 'react';
import { colors, disabledLook } from './theme';

interface Props {
  /** SPIN, STOP, or the free spins left. */
  label: string;
  disabled: boolean;
  onPress: () => void;
}

/** The main button; also pressed with Space. */
export function SpinButton({ label, disabled, onPress }: Props) {
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
    <button style={{ ...style, ...disabledLook(disabled) }} onClick={onPress} disabled={disabled}>
      {label}
    </button>
  );
}

const style: CSSProperties = {
  width: 'clamp(80px, 13vw, 100px)', aspectRatio: '1', borderRadius: '50%',
  marginTop: 'clamp(-20px, calc(40px - 8vw), 0px)', // raised on desktop, flush on phones
  border: '5px solid #fff3c4', color: colors.dark, fontSize: 22, fontWeight: 900,
  background: 'radial-gradient(circle at 35% 30%, #ffe27a, #f39a0f 60%, #b25e00)',
  boxShadow: '0 6px 24px rgb(0 0 0 / 0.5)',
};
