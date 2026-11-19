import { describe, expect, it } from 'vitest';
import {
  MUSIC_CACHE_TTL_MS,
  isMusicCacheStale,
  parseActiveMusic,
} from '../src/services/music.service';

describe('background music config', () => {
  it('parses the active primary track payload', () => {
    const track = parseActiveMusic({
      id: 'track-1',
      title: 'Lentera Pagi',
      url: 'https://example.com/music/pagi.mp3',
      format: 'mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 4096,
      updatedAt: '2026-11-20T10:00:00.000Z',
    });

    expect(track).toMatchObject({
      id: 'track-1',
      title: 'Lentera Pagi',
      format: 'mp3',
      sizeBytes: 4096,
    });
  });

  it('returns null when no primary track is configured', () => {
    expect(parseActiveMusic(null)).toBeNull();
    expect(parseActiveMusic({ id: 'x' })).toBeNull();
    expect(parseActiveMusic({ url: 'https://example.com/a.mp3' })).toBeNull();
  });

  it('normalises an unknown format to mp3 and keeps ogg/wav', () => {
    const base = { id: 'a', url: 'https://example.com/a' };
    expect(parseActiveMusic({ ...base, format: 'flac' })?.format).toBe('mp3');
    expect(parseActiveMusic({ ...base, format: 'ogg' })?.format).toBe('ogg');
    expect(parseActiveMusic({ ...base, format: 'wav' })?.format).toBe('wav');
  });

  it('treats only old timestamps as stale', () => {
    const now = 1_000_000;
    expect(isMusicCacheStale(now - MUSIC_CACHE_TTL_MS + 1, now)).toBe(false);
    expect(isMusicCacheStale(now - MUSIC_CACHE_TTL_MS, now)).toBe(true);
    expect(isMusicCacheStale(Number.NaN, now)).toBe(true);
  });
});
