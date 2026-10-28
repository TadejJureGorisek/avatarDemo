import { useState } from 'react';

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

  return (
    <div className="cheats">
      <button className="cheats-toggle" onClick={() => setOpen(!open)}>CHEATS</button>
      {open && (
        <div className="cheats-menu">
          <button onClick={() => pick('win')} disabled={disabled}>Big win</button>
          <button onClick={() => pick('freeSpins')} disabled={disabled}>Free spins</button>
        </div>
      )}
    </div>
  );
}
