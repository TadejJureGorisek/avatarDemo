import type { CSSProperties } from 'react';
import type { Look } from './Paint';

export const colors = { gold: '#ffc94a', dark: '#3a1500', panel: 'rgb(26 11 61 / 0.9)', border: 'rgb(255 201 74 / 0.5)' };

export const meter: CSSProperties = {
  display: 'flex', flexDirection: 'column', width: 170, boxSizing: 'border-box',
  padding: '8px 14px', borderRadius: 12,
  background: colors.panel, border: `2px solid ${colors.border}`,
};

export const label: CSSProperties = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, textAlign: 'center' };

export const value: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, height: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
};

export const disabledLook = (disabled: boolean): CSSProperties =>
  ({ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' });

export const looks = {
  ring: { radius: 'round', fill: colors.panel, border: { width: 3, color: colors.gold } },
  ringOn: { radius: 'round', fill: colors.gold, border: { width: 3, color: colors.gold } },
  spin: { radius: 'round', fill: ['#ffe27a', '#f8b032', '#f39a0f', '#b25e00'], border: { width: 5, color: '#fff3c4' } },
} satisfies Record<string, Look>;
