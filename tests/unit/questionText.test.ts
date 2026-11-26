import { describe, expect, it } from 'vitest';
import {
  joinSentenceTokens,
  normalizeSentenceAnswer,
  sentenceBuilderTokens,
  splitSentenceTokens,
} from '../../frontend/src/utils/questionText';

describe('splitSentenceTokens', () => {
  it('splits on any whitespace and drops empty tokens', () => {
    expect(splitSentenceTokens('  Saya   pergi\tke sekolah. ')).toEqual([
      'Saya',
      'pergi',
      'ke',
      'sekolah.',
    ]);
  });

  it('keeps punctuation attached to its word', () => {
    expect(splitSentenceTokens('Apakah kamu sudah makan?')).toEqual([
      'Apakah',
      'kamu',
      'sudah',
      'makan?',
    ]);
  });

  it('keeps repeated words as separate tokens', () => {
    expect(splitSentenceTokens('saya suka suka makan')).toEqual([
      'saya',
      'suka',
      'suka',
      'makan',
    ]);
  });

  it('returns no tokens for an empty sentence', () => {
    expect(splitSentenceTokens('   ')).toEqual([]);
  });
});

describe('sentenceBuilderTokens', () => {
  it('splits a multi-word sentence into words', () => {
    expect(sentenceBuilderTokens('Saya suka belajar')).toEqual(['Saya', 'suka', 'belajar']);
  });

  it('keeps a one-word answer as one whole card', () => {
    expect(sentenceBuilderTokens('  INDONESIA ')).toEqual(['INDONESIA']);
  });

  it('keeps punctuation attached to a single word', () => {
    expect(sentenceBuilderTokens('SEKOLAH!')).toEqual(['SEKOLAH!']);
  });

  it('returns one card per word for short words', () => {
    expect(sentenceBuilderTokens('I love Indonesia')).toEqual(['I', 'love', 'Indonesia']);
  });

  it('returns no tokens for an empty answer', () => {
    expect(sentenceBuilderTokens('   ')).toEqual([]);
  });
});

describe('joinSentenceTokens', () => {
  it('keeps a single whole word unchanged', () => {
    expect(joinSentenceTokens(['KOMPUTER'])).toBe('KOMPUTER');
  });

  it('keeps spaces between word tokens', () => {
    expect(joinSentenceTokens(['IBU', 'MEMASAK', 'NASI'])).toBe('IBU MEMASAK NASI');
  });
});

describe('normalizeSentenceAnswer', () => {
  it('ignores case, punctuation and extra spaces', () => {
    expect(normalizeSentenceAnswer('  Saya pergi ke sekolah. ')).toBe(
      'saya pergi ke sekolah',
    );
  });

  it('does not reorder words', () => {
    expect(normalizeSentenceAnswer('sekolah ke pergi saya')).not.toBe(
      normalizeSentenceAnswer('saya pergi ke sekolah'),
    );
  });

  it('treats tokens joined with spaces the same as a punctuated sentence', () => {
    expect(normalizeSentenceAnswer('Saya makan nasi .')).toBe(
      normalizeSentenceAnswer('Saya makan nasi.'),
    );
  });
});
