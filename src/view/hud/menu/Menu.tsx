import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '../Icon';
import { createPortal } from 'react-dom';
import type { GameConfig } from '../../../engine/config';
import { Paint, painted } from '../Paint';
import { colors, disabledLook, looks } from '../theme';
import { Autoplay } from './Autoplay';
import { History, type HistoryEntry } from './History';
import { Info } from './Info';
import { SettingsTab } from './SettingsTab';
import { useDragScroll } from './useDragScroll';

const HOME_URL = 'https://www.linkedin.com/in/tadejjuregorisek/';
type Page = 'info' | 'autoplay' | 'history' | 'settings';
const BUTTONS: { page?: Page; icon: IconName; label: string }[] = [
  { icon: 'close', label: 'Close' },
  { page: 'info', icon: 'info', label: 'Info' },
  { page: 'autoplay', icon: 'autoplay', label: 'Autoplay' },
  { page: 'settings', icon: 'settings', label: 'Settings' },
  { page: 'history', icon: 'history', label: 'History' },
  { icon: 'home', label: 'Home' },
];
const EXPAND_S = 0.3;
const STAGGER_S = 0.04;
const GAP = 0.3;
const TITLE_MARGIN = 4;

interface Props {
  disabled: boolean;
  open: boolean;
  portrait: boolean;
  onOpenChange: (open: boolean) => void;
  config: GameConfig;
  bet: number;
  atMinBet: boolean;
  atMaxBet: boolean;
  onBetChange: (direction: 1 | -1) => void;
  history: HistoryEntry[];
  autoplayLeft: number;
  canStartAutoplay: boolean;
  onStartAutoplay: (spins: number) => void;
  onStopAutoplay: () => void;
  turbo: boolean;
  onToggleTurbo: () => void;
}

export function Menu(p: Props) {
  const [page, setPage] = useState<Page>('info');
  const [confirmHome, setConfirmHome] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [settled, setSettled] = useState(false);
  const [anchor, setAnchor] = useState({ left: 0, top: 0, size: 52 });
  const burger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useDragScroll(content);

  useLayoutEffect(() => {
    const r = burger.current!.getBoundingClientRect();
    if (r.left !== anchor.left || r.top !== anchor.top || r.width !== anchor.size) setAnchor({ left: r.left, top: r.top, size: r.width });
  });
  useEffect(() => {
    if (!p.open) return;
    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, [p.open]);
  useEffect(() => {
    setSettled(false);
    if (!expanded) return;
    const timer = setTimeout(() => setSettled(true), (EXPAND_S + STAGGER_S * BUTTONS.length) * 1000);
    return () => clearTimeout(timer);
  }, [expanded]);

  const closing = useRef<ReturnType<typeof setTimeout>>();
  const close = () => {
    if (closing.current) return;
    setConfirmHome(false);
    setExpanded(false);
    closing.current = setTimeout(() => {
      closing.current = undefined;
      p.onOpenChange(false);
    }, (EXPAND_S + STAGGER_S * BUTTONS.length) * 1000);
  };

  const { left, top, size } = anchor;
  const step = size * (1 + GAP);
  const side = left + size + 8;
  const vertical = !p.portrait;
  const zoom = vertical
    ? Math.min((innerWidth - 2 * side) / 700, innerHeight / 760, 1.6)
    : Math.min(innerWidth / 440, (top - 16) / 640, 1.6);
  const run = BUTTONS.length * step - size * GAP;
  const start = ((vertical ? innerHeight : innerWidth) - run) / 2;
  const place = (i: number) => (vertical
    ? { left, top: start + (BUTTONS.length - 1 - i) * step }
    : { left: start + i * step, top });
  const edgeGap = Math.max(16, (vertical ? start : innerHeight - top - size) - TITLE_MARGIN * zoom);
  const contentBox: CSSProperties = vertical
    ? { left: 0, right: 0, top: edgeGap, bottom: edgeGap, paddingLeft: side, paddingRight: side }
    : { left: 0, right: 0, top: edgeGap, height: top - 8 - edgeGap };

  return (
    <>
      <button ref={burger} style={{ ...styles.burger, ...disabledLook(p.disabled) }}
        onClick={() => p.onOpenChange(true)} data-sound="whoosh" disabled={p.disabled} aria-label="Menu"><Paint look={looks.ring} /><Icon name="menu" size={26} color={colors.gold} /></button>
      {p.open && createPortal(
        <div style={{ ...styles.overlay, opacity: expanded ? 1 : 0 }}>
          <div style={{ ...styles.content, ...contentBox }} ref={content}>
            <div style={{ ...styles.page, zoom }}>
              {page === 'info' && <Info config={p.config} bet={p.bet} />}
              {page === 'autoplay' && (
                <Autoplay
                  bet={p.bet}
                  atMinBet={p.atMinBet}
                  atMaxBet={p.atMaxBet}
                  onBetChange={p.onBetChange}
                  autoplayLeft={p.autoplayLeft}
                  canStart={p.canStartAutoplay}
                  onStart={(n) => {
                    p.onStartAutoplay(n);
                    close();
                  }}
                  onStop={p.onStopAutoplay}
                />
              )}
              {page === 'history' && <History entries={p.history} />}
              {page === 'settings' && <SettingsTab turbo={p.turbo} onToggleTurbo={p.onToggleTurbo} />}
            </div>
          </div>
          {BUTTONS.map((b, i) => {
            const at = place(i);
            return (
              <RoundButton
                key={b.label}
                icon={b.icon}
                label={b.label}
                size={size}
                active={b.page === page}
                style={{
                  ...at, opacity: expanded ? 1 : 0, pointerEvents: settled ? undefined : 'none',
                  transform: expanded ? 'none' : `translate(${left - at.left}px, ${top - at.top}px) scale(0.6)`,
                  transitionDelay: `${(expanded ? i : BUTTONS.length - 1 - i) * STAGGER_S}s`,
                }}
                onClick={() => (b.icon === 'close' ? close() : b.page ? setPage(b.page) : setConfirmHome(true))}
              />
            );
          })}
          {confirmHome && (
            <div style={styles.dim} onClick={() => setConfirmHome(false)}>
              <div style={{ ...styles.dialog, zoom: Math.min(innerWidth / 700, innerHeight / 520, 1.4) }}
                onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirm choice">
                <button style={styles.dialogClose} onClick={() => setConfirmHome(false)} aria-label="Close">
                  <Icon name="close" size={28} color="#fff" />
                </button>
                <h2 style={styles.dialogTitle}>CONFIRM CHOICE</h2>
                <p style={styles.dialogText}>
                  You pressed the Home icon, which will exit the game and take you to the developer's LinkedIn profile.
                </p>
                <h3 style={styles.question}>DO YOU WANT TO PROCEED?</h3>
                <div style={styles.answers}>
                  <button style={styles.answer} onClick={() => setConfirmHome(false)}><Paint look={{ radius: 'round', fill: '#f04a4a' }} />NO</button>
                  <button style={styles.answer} onClick={() => location.assign(HOME_URL)}><Paint look={{ radius: 'round', fill: '#16a85a' }} />YES</button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

interface RoundProps {
  icon: IconName;
  label: string;
  size: number;
  active?: boolean;
  style: CSSProperties;
  onClick: () => void;
}

function RoundButton({ icon, label, size, active = false, style, onClick }: RoundProps) {
  return (
    <button style={{ ...styles.round, ...(active ? styles.roundActive : {}), width: size, height: size, ...style }}
      onClick={onClick} aria-label={label} aria-pressed={active}>
      <Paint look={active ? looks.ringOn : { radius: 'round', fill: '#1a0b3d', border: { width: 3, color: colors.gold } }} />
      <Icon name={icon} size={size * 0.5} color={active ? colors.dark : '#fff'} />
    </button>
  );
}

const styles = {
  burger: {
    width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', boxSizing: 'border-box',
    display: 'grid', placeItems: 'center', padding: 0,
    ...painted, color: colors.gold,
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10, transition: `opacity ${EXPAND_S}s`,
    background: 'rgb(10 4 28 / 0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  },
  round: {
    ...painted, position: 'fixed', borderRadius: '50%', padding: 0, cursor: 'pointer', boxSizing: 'border-box',
    display: 'grid', placeItems: 'center', color: '#fff',
    boxShadow: '0 4px 14px rgb(0 0 0 / 0.5)',
    transition: `transform ${EXPAND_S}s cubic-bezier(0.34, 1.4, 0.64, 1), opacity ${EXPAND_S}s, background 0.2s`,
  },
  roundActive: { color: colors.dark, boxShadow: `0 0 18px ${colors.gold}` },
  content: {
    position: 'absolute', overflow: 'auto', padding: '0 16px 32px', boxSizing: 'border-box',
    scrollbarWidth: 'thin', scrollbarColor: `${colors.gold} transparent`,
  },
  page: { maxWidth: 720, margin: '0 auto' },
  dim: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 16, background: 'rgb(0 0 0 / 0.5)' },
  dialog: {
    position: 'relative', width: 640, boxSizing: 'border-box', padding: '36px 40px 40px',
    borderRadius: 18, background: 'rgb(8 4 20 / 0.95)', border: `3px solid ${colors.gold}`, textAlign: 'center',
  },
  dialogClose: {
    position: 'absolute', top: 14, right: 14, padding: 4, border: 'none', cursor: 'pointer',
    background: 'transparent', color: '#fff',
  },
  dialogTitle: { margin: '0 0 36px', fontSize: 32, fontWeight: 900, letterSpacing: 1.5, color: colors.gold },
  dialogText: { margin: '0 auto 36px', maxWidth: 480, fontSize: 20, lineHeight: 1.5 },
  question: { margin: '0 0 22px', fontSize: 24, fontWeight: 900 },
  answers: { display: 'flex', justifyContent: 'center', gap: 120 },
  answer: {
    ...painted, width: 160, height: 48, borderRadius: 24, cursor: 'pointer',
    fontSize: 24, fontWeight: 900, color: '#fff',
  },
} satisfies Record<string, CSSProperties>;
