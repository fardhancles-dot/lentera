export interface BlankPrompt {
  /** Text segments around each blank; length is blankCount + 1 when inline. */
  parts: string[];
  blankCount: number;
  inline: boolean;
}

/** Splits a prompt on two or more underscores, matching the seeded content. */
export function parseBlankPrompt(prompt: string): BlankPrompt {
  const parts = prompt.split(/_{2,}/);
  const blankCount = Math.max(0, parts.length - 1);
  return { parts, blankCount, inline: blankCount > 0 };
}

/**
 * The server grades one normalized text answer, so multiple blanks are joined
 * with single spaces. Any empty blank makes the whole answer incomplete.
 */
export function joinBlankAnswers(values: string[]): string | null {
  const trimmed = values.map((value) => value.trim());
  if (trimmed.length === 0 || trimmed.some((value) => value.length === 0)) {
    return null;
  }
  return trimmed.join(' ');
}
