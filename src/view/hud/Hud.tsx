import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import type { StateName } from '../states/StateMachine';
import { Balance } from './Balance';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import type { HistoryEntry } from './menu/History';
import { Menu } from './menu/Menu';
import { SpinButton } from './SpinButton';
import { colors } from './theme';

export interface HudState {
  ready: boolean;
  /** Current game state; controls are only live in the bet state. */
  state: StateName;
  balance: number;
  bet: number;
  atMinBet: boolean;
  atMaxBet: boolean;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  /** True while a free spin is playing (including the last one, when freeSpinsLeft is already 0). */
  freeSpin: boolean;
  /** Autoplay spins still to come; 0 when autoplay is off. */
  autoplayLeft: number;
}

interface Props {
  state: HudState;
  config: GameConfig;
  history: HistoryEntry[];
  /** SPIN / STOP, or stops autoplay while it runs. */
  onSpin: () => void;
  onBetChange: (direction: 1 | -1) => void;
  onCheat: (cheat: Cheat) => void;
  onStartAutoplay: (spins: number) => void;
  onStopAutoplay: () => void;
  /** Reports the bottom bar's height whenever it changes, so the scene can fit above it. */
  onHeight: (height: number) => void;
}

/** The whole UI on top of the canvas. */
export function Hud({ state: s, config, history, onSpin, onBetChange, onCheat, onStartAutoplay, onStopAutoplay, onHeight }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inFreeSpins = s.freeSpin || s.freeSpinsLeft > 0;
  const autoplay = s.autoplayLeft > 0;
  const locked = !s.ready || s.state !== 'bet' || inFreeSpins || autoplay;
  // SPIN in the bet state, STOP while spinning, the free spins left during free spins (they play
  // themselves), the autoplay spins left during autoplay (pressing it stops autoplay).
  const spinLabel = inFreeSpins ? String(s.freeSpinsLeft) : autoplay ? `AUTO ${s.autoplayLeft}` : s.state === 'spin' ? 'STOP' : 'SPIN';
  const spinDisabled = !s.ready || menuOpen || inFreeSpins || (s.state === 'win' && !autoplay);
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
      <Menu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        config={config}
        bet={s.bet}
        history={history}
        autoplayLeft={s.autoplayLeft}
        canStartAutoplay={!locked}
        onStartAutoplay={onStartAutoplay}
        onStopAutoplay={onStopAutoplay}
      />
      {inFreeSpins && (
        <div style={styles.banner}>FREE SPINS: {s.freeSpinsLeft} left · Total {s.freeSpinsTotal.toFixed(2)}</div>
      )}
      <div style={styles.bar} ref={bar}>
        <div style={styles.left}>
          <div style={styles.group}>
            <Balance value={s.balance} />
            <BetControl bet={s.bet} disabled={locked} atMin={s.atMinBet} atMax={s.atMaxBet} onChange={onBetChange} />
          </div>
          <CheatMenu disabled={locked} onCheat={onCheat} />
        </div>
        <SpinButton label={spinLabel} disabled={spinDisabled} onPress={onSpin} />
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
  // Balance + Bet, with CHEATS underneath.
  left: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  // Wraps into a column on narrow screens.
  group: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(4px, 1.2vw, 14px)' },
} satisfies Record<string, CSSProperties>;
