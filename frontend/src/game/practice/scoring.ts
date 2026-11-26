/**
 * Display-only helpers. The server owns scoring, combo bonuses, and XP; these
 * values are never sent back as authority.
 */
export const RAMP_UP_SECONDS = 20;

export function formatClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function comboMultiplier(combo: number): number {
  return Math.round((1 + Math.min(5, Math.max(0, combo - 1)) * 0.1) * 10) / 10;
}
