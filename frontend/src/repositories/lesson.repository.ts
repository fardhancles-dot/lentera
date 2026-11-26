import { requireSupabase } from '../services/supabase/client';
import type { Json, LessonAttemptRow } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan lesson gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * All writes go through security-definer RPCs. The browser never sends XP,
 * coins, or completion flags, and never receives answer keys.
 */
export const lessonRepository = {
  async start(nodeId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('start_lesson', {
      p_node_id: nodeId,
    });
    if (error) raise(error);
    return data;
  },

  async answer(attemptId: string, questionId: string, answer: Json): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('submit_attempt_answer', {
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_answer: answer,
    });
    if (error) raise(error);
    return data;
  },

  async complete(attemptId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('complete_lesson_attempt', {
      p_attempt_id: attemptId,
    });
    if (error) raise(error);
    return data;
  },

  /** RLS `lesson_attempts_select_own` limits this to the signed-in player. */
  async listAttempts(lessonId: string, limit = 5): Promise<LessonAttemptRow[]> {
    const { data, error } = await requireSupabase()
      .from('lesson_attempts')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) raise(error);
    return data;
  },
};
