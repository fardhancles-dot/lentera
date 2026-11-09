import { sessionStore } from '../../stores/session.store';
import { SOUND_PATTERNS, volumeToGain, type SoundName } from './patterns';

/**
 * Lentera's audio engine is fully synthesized with the Web Audio API. There are
 * no downloaded samples: every sound is generated from oscillators, so the
 * project ships no third-party audio licence and nothing is a silent
 * placeholder. Volumes come from the user's saved settings; the mute toggle is
 * a local device preference and never overwrites the database settings.
 */

const MUSIC_BARS: readonly (readonly number[])[] = [
  [220, 261.63, 329.63],
  [196, 246.94, 293.66],
  [174.61, 220, 261.63],
  [196, 246.94, 329.63],
];
const MUSIC_MELODY = [659.25, 587.33, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
const MUSIC_BAR_MS = 4000;
const MUTE_KEY = 'lentera:audio-muted';

type Listener = () => void;

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicBar = 0;
  private musicWanted = false;
  private listeners = new Set<Listener>();
  private lastPlayed = new Map<SoundName, number>();
  private muted = false;

  constructor() {
    if (typeof window === 'undefined') return;

    try {
      this.muted = window.localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      this.muted = false;
    }

    sessionStore.subscribe(() => this.syncWithSession());
    document.addEventListener('visibilitychange', () => this.handleVisibility());
    this.syncWithSession();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      window.localStorage.setItem(MUTE_KEY, String(muted));
    } catch {
      // Private mode may reject storage; the in-memory flag still works.
    }
    if (muted) this.stopMusic();
    else if (this.musicWanted && this.context?.state === 'running') this.startMusic();
    this.applyVolumes();
    this.notify();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Browsers only allow audio after a user gesture. Call this from the first
   * pointerdown/keydown so queued music can start.
   */
  unlock(): void {
    if (typeof window === 'undefined') return;
    const context = this.ensureContext();
    if (!context) return;

    if (context.state === 'suspended') void context.resume();
    this.applyVolumes();
    if (this.musicWanted && !this.muted) this.startMusic();
  }

  play(name: SoundName): void {
    if (this.muted || typeof window === 'undefined') return;
    const context = this.ensureContext();
    if (!context || context.state !== 'running' || !this.sfxGain) return;

    const now = context.currentTime;
    const last = this.lastPlayed.get(name) ?? 0;
    if (now - last < 0.04) return;
    this.lastPlayed.set(name, now);

    const pattern = SOUND_PATTERNS[name];
    const volume = this.sfxVolume();

    for (const step of pattern) {
      const start = now + (step.delay ?? 0);
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = step.type ?? 'triangle';
      oscillator.frequency.setValueAtTime(step.frequency, start);

      const peak = Math.max(0.0001, volume * 0.6);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration);

      oscillator.connect(gain);
      gain.connect(this.sfxGain);
      oscillator.start(start);
      oscillator.stop(start + step.duration + 0.02);
    }
  }

  /** Music is allowed only while a signed-in player is in the app. */
  setMusicEnabled(enabled: boolean): void {
    this.musicWanted = enabled;
    if (!enabled) this.stopMusic();
    else if (this.context?.state === 'running' && !this.muted) this.startMusic();
  }

  private sfxVolume(): number {
    const settings = sessionStore.getState().user?.settings;
    if (!settings) return 0.6;
    return volumeToGain(settings.sfx_volume, 0.8);
  }

  private musicVolume(): number {
    const settings = sessionStore.getState().user?.settings;
    if (!settings) return 0.25;
    return volumeToGain(settings.music_volume, 0.3);
  }

  private syncWithSession(): void {
    const signedIn = Boolean(sessionStore.getState().user);
    this.setMusicEnabled(signedIn);
    this.applyVolumes();
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return null;

    const Ctor = window.AudioContext;
    if (!Ctor) return null;

    try {
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();

      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.context.destination);
      this.applyVolumes();
    } catch (error) {
      console.error('[audio] Web Audio is not available', error);
      this.context = null;
    }

    return this.context;
  }

  private applyVolumes(): void {
    if (!this.context || !this.master || !this.musicGain || !this.sfxGain) return;
    const now = this.context.currentTime;
    const muted = this.muted;
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVolume(), now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume(), now, 0.05);
  }

  private startMusic(): void {
    if (this.musicTimer !== null || typeof window === 'undefined') return;
    this.playMusicBar();
    this.musicTimer = window.setInterval(() => this.playMusicBar(), MUSIC_BAR_MS);
  }

  private stopMusic(): void {
    if (this.musicTimer === null) return;
    window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private playMusicBar(): void {
    if (this.muted) return;
    const context = this.context;
    if (!context || context.state !== 'running' || !this.musicGain) return;

    const now = context.currentTime;
    const chord = MUSIC_BARS[this.musicBar % MUSIC_BARS.length]!;
    this.musicBar += 1;

    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + MUSIC_BAR_MS / 1000 - 0.2);

      oscillator.connect(gain);
      gain.connect(this.musicGain!);
      oscillator.start(now);
      oscillator.stop(now + MUSIC_BAR_MS / 1000);
    });

    const melodyFrequency = MUSIC_MELODY[this.musicBar % MUSIC_MELODY.length]!;
    const melody = context.createOscillator();
    const melodyGain = context.createGain();
    melody.type = 'sine';
    melody.frequency.setValueAtTime(melodyFrequency, now + 1.6);
    melodyGain.gain.setValueAtTime(0.0001, now + 1.6);
    melodyGain.gain.exponentialRampToValueAtTime(0.12, now + 1.75);
    melodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    melody.connect(melodyGain);
    melodyGain.connect(this.musicGain);
    melody.start(now + 1.6);
    melody.stop(now + 2.7);
  }

  private handleVisibility(): void {
    if (!this.context) return;
    if (document.visibilityState === 'hidden') {
      this.stopMusic();
      void this.context.suspend();
      return;
    }

    void this.context.resume().then(() => {
      this.applyVolumes();
      if (this.musicWanted && !this.muted) this.startMusic();
    });
  }
}

export const audioEngine = new AudioEngine();

/** Adds one-shot listeners that unlock audio on the first user gesture. */
export function installAudioUnlock(): void {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    audioEngine.unlock();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);

  // Buttons and links get a soft click. Specific flows (correct answer, reward,
  // map node) layer their own sound a moment later, so both stay distinct.
  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-silent-sfx]')) return;
      if (!target.closest('button, a[href], [role="button"], input[type="checkbox"], input[type="radio"]')) {
        return;
      }
      audioEngine.play('click');
    },
    { capture: true, passive: true },
  );
}
