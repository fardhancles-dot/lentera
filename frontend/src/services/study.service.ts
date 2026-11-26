import { studyRepository } from '../repositories/study.repository';

export interface DailyGoalProgress {
  goalMinutes: number;
  targetSeconds: number;
  studiedSeconds: number;
  percent: number;
  sessionCount: number;
  remainingSeconds: number;
  date: string;
  timezone: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseDailyGoal(value: unknown): DailyGoalProgress {
  const record = asRecord(value);
  const goalMinutes = Math.max(1, asNumber(record.goalMinutes, 10));

  return {
    goalMinutes,
    targetSeconds: Math.max(1, asNumber(record.targetSeconds, goalMinutes * 60)),
    studiedSeconds: Math.max(0, asNumber(record.studiedSeconds)),
    percent: clamp(asNumber(record.percent), 0, 100),
    sessionCount: Math.max(0, asNumber(record.sessionCount)),
    remainingSeconds: Math.max(0, asNumber(record.remainingSeconds)),
    date: asString(record.date),
    timezone: asString(record.timezone, 'Asia/Jakarta'),
  };
}

export const studyService = {
  async loadDailyGoal(): Promise<DailyGoalProgress> {
    try {
      return parseDailyGoal(await studyRepository.fetchDailyGoal());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Data target harian gagal dimuat.';
      throw new Error(message);
    }
  },

  /**
   * Fire-and-forget heartbeat. The server measures elapsed time itself, so the
   * browser only tells it that the lesson screen is still active.
   */
  async ping(attemptId: string): Promise<void> {
    if (!attemptId) return;
    await studyRepository.ping(attemptId);
  },
};
