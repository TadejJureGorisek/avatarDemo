import type { StateName } from '../states/StateMachine';
import { Balance } from './Balance';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import { SpinButton } from './SpinButton';

export interface HudState {
  ready: boolean;
  /** Current game state; controls are only live in the bet state. */
  state: StateName;
  balance: number;
  bet: number;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  message: string;
}

interface Props {
  state: HudState;
  onSpin: () => void;
  onBetChange: (direction: 1 | -1) => void;
  onCheat: (cheat: Cheat) => void;
}

/** The whole UI on top of the canvas. */
export function Hud({ state: s, onSpin, onBetChange, onCheat }: Props) {
  const locked = !s.ready || s.state !== 'bet' || s.freeSpinsLeft > 0;

  return (
    <>
      {!s.ready && <div className="loading">Loading…</div>}
      <CheatMenu disabled={locked} onCheat={onCheat} />
      {s.freeSpinsLeft > 0 && (
        <div className="banner">FREE SPINS: {s.freeSpinsLeft} left · Total {s.freeSpinsTotal.toFixed(2)}</div>
      )}
      <div className="hud">
        <div className="hud-group">
          <Balance value={s.balance} />
          <BetControl bet={s.bet} disabled={locked} onChange={onBetChange} />
        </div>
        <SpinButton disabled={locked} spinning={s.state === 'spin'} onSpin={onSpin} />
        <div className="hud-group">
          <div className="message">{s.message}</div>
        </div>
      </div>
    </>
  );
}
