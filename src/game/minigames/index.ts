import type { LessonQuestion } from '../../services/lesson.service';
import type { QuestionType } from '../../types/database';
import { createFillBlank } from './fillBlank';
import { createMatchingPairs } from './matchingPairs';
import { createMultipleChoice } from './multipleChoice';
import { createPictureIdentification } from './pictureIdentification';
import { createSentenceBuilder } from './sentenceBuilder';
import { createTyping } from './typing';
import type { MiniGameRenderer, MiniGameView } from './types';
import { createUnsupported } from './unsupported';
import { createWordBank } from './wordBank';

const RENDERERS: Partial<Record<QuestionType, MiniGameRenderer>> = {
  multiple_choice: createMultipleChoice,
  picture_identification: createPictureIdentification,
  word_bank: createWordBank,
  sentence_builder: createSentenceBuilder,
  matching_pairs: createMatchingPairs,
  fill_blank: createFillBlank,
  typing: createTyping,
  translation: createTyping,
};

const fallback: MiniGameRenderer = () => createUnsupported();

export function isMiniGameSupported(type: QuestionType): boolean {
  return Boolean(RENDERERS[type]);
}

export function createMiniGame(
  question: LessonQuestion,
  onChange: (ready: boolean) => void,
): MiniGameView {
  const renderer = RENDERERS[question.type] ?? fallback;
  return renderer({ question, onChange });
}
