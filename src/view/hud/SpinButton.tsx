import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { settings } from '../settings';
import { Paint, painted } from './Paint';
import { colors, disabledLook, looks } from './theme';

const HOLD_MS = 500;

interface Props {
  label: ReactNode;
  ariaLabel: string;
  disabled: boolean;
  onPress: () => void;
  onHold: (holding: boolean) => void;
}

export function SpinButton({ label, ariaLabel, disabled, onPress, onHold }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const held = useRef(false);
  const startHold = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      held.current = true;
      onHold(true);
    }, HOLD_MS);
  };
  const endHold = () => {
    clearTimeout(timer.current);
    if (held.current) onHold(false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !settings.get().spaceToSpin) return;
      e.preventDefault();
      if (e.repeat) return;
      held.current = false;
      if (!disabled) onPress();
      startHold();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      endHold();
      held.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [disabled, onPress, onHold]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      style={{ ...style, ...disabledLook(disabled) }}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => {
        held.current = false;
        startHold();
      }}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) held.current = false;
        else onPress();
      }}
    >
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
  boxShadow: '0 6px 24px rgb(0 0 0 / 0.5)', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
};
