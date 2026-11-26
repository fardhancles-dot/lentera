/**
 * Splits a sentence into the tokens used by Susun Kalimat. Whitespace is the
 * only separator, so punctuation stays attached to its word, joining the
 * tokens with a single space rebuilds the sentence exactly, and a single-word
 * answer stays one whole word instead of being split into letters.
 */
export function splitSentenceTokens(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Cards used by Susun Kalimat: one token per word, for one-word answers and
 * multi-word sentences alike. A word is never split into its letters.
 */
export function sentenceBuilderTokens(sentence: string): string[] {
  return splitSentenceTokens(sentence);
}

/** Joins the arranged words back into the answer text that the server grades. */
export function joinSentenceTokens(tokens: readonly string[]): string {
  return tokens.join(' ');
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
