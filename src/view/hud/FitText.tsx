import { useLayoutEffect, useRef } from 'react';

const MAX_SIZE = 26;

export function FitText({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const el = inner.current!;
      el.style.fontSize = `${MAX_SIZE}px`;
      const ratio = box.current!.clientWidth / el.scrollWidth;
      if (ratio < 1) el.style.fontSize = `${Math.floor(MAX_SIZE * ratio)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box.current!);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span ref={box} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center' }}>
      <span ref={inner} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
}
