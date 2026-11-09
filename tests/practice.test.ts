import { describe, expect, it } from 'vitest';
import { comboMultiplier, formatClock, RAMP_UP_SECONDS } from '../src/game/practice/scoring';

describe('practice display scoring', () => {
  it('formats the countdown as minutes and seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(1000)).toBe('0:01');
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(120_000)).toBe('2:00');
  });

  it('never shows a negative clock', () => {
    expect(formatClock(-5000)).toBe('0:00');
  });

  it('keeps the combo multiplier readable and capped', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.1);
    expect(comboMultiplier(4)).toBe(1.3);
    expect(comboMultiplier(9)).toBe(1.5);
    expect(comboMultiplier(30)).toBe(1.5);
  });

  it('uses a 20 second limit per Ramp Up question', () => {
    expect(RAMP_UP_SECONDS).toBe(20);
  });
});
