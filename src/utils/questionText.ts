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
