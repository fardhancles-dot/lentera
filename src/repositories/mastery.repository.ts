import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Data penguasaan gagal dimuat.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export const masteryRepository = {
  async fetchSummary(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_mastery');
    if (error) raise(error);
    return data ?? {};
  },

  async startScheduledReview(courseId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('start_scheduled_review', {
      p_course_id: courseId,
    });
    if (error) raise(error);
    return data ?? {};
  },
};
