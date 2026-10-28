import { useEffect } from 'react';

interface Props {
  disabled: boolean;
  spinning: boolean;
  onSpin: () => void;
}

/** Spins on click or Space. */
export function SpinButton({ disabled, spinning, onSpin }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!disabled) onSpin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onSpin]);

  return (
    <button className="spin" onClick={onSpin} disabled={disabled}>
      {spinning ? '…' : 'SPIN'}
    </button>
  );
}
