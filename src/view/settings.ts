import { useSyncExternalStore } from 'react';

export interface Settings {
  masterVolume: number;
  soundFx: boolean;
  soundFxVolume: number;
  music: boolean;
  musicVolume: number;
  spaceToSpin: boolean;
  cheatKeys: boolean;
}

const KEY = 'settings';
const DEFAULTS: Settings = {
  masterVolume: 1, soundFx: true, soundFxVolume: 1, music: true, musicVolume: 0.8, spaceToSpin: true, cheatKeys: true,
};

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

let current = load();
const listeners = new Set<() => void>();

export const settings = {
  get: () => current,
  set(patch: Partial<Settings>) {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {}
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};

export const useSettings = () => useSyncExternalStore(settings.subscribe, settings.get);
