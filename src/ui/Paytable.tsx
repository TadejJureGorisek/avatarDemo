import { gameConfig } from '../config/gameConfig';
import { symbolTexturePath } from '../view/SymbolView';

export function Paytable({ onClose, bet }: { onClose: () => void; bet: number }) {
  const { reels, rows, freeSpins } = gameConfig;
  const ways = rows ** reels;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="paytable" onClick={(e) => e.stopPropagation()}>
        <h2>Paytable</h2>
        <p>
          {ways} ways, paying left to right from the first reel. Values are per way at the current bet
          ({bet.toFixed(2)}). {freeSpins.minScatters}+ BONUS anywhere award {freeSpins.spinsAwarded} free
          spins.
        </p>
        <div className="paytable-grid">
          {gameConfig.symbols.map((s) => (
            <div key={s.id} className="paytable-item">
              <img src={symbolTexturePath(s.id)} alt={s.id} />
              <div>
                {Object.entries(s.pays)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([count, pay]) => (
                    <div key={count}>
                      <b>{count}×</b> {(pay * bet).toFixed(2)}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <button className="close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
