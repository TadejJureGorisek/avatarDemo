import { useEffect, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import { settings } from '../settings';
import { colors } from './theme';

export type Cheat = keyof GameConfig['winCheats'] | 'freeSpins';

// In menu order; the number keys 1–7 pick them too.
const CHEATS: { cheat: Cheat; label: string }[] = [
  { cheat: 'small', label: 'Small win' },
  { cheat: 'nice', label: 'Nice win' },
  { cheat: 'big', label: 'Big win' },
  { cheat: 'mega', label: 'Mega win' },
  { cheat: 'epic', label: 'Epic win' },
  { cheat: 'ways', label: '27 ways' },
  { cheat: 'freeSpins', label: 'Free spins' },
];

interface Props {
  onCheat: (cheat: Cheat) => void;
}

export function CheatMenu({ onCheat }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (cheat: Cheat) => {
    setOpen(false);
    onCheat(cheat);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const entry = CHEATS[Number(e.key) - 1];
      if (entry && !e.repeat && settings.get().cheatKeys) onCheat(entry.cheat);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCheat]);

  return (
    <div style={{ position: 'relative' }}>
      <button style={{ ...button, width: '100%' }} onClick={() => setOpen(!open)}>CHEATS</button>
      {open && (
        <div style={menu}>
          {CHEATS.map(({ cheat, label }, i) => (
            <button key={cheat} style={button} onClick={() => pick(cheat)}>{i + 1}  {label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const menu: CSSProperties = {
  position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, display: 'flex', flexDirection: 'column', gap: 6,
  whiteSpace: 'nowrap',
};

const button: CSSProperties = {
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
  border: `2px solid ${colors.border}`, background: colors.panel, color: colors.gold,
};
