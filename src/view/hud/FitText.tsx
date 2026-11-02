import { useLayoutEffect, useRef } from 'react';

/** One line of text that shrinks its font (from `maxSize` px down) to fit the space it's given. */
export function FitText({ text, maxSize = 26 }: { text: string; maxSize?: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const el = inner.current!;
      el.style.fontSize = `${maxSize}px`;
      const ratio = box.current!.clientWidth / el.scrollWidth;
      if (ratio < 1) el.style.fontSize = `${Math.floor(maxSize * ratio)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box.current!);
    return () => observer.disconnect();
  }, [text, maxSize]);

  return (
    <span ref={box} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center' }}>
      {/* inline-block so scrollWidth reports the text's real width (inline spans report 0) */}
      <span ref={inner} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
}
