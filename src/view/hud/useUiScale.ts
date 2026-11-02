import { useEffect, useState } from 'react';

/** Window size the HUD is laid out for at scale 1; it grows and shrinks from there, keeping proportions. */
const DESIGN = { width: 1280, height: 720 };
/** Never smaller than this, so buttons stay usable on phones. */
const MIN_SCALE = 0.6;

const current = () => Math.max(MIN_SCALE, Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height));

/** One scale for the whole HUD and menu, like the board's: fits the window, keeps proportions. */
export function useUiScale() {
  const [scale, setScale] = useState(current);
  useEffect(() => {
    const onResize = () => setScale(current());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}
