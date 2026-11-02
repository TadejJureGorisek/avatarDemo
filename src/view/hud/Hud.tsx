import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { StateName } from '../states/StateMachine';
import { Balance } from './Balance';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import { SpinButton } from './SpinButton';
import { colors } from './theme';

export interface HudState {
  ready: boolean;
  /** Current game state; controls are only live in the bet state. */
  state: StateName;
  balance: number;
  bet: number;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
}

interface Props {
  state: HudState;
  onSpin: () => void;
  onBetChange: (direction: 1 | -1) => void;
  onCheat: (cheat: Cheat) => void;
  /** Reports the bottom bar's height whenever it changes, so the scene can fit above it. */
  onHeight: (height: number) => void;
}

/** The whole UI on top of the canvas. */
export function Hud({ state: s, onSpin, onBetChange, onCheat, onHeight }: Props) {
  const locked = !s.ready || s.state !== 'bet' || s.freeSpinsLeft > 0;
  const bar = useRef<HTMLDivElement>(null);

  // The bar grows when its contents wrap on narrow screens, so measure it instead of assuming a height.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => onHeight(bar.current!.offsetHeight));
    observer.observe(bar.current!);
    return () => observer.disconnect();
  }, [onHeight]);

  return (
    <>
      {!s.ready && <div style={styles.loading}>Loading…</div>}
      <CheatMenu disabled={locked} onCheat={onCheat} />
      {s.freeSpinsLeft > 0 && (
        <div style={styles.banner}>FREE SPINS: {s.freeSpinsLeft} left · Total {s.freeSpinsTotal.toFixed(2)}</div>
      )}
      <div style={styles.bar} ref={bar}>
        <div style={styles.group}>
          <Balance value={s.balance} />
          <BetControl bet={s.bet} disabled={locked} onChange={onBetChange} />
        </div>
        <SpinButton disabled={locked} spinning={s.state === 'spin'} onSpin={onSpin} />
        {/* Empty right column keeps SPIN centred. */}
        <div />
      </div>
    </>
  );
}

const styles = {
  loading: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 28 },
  banner: {
    position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', padding: '8px 22px',
    borderRadius: 999, whiteSpace: 'nowrap', fontWeight: 800, color: colors.dark,
    background: 'linear-gradient(#ffd85a, #e79a12)',
  },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 24px)',
    display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 16px)',
  },
  // Wraps into a column on narrow screens.
  group: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(4px, 1.2vw, 14px)' },
} satisfies Record<string, CSSProperties>;
