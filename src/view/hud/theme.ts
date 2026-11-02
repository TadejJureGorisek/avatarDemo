import type { CSSProperties } from 'react';

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
