import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Data target harian gagal dimuat.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export const studyRepository = {
  async fetchDailyGoal(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_daily_goal');
    if (error) raise(error);
    return data ?? {};
  },

  async ping(attemptId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('ping_study_session', {
      p_attempt_id: attemptId,
    });
    if (error) raise(error);
    return data ?? {};
  },
};
