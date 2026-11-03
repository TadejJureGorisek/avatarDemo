import type { CSSProperties } from 'react';
import { FitText } from './FitText';
import { Paint, painted } from './Paint';
import { colors, disabledLook, label, meter, value } from './theme';

interface Props {
  bet: number;
  disabled: boolean;
  atMin: boolean;
  atMax: boolean;
  onChange: (direction: 1 | -1) => void;
}

const stepButton: CSSProperties = {
  ...painted, flexShrink: 0, width: 26, height: 26, padding: 0, borderRadius: '50%',
};

const step = (sign: string) => ({ radius: 'round' as const, fill: colors.gold, text: { value: sign, color: colors.dark, font: '800 18px system-ui, sans-serif' } });

export function BetControl({ bet, disabled, atMin, atMax, onChange }: Props) {
  const minusOff = disabled || atMin;
  const plusOff = disabled || atMax;
  return (
    <div style={meter}>
      <span style={label}>Bet</span>
      <span style={value}>
        <button style={{ ...stepButton, ...disabledLook(minusOff) }} onClick={() => onChange(-1)} disabled={minusOff} aria-label="Lower bet"><Paint look={step('−')} /></button>
        <FitText text={bet.toFixed(2)} />
        <button style={{ ...stepButton, ...disabledLook(plusOff) }} onClick={() => onChange(1)} disabled={plusOff} aria-label="Raise bet"><Paint look={step('+')} /></button>
      </span>
    </div>
  );
}
