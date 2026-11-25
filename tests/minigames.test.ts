import { describe, expect, it } from 'vitest';
import {
  joinBlankAnswers,
  parseBlankPrompt,
} from '../src/game/minigames/blankPrompt';
import { parseLessonQuestions } from '../src/services/lesson.service';

describe('parseBlankPrompt', () => {
  it('reports no inline blank when the prompt has no marker', () => {
    const result = parseBlankPrompt('Tulis jawabanmu di buku.');
    expect(result.inline).toBe(false);
    expect(result.blankCount).toBe(0);
    expect(result.parts).toEqual(['Tulis jawabanmu di buku.']);
  });

  it('splits one blank into two text parts', () => {
    const result = parseBlankPrompt('She __ to school every day.');
    expect(result.inline).toBe(true);
    expect(result.blankCount).toBe(1);
    expect(result.parts).toEqual(['She ', ' to school every day.']);
  });

  it('supports two blanks and keeps the text between them', () => {
    const result = parseBlankPrompt('Ani __ buku dan __ catatan.');
    expect(result.blankCount).toBe(2);
    expect(result.parts).toEqual(['Ani ', ' buku dan ', ' catatan.']);
  });

  it('accepts three underscores as one blank marker', () => {
    const result = parseBlankPrompt('Buku itu terletak ___ atas meja.');
    expect(result.blankCount).toBe(1);
    expect(result.parts).toEqual(['Buku itu terletak ', ' atas meja.']);
  });

  it('counts three separate blanks', () => {
    const result = parseBlankPrompt('__ + __ = __');
    expect(result.blankCount).toBe(3);
    expect(result.parts).toHaveLength(4);
  });
});

describe('parseLessonQuestions scene', () => {
  const question = (scene: Record<string, unknown>) => [
    {
      id: 'q1',
      type: 'sentence_builder',
      prompt: 'Susun kata.',
      scene,
      options: [{ id: 'o1', label: 'I' }],
    },
  ];

  it('keeps the letter mode of a one-word Susun Kata answer', () => {
    const [parsed] = parseLessonQuestions(question({ tokenMode: 'letters' }));
    expect(parsed?.scene.tokenMode).toBe('letters');
  });

  it('defaults to word mode when the scene has no token mode', () => {
    const [parsed] = parseLessonQuestions(question({}));
    expect(parsed?.scene.tokenMode).toBeUndefined();
  });

  it('keeps the letter mode of a Susun Kata answer inside Soal Kombinasi', () => {
    const [parsed] = parseLessonQuestions(question({ tokenMode: 'letters', kind: 'combined' }));
    expect(parsed?.scene.tokenMode).toBe('letters');
  });
});

describe('joinBlankAnswers', () => {
  it('trims and joins all blank values in order', () => {
    expect(joinBlankAnswers([' membaca ', 'menulis  '])).toBe('membaca menulis');
  });

  it('returns null when any blank is empty', () => {
    expect(joinBlankAnswers(['membaca', '   '])).toBeNull();
  });

  it('returns null when there are no values', () => {
    expect(joinBlankAnswers([])).toBeNull();
  });
});
