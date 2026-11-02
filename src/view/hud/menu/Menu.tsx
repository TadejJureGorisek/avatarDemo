import { useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { GameConfig } from '../../../engine/config';
import { colors, disabledLook } from '../theme';
import { About } from './About';
import { Autoplay } from './Autoplay';
import { History, type HistoryEntry } from './History';
import { HowToPlay } from './HowToPlay';
import { useDragScroll } from './useDragScroll';

const TABS = ['HOW TO PLAY', 'ABOUT THE GAME', 'AUTOPLAY', 'HISTORY'] as const;
/** The panel's design size, before zoom. */
const PANEL = { width: 600, height: 620 };
type Tab = (typeof TABS)[number];

interface Props {
  disabled: boolean;
  open: boolean;
  /** Panel width in px (the board's on-screen width); 0 until the scene has laid out. */
  width: number;
  /** HUD zoom (from the scene); sizes the panel until the board's width is known. */
  scale: number;
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
}

// The overlay is portalled to <body> so the bar's zoom doesn't apply to it; the panel gets its own.
export function Menu(p: Props) {
  const [tab, setTab] = useState<Tab>('HOW TO PLAY');
  const content = useRef<HTMLDivElement>(null);
  useDragScroll(content);
  // The panel is always laid out at PANEL size (so its text wraps the same way at any window size)
  // and zoomed to the board's on-screen width, or smaller if the window is too short or narrow.
  const zoom = Math.min((p.width || PANEL.width * p.scale) / PANEL.width,
    (window.innerWidth - 32) / PANEL.width, (window.innerHeight - 32) / PANEL.height);
  const panelSize = { zoom, width: PANEL.width, height: PANEL.height };

  return (
    <>
      <button style={{ ...styles.burger, ...disabledLook(p.disabled) }} onClick={() => p.onOpenChange(true)}
        disabled={p.disabled} aria-label="Menu">☰</button>
      {p.open && createPortal(
        <div style={styles.overlay} onClick={() => p.onOpenChange(false)}>
          <div style={{ ...styles.panel, ...panelSize }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.tabs}>
              {TABS.map((t) => (
                <button key={t} style={{ ...styles.tab, ...(t === tab ? styles.activeTab : {}) }} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
              <button style={styles.close} onClick={() => p.onOpenChange(false)} aria-label="Close">✕</button>
            </div>
            <div style={styles.content} ref={content}>
              {tab === 'HOW TO PLAY' && <HowToPlay config={p.config} bet={p.bet} />}
              {tab === 'ABOUT THE GAME' && <About config={p.config} />}
              {tab === 'AUTOPLAY' && (
                <Autoplay
                  bet={p.bet}
                  atMinBet={p.atMinBet}
                  atMaxBet={p.atMaxBet}
                  onBetChange={p.onBetChange}
                  autoplayLeft={p.autoplayLeft}
                  canStart={p.canStartAutoplay}
                  onStart={(n) => {
                    p.onStartAutoplay(n);
                    p.onOpenChange(false);
                  }}
                  onStop={p.onStopAutoplay}
                />
              )}
              {tab === 'HISTORY' && <History entries={p.history} />}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

const styles = {
  burger: {
    width: 52, height: 52, borderRadius: 12, cursor: 'pointer',
    fontSize: 24, border: `2px solid ${colors.border}`, background: colors.panel, color: colors.gold,
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10, display: 'grid', placeItems: 'center', padding: 16,
    background: 'rgb(0 0 0 / 0.6)',
  },
  // Same size for every tab, so switching tabs doesn't resize the panel; long tabs scroll inside.
  panel: {
    display: 'flex', flexDirection: 'column', borderRadius: 18,
    background: '#1a0b3d', border: `3px solid ${colors.gold}`, overflow: 'hidden',
  },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, borderBottom: `2px solid ${colors.border}` },
  tab: {
    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
    background: 'transparent', color: '#fff',
  },
  activeTab: { background: colors.gold, color: colors.dark },
  close: {
    marginLeft: 'auto', width: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18,
    background: 'transparent', color: '#fff',
  },
  // Themed scrollbar via the standard properties, so no CSS file is needed.
  content: {
    flex: 1, minHeight: 0, padding: '12px 20px 20px', overflow: 'auto',
    scrollbarWidth: 'thin', scrollbarColor: `${colors.gold} ${colors.panel}`,
  },
} satisfies Record<string, CSSProperties>;
