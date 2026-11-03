import { useSyncExternalStore } from 'react';

export interface Settings {
  soundFx: boolean;
  music: boolean;
  spaceToSpin: boolean;
  cheatKeys: boolean;
}

const KEY = 'settings';
const DEFAULTS: Settings = { soundFx: true, music: true, spaceToSpin: true, cheatKeys: true };

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
