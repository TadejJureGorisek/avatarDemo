import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';

// Phone browsers with a forced dark mode (Samsung Internet) repaint the colours of ordinary page
// elements, but leave canvases alone. So the HUD's bright fills, rings and icons are drawn on canvases.

type Draw = (g: CanvasRenderingContext2D, width: number, height: number) => void;

function useCanvas(draw: Draw, key: string) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const paint = () => {
    const canvas = ref.current;
    if (!canvas || !canvas.clientWidth) return;
    const { width } = canvas.getBoundingClientRect();
    const scale = (width / canvas.clientWidth) * devicePixelRatio;
    canvas.width = Math.round(canvas.clientWidth * scale);
    canvas.height = Math.round(canvas.clientHeight * scale);
    const g = canvas.getContext('2d')!;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    drawRef.current(g, canvas.clientWidth, canvas.clientHeight);
  };
  useLayoutEffect(paint, [key]);
  useEffect(() => {
    const observer = new ResizeObserver(paint);
    observer.observe(ref.current!);
    addEventListener('resize', paint);
    return () => {
      observer.disconnect();
      removeEventListener('resize', paint);
    };
  }, []);
  return { ref, paint };
}

export interface Look {
  /** Corner radius in CSS px, or 'round' for a circle/pill. */
  radius: number | 'round';
  /** A colour, or the stops of a radial gradient lit from the top left. */
  fill?: string | string[];
  border?: { width: number; color: string };
  /** Text drawn centred on the fill, for dark-on-gold labels. */
  text?: { value: string; color: string; font: string };
}

export function Paint({ look }: { look: Look }) {
  const { ref } = useCanvas((g, w, h) => {
    const r = look.radius === 'round' ? Math.min(w, h) / 2 : look.radius;
    const b = look.border?.width ?? 0;
    g.beginPath();
    g.roundRect(b / 2, b / 2, w - b, h - b, Math.max(0, r - b / 2));
    if (look.fill) {
      if (typeof look.fill === 'string') g.fillStyle = look.fill;
      else {
        const gradient = g.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h) * 0.75);
        look.fill.forEach((color, i) => gradient.addColorStop(i / (look.fill!.length - 1), color));
        g.fillStyle = gradient;
      }
      g.fill();
    }
    if (look.border) {
      g.lineWidth = b;
      g.strokeStyle = look.border.color;
      g.stroke();
    }
    if (look.text) {
      g.fillStyle = look.text.color;
      g.font = look.text.font;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(look.text.value, w / 2, h / 2 + 1);
    }
  }, JSON.stringify(look));
  return <canvas ref={ref} aria-hidden style={layer} />;
}

/** Style for an element that has a <Paint> behind its content. */
export const painted: CSSProperties = { position: 'relative', isolation: 'isolate', background: 'transparent', border: 'none' };

const layer: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' };

interface IconShape {
  paths: Path2D[];
  strokeWidth: number;
  filled: boolean;
}

const num = (el: Element, name: string) => Number(el.getAttribute(name) ?? 0);

/** An icon's shapes as canvas paths. Rendering the SVG as an image would let forced dark mode recolour it. */
function toShape(svg: string): IconShape {
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  const paths = [...root.querySelectorAll('path, line, circle, rect')].map((el) => {
    if (el.tagName === 'path') return new Path2D(el.getAttribute('d')!);
    const p = new Path2D();
    if (el.tagName === 'line') {
      p.moveTo(num(el, 'x1'), num(el, 'y1'));
      p.lineTo(num(el, 'x2'), num(el, 'y2'));
    } else if (el.tagName === 'circle') {
      p.arc(num(el, 'cx'), num(el, 'cy'), num(el, 'r'), 0, Math.PI * 2);
    } else {
      p.roundRect(num(el, 'x'), num(el, 'y'), num(el, 'width'), num(el, 'height'), num(el, 'rx'));
    }
    return p;
  });
  return { paths, strokeWidth: num(root, 'stroke-width') || 2, filled: (root.getAttribute('fill') ?? 'none') !== 'none' };
}

const shapes = new Map<string, Promise<IconShape>>();
const loadShape = (name: string) => {
  if (!shapes.has(name)) shapes.set(name, fetch(`assets/icons/${name}.svg`).then((r) => r.text()).then(toShape));
  return shapes.get(name)!;
};
const loaded = new Map<string, IconShape>();

/** An icon drawn on a canvas. The colour is passed in, not read from CSS, which forced dark mode rewrites. */
export function CanvasIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const { ref, paint } = useCanvas((g, w) => {
    const shape = loaded.get(name);
    if (!shape) {
      void loadShape(name).then((s) => {
        loaded.set(name, s);
        paint();
      });
      return;
    }
    g.scale(w / 24, w / 24);
    g.lineWidth = shape.strokeWidth;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = g.fillStyle = color;
    for (const p of shape.paths) {
      if (shape.filled) g.fill(p);
      g.stroke(p);
    }
  }, `${name}|${color}`);
  return <canvas ref={ref} aria-hidden style={{ display: 'block', width: size, height: size }} />;
}
