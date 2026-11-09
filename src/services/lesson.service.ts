import { lessonRepository } from '../repositories/lesson.repository';
import type { DifficultyBand, Json, QuestionType } from '../types/database';

export interface LessonQuestionOption {
  id: string;
  label: string;
}

export interface LessonQuestionMedia {
  kind: 'image' | 'audio' | 'video';
  url: string;
  alt: string;
}

export interface LessonMatchItem {
  id: string;
  label: string;
}

export interface LessonSceneChoice {
  label: string;
  reply: string;
}

export interface LessonSceneScreen {
  speaker?: string;
  line: string;
  narration?: string;
  choices?: LessonSceneChoice[];
}

export interface LessonScene {
  lang?: string;
  speech?: string;
  npc?: { name: string; role?: string };
  screens: LessonSceneScreen[];
  /** NPC reaction per option, aligned with the option order. */
  responses: string[];
}

export interface LessonQuestion {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: DifficultyBand;
  instruction: string;
  prompt: string;
  hint: string | null;
  points: number;
  options: LessonQuestionOption[];
  leftItems: LessonMatchItem[];
  rightItems: LessonMatchItem[];
  media: LessonQuestionMedia[];
  scene: LessonScene;
}

export interface LessonStart {
  attemptId: string;
  lesson: {
    id: string;
    slug: string;
    title: string;
    description: string;
    kind: string;
    subjectSlug: string;
    xpReward: number;
    coinReward: number;
    heartsEnabled: boolean;
  };
  questions: LessonQuestion[];
}

export interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  explanation: string;
  correctAnswer: string;
  hint: string | null;
  answeredCount: number;
  totalCount: number;
  alreadyAnswered: boolean;
}

export interface LessonSummary {
  alreadyCompleted: boolean;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
  accuracy: number;
  durationSeconds: number;
  xpAwarded: number;
  coinsAwarded: number;
  totalXp: number;
  coinBalance: number;
  attempts?: number;
}

export type LessonAnswer =
  | { optionId: string }
  | { text: string }
  | { matches: Array<{ leftId: string; rightId: string }> };

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  lesson_not_found: 'Lesson tidak ditemukan atau sudah tidak dipublikasikan.',
  lesson_locked: 'Lesson ini masih terkunci. Selesaikan lesson sebelumnya dulu.',
  lesson_has_no_questions: 'Lesson ini belum memiliki soal yang dapat dimainkan.',
  node_not_playable: 'Node ini bukan lesson yang dapat dimainkan.',
  attempt_not_found: 'Sesi pengerjaan tidak ditemukan. Mulai ulang lesson.',
  attempt_not_active: 'Sesi ini sudah selesai. Mulai ulang lesson untuk bermain lagi.',
  attempt_abandoned: 'Sesi ini sudah dibatalkan. Mulai ulang lesson.',
  attempt_incomplete: 'Masih ada soal yang belum dijawab.',
  question_not_in_lesson: 'Soal tidak cocok dengan lesson ini.',
  hearts_empty: 'Hearts kamu habis. Isi Hearts di wallet atau tunggu pemulihan otomatis.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Lesson gagal dimuat.';
  const clean = raw.replace(/^.*?:\s*/, '').trim();
  const key = Object.keys(ERROR_MESSAGES).find(
    (candidate) => raw.includes(candidate) || clean === candidate,
  );
  return new Error(key ? ERROR_MESSAGES[key] : raw);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function parseMatchItems(value: unknown): LessonMatchItem[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          const record = asRecord(item);
          return { id: asString(record.id), label: asString(record.label) };
        })
        .filter((item) => Boolean(item.id) && Boolean(item.label))
    : [];
}

function parseScene(value: unknown): LessonScene {
  const record = asRecord(value);
  const npc = asRecord(record.npc);
  const screens = Array.isArray(record.screens)
    ? record.screens
        .map((item) => {
          const screen = asRecord(item);
          const choices = Array.isArray(screen.choices)
            ? screen.choices
                .map((choice) => {
                  const entry = asRecord(choice);
                  return {
                    label: asString(entry.label),
                    reply: asString(entry.reply),
                  };
                })
                .filter((choice) => Boolean(choice.label) && Boolean(choice.reply))
            : [];
          return {
            speaker: asString(screen.speaker) || undefined,
            line: asString(screen.line),
            narration: asString(screen.narration) || undefined,
            ...(choices.length > 0 ? { choices } : {}),
          };
        })
        .filter((screen) => Boolean(screen.line || screen.narration))
    : [];

  const responses = Array.isArray(record.responses)
    ? record.responses.map((item) => asString(item)).filter(Boolean)
    : [];

  return {
    ...(asString(record.lang) ? { lang: asString(record.lang) } : {}),
    ...(asString(record.speech) ? { speech: asString(record.speech) } : {}),
    ...(asString(npc.name)
      ? { npc: { name: asString(npc.name), role: asString(npc.role) || undefined } }
      : {}),
    screens,
    responses,
  };
}

/** Shared by the lesson and practice pages so both read the same payload. */
export function parseLessonQuestions(value: unknown): LessonQuestion[] {
  const questions = Array.isArray(value) ? value : [];

  return questions.map((item) => {
    const question = asRecord(item);
    return {
      id: asString(question.id),
      type: asString(question.type, 'multiple_choice') as QuestionType,
      topic: asString(question.topic),
      difficulty: asString(question.difficulty, 'beginner') as DifficultyBand,
      instruction: asString(question.instruction),
      prompt: asString(question.prompt),
      hint: typeof question.hint === 'string' ? question.hint : null,
      points: asNumber(question.points, 10),
      options: Array.isArray(question.options)
        ? question.options.map((option) => {
            const record = asRecord(option);
            return { id: asString(record.id), label: asString(record.label) };
          })
        : [],
      leftItems: parseMatchItems(question.leftItems),
      rightItems: parseMatchItems(question.rightItems),
      media: Array.isArray(question.media)
        ? question.media.map((media) => {
            const record = asRecord(media);
            return {
              kind: asString(record.kind, 'image') as LessonQuestionMedia['kind'],
              url: asString(record.url),
              alt: asString(record.alt),
            };
          })
        : [],
      scene: parseScene(question.scene),
    };
  });
}

function parseStart(payload: Json): LessonStart {
  const root = asRecord(payload);
  const lesson = asRecord(root.lesson);

  return {
    attemptId: asString(root.attemptId),
    lesson: {
      id: asString(lesson.id),
      slug: asString(lesson.slug),
      title: asString(lesson.title),
      description: asString(lesson.description),
      kind: asString(lesson.kind),
      subjectSlug: asString(lesson.subjectSlug),
      xpReward: asNumber(lesson.xpReward),
      coinReward: asNumber(lesson.coinReward),
      heartsEnabled: asBoolean(lesson.heartsEnabled),
    },
    questions: parseLessonQuestions(root.questions),
  };
}

function parseAnswer(payload: Json): AnswerResult {
  const root = asRecord(payload);
  return {
    questionId: asString(root.questionId),
    isCorrect: asBoolean(root.isCorrect),
    pointsAwarded: asNumber(root.pointsAwarded),
    explanation: asString(root.explanation),
    correctAnswer: asString(root.correctAnswer),
    hint: typeof root.hint === 'string' ? root.hint : null,
    answeredCount: asNumber(root.answeredCount),
    totalCount: asNumber(root.totalCount),
    alreadyAnswered: asBoolean(root.alreadyAnswered),
  };
}

function parseSummary(payload: Json): LessonSummary {
  const root = asRecord(payload);
  return {
    alreadyCompleted: asBoolean(root.alreadyCompleted),
    passed: asBoolean(root.passed),
    correctCount: asNumber(root.correctCount),
    totalCount: asNumber(root.totalCount),
    score: asNumber(root.score),
    maxScore: asNumber(root.maxScore),
    accuracy: asNumber(root.accuracy),
    durationSeconds: asNumber(root.durationSeconds),
    xpAwarded: asNumber(root.xpAwarded),
    coinsAwarded: asNumber(root.coinsAwarded),
    totalXp: asNumber(root.totalXp),
    coinBalance: asNumber(root.coinBalance),
    attempts: typeof root.attempts === 'number' ? root.attempts : undefined,
  };
}

export const lessonService = {
  async start(nodeId: string): Promise<LessonStart> {
    try {
      const start = parseStart(await lessonRepository.start(nodeId));
      if (!start.attemptId || start.questions.length === 0) {
        throw new Error('Lesson tidak mengembalikan soal yang valid.');
      }
      return start;
    } catch (error) {
      throw messageFor(error);
    }
  },

  async answer(
    attemptId: string,
    questionId: string,
    answer: LessonAnswer,
  ): Promise<AnswerResult> {
    try {
      return parseAnswer(
        await lessonRepository.answer(attemptId, questionId, answer as Json),
      );
    } catch (error) {
      throw messageFor(error);
    }
  },

  async complete(attemptId: string): Promise<LessonSummary> {
    try {
      return parseSummary(await lessonRepository.complete(attemptId));
    } catch (error) {
      throw messageFor(error);
    }
  },
};
