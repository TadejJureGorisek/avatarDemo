import { useRef, useState, type CSSProperties } from 'react';
import type { GameConfig } from '../../../engine/config';
import { colors, disabledLook } from '../theme';
import { About } from './About';
import { Autoplay } from './Autoplay';
import { History, type HistoryEntry } from './History';
import { HowToPlay } from './HowToPlay';
import { useDragScroll } from './useDragScroll';

const TABS = ['HOW TO PLAY', 'ABOUT THE GAME', 'AUTOPLAY', 'HISTORY'] as const;
type Tab = (typeof TABS)[number];

interface Props {
  /** Locked during a round (a spin, free spins or autoplay). */
  disabled: boolean;
  open: boolean;
  /** Panel width in px (the board's on-screen width); 0 until the scene has laid out. */
  width: number;
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

/** Burger button (sits in the bottom bar) and the full-screen menu panel with its four tabs. */
export function Menu(p: Props) {
  const [tab, setTab] = useState<Tab>('HOW TO PLAY');
  const content = useRef<HTMLDivElement>(null);
  useDragScroll(content);

  return (
    <>
      <button style={{ ...styles.burger, ...disabledLook(p.disabled) }} onClick={() => p.onOpenChange(true)}
        disabled={p.disabled} aria-label="Menu">☰</button>
      {p.open && (
        <div style={styles.overlay} onClick={() => p.onOpenChange(false)}>
          <div style={{ ...styles.panel, width: p.width ? `min(${Math.round(p.width)}px, 100%)` : styles.panel.width }} onClick={(e) => e.stopPropagation()}>
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
        </div>
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
  // Fixed size for every tab (as wide as the board, centred on screen), so switching tabs doesn't
  // resize the panel; long tabs scroll inside.
  panel: {
    width: 'min(860px, 100%)', height: 'min(620px, 100%)', display: 'flex', flexDirection: 'column', borderRadius: 18,
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
  // Themed scrollbar (thin gold thumb on the dark panel) via the standard properties, so no CSS file.
  content: {
    flex: 1, minHeight: 0, padding: '12px 20px 20px', overflow: 'auto',
    scrollbarWidth: 'thin', scrollbarColor: `${colors.gold} ${colors.panel}`,
  },
} satisfies Record<string, CSSProperties>;
