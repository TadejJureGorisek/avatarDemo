import type { CSSProperties } from 'react';
import { FitText } from './FitText';
import { colors, disabledLook, label, meter, value } from './theme';

interface Props {
  bet: number;
  disabled: boolean;
  atMin: boolean;
  atMax: boolean;
  onChange: (direction: 1 | -1) => void;
}

const stepButton: CSSProperties = {
  flexShrink: 0, width: 26, height: 26, padding: 0, border: 'none', borderRadius: '50%',
  background: colors.gold, color: colors.dark, fontSize: 18, fontWeight: 800,
};

export function BetControl({ bet, disabled, atMin, atMax, onChange }: Props) {
  const minusOff = disabled || atMin;
  const plusOff = disabled || atMax;
  return (
    <div style={meter}>
      <span style={label}>Bet</span>
      <span style={value}>
        <button style={{ ...stepButton, ...disabledLook(minusOff) }} onClick={() => onChange(-1)} disabled={minusOff}>−</button>
        <FitText text={bet.toFixed(2)} />
        <button style={{ ...stepButton, ...disabledLook(plusOff) }} onClick={() => onChange(1)} disabled={plusOff}>+</button>
      </span>
    </div>
  );
}
