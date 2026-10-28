import type { GameController, UiState } from '../controller/GameController';

const money = (value: number) => value.toFixed(2);

interface HudProps {
  state: UiState;
  controller: GameController;
  onPaytable: () => void;
}

export function Hud({ state, controller, onPaytable }: HudProps) {
  const locked = state.spinning || state.freeSpinsRemaining > 0;

  return (
    <div className="hud">
      <div className="hud-group">
        <Meter label="Balance" value={money(state.balance)} />
        <div className="meter">
          <span className="meter-label">Bet</span>
          <div className="bet-control">
            <button onClick={() => controller.changeBet(-1)} disabled={locked} aria-label="Decrease bet">
              −
            </button>
            <span className="meter-value">{money(state.bet)}</span>
            <button onClick={() => controller.changeBet(1)} disabled={locked} aria-label="Increase bet">
              +
            </button>
          </div>
        </div>
      </div>

      <button
        className="spin-button"
        onClick={() => void controller.spin()}
        disabled={!state.ready || locked}
        aria-label="Spin"
      >
        {state.spinning ? '…' : 'SPIN'}
      </button>

      <div className="hud-group">
        <Meter label="Win" value={money(state.lastWin)} highlight={state.lastWin > 0} />
        <div className="meter message">
          <span className="meter-label">
            <button className="link" onClick={onPaytable}>
              Paytable
            </button>
          </span>
          <span className="message-text">{state.message}</span>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`meter${highlight ? ' highlight' : ''}`}>
      <span className="meter-label">{label}</span>
      <span className="meter-value">{value}</span>
    </div>
  );
}
