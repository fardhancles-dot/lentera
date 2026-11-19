import { musicService } from '../../services/music.service';
import { sessionStore } from '../../stores/session.store';
import type { ActiveBackgroundMusic } from '../../types/music';
import { audioEngine } from './audioEngine';
import { volumeToGain } from './patterns';

/**
 * Single global background-music player for the whole SPA.
 *
 * - One HTMLAudioElement is created at boot and reused by every route, so
 *   navigation never restarts the track.
 * - The source always comes from the active primary row in background_music.
 * - Browsers may block `play()` before a gesture. When that happens the player
 *   arms passive listeners and starts on the next natural tap/key press; no
 *   music button or widget is added to the player UI.
 */

const AUDIO_ID = 'background-music';
const MAX_RETRIES = 2;
const GESTURE_EVENTS = ['pointerdown', 'touchend', 'click', 'keydown'] as const;

class BackgroundMusic {
  private audio: HTMLAudioElement | null = null;
  private track: ActiveBackgroundMusic | null = null;
  private started = false;
  private gestureArmed = false;
  private gestureHandler: (() => void) | null = null;
  private retryTimer: number | null = null;
  private retries = 0;

  /** Called once from main.ts; safe to call again. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    this.audio = this.createAudio();
    sessionStore.subscribe(() => this.applyVolume());
    audioEngine.subscribe(() => this.applyMuted());
    this.applyVolume();
    this.applyMuted();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      // Browsers may suspend media in the background; recover when the player
      // returns. No continuous polling, only a stale configuration refresh.
      if (!this.track) {
        void this.sync(false);
        return;
      }
      if (this.audio?.paused) this.attemptPlay();
      else if (!musicService.cached()) void this.sync(false);
    });

    window.addEventListener('lentera:music-updated', () => {
      musicService.invalidate();
      void this.sync(true);
    });

    void this.sync(false);
  }

  /** Applies an admin change immediately (also used after a failed load). */
  async refresh(): Promise<void> {
    musicService.invalidate();
    await this.sync(true);
  }

  private async sync(force: boolean): Promise<void> {
    try {
      const track = await musicService.load(force);
      this.applyTrack(track);
    } catch (error) {
      // Offline or RPC failure: keep whatever is currently playing.
      console.warn('[music] background config could not be loaded', error);
    }
  }

  private createAudio(): HTMLAudioElement {
    const audio = document.createElement('audio');
    audio.id = AUDIO_ID;
    audio.loop = true;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');
    // A hidden media element is not a player control; it keeps the UI clean.
    audio.hidden = true;
    audio.style.display = 'none';
    audio.addEventListener('error', () => this.scheduleRetry());
    document.body.append(audio);
    return audio;
  }

  private applyTrack(track: ActiveBackgroundMusic | null): void {
    const audio = this.audio ?? (this.audio = this.createAudio());

    if (!track) {
      this.track = null;
      this.disarmGesture();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    const sameTrack =
      this.track?.id === track.id &&
      this.track.updatedAt === track.updatedAt &&
      audio.getAttribute('src') === track.url;

    this.track = track;
    this.applyVolume();
    this.applyMuted();

    if (sameTrack) {
      if (audio.paused) this.attemptPlay();
      return;
    }

    audio.pause();
    audio.src = track.url;
    audio.load();
    this.retries = 0;
    this.attemptPlay();
  }

  private attemptPlay(): void {
    const audio = this.audio;
    if (!audio || !this.track || audioEngine.isMuted()) return;

    const result = audio.play();
    if (!result) return;

    void result
      .then(() => {
        this.retries = 0;
        this.disarmGesture();
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          this.armGesture();
          return;
        }
        this.scheduleRetry();
      });
  }

  private armGesture(): void {
    if (this.gestureArmed || typeof document === 'undefined') return;
    this.gestureArmed = true;

    const handler = (): void => this.playFromGesture();
    this.gestureHandler = handler;
    for (const event of GESTURE_EVENTS) {
      document.addEventListener(event, handler, { capture: true, passive: true });
    }
  }

  private disarmGesture(): void {
    if (!this.gestureArmed || !this.gestureHandler) return;
    for (const event of GESTURE_EVENTS) {
      document.removeEventListener(event, this.gestureHandler, { capture: true });
    }
    this.gestureArmed = false;
    this.gestureHandler = null;
  }

  /**
   * Runs synchronously inside a real user gesture. Browsers that block autoplay
   * accept this call, so no dedicated "play music" button is needed.
   */
  private playFromGesture(): void {
    const audio = this.audio;
    if (!audio) return;
    if (!this.track) {
      void this.sync(false);
      return;
    }

    const result = audio.play();
    if (!result) return;
    void result
      .then(() => {
        this.retries = 0;
        this.disarmGesture();
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof DOMException && error.name === 'NotAllowedError') return;
        this.disarmGesture();
        this.scheduleRetry();
      });
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null || this.retries >= MAX_RETRIES) return;
    this.retries += 1;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      void this.sync(true);
    }, 1500 * this.retries);
  }

  private applyVolume(): void {
    if (!this.audio) return;
    const settings = sessionStore.getState().user?.settings;
    const gain = settings ? volumeToGain(settings.music_volume, 0.35) : 0.28;
    this.audio.volume = Math.min(1, Math.max(0, gain));
  }

  private applyMuted(): void {
    if (!this.audio) return;
    const muted = audioEngine.isMuted();
    this.audio.muted = muted;
    if (!muted && this.audio.paused && this.track) this.attemptPlay();
  }
}

export const backgroundMusic = new BackgroundMusic();
