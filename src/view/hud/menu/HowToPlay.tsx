import type { CSSProperties } from 'react';
import type { GameConfig } from '../../../engine/config';
import { symbolUrl } from '../../board/Cell';
import { Section, TabTitle } from './Section';

/** Rules and the paytable at the current bet. */
export function HowToPlay({ config, bet }: { config: GameConfig; bet: number }) {
  const { reels, rows, freeSpins } = config;
  return (
    <>
      <TabTitle>HOW TO PLAY</TabTitle>
      <Section subtitle="Playing">
        Set your bet with − / + and press SPIN (or Space). Press STOP to land the reels early.
      </Section>
      <Section subtitle="Ways to win">
        {reels} reels × {rows} rows, {rows ** reels} ways. A win is 3 or more of the same symbol on
        neighbouring reels, starting from the leftmost reel, in any row. Every combination of matching
        symbols is a way, and every way pays.
      </Section>
      <Section subtitle="Free spins">
        BONUS pays anywhere on the board. {freeSpins.minScatters} BONUS (one on every reel) award{' '}
        {freeSpins.awarded} free spins, played automatically at the same bet.
      </Section>
      <Section subtitle="Paytable">
        <p style={{ margin: '0 0 12px' }}>Per way, at bet {bet.toFixed(2)}</p>
        <div style={grid}>
          {config.symbols.map((s) => (
            <div key={s.id} style={item}>
              <img src={symbolUrl(s.id)} alt={s.id} width={64} height={64} />
              <div style={{ textAlign: 'left' }}>
                {Object.entries(s.pays).sort(([a], [b]) => Number(b) - Number(a)).map(([count, pay]) => (
                  <div key={count}><b>{count}×</b> {(pay * bet).toFixed(2)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// Two columns of symbols, each symbol centred in its column.
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' };
const item: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 18 };
