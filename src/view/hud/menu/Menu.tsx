import { useRef, useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '../Icon';
import { createPortal } from 'react-dom';
import type { GameConfig } from '../../../engine/config';
import { colors, disabledLook } from '../theme';
import { Autoplay } from './Autoplay';
import { History, type HistoryEntry } from './History';
import { Info } from './Info';
import { SettingsTab } from './SettingsTab';
import { useDragScroll } from './useDragScroll';

const HOME_URL = 'https://www.linkedin.com/in/tadejjuregorisek/';
const PAGES: { page: Page; icon: IconName; label: string }[] = [
  { page: 'history', icon: 'history', label: 'History' },
  { page: 'settings', icon: 'settings', label: 'Settings' },
  { page: 'autoplay', icon: 'autoplay', label: 'Autoplay' },
  { page: 'info', icon: 'info', label: 'Info' },
];
type Page = 'info' | 'autoplay' | 'history' | 'settings';

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
  const content = useRef<HTMLDivElement>(null);
  useDragScroll(content);
  const zoom = p.portrait
    ? Math.min(innerWidth / 480, 1.6)
    : Math.min(innerHeight / 760, innerWidth / 1100, 1.6);
  const close = () => {
    setConfirmHome(false);
    p.onOpenChange(false);
  };

  const nav = (
    <nav style={{ ...styles.nav, ...(p.portrait ? styles.navRow : {}), zoom: p.portrait ? Math.min(innerWidth / 600, zoom) : zoom }}>
      <RoundButton icon="home" label="Home" onClick={() => setConfirmHome(true)} />
      {PAGES.map((t) => (
        <RoundButton key={t.page} icon={t.icon} label={t.label} active={t.page === page} onClick={() => setPage(t.page)} />
      ))}
      <RoundButton icon="close" label="Close" onClick={close} />
    </nav>
  );

  return (
    <>
      <button style={{ ...styles.burger, ...disabledLook(p.disabled) }} onClick={() => p.onOpenChange(true)}
        data-sound="whoosh" disabled={p.disabled} aria-label="Menu"><Icon name="menu" size={26} /></button>
      {p.open && createPortal(
        <div style={{ ...styles.overlay, flexDirection: p.portrait ? 'column-reverse' : 'row' }}>
          {nav}
          <div style={styles.content} ref={content}>
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
          {confirmHome && (
            <div style={styles.dim} onClick={() => setConfirmHome(false)}>
              <div style={{ ...styles.dialog, zoom }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirm choice">
                <button style={styles.dialogClose} onClick={() => setConfirmHome(false)} aria-label="Close">
                  <Icon name="close" size={28} />
                </button>
                <h2 style={styles.dialogTitle}>CONFIRM CHOICE</h2>
                <p style={styles.dialogText}>
                  You pressed the Home icon, which will exit the game and take you to the developer's LinkedIn profile.
                </p>
                <h3 style={styles.question}>DO YOU WANT TO PROCEED?</h3>
                <div style={styles.answers}>
                  <button style={{ ...styles.answer, background: '#f04a4a' }} onClick={() => setConfirmHome(false)}>NO</button>
                  <button style={{ ...styles.answer, background: '#16a85a' }} onClick={() => location.assign(HOME_URL)}>YES</button>
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

function RoundButton({ icon, label, active = false, onClick }: { icon: IconName; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button style={{ ...styles.round, ...(active ? styles.roundActive : {}) }} onClick={onClick} aria-label={label} aria-pressed={active}>
      <Icon name={icon} size={36} />
    </button>
  );
}

const styles = {
  burger: {
    width: 52, height: 52, borderRadius: 12, cursor: 'pointer',
    display: 'grid', placeItems: 'center', padding: 0,
    border: `2px solid ${colors.border}`, background: colors.panel, color: colors.gold,
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10, display: 'flex',
    background: 'rgb(10 4 28 / 0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  },
  nav: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 22,
    padding: '20px 28px', flex: 'none',
  },
  navRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 16, padding: '8px 12px 24px' },
  round: {
    width: 76, height: 76, borderRadius: '50%', padding: 0, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    border: `3px solid ${colors.gold}`, background: '#1a0b3d', color: '#fff',
    boxShadow: '0 4px 14px rgb(0 0 0 / 0.5)',
  },
  roundActive: { background: colors.gold, color: colors.dark, boxShadow: `0 0 18px ${colors.gold}` },
  content: {
    flex: 1, minWidth: 0, minHeight: 0, overflow: 'auto', padding: '24px 20px 40px',
    scrollbarWidth: 'thin', scrollbarColor: `${colors.gold} transparent`,
  },
  page: { maxWidth: 720, margin: '0 auto' },
  dim: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 16, background: 'rgb(0 0 0 / 0.5)' },
  dialog: {
    position: 'relative', width: 640, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', padding: '36px 40px 40px',
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
    width: 160, height: 48, borderRadius: 24, border: 'none', cursor: 'pointer',
    fontSize: 24, fontWeight: 900, color: '#fff',
  },
} satisfies Record<string, CSSProperties>;
