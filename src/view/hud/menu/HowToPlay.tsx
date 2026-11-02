import type { CSSProperties } from 'react';
import type { GameConfig } from '../../../engine/config';
import { symbolUrl } from '../../board/Cell';

/** Rules and the paytable at the current bet. */
export function HowToPlay({ config, bet }: { config: GameConfig; bet: number }) {
  const { reels, rows, freeSpins } = config;
  return (
    <>
      <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
        <li>Set your bet with − / + and press SPIN (or Space). Press STOP to land the reels early.</li>
        <li>
          {reels} reels × {rows} rows, {rows ** reels} ways: a win is 3 or more of the same symbol on
          neighbouring reels, starting from the leftmost reel, in any row.
        </li>
        <li>Each combination of matching symbols counts as a way, and every way pays.</li>
        <li>
          BONUS pays anywhere on the board. {freeSpins.minScatters} BONUS (one on every reel) award{' '}
          {freeSpins.awarded} free spins, played automatically at the same bet.
        </li>
      </ul>
      <h3 style={{ margin: '12px 0 8px' }}>Paytable (per way, at bet {bet.toFixed(2)})</h3>
      <div style={grid}>
        {config.symbols.map((s) => (
          <div key={s.id} style={item}>
            <img src={symbolUrl(s.id)} alt={s.id} width={52} height={52} />
            <div>
              {Object.entries(s.pays).sort(([a], [b]) => Number(b) - Number(a)).map(([count, pay]) => (
                <div key={count}><b>{count}×</b> {(pay * bet).toFixed(2)}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 };
const item: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 };
