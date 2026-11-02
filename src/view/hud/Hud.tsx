import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import type { StateName } from '../states/StateMachine';
import { AutoplayButton, AUTOPLAY_COUNTS } from './AutoplayButton';
import { Balance } from './Balance';
import { SpinIcon, StopIcon } from './icons';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import type { HistoryEntry } from './menu/History';
import { Menu } from './menu/Menu';
import { SpinButton } from './SpinButton';
import { colors } from './theme';
import { useUiScale } from './useUiScale';

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
  /** On-screen width of the board; the menu panel matches it. */
  menuWidth: number;
}

/** The whole UI on top of the canvas. */
export function Hud({ state: s, config, history, onSpin, onBetChange, onCheat, onStartAutoplay, onStopAutoplay, onHeight, menuWidth }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Everything in the HUD is laid out at a fixed design size and zoomed by this, like the board.
  const scale = useUiScale();
  // Mini autoplay pop-up next to SPIN: while it's open, SPIN shows the picked spins and starts autoplay.
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoChoice, setAutoChoice] = useState(AUTOPLAY_COUNTS[0]);
  // Once STOP is pressed the button stays off until the reels have landed and it's SPIN again.
  const [stopPressed, setStopPressed] = useState(false);
  useEffect(() => {
    if (s.state !== 'spin') setStopPressed(false);
  }, [s.state]);
  const inFreeSpins = s.freeSpin || s.freeSpinsLeft > 0;
  const autoplay = s.autoplayLeft > 0;
  const locked = !s.ready || s.state !== 'bet' || inFreeSpins || autoplay;
  // Spin icon in the bet state, stop icon while spinning, and numbers otherwise: the free spins left
  // during free spins (they play themselves), the autoplay spins left during autoplay (pressing it
  // stops autoplay), and the picked spins while the mini autoplay pop-up is open (pressing it starts autoplay).
  const [spinLabel, spinAria] = autoOpen ? [autoChoice, `Start autoplay, ${autoChoice} spins`]
    : inFreeSpins ? [s.freeSpinsLeft, `${s.freeSpinsLeft} free spins left`]
    : autoplay ? [s.autoplayLeft, `Stop autoplay, ${s.autoplayLeft} spins left`]
    : s.state === 'spin' ? [<StopIcon />, 'Stop'] : [<SpinIcon />, 'Spin'];
  const spinDisabled = !s.ready || menuOpen || inFreeSpins || (s.state === 'win' && !autoplay) || (autoOpen && locked)
    || (stopPressed && !autoplay);
  const pressSpin = () => {
    if (!autoOpen) {
      if (s.state === 'spin' && !autoplay) setStopPressed(true);
      return onSpin();
    }
    setAutoOpen(false);
    onStartAutoplay(autoChoice);
  };
  const bar = useRef<HTMLDivElement>(null);

  // Report the bar's on-screen (zoomed) height so the scene fits above it; re-measured when it or the scale changes.
  useLayoutEffect(() => {
    const measure = () => onHeight(bar.current!.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar.current!);
    return () => observer.disconnect();
  }, [onHeight, scale]);

  return (
    <>
      {!s.ready && <div style={styles.loading}>Loading…</div>}
      {inFreeSpins && (
        <div style={{ ...styles.banner, zoom: scale }}>FREE SPINS: {s.freeSpinsLeft} left · Total {s.freeSpinsTotal.toFixed(2)}</div>
      )}
      {/* Menu bottom left, SPIN centre, Balance / Bet / CHEATS stacked bottom right. */}
      <div style={{ ...styles.bar, zoom: scale }} ref={bar}>
        <div>
          <Menu
            open={menuOpen}
            disabled={locked}
            width={menuWidth}
            scale={scale}
            onOpenChange={setMenuOpen}
            config={config}
            bet={s.bet}
            atMinBet={s.atMinBet}
            atMaxBet={s.atMaxBet}
            onBetChange={onBetChange}
            history={history}
            autoplayLeft={s.autoplayLeft}
            canStartAutoplay={!locked}
            onStartAutoplay={onStartAutoplay}
            onStopAutoplay={onStopAutoplay}
          />
        </div>
        <div style={styles.centre}>
          <SpinButton label={spinLabel} ariaLabel={spinAria} disabled={spinDisabled} onPress={pressSpin} />
          <div style={styles.auto}>
            <AutoplayButton
              open={autoOpen}
              choice={autoChoice}
              disabled={locked}
              onToggle={() => setAutoOpen(!autoOpen)}
              onChoose={setAutoChoice}
            />
          </div>
        </div>
        <div style={styles.stack}>
          <Balance value={s.balance} />
          <BetControl bet={s.bet} disabled={locked} atMin={s.atMinBet} atMax={s.atMaxBet} onChange={onBetChange} />
          <CheatMenu onCheat={onCheat} />
        </div>
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
    // The middle three-quarters of the screen, centred, rather than the full width.
    position: 'absolute', left: '12.5%', right: '12.5%', bottom: 0, padding: '14px 24px',
    display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 16,
  },
  // SPIN stays centred; the small autoplay button hangs off its right side.
  centre: { position: 'relative' },
  auto: { position: 'absolute', left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)' },
  // Balance, Bet and CHEATS on top of each other, same width, in the bottom-right corner.
  stack: { justifySelf: 'end', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 },
} satisfies Record<string, CSSProperties>;
