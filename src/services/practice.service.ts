import { practiceRepository } from '../repositories/practice.repository';
import type { Json } from '../types/database';
import type { IconName } from '../components/icons';
import {
  parseLessonQuestions,
  type LessonAnswer,
  type LessonQuestion,
} from './lesson.service';

export type PracticeMode =
  | 'match_madness'
  | 'ramp_up'
  | 'timed'
  | 'mistakes'
  | 'personalized'
  | 'unit_review'
  | 'legendary';

export interface PracticeModeInfo {
  mode: PracticeMode;
  title: string;
  description: string;
  icon: IconName;
  meta: string;
  needsUnit?: boolean;
}

export const PRACTICE_MODES: PracticeModeInfo[] = [
  {
    mode: 'match_madness',
    title: 'Match Madness',
    description:
      'Cocokkan dua kolom secepat mungkin. Satu hitung mundur 90 detik, combo menambah poin.',
    icon: 'gamepad',
    meta: '90 detik · poin kecepatan · combo',
  },
  {
    mode: 'ramp_up',
    title: 'Ramp Up',
    description:
      'Soal naik tingkat kesulitannya setiap kali kamu benar. Setiap soal punya batas 20 detik.',
    icon: 'chart',
    meta: '10 soal · 20 detik per soal · tingkat bertambah',
  },
  {
    mode: 'timed',
    title: 'Timed Challenge',
    description:
      'Sepuluh soal acak dengan satu hitung mundur 120 detik. Waktu habis, sesi langsung dinilai.',
    icon: 'clock',
    meta: '120 detik total · bonus kecepatan',
  },
  {
    mode: 'mistakes',
    title: 'Mistakes Review',
    description: 'Ulangi soal yang pernah kamu jawab salah, dari lesson maupun latihan.',
    icon: 'refresh',
    meta: 'Dari riwayat jawabanmu',
  },
  {
    mode: 'personalized',
    title: 'Personalized Practice',
    description: 'Latihan dari topik yang paling sering salah; jika belum ada, dari soal yang belum dicoba.',
    icon: 'target',
    meta: 'Berdasarkan performa',
  },
  {
    mode: 'unit_review',
    title: 'Unit Review',
    description: 'Campuran soal satu unit untuk memeriksa penguasaan sebelum lanjut.',
    icon: 'book',
    meta: 'Pilih unit · maksimal 12 soal',
    needsUnit: true,
  },
  {
    mode: 'legendary',
    title: 'Legendary Challenge',
    description: 'Soal tersulit dari lesson legendary dengan XP lebih besar.',
    icon: 'trophy',
    meta: 'Soal sulit · XP hingga 30',
  },
];

export interface PracticeStart {
  sessionId: string;
  mode: PracticeMode;
  courseId: string;
  timeLimitSeconds: number;
  questionCount: number;
  maxScore: number;
  questions: LessonQuestion[];
}

export interface PracticeAnswerResult {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  combo: number;
  explanation: string;
  correctAnswer: string;
  answeredCount: number;
  totalCount: number;
  alreadyAnswered: boolean;
}

export interface PracticeSummary {
  alreadyCompleted: boolean;
  sessionId: string;
  mode: PracticeMode;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  answeredCount: number;
  score: number;
  maxScore: number;
  accuracy: number;
  bestCombo: number;
  durationSeconds: number;
  xpAwarded: number;
  totalXp: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  course_not_found: 'Mata pelajaran tidak ditemukan atau tidak aktif.',
  practice_unit_required: 'Unit Review membutuhkan unit yang dipilih.',
  practice_unit_not_found: 'Unit tidak ditemukan pada mata pelajaran ini.',
  practice_not_found: 'Sesi latihan tidak ditemukan. Mulai latihan baru.',
  practice_not_active: 'Sesi latihan ini sudah selesai.',
  practice_no_mistakes:
    'Belum ada jawaban salah yang tercatat di mata pelajaran ini. Kerjakan lesson dulu, lalu kembali.',
  practice_not_enough_questions:
    'Soal untuk mode ini belum cukup di mata pelajaran tersebut. Pilih mata pelajaran lain.',
  practice_incomplete: 'Belum ada jawaban pada sesi ini, jadi belum bisa dinilai.',
  question_not_in_practice: 'Soal tidak cocok dengan sesi latihan ini.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Latihan gagal dimuat.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key]! : raw);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function parseStart(payload: Json, mode: PracticeMode): PracticeStart {
  const root = asRecord(payload);
  const start: PracticeStart = {
    sessionId: asString(root.sessionId),
    mode: (asString(root.mode) || mode) as PracticeMode,
    courseId: asString(root.courseId),
    timeLimitSeconds: asNumber(root.timeLimitSeconds),
    questionCount: asNumber(root.questionCount),
    maxScore: asNumber(root.maxScore),
    questions: parseLessonQuestions(root.questions),
  };

  if (!start.sessionId || start.questions.length === 0) {
    throw new Error('Latihan tidak mengembalikan soal yang valid.');
  }

  return start;
}

function parseAnswer(payload: Json): PracticeAnswerResult {
  const root = asRecord(payload);
  return {
    questionId: asString(root.questionId),
    isCorrect: asBoolean(root.isCorrect),
    pointsAwarded: asNumber(root.pointsAwarded),
    combo: Math.max(1, asNumber(root.combo, 1)),
    explanation: asString(root.explanation),
    correctAnswer: asString(root.correctAnswer),
    answeredCount: asNumber(root.answeredCount),
    totalCount: asNumber(root.totalCount),
    alreadyAnswered: asBoolean(root.alreadyAnswered),
  };
}

function parseSummary(payload: Json): PracticeSummary {
  const root = asRecord(payload);
  return {
    alreadyCompleted: asBoolean(root.alreadyCompleted),
    sessionId: asString(root.sessionId),
    mode: (asString(root.mode) || 'timed') as PracticeMode,
    passed: asBoolean(root.passed),
    correctCount: asNumber(root.correctCount),
    totalCount: asNumber(root.totalCount),
    answeredCount: asNumber(root.answeredCount, asNumber(root.totalCount)),
    score: asNumber(root.score),
    maxScore: asNumber(root.maxScore),
    accuracy: asNumber(root.accuracy),
    bestCombo: asNumber(root.bestCombo),
    durationSeconds: asNumber(root.durationSeconds),
    xpAwarded: asNumber(root.xpAwarded),
    totalXp: asNumber(root.totalXp),
  };
}

export const practiceService = {
  modeInfo(mode: string): PracticeModeInfo | null {
    return PRACTICE_MODES.find((item) => item.mode === mode) ?? null;
  },

  async start(mode: PracticeMode, courseId: string, unitId?: string | null): Promise<PracticeStart> {
    try {
      return parseStart(await practiceRepository.start(mode, courseId, unitId), mode);
    } catch (error) {
      throw messageFor(error);
    }
  },

  async answer(
    sessionId: string,
    questionId: string,
    answer: LessonAnswer,
    elapsedMs: number,
  ): Promise<PracticeAnswerResult> {
    try {
      return parseAnswer(
        await practiceRepository.answer(sessionId, questionId, answer as Json, elapsedMs),
      );
    } catch (error) {
      throw messageFor(error);
    }
  },

  async complete(sessionId: string): Promise<PracticeSummary> {
    try {
      return parseSummary(await practiceRepository.complete(sessionId));
    } catch (error) {
      throw messageFor(error);
    }
  },
};
