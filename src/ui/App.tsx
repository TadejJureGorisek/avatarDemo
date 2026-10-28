import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GameController } from '../controller/GameController';
import { Hud } from './Hud';
import { Paytable } from './Paytable';

export function App({ controller }: { controller: GameController }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.get);
  const [showPaytable, setShowPaytable] = useState(false);

  useEffect(() => {
    controller.mount(hostRef.current!).catch(console.error);
    return () => controller.destroy();
  }, [controller]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        void controller.spin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [controller]);

  return (
    <div className="game">
      <div className="canvas-host" ref={hostRef} />
      {!state.ready && <div className="loading">Loading…</div>}
      {state.freeSpinsRemaining > 0 && (
        <div className="banner">
          FREE SPINS: {state.freeSpinsRemaining} left · Total {state.freeSpinsTotal.toFixed(2)}
        </div>
      )}
      <Hud state={state} controller={controller} onPaytable={() => setShowPaytable(true)} />
      {showPaytable && <Paytable onClose={() => setShowPaytable(false)} bet={state.bet} />}
    </div>
  );
}
