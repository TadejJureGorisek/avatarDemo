import { useEffect, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../engine/config';
import type { HudLayout } from '../MainView';
import type { StateName } from '../states/StateMachine';
import { AutoplayButton, AUTOPLAY_COUNTS } from './AutoplayButton';
import { Balance } from './Balance';
import { Icon } from './Icon';
import { BetControl } from './BetControl';
import { CheatMenu, type Cheat } from './CheatMenu';
import type { HistoryEntry } from './menu/History';
import { Menu } from './menu/Menu';
import { SpinButton } from './SpinButton';
import { TurboButton } from './TurboButton';
import { colors } from './theme';

export interface HudState {
  ready: boolean;
  state: StateName;
  balance: number;
  bet: number;
  atMinBet: boolean;
  atMaxBet: boolean;
  freeSpinsLeft: number;
  freeSpin: boolean;
  autoplayLeft: number;
  freeSpinsReady: boolean;
  continueReady: boolean;
  turbo: boolean;
}

interface Props {
  state: HudState;
  config: GameConfig;
  history: HistoryEntry[];
  onSpin: () => void;
  onBetChange: (direction: 1 | -1) => void;
  onCheat: (cheat: Cheat) => void;
  onStartAutoplay: (spins: number) => void;
  onStopAutoplay: () => void;
  onToggleTurbo: () => void;
  layout: HudLayout;
}

export function Hud({ state: s, config, history, onSpin, onBetChange, onCheat, onStartAutoplay, onStopAutoplay, onToggleTurbo, layout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scale = layout.zoom;
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoChoice, setAutoChoice] = useState(AUTOPLAY_COUNTS[0]);
  const [stopPressed, setStopPressed] = useState(false);
  useEffect(() => {
    if (s.state !== 'spin') setStopPressed(false);
  }, [s.state]);
  const inFreeSpins = s.freeSpin || s.freeSpinsLeft > 0;
  const autoplay = s.autoplayLeft > 0;
  const locked = !s.ready || s.state !== 'bet' || inFreeSpins || autoplay;
  const splash = s.state === 'splash';
  const intro = splash || !s.ready;
  const others: CSSProperties = { opacity: intro ? 0 : 1, pointerEvents: intro ? 'none' : undefined, transition: 'opacity 0.5s' };
  const [spinLabel, spinAria] = splash ? [<Icon name="continue" size={44} />, 'Continue']
    : autoOpen ? [autoChoice, `Start autoplay, ${autoChoice} spins`]
    : s.freeSpinsReady ? [<Icon name="spin" size={44} />, `Start ${s.freeSpinsLeft} free spins`]
    : s.continueReady ? [<Icon name="spin" size={44} />, 'Continue']
    : inFreeSpins ? [s.freeSpinsLeft, `${s.freeSpinsLeft} free spins left`]
    : autoplay ? [s.autoplayLeft, `Stop autoplay, ${s.autoplayLeft} spins left`]
    : s.state === 'spin' ? [<Icon name="stop" size={30} />, 'Stop'] : [<Icon name="spin" size={44} />, 'Spin'];
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
  const meters = { zoom: size.meters };
  const balance = <div style={meters}><Balance value={s.balance} /></div>;
  const spin = (
    <div style={styles.centre}>
      <div style={{ zoom: size.spin }}>
        {s.ready
          ? <SpinButton label={spinLabel} ariaLabel={spinAria} disabled={spinDisabled} onPress={pressSpin} />
          : <div style={styles.loading}>Loading…</div>}
      </div>
      <div style={{ ...styles.turbo, ...others }}>
        <div style={{ zoom: size.autoplay }}>
          <TurboButton on={s.turbo} disabled={!s.ready || splash} onToggle={onToggleTurbo} />
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
    <div style={meters}>
      <BetControl bet={s.bet} disabled={locked} atMin={s.atMinBet} atMax={s.atMaxBet} onChange={onBetChange} />
    </div>
  );
  const cheats = <div style={control}><CheatMenu onCheat={onCheat} /></div>;
  const place: CSSProperties = {
    position: 'absolute', zoom: scale, top: layout.top / scale, left: layout.left / scale, width: layout.width / scale,
    visibility: layout.boardWidth ? 'visible' : 'hidden',
  };

  return layout.portrait ? (
    <>
      <div style={{ ...place, ...styles.pair, ...others, top: layout.metersY / scale, transform: 'translateY(-50%)' }}>{balance}{bet}</div>
      <div style={{ ...place, ...styles.stack }}>
      <div style={{ ...styles.pair, ...others }}>{cheats}</div>
      <div style={styles.row}>
        <div style={{ ...styles.left, ...others, paddingRight: 110 }}>{menu}</div>
        {spin}
        <div style={{ ...styles.right, ...others, paddingLeft: 110 }} />
      </div>
      </div>
    </>
  ) : (
    <div style={{ ...place, ...styles.row }}>
      <div style={{ ...styles.left, ...styles.edge, ...others }}>{menu}<div style={{ marginRight: 'auto' }}>{cheats}</div>{balance}</div>
      {spin}
      <div style={{ ...styles.right, ...others }}>{bet}</div>
    </div>
  );
}

const SIZES = {
  landscape: { control: 1.1, meters: 1.1, spin: 1.2, autoplay: 1.15 },
  portrait: { control: 1.43, meters: 1.25, spin: 1.9, autoplay: 1.725 },
};

const styles = {
  loading: { width: 110, height: 110, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: colors.gold },
  row: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 28 },
  left: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 28, paddingRight: 80 },
  edge: { justifyContent: 'flex-start', gap: 30, paddingLeft: 40 },
  stack: { display: 'flex', flexDirection: 'column', gap: 24 },
  pair: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 },
  centre: { position: 'relative' },
  auto: { position: 'absolute', left: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' },
  turbo: { position: 'absolute', right: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' },
  right: { display: 'flex', alignItems: 'center', gap: 28, paddingLeft: 80 },
} satisfies Record<string, CSSProperties>;
