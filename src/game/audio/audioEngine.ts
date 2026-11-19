import { sessionStore } from '../../stores/session.store';
import { SOUND_PATTERNS, volumeToGain, type SoundName } from './patterns';

/**
 * Lentera's sound effects are synthesized with the Web Audio API; the global
 * background track is streamed by backgroundMusic.ts from the admin library.
 * Volumes come from the user's saved settings; the mute toggle is a local
 * device preference and never overwrites the database settings.
 */

const MUTE_KEY = 'lentera:audio-muted';

type Listener = () => void;

class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private listeners = new Set<Listener>();
  private lastPlayed = new Map<SoundName, number>();
  private pendingGestureSfx: SoundName | null = null;
  private muted = false;

  constructor() {
    if (typeof window === 'undefined') return;

    try {
      this.muted = window.localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      this.muted = false;
    }

    sessionStore.subscribe(() => this.applyVolumes());
    document.addEventListener('visibilitychange', () => this.handleVisibility());
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
    this.applyVolumes();
    this.notify();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Browsers only allow audio after a user gesture. Call this from the first
   * pointerdown/keydown so effect sounds are ready.
   */
  unlock(): void {
    if (typeof window === 'undefined') return;
    const context = this.ensureContext();
    if (!context) return;

    if (context.state === 'suspended') {
      // The first tap's click handler can run before resume() settles; keep that
      // effect queued so mobile users still hear feedback on the first gesture.
      void context.resume().then(() => {
        this.applyVolumes();
        const pending = this.pendingGestureSfx;
        this.pendingGestureSfx = null;
        if (pending && this.context?.state === 'running') this.play(pending);
      });
      return;
    }
    this.applyVolumes();
  }

  play(name: SoundName): void {
    if (this.muted || typeof window === 'undefined') return;
    const context = this.ensureContext();
    if (!context) return;
    if (context.state !== 'running') {
      this.pendingGestureSfx = name;
      return;
    }
    if (!this.sfxGain) return;

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

  private sfxVolume(): number {
    const settings = sessionStore.getState().user?.settings;
    if (!settings) return 0.6;
    return volumeToGain(settings.sfx_volume, 0.8);
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return null;

    const Ctor = window.AudioContext;
    if (!Ctor) return null;

    try {
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.sfxGain = this.context.createGain();

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
    if (!this.context || !this.master || !this.sfxGain) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume(), now, 0.05);
  }

  private handleVisibility(): void {
    if (!this.context) return;
    if (document.visibilityState === 'hidden') {
      void this.context.suspend();
      return;
    }

    void this.context.resume().then(() => this.applyVolumes());
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
