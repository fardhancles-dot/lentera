/**
 * Splits a sentence into the tokens used by Sentence Builder. Whitespace is the
 * only separator, so punctuation stays attached to its word and joining the
 * tokens with a single space rebuilds the sentence exactly.
 */
export function splitSentenceTokens(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export type SentenceBuilderTokenMode = 'words' | 'letters';

export interface SentenceBuilderTokens {
  tokens: string[];
  mode: SentenceBuilderTokenMode;
}

/**
 * Tokens used by Susun Kata. A multi-word answer is split on whitespace as
 * before. A single word has no word order to arrange, so it is split into its
 * letters (punctuation dropped) and the player rearranges the letters instead.
 */
export function sentenceBuilderTokens(sentence: string): SentenceBuilderTokens {
  const words = splitSentenceTokens(sentence);
  if (words.length !== 1) return { tokens: words, mode: 'words' };
  const letters = Array.from(words[0]!.replace(/[^\p{L}\p{N}]/gu, ''));
  if (letters.length === 0) return { tokens: words, mode: 'words' };
  return { tokens: letters, mode: 'letters' };
}

/** Joins the arranged tokens back into the answer text that the server grades. */
export function joinSentenceTokens(
  tokens: readonly string[],
  mode: SentenceBuilderTokenMode,
): string {
  return tokens.join(mode === 'letters' ? '' : ' ');
}

/**
 * Normalises a word-ordering answer. Case, punctuation and repeated spaces are
 * ignored, word order is not. Mirrors public.normalize_sentence_text() in the
 * database so the admin form can reject a Word Bank whose key can never match.
 */
export function normalizeSentenceAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
