import { masteryRepository } from '../repositories/mastery.repository';
import type { Json } from '../types/database';
import type {
  CourseMastery,
  MasteryBoard,
  MasterySummary,
} from '../types/mastery';
const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  course_not_found: 'Mata pelajaran tidak ditemukan atau tidak aktif.',
  practice_no_due_reviews:
    'Belum ada soal yang jatuh tempo. Selesaikan lesson atau latihan dulu agar jadwal review terbentuk.',
  practice_not_enough_questions:
    'Soal review belum cukup untuk memulai sesi di mata pelajaran ini.',
};

export interface ScheduledReviewStart {
  sessionId: string;
  courseId: string;
  timeLimitSeconds: number;
  questionCount: number;
  maxScore: number;
  raw: Json;
}

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Data penguasaan gagal dimuat.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key]! : raw);
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

function asCount(value: unknown): number {
  return Math.max(0, Math.round(asNumber(value)));
}

function asPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Math.round(asNumber(value))));
}

function parseSummary(value: unknown): MasterySummary {
  const record = asRecord(value);
  return {
    totalQuestions: asCount(record.totalQuestions),
    tracked: asCount(record.tracked),
    mastered: asCount(record.mastered),
    due: asCount(record.due),
    accuracy: asPercent(record.accuracy),
  };
}

function parseCourse(value: unknown): CourseMastery | null {
  const record = asRecord(value);
  const courseId = asString(record.courseId);
  const subjectSlug = asString(record.subjectSlug);

  if (!courseId || !subjectSlug) return null;

  return {
    courseId,
    subjectSlug,
    subjectName: asString(record.subjectName, subjectSlug),
    totalQuestions: asCount(record.totalQuestions),
    tracked: asCount(record.tracked),
    mastered: asCount(record.mastered),
    due: asCount(record.due),
    accuracy: asPercent(record.accuracy),
    masteryPercent: asPercent(record.masteryPercent),
  };
}

export function parseMasteryBoard(value: unknown): MasteryBoard {
  const record = asRecord(value);
  const courses = Array.isArray(record.courses)
    ? record.courses.map(parseCourse).filter((course): course is CourseMastery => Boolean(course))
    : [];

  return {
    summary: parseSummary(record.summary),
    courses,
  };
}

export const masteryService = {
  async load(): Promise<MasteryBoard> {
    try {
      return parseMasteryBoard(await masteryRepository.fetchSummary());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async startScheduledReview(courseId: string): Promise<ScheduledReviewStart> {
    try {
      const payload = await masteryRepository.startScheduledReview(courseId);
      const record = asRecord(payload);
      const sessionId = asString(record.sessionId);
      if (!sessionId) {
        throw new Error('Review tidak mengembalikan sesi yang valid.');
      }
      return {
        sessionId,
        courseId: asString(record.courseId, courseId),
        timeLimitSeconds: asCount(record.timeLimitSeconds),
        questionCount: asCount(record.questionCount),
        maxScore: asCount(record.maxScore),
        raw: payload,
      };
    } catch (error) {
      throw messageFor(error);
    }
  },
};
