import { settings } from './settings';

const EFFECTS = [
  'click', 'toggle', 'whoosh', 'spin', 'reelSpin', 'reelStop', 'bonusLand', 'anticipation', 'win', 'bigWin', 'freeSpins',
  'squat', 'smile', 'unsquat', 'wiggle', 'clink', 'celebrate',
] as const;
const MUSIC = ['musicBase', 'musicFreeSpins'] as const;
export type Effect = (typeof EFFECTS)[number];
export type Music = (typeof MUSIC)[number];

const VOLUME: Record<Effect | Music, number> = {
  click: 0.5, toggle: 0.5, whoosh: 0.4, spin: 0.5, reelSpin: 0.45, reelStop: 0.6, bonusLand: 0.8, anticipation: 0.7,
  win: 0.7, bigWin: 0.6, freeSpins: 0.9,
  squat: 0.35, smile: 0.4, unsquat: 0.35, wiggle: 0.35, clink: 0.6, celebrate: 0.7,
  musicBase: 0.35, musicFreeSpins: 0.4,
};
const MUSIC_FADE_S = 1.2;
const REPEAT_GAP_S = 0.04;

export interface Playing {
  stop(fadeSeconds?: number): void;
  volume(level: number): void;
}

class Sound {
  private context = new AudioContext();
  private master = this.context.createGain();
  private effects = this.context.createGain();
  private musicBus = this.context.createGain();
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Set<string>();
  private lastPlayed = new Map<Effect, number>();
  private track?: { name: Music; playing: Playing };
  private wanted?: Music;

  constructor() {
    this.master.connect(this.context.destination);
    this.effects.connect(this.master);
    this.musicBus.connect(this.master);
    this.applySettings(0);
    settings.subscribe(() => this.applySettings(0.05));
    const unlock = () => void this.context.resume();
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
  }

  async loadEffects() {
    await Promise.all(EFFECTS.map((name) => this.load(name)));
  }

  async loadMusic() {
    await Promise.all(MUSIC.map((name) => this.load(name)));
    if (this.wanted) this.music(this.wanted);
  }

  play(name: Effect, { loop = false } = {}): Playing {
    const buffer = this.buffers.get(name);
    const now = this.context.currentTime;
    if (!buffer || now - (this.lastPlayed.get(name) ?? -1) < REPEAT_GAP_S) return { stop() {}, volume() {} };
    this.lastPlayed.set(name, now);
    return this.start(buffer, this.effects, VOLUME[name], loop);
  }

  music(name: Music) {
    this.wanted = name;
    if (this.track?.name === name) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    this.track?.playing.stop(MUSIC_FADE_S);
    this.track = { name, playing: this.start(buffer, this.musicBus, VOLUME[name], true, MUSIC_FADE_S) };
  }

  private applySettings(fade: number) {
    const { masterVolume, soundFx, soundFxVolume, music, musicVolume } = settings.get();
    const t = this.context.currentTime;
    this.master.gain.setTargetAtTime(masterVolume, t, fade || 0.001);
    this.effects.gain.setTargetAtTime(soundFx ? soundFxVolume : 0, t, fade || 0.001);
    this.musicBus.gain.setTargetAtTime(music ? musicVolume : 0, t, fade || 0.001);
  }

  private async load(name: string) {
    if (this.loading.has(name)) return;
    this.loading.add(name);
    try {
      const data = await (await fetch(`assets/audio/${name}.mp3`)).arrayBuffer();
      this.buffers.set(name, await this.context.decodeAudioData(data));
    } catch {}
  }

  private start(buffer: AudioBuffer, bus: GainNode, volume: number, loop: boolean, fadeIn = 0): Playing {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gain).connect(bus);
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(fadeIn ? 0 : volume, now);
    if (fadeIn) gain.gain.linearRampToValueAtTime(volume, now + fadeIn);
    source.start();
    let stopped = false;
    return {
      stop: (fade = 0.15) => {
        if (stopped) return;
        stopped = true;
        const t = this.context.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + fade);
        source.stop(t + fade);
      },
      volume: (level) => {
        if (!stopped) gain.gain.setTargetAtTime(volume * level, this.context.currentTime, 0.05);
      },
    };
  }
}

export const sound = new Sound();
