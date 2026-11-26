import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';
import type { PracticeMode } from '../services/practice.service';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan latihan gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * Practice sessions are created, graded, and rewarded by security-definer RPCs.
 * The client only sends answers and elapsed time; it never sends a score.
 */
export const practiceRepository = {
  async start(mode: PracticeMode, courseId: string, unitId?: string | null): Promise<Json> {
    const client = requireSupabase();
    const { data, error } =
      mode === 'scheduled_review'
        ? await client.rpc('start_scheduled_review', { p_course_id: courseId })
        : await client.rpc('start_practice', {
            p_mode: mode,
            p_course_id: courseId,
            p_unit_id: unitId ?? null,
          });
    if (error) raise(error);
    return data;
  },

  async answer(
    sessionId: string,
    questionId: string,
    answer: Json,
    elapsedMs: number,
  ): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('submit_practice_answer', {
      p_session_id: sessionId,
      p_question_id: questionId,
      p_answer: answer,
      p_elapsed_ms: Math.max(0, Math.round(elapsedMs)),
    });
    if (error) raise(error);
    return data;
  },

  async complete(sessionId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('complete_practice_session', {
      p_session_id: sessionId,
    });
    if (error) raise(error);
    return data;
  },
};
