import { CanvasIcon } from './Paint';

export type IconName = 'spin' | 'stop' | 'autoplay' | 'continue' | 'turbo' | 'menu' | 'close'
  | 'home' | 'history' | 'settings' | 'info';

export function Icon({ name, size }: { name: IconName; size: number }) {
  return <CanvasIcon name={name} size={size} />;
}
