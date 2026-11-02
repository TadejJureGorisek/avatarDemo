import type { CSSProperties, ReactNode } from 'react';
import { colors } from '../theme';

/** Big gold heading at the top of a menu tab. */
export function TabTitle({ children }: { children: ReactNode }) {
  return <h2 style={styles.title}>{children}</h2>;
}

/** One centred block of a menu tab: a subtitle and its content. */
export function Section({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.subtitle}>{subtitle}</h3>
      <div style={styles.content}>{children}</div>
    </section>
  );
}

const styles = {
  title: { margin: '4px 0 18px', textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 2, color: colors.gold },
  section: { textAlign: 'center', margin: '0 auto 20px', maxWidth: 640 },
  subtitle: { margin: '0 0 6px', fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' },
  content: { fontSize: 15, lineHeight: 1.6, opacity: 0.85 },
} satisfies Record<string, CSSProperties>;
