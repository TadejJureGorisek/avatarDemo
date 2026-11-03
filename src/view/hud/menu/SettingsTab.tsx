import type { CSSProperties } from 'react';
import { settings, useSettings, type Settings } from '../../settings';
import { colors } from '../theme';
import { TabTitle } from './Section';

interface Props {
  turbo: boolean;
  onToggleTurbo: () => void;
}

export function SettingsTab({ turbo, onToggleTurbo }: Props) {
  const s = useSettings();
  const option = (key: keyof Settings, label: string) => (
    <Toggle label={label} on={s[key]} onToggle={() => settings.set({ [key]: !s[key] })} />
  );
  return (
    <>
      <TabTitle>SETTINGS</TabTitle>
      <h3 style={styles.group}>AUDIO</h3>
      {option('soundFx', 'Sound FX')}
      {option('music', 'Music')}
      <h3 style={styles.group}>KEYBOARD</h3>
      {option('spaceToSpin', 'Press spacebar to spin')}
      {option('cheatKeys', 'Number keys 1–7 pick cheats')}
      <h3 style={styles.group}>GAMEPLAY</h3>
      <Toggle label="Turbo spins" on={turbo} onToggle={onToggleTurbo} />
    </>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <label style={styles.row}>
      <button style={{ ...styles.track, ...(on ? styles.trackOn : {}) }} onClick={onToggle}
        role="switch" aria-checked={on} aria-label={label} data-sound="toggle">
        <span style={{ ...styles.knob, ...(on ? styles.knobOn : {}) }} />
      </button>
      <span>{label}</span>
    </label>
  );
}

const styles = {
  group: { margin: '20px 0 12px', textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: 1.5 },
  row: {
    display: 'flex', alignItems: 'center', gap: 24, width: 360, margin: '0 auto 14px',
    fontSize: 19, fontWeight: 800, cursor: 'pointer',
  },
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
