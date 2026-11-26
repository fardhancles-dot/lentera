export type SoundName =
  | 'click'
  | 'step'
  | 'correct'
  | 'wrong'
  | 'complete'
  | 'reward'
  | 'locked';

export interface ToneStep {
  frequency: number;
  duration: number;
  delay?: number;
  type?: OscillatorType;
}

/** Every SFX is synthesized, so there are no audio files or licences to ship. */
export const SOUND_PATTERNS: Record<SoundName, readonly ToneStep[]> = {
  click: [{ frequency: 620, duration: 0.06, type: 'triangle' }],
  step: [{ frequency: 340, duration: 0.05, type: 'triangle' }],
  correct: [
    { frequency: 523.25, duration: 0.09, type: 'triangle' },
    { frequency: 659.25, duration: 0.12, delay: 0.09, type: 'triangle' },
  ],
  wrong: [
    { frequency: 233.08, duration: 0.12, type: 'sawtooth' },
    { frequency: 174.61, duration: 0.16, delay: 0.1, type: 'sawtooth' },
  ],
  complete: [
    { frequency: 523.25, duration: 0.1, type: 'triangle' },
    { frequency: 659.25, duration: 0.1, delay: 0.1, type: 'triangle' },
    { frequency: 783.99, duration: 0.1, delay: 0.2, type: 'triangle' },
    { frequency: 1046.5, duration: 0.26, delay: 0.3, type: 'triangle' },
  ],
  reward: [
    { frequency: 880, duration: 0.08, type: 'sine' },
    { frequency: 1174.66, duration: 0.08, delay: 0.08, type: 'sine' },
    { frequency: 1567.98, duration: 0.22, delay: 0.16, type: 'sine' },
  ],
  locked: [
    { frequency: 164.81, duration: 0.12, type: 'square' },
    { frequency: 130.81, duration: 0.18, delay: 0.09, type: 'square' },
  ],
};

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function volumeToGain(value: number, ceiling: number): number {
  return clampVolume(value / 100) * ceiling;
}
