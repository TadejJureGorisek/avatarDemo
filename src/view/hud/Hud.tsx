import { useEffect, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import type { HudLayout } from '../MainView';
import type { StateName } from '../states/StateMachine';
import { AutoplayButton, AUTOPLAY_COUNTS } from './AutoplayButton';
import { Balance } from './Balance';
import { ArrowIcon, SpinIcon, StopIcon } from './icons';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import type { HistoryEntry } from './menu/History';
import { Menu } from './menu/Menu';
import { SpinButton } from './SpinButton';
import { TurboButton } from './TurboButton';
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
  /** True while a free spin is playing (including the last one, when freeSpinsLeft is already 0). */
  freeSpin: boolean;
  /** Autoplay spins still to come; 0 when autoplay is off. */
  autoplayLeft: number;
  /** Free spins were just won and wait for the player to press SPIN to start them. */
  freeSpinsReady: boolean;
  /** Free spins just ended and the result waits for the player to press SPIN to continue. */
  continueReady: boolean;
  /** TURBO is on: spins run faster. */
  turbo: boolean;
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
  onToggleTurbo: () => void;
  /** From the scene: where the row goes (right under the message), its zoom, and the board's width. */
  layout: HudLayout;
}

/** The whole UI on top of the canvas. */
export function Hud({ state: s, config, history, onSpin, onBetChange, onCheat, onStartAutoplay, onStopAutoplay, onToggleTurbo, layout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Everything in the HUD is laid out at a fixed design size and zoomed with the scene, like the board.
  const scale = layout.zoom;
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
  // While loading and on the splash only SPIN's spot shows ("Loading…", then CONTINUE); the rest
  // fades in with the game.
  const splash = s.state === 'splash';
  const intro = splash || !s.ready;
  const others: CSSProperties = { opacity: intro ? 0 : 1, pointerEvents: intro ? 'none' : undefined, transition: 'opacity 0.5s' };
  // An arrow (CONTINUE) on the splash, spin icon in the bet state (also while won free spins wait
  // to be started), stop icon while spinning, and
  // numbers otherwise: the free spins left during free spins (they play themselves), the autoplay
  // spins left during autoplay (pressing it stops autoplay), and the picked spins while the mini
  // autoplay pop-up is open (pressing it starts autoplay).
  const [spinLabel, spinAria] = splash ? [<ArrowIcon />, 'Continue']
    : autoOpen ? [autoChoice, `Start autoplay, ${autoChoice} spins`]
    : s.freeSpinsReady ? [<SpinIcon />, `Start ${s.freeSpinsLeft} free spins`]
    : s.continueReady ? [<SpinIcon />, 'Continue']
    : inFreeSpins ? [s.freeSpinsLeft, `${s.freeSpinsLeft} free spins left`]
    : autoplay ? [s.autoplayLeft, `Stop autoplay, ${s.autoplayLeft} spins left`]
    : s.state === 'spin' ? [<StopIcon />, 'Stop'] : [<SpinIcon />, 'Spin'];
  // SPIN is live while free spins wait to be started or their result waits to be closed, even
  // though the rest stays locked.
  const spinDisabled = !s.freeSpinsReady && !s.continueReady && (!s.ready || menuOpen || inFreeSpins || (s.state === 'win' && !autoplay)
    || (autoOpen && locked) || (stopPressed && !autoplay));
  const pressSpin = () => {
    if (!autoOpen) {
      if (s.state === 'spin' && !autoplay) setStopPressed(true);
      return onSpin();
    }
    setAutoOpen(false);
    onStartAutoplay(autoChoice);
  };

  // Each control's size relative to its own design size: SPIN stands out most, then autoplay;
  // in portrait, where the HUD has the whole bottom of the screen, they're all bigger still.
  const size = SIZES[layout.portrait ? 'portrait' : 'landscape'];
  const control = { zoom: size.control };
  const menu = (
    <div style={control}>
      <Menu
        open={menuOpen}
        disabled={locked}
        width={layout.boardWidth}
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
  );
  const balance = <div style={control}><Balance value={s.balance} /></div>;
  const spin = (
    <div style={styles.centre}>
      <div style={{ zoom: size.spin }}>
        {s.ready
          ? <SpinButton label={spinLabel} ariaLabel={spinAria} disabled={spinDisabled} onPress={pressSpin} />
          : <div style={styles.loading}>Loading…</div>}
      </div>
      {/* Turbo and autoplay hang off SPIN's sides, so SPIN itself stays centred. Turbo can be
          switched any time, even mid-spin (it applies from the next spin). */}
      <div style={{ ...styles.turbo, ...others }}>
        <div style={{ zoom: size.autoplay }}>
          <TurboButton on={s.turbo} disabled={!s.ready || s.state === 'splash'} onToggle={onToggleTurbo} />
        </div>
      </div>
      <div style={{ ...styles.auto, ...others }}>
        <div style={{ zoom: size.autoplay }}>
          <AutoplayButton
            open={autoOpen}
            choice={autoChoice}
            disabled={locked}
            onToggle={() => setAutoOpen(!autoOpen)}
            onChoose={setAutoChoice}
          />
        </div>
      </div>
    </div>
  );
  const bet = (
    <div style={control}>
      <BetControl bet={s.bet} disabled={locked} atMin={s.atMinBet} atMax={s.atMaxBet} onChange={onBetChange} />
    </div>
  );
  const cheats = <div style={control}><CheatMenu onCheat={onCheat} /></div>;
  // Its position and width are divided by the zoom, because zoom scales those too. Hidden until
  // the scene has placed it (layout.boardWidth is 0 until then).
  const place: CSSProperties = {
    position: 'absolute', zoom: scale, top: layout.top / scale, left: layout.left / scale, width: layout.width / scale,
    visibility: layout.boardWidth ? 'visible' : 'hidden',
  };

  // Landscape: one row right under the message: menu and cheats at the left edge, then balance |
  // SPIN (centred), with turbo and autoplay at its sides | bet. Portrait: at the bottom of the
  // screen, balance and bet, cheats under them, then menu | SPIN with turbo and autoplay.
  return layout.portrait ? (
    <div style={{ ...place, ...styles.stack }}>
      <div style={{ ...styles.pair, ...others }}>{balance}{bet}</div>
      <div style={{ ...styles.pair, ...others }}>{cheats}</div>
      <div style={styles.row}>
        <div style={{ ...styles.left, ...others, paddingRight: 110 }}>{menu}</div>
        {spin}
        <div style={{ ...styles.right, ...others, paddingLeft: 110 }} />
      </div>
    </div>
  ) : (
    <div style={{ ...place, ...styles.row }}>
      <div style={{ ...styles.left, ...styles.edge, ...others }}>{menu}<div style={{ marginRight: 'auto' }}>{cheats}</div>{balance}</div>
      {spin}
      <div style={{ ...styles.right, ...others }}>{bet}</div>
    </div>
  );
}

const SIZES = {
  landscape: { control: 1.1, spin: 1.2, autoplay: 1.15 },
  portrait: { control: 1.43, spin: 2.4, autoplay: 1.725 },
};

const styles = {
  // Takes SPIN's place (and size) while the game loads, so nothing moves when SPIN appears.
  loading: { width: 110, height: 110, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: colors.gold },
  // One line: SPIN in the exact middle (equal side columns), each side tucked in towards it.
  row: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 28 },
  // Each side leaves room for the button hanging off SPIN (turbo / autoplay), the same on both, so
  // balance and bet sit the same distance from SPIN.
  left: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 28, paddingRight: 80 },
  // Landscape: menu and cheats keep to the row's left edge, so the left side never pushes SPIN off centre.
  edge: { justifyContent: 'flex-start', gap: 30, paddingLeft: 40 },
  // Portrait: the balance and bet row above the SPIN row.
  stack: { display: 'flex', flexDirection: 'column', gap: 24 },
  pair: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 },
  centre: { position: 'relative' },
  // Hang off SPIN's sides, so SPIN itself stays centred.
  auto: { position: 'absolute', left: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' },
  turbo: { position: 'absolute', right: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' },
  right: { display: 'flex', alignItems: 'center', gap: 28, paddingLeft: 80 },
} satisfies Record<string, CSSProperties>;
