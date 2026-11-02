import type { CSSProperties } from 'react';
import { colors, disabledLook, label, meter, value } from './theme';

interface Props {
  bet: number;
  disabled: boolean;
  onChange: (direction: 1 | -1) => void;
}

const stepButton: CSSProperties = {
  width: 30, height: 30, border: 'none', borderRadius: '50%',
  background: colors.gold, color: colors.dark, fontSize: 20, fontWeight: 800,
};

export function BetControl({ bet, disabled, onChange }: Props) {
  const button = { ...stepButton, ...disabledLook(disabled) };
  return (
    <div style={meter}>
      <span style={label}>Bet</span>
      <span style={value}>
        <button style={button} onClick={() => onChange(-1)} disabled={disabled}>−</button>
        {bet.toFixed(2)}
        <button style={button} onClick={() => onChange(1)} disabled={disabled}>+</button>
      </span>
    </div>
  );
}
