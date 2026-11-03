import { useState, type CSSProperties } from 'react';
import { BetControl } from '../BetControl';
import { Paint, painted, type Look } from '../Paint';
import { colors, disabledLook } from '../theme';
import { Section, TabTitle } from './Section';

const MAX_SPINS = 999;
const STEPS = [1, 10, 100];

interface Props {
  bet: number;
  atMinBet: boolean;
  atMaxBet: boolean;
  onBetChange: (direction: 1 | -1) => void;
  autoplayLeft: number;
  canStart: boolean;
  onStart: (spins: number) => void;
  onStop: () => void;
}

export function Autoplay({ bet, atMinBet, atMaxBet, onBetChange, autoplayLeft, canStart, onStart, onStop }: Props) {
  const [custom, setCustom] = useState('');
  const spins = Math.min(MAX_SPINS, Math.floor(Number(custom)));
  const canStartCustom = canStart && spins >= 1;
  if (autoplayLeft > 0) {
    return (
      <>
        <TabTitle>AUTOPLAY</TabTitle>
        <Section subtitle="Running">
          <p style={{ margin: '0 0 12px' }}>{autoplayLeft} spins left.</p>
          <button style={button} onClick={onStop}><Paint look={gold('Stop autoplay')} />Stop autoplay</button>
        </Section>
      </>
    );
  }
  return (
    <>
      <TabTitle>AUTOPLAY</TabTitle>
      <Section subtitle="How it works">
        Spins play automatically at this bet. Autoplay stops if your balance runs out; free spins play
        first, then autoplay carries on.
      </Section>
      <Section subtitle="Bet">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BetControl bet={bet} disabled={!canStart} atMin={atMinBet} atMax={atMaxBet} onChange={onBetChange} />
        </div>
      </Section>
      <Section subtitle="Number of spins">
        <div style={{ ...customRow, marginTop: 0 }}>
          <input
            type="text" inputMode="numeric" placeholder="Custom" value={custom}
            aria-label="Custom number of spins" disabled={!canStart} style={input}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter' && canStartCustom) onStart(spins);
            }}
          />
          <button style={{ ...button, ...disabledLook(!canStartCustom) }} disabled={!canStartCustom} onClick={() => onStart(spins)}>
            <Paint look={gold(canStartCustom ? `Start ${spins} spins` : 'Start')} />
            {canStartCustom ? `Start ${spins} spins` : 'Start'}
          </button>
        </div>
        <div style={customRow}>
          {STEPS.map((n) => (
            <button key={n} style={{ ...stepButton, ...disabledLook(!canStart) }} disabled={!canStart}
              onClick={() => setCustom((c) => String(Math.min(MAX_SPINS, (Number(c) || 0) + n)))}><Paint look={stepLook} />+{n}</button>
          ))}
          <button style={{ ...stepButton, ...disabledLook(!canStart || !custom) }} disabled={!canStart || !custom}
            onClick={() => setCustom('')}><Paint look={stepLook} />Clear</button>
        </div>
        {!canStart && <p style={{ margin: '10px 0 0' }}>Wait for the current spin to finish.</p>}
      </Section>
    </>
  );
}

const customRow: CSSProperties = { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 };
const input: CSSProperties = {
  width: 110, padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box', textAlign: 'center',
  border: `2px solid ${colors.gold}`, background: colors.panel, color: '#fff', fontSize: 16, fontWeight: 800,
};

const button: CSSProperties = {
  ...painted, padding: '10px 18px', borderRadius: 10, fontWeight: 800, color: 'transparent', cursor: 'pointer',
};
const stepButton: CSSProperties = { ...button, minWidth: 64, padding: '8px 12px', color: colors.gold };
const stepLook: Look = { radius: 10, fill: colors.panel, border: { width: 2, color: colors.gold } };
const gold = (text: string): Look => ({
  radius: 10, fill: colors.gold, text: { value: text, color: colors.dark, font: '800 13.33px system-ui, sans-serif' },
});
