import type { LessonAnswer, LessonQuestion } from '../../services/lesson.service';

export interface MiniGameProps {
  question: LessonQuestion;
  onChange: (ready: boolean) => void;
}

export interface MiniGameView {
  /** Replaces the default question prompt when the game renders it itself. */
  prompt?: HTMLElement;
  answer: HTMLElement;
  /** True when the game already renders `question.media`. */
  ownsMedia?: boolean;
  getAnswer: () => LessonAnswer | null;
  focus: () => void;
  setDisabled: (disabled: boolean) => void;
  markResult?: (isCorrect: boolean, correctAnswer: string) => void;
}

export type MiniGameRenderer = (props: MiniGameProps) => MiniGameView;
