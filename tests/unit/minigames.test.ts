import { describe, expect, it } from 'vitest';
import {
  joinBlankAnswers,
  parseBlankPrompt,
} from '../../frontend/src/game/minigames/blankPrompt';
import {
  mergeLegacyLetters,
  sentenceBuilderAnswer,
} from '../../frontend/src/game/minigames/sentenceBuilder';
import { parseLessonQuestions } from '../../frontend/src/services/lesson.service';

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

describe('mergeLegacyLetters', () => {
  const option = (id: string, label: string) => ({ id, label });

  it('merges a legacy letter-based answer into one whole-word card', () => {
    const merged = mergeLegacyLetters(
      [...'INDONESIA'].map((letter, index) => option(`o${index}`, letter)),
    );
    expect(merged).toEqual([{ id: 'o0:word', label: 'INDONESIA' }]);
  });

  it('keeps whole-word distractors as separate cards', () => {
    const merged = mergeLegacyLetters([
      option('a', 'i'),
      option('b', 'n'),
      option('c', 'd'),
      option('d', 'malaysia'),
    ]);
    expect(merged).toEqual([
      { id: 'a:word', label: 'ind' },
      option('d', 'malaysia'),
    ]);
  });

  it('leaves questions that already store whole words untouched', () => {
    const options = [option('a', 'I'), option('b', 'love'), option('c', 'Indonesia')];
    expect(mergeLegacyLetters(options)).toEqual(options);
  });
});

describe('sentenceBuilderAnswer', () => {
  const option = (id: string, label: string) => ({ id, label });

  it('submits the selected whole word for a legacy letter question', () => {
    const tokens = mergeLegacyLetters(
      [...'INDONESIA'].map((letter, index) => option(`o${index}`, letter)),
    );
    expect(sentenceBuilderAnswer(['o0:word'], tokens)).toBe('INDONESIA');
  });

  it('joins the selected words in the order the player arranged them', () => {
    const tokens = ['I', 'love', 'Indonesia'].map((label, index) =>
      option(`w${index}`, label),
    );
    expect(sentenceBuilderAnswer(['w0', 'w1', 'w2'], tokens)).toBe('I love Indonesia');
    expect(sentenceBuilderAnswer(['w2', 'w0', 'w1'], tokens)).toBe('Indonesia I love');
  });

  it('keeps duplicate words distinct by token id', () => {
    const tokens = ['suka', 'suka'].map((label, index) => option(`d${index}`, label));
    expect(sentenceBuilderAnswer(['d1', 'd0'], tokens)).toBe('suka suka');
  });

  it('sends a selected distractor so the server can reject it', () => {
    const tokens = [option('a', 'indonesia'), option('b', 'malaysia')];
    expect(sentenceBuilderAnswer(['b'], tokens)).toBe('malaysia');
  });

  it('never includes unselected words in the answer', () => {
    const tokens = [option('a', 'indonesia'), option('b', 'thailand')];
    expect(sentenceBuilderAnswer(['a'], tokens)).toBe('indonesia');
  });

  it('returns an empty answer when nothing is selected', () => {
    expect(sentenceBuilderAnswer([], [option('a', 'indonesia')])).toBe('');
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
