export type IconName = 'spin' | 'stop' | 'autoplay' | 'continue' | 'turbo' | 'menu' | 'close';

export function Icon({ name, size }: { name: IconName; size: number }) {
  const mask = `url(assets/icons/${name}.svg) center / contain no-repeat`;
  return <span aria-hidden style={{ display: 'block', width: size, height: size, background: 'currentColor', mask, WebkitMask: mask }} />;
}
