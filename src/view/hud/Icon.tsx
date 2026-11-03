import { CanvasIcon } from './Paint';

export type IconName = 'spin' | 'stop' | 'autoplay' | 'continue' | 'turbo' | 'menu' | 'close'
  | 'home' | 'history' | 'settings' | 'info';

export function Icon({ name, size, color }: { name: IconName; size: number; color: string }) {
  return <CanvasIcon name={name} size={size} color={color} />;
}
