import type { CSSProperties } from 'react';
import { settings, useSettings, type Settings } from '../../settings';
import { colors } from '../theme';
import { TabTitle } from './Section';

type Flag = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];
type Level = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

interface Props {
  turbo: boolean;
  onToggleTurbo: () => void;
}

export function SettingsTab({ turbo, onToggleTurbo }: Props) {
  const s = useSettings();
  const toggle = (key: Flag, label: string) => <Toggle label={label} on={s[key]} onToggle={() => settings.set({ [key]: !s[key] })} />;
  const option = (key: Flag, label: string) => (
    <div style={styles.row}>{toggle(key, label)}<span>{label}</span></div>
  );
  const volume = (key: Level, label: string, flag?: Flag) => (
    <div style={styles.row}>
      {flag ? toggle(flag, label) : <span style={styles.spacer} />}
      <span style={styles.name}>{label}</span>
      <Slider label={`${label} volume`} value={s[key]} disabled={flag && !s[flag]} onChange={(v) => settings.set({ [key]: v })} />
    </div>
  );
  return (
    <>
      <TabTitle>SETTINGS</TabTitle>
      <h3 style={styles.group}>AUDIO</h3>
      {volume('masterVolume', 'Master')}
      {volume('soundFxVolume', 'Sound FX', 'soundFx')}
      {volume('musicVolume', 'Music', 'music')}
      <h3 style={styles.group}>KEYBOARD</h3>
      {option('spaceToSpin', 'Press spacebar to spin')}
      {option('cheatKeys', 'Number keys 1–7 pick cheats')}
      <h3 style={styles.group}>GAMEPLAY</h3>
      <div style={styles.row}><Toggle label="Turbo spins" on={turbo} onToggle={onToggleTurbo} /><span>Turbo spins</span></div>
    </>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button style={{ ...styles.track, ...(on ? styles.trackOn : {}) }} onClick={onToggle}
      role="switch" aria-checked={on} aria-label={label} data-sound="toggle">
      <span style={{ ...styles.knob, ...(on ? styles.knobOn : {}) }} />
    </button>
  );
}

function Slider({ label, value, disabled = false, onChange }: { label: string; value: number; disabled?: boolean; onChange: (v: number) => void }) {
  const percent = Math.round(value * 100);
  return (
    <span style={{ ...styles.slider, opacity: disabled ? 0.4 : 1 }}>
      <input
        type="range" min={0} max={100} value={percent} disabled={disabled} aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={styles.range}
      />
      <span style={styles.percent}>{percent}%</span>
    </span>
  );
}

const styles = {
  group: { margin: '20px 0 12px', textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: 1.5 },
  row: {
    display: 'flex', alignItems: 'center', gap: 20, width: 480, maxWidth: '100%', margin: '0 auto 14px',
    fontSize: 19, fontWeight: 800,
  },
  name: { width: 100, flex: 'none' },
  spacer: { width: 76, flex: 'none' },
  slider: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  range: { flex: 1, minWidth: 0, height: 24, margin: 0, accentColor: colors.gold, cursor: 'pointer' },
  percent: { width: 52, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  track: {
    position: 'relative', flex: 'none', width: 76, height: 40, padding: 0, borderRadius: 20, cursor: 'pointer',
    border: `2px solid ${colors.border}`, background: colors.panel, transition: 'background 0.2s',
  },
  trackOn: { background: '#8a5a00', borderColor: colors.gold },
  knob: {
    position: 'absolute', top: 4, left: 4, width: 28, height: 28, borderRadius: '50%',
    background: '#6d5a8a', transition: 'left 0.2s, background 0.2s',
  },
  knobOn: { left: 40, background: colors.gold, boxShadow: `0 0 10px ${colors.gold}` },
} satisfies Record<string, CSSProperties>;
