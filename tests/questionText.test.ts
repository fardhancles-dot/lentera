import { describe, expect, it } from 'vitest';
import {
  joinSentenceTokens,
  normalizeSentenceAnswer,
  sentenceBuilderTokens,
  splitSentenceTokens,
} from '../src/utils/questionText';

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
    expect(sentenceBuilderTokens('Saya suka belajar')).toEqual({
      tokens: ['Saya', 'suka', 'belajar'],
      mode: 'words',
    });
  });

  it('splits a single word into its letters', () => {
    expect(sentenceBuilderTokens('  INDONESIA ')).toEqual({
      tokens: ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      mode: 'letters',
    });
  });

  it('drops punctuation from a single word instead of making it a token', () => {
    expect(sentenceBuilderTokens('SEKOLAH!').tokens).toEqual([
      'S',
      'E',
      'K',
      'O',
      'L',
      'A',
      'H',
    ]);
  });

  it('returns no tokens for an empty answer', () => {
    expect(sentenceBuilderTokens('   ')).toEqual({ tokens: [], mode: 'words' });
  });
});

describe('joinSentenceTokens', () => {
  it('joins letters without spaces so the word matches the saved answer', () => {
    expect(joinSentenceTokens(['K', 'O', 'M', 'P', 'U', 'T', 'E', 'R'], 'letters')).toBe(
      'KOMPUTER',
    );
  });

  it('keeps spaces between word tokens', () => {
    expect(joinSentenceTokens(['IBU', 'MEMASAK', 'NASI'], 'words')).toBe(
      'IBU MEMASAK NASI',
    );
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
