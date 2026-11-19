import { describe, expect, it } from 'vitest';
import { normalizeSentenceAnswer, splitSentenceTokens } from '../src/utils/questionText';

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
