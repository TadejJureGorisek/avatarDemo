import type { CSSProperties } from 'react';

export interface HistoryEntry {
  time: Date;
  bet: number;
  win: number;
  freeSpin: boolean;
  freeSpinsAwarded: number;
}

/** Last spins, newest first. */
export function History({ entries }: { entries: HistoryEntry[] }) {
  if (!entries.length) return <p>No spins yet.</p>;
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={cell}>Time</th>
          <th style={cell}>Type</th>
          <th style={cell}>Bet</th>
          <th style={cell}>Win</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={i} style={{ color: e.win > 0 ? '#ffe27a' : undefined }}>
            <td style={cell}>{e.time.toLocaleTimeString()}</td>
            <td style={cell}>
              {e.freeSpin ? 'Free spin' : 'Spin'}
              {e.freeSpinsAwarded > 0 && ` · +${e.freeSpinsAwarded} free spins`}
            </td>
            <td style={cell}>{e.freeSpin ? '-' : e.bet.toFixed(2)}</td>
            <td style={cell}>{e.win.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const cell: CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgb(255 255 255 / 0.1)' };
