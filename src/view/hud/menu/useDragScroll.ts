import { useEffect, type RefObject } from 'react';

const THRESHOLD = 5;

export function useDragScroll(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { y: number; scrollTop: number } | undefined;
    let dragging = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as Element).closest('input, select, textarea')) return;
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
