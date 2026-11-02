import { useState, type CSSProperties } from 'react';
import { colors, disabledLook } from './theme';

export type Cheat = 'win' | 'freeSpins';

interface Props {
  disabled: boolean;
  onCheat: (cheat: Cheat) => void;
}

/** Demo shortcuts: force the next spin to win or to trigger free spins. */
export function CheatMenu({ disabled, onCheat }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (cheat: Cheat) => {
    setOpen(false);
    onCheat(cheat);
  };

  const option = { ...button, ...disabledLook(disabled) };
  return (
    <div style={container}>
      <button style={button} onClick={() => setOpen(!open)}>CHEATS</button>
      {open && (
        <>
          <button style={option} onClick={() => pick('win')} disabled={disabled}>Big win</button>
          <button style={option} onClick={() => pick('freeSpins')} disabled={disabled}>Free spins</button>
        </>
      )}
    </div>
  );
}

const container: CSSProperties = {
  position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
};

const button: CSSProperties = {
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
  border: `2px solid ${colors.border}`, background: colors.panel, color: colors.gold,
};
