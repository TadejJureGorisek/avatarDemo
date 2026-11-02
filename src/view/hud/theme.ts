import type { CSSProperties } from 'react';

// Shared HUD styles. Sizes use clamp() so the HUD shrinks on phones without media queries.
export const colors = { gold: '#ffc94a', dark: '#3a1500', panel: 'rgb(26 11 61 / 0.9)', border: 'rgb(255 201 74 / 0.5)' };

// Fixed width: values shrink to fit (FitText) instead of the box growing with the number.
export const meter: CSSProperties = {
  display: 'flex', flexDirection: 'column', width: 'clamp(130px, 22vw, 170px)', boxSizing: 'border-box',
  padding: 'clamp(3px, 1vw, 8px) clamp(8px, 1.8vw, 14px)', borderRadius: 12,
  background: colors.panel, border: `2px solid ${colors.border}`,
};

export const label: CSSProperties = { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 };

export const value: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, height: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
};

export const disabledLook = (disabled: boolean): CSSProperties =>
  ({ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' });
