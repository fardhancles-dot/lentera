import { describe, expect, it } from 'vitest';
import { SOUND_PATTERNS, clampVolume, volumeToGain } from '../src/game/audio/patterns';

describe('audio patterns', () => {
  it('clamps volumes to the 0..1 range', () => {
    expect(clampVolume(-10)).toBe(0);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(1)).toBe(1);
    expect(clampVolume(140)).toBe(1);
    expect(clampVolume(Number.NaN)).toBe(0);
  });

  it('maps the 0..100 settings scale onto a gain ceiling', () => {
    expect(volumeToGain(0, 0.5)).toBe(0);
    expect(volumeToGain(50, 0.5)).toBe(0.25);
    expect(volumeToGain(100, 0.5)).toBe(0.5);
    expect(volumeToGain(300, 0.5)).toBe(0.5);
  });

  it('defines a playable pattern for every sound', () => {
    const names = Object.keys(SOUND_PATTERNS);

    expect(names).toEqual(
      expect.arrayContaining(['click', 'step', 'correct', 'wrong', 'complete', 'reward', 'locked']),
    );

    for (const [name, steps] of Object.entries(SOUND_PATTERNS)) {
      expect(steps.length, `${name} has notes`).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.frequency).toBeGreaterThan(0);
        expect(step.duration).toBeGreaterThan(0);
        expect(step.delay ?? 0).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
