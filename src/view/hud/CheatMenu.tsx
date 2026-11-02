import { useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import { colors, disabledLook } from './theme';

export type Cheat = keyof GameConfig['winCheats'] | 'freeSpins';

const CHEATS: { cheat: Cheat; label: string }[] = [
  { cheat: 'nice', label: 'Nice win' },
  { cheat: 'big', label: 'Big win' },
  { cheat: 'mega', label: 'Mega win' },
  { cheat: 'epic', label: 'Epic win' },
  { cheat: 'freeSpins', label: 'Free spins' },
];

interface Props {
  disabled: boolean;
  onCheat: (cheat: Cheat) => void;
}

/** Demo shortcuts: force the next spin to land a big win tier or to trigger free spins. */
export function CheatMenu({ disabled, onCheat }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (cheat: Cheat) => {
    setOpen(false);
    onCheat(cheat);
  };

  const option = { ...button, ...disabledLook(disabled) };
  return (
    <div style={{ position: 'relative' }}>
      <button style={{ ...button, width: '100%' }} onClick={() => setOpen(!open)}>CHEATS</button>
      {open && (
        <div style={menu}>
          {CHEATS.map(({ cheat, label }) => (
            <button key={cheat} style={option} onClick={() => pick(cheat)} disabled={disabled}>{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Opens upwards, since the toggle sits in the bottom bar.
const menu: CSSProperties = {
  position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, display: 'flex', flexDirection: 'column', gap: 6,
  whiteSpace: 'nowrap',
};

const button: CSSProperties = {
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
  border: `2px solid ${colors.border}`, background: colors.panel, color: colors.gold,
};
