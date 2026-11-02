import { useEffect, useState } from 'react';

/** Window size the HUD is laid out for at scale 1; it grows and shrinks from there, keeping proportions. */
const DESIGN = { width: 1280, height: 720 };
// No minimum: a squeezed window shrinks everything evenly, so text never re-wraps.
const current = () => Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);

/** One scale for the whole HUD and menu, like the board's: fits the window, keeps proportions. */
export function useUiScale() {
  const [scale, setScale] = useState(current);
  useEffect(() => {
    // Watch the page's size directly as well as the resize event, which doesn't fire for every change.
    const onResize = () => setScale(current());
    const observer = new ResizeObserver(onResize);
    observer.observe(document.documentElement);
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return scale;
}
