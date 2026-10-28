interface Props {
  bet: number;
  disabled: boolean;
  onChange: (direction: 1 | -1) => void;
}

export function BetControl({ bet, disabled, onChange }: Props) {
  return (
    <div className="meter">
      <span className="label">Bet</span>
      <span className="value">
        <button onClick={() => onChange(-1)} disabled={disabled}>−</button>
        {bet.toFixed(2)}
        <button onClick={() => onChange(1)} disabled={disabled}>+</button>
      </span>
    </div>
  );
}
