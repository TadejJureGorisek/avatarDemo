import type { CSSProperties, ReactNode } from 'react';
import { colors } from '../theme';

export function TabTitle({ children }: { children: ReactNode }) {
  return <h2 style={styles.title}>{children}</h2>;
}

export function Section({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.subtitle}>{subtitle}</h3>
      <div style={styles.content}>{children}</div>
    </section>
  );
}

const styles = {
  title: { margin: '4px 0 20px', textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: 2, color: colors.gold },
  section: { textAlign: 'center', margin: '0 auto 24px', maxWidth: 680 },
  subtitle: { margin: '0 0 8px', fontSize: 20, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' },
  content: { fontSize: 19, lineHeight: 1.55, opacity: 0.9 },
} satisfies Record<string, CSSProperties>;
