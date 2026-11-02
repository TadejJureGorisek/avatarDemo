import { useEffect, type RefObject } from 'react';

/** Movement (px) before a press turns into a drag, so plain clicks on buttons still work. */
const THRESHOLD = 5;

/**
 * Click-and-drag scrolling with the mouse. Touch swipes already scroll natively, so those are
 * left to the browser.
 */
export function useDragScroll(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { y: number; scrollTop: number } | undefined;
    let dragging = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = { y: e.clientY, scrollTop: el.scrollTop };
      dragging = false;
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const dy = e.clientY - start.y;
      if (!dragging && Math.abs(dy) < THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';
      }
      el.scrollTop = start.scrollTop - dy;
    };
    const up = (e: PointerEvent) => {
      if (dragging) el.releasePointerCapture(e.pointerId);
      el.style.cursor = '';
      start = undefined;
    };
    // A drag shouldn't also count as a click on whatever it started on.
    const click = (e: MouseEvent) => {
      if (dragging) {
        e.stopPropagation();
        e.preventDefault();
        dragging = false;
      }
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  });
}
