import { musicRepository } from '../repositories/music.repository';
import type { ActiveBackgroundMusic, MusicFormat } from '../types/music';

const CACHE_KEY = 'lentera:background-music';
export const MUSIC_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  track: ActiveBackgroundMusic | null;
  savedAt: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asFormat(value: unknown): MusicFormat {
  return value === 'ogg' || value === 'wav' ? value : 'mp3';
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Returns null when the server has no active primary track. */
export function parseActiveMusic(value: unknown): ActiveBackgroundMusic | null {
  const data = asRecord(value);
  const id = asString(data.id);
  const url = asString(data.url);
  if (!id || !url) return null;

  return {
    id,
    title: asString(data.title, 'Musik Lentera'),
    url,
    format: asFormat(data.format),
    mimeType: asString(data.mimeType, 'audio/mpeg'),
    sizeBytes: asNumber(data.sizeBytes),
    updatedAt: asString(data.updatedAt),
  };
}

export function isMusicCacheStale(
  savedAt: number,
  now: number,
  ttl = MUSIC_CACHE_TTL_MS,
): boolean {
  return !Number.isFinite(savedAt) || now - savedAt >= ttl;
}

class MusicService {
  private memory: CacheEntry | null = null;
  private pending: Promise<ActiveBackgroundMusic | null> | null = null;

  private read(): CacheEntry | null {
    if (this.memory) return this.memory;
    try {
      const raw = window.sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry;
      if (!parsed || typeof parsed.savedAt !== 'number') return null;
      this.memory = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  private write(track: ActiveBackgroundMusic | null): void {
    // A missing track is never cached: after an admin publishes music, the next
    // page load must pick it up immediately instead of waiting for a TTL.
    if (!track) {
      this.memory = null;
      try {
        window.sessionStorage.removeItem(CACHE_KEY);
      } catch {
        // Private mode may reject storage; the in-memory value is already clear.
      }
      return;
    }

    const entry: CacheEntry = { track, savedAt: Date.now() };
    this.memory = entry;
    try {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // Caching is an optimisation only.
    }
  }

  invalidate(): void {
    this.write(null);
  }

  cached(now = Date.now()): ActiveBackgroundMusic | null {
    const entry = this.read();
    if (!entry || isMusicCacheStale(entry.savedAt, now)) return null;
    return entry.track;
  }

  /**
   * Loads the active primary track. A fresh cache avoids a database request; a
   * failed refresh falls back to the previously cached track so a flaky network
   * never stops the current music.
   */
  async load(force = false): Promise<ActiveBackgroundMusic | null> {
    if (!force) {
      const fresh = this.cached();
      if (fresh) return fresh;
    }
    if (this.pending) return this.pending;

    this.pending = (async () => {
      try {
        const track = parseActiveMusic(await musicRepository.getActiveMusic());
        this.write(track);
        return track;
      } catch (error) {
        const entry = this.read();
        if (entry) return entry.track;
        throw error;
      } finally {
        this.pending = null;
      }
    })();

    return this.pending;
  }
}

export const musicService = new MusicService();
