import { requireSupabase } from '../services/supabase/client';
import type {
  UserCourseProgressRow,
  UserNodeProgressRow,
  UserRewardClaimRow,
} from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan progres gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * Progress is read-only for players. Gameplay writes it through a server-side
 * RPC in a later stage, so this repository intentionally exposes no mutations.
 */
export const progressRepository = {
  async listCourseProgress(userId: string): Promise<UserCourseProgressRow[]> {
    const { data, error } = await requireSupabase()
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) raise(error);
    return data;
  },

  async listNodeProgress(userId: string): Promise<UserNodeProgressRow[]> {
    const { data, error } = await requireSupabase()
      .from('user_node_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) raise(error);
    return data;
  },

  async listRewardClaims(userId: string): Promise<UserRewardClaimRow[]> {
    const { data, error } = await requireSupabase()
      .from('user_reward_claims')
      .select('*')
      .eq('user_id', userId);
    if (error) raise(error);
    return data;
  },
};
