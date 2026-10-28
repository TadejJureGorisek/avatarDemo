import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { MainView } from './MainView';

export function Hud({ game }: { game: MainView }) {
  const host = useRef<HTMLDivElement>(null);
  const s = useSyncExternalStore(game.subscribe, game.getState);
  const locked = !s.ready || s.spinning || s.freeSpinsLeft > 0;

  useEffect(() => {
    game.mount(host.current!).catch(console.error);
    const onKey = (e: KeyboardEvent) => e.code === 'Space' && (e.preventDefault(), void game.spin());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game]);

  return (
    <div className="game">
      <div className="canvas-host" ref={host} />
      {!s.ready && <div className="loading">Loading…</div>}
      {s.freeSpinsLeft > 0 && (
        <div className="banner">FREE SPINS: {s.freeSpinsLeft} left · Total {s.freeSpinsTotal.toFixed(2)}</div>
      )}
      <div className="hud">
        <div className="hud-group">
          <Meter label="Balance">{s.balance.toFixed(2)}</Meter>
          <Meter label="Bet">
            <button onClick={() => game.changeBet(-1)} disabled={locked}>−</button>
            {s.bet.toFixed(2)}
            <button onClick={() => game.changeBet(1)} disabled={locked}>+</button>
          </Meter>
        </div>
        <button className="spin" onClick={() => void game.spin()} disabled={locked}>
          {s.spinning ? '…' : 'SPIN'}
        </button>
        <div className="hud-group">
          <Meter label="Win" highlight={s.lastWin > 0}>{s.lastWin.toFixed(2)}</Meter>
          <div className="message">{s.message}</div>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={`meter${highlight ? ' highlight' : ''}`}>
      <span className="label">{label}</span>
      <span className="value">{children}</span>
    </div>
  );
}
