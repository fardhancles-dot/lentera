import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan Friends Quest gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * Friend quests are created, joined, progressed, and claimed on the server.
 * The browser never sends contribution XP or a reward amount.
 */
export const friendsQuestRepository = {
  async list(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_friend_quests');
    if (error) raise(error);
    return data;
  },

  async create(
    title: string,
    targetXp: number,
    rewardXp: number,
    rewardCoins: number,
  ): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('create_friend_quest', {
      p_title: title,
      p_target_xp: targetXp,
      p_reward_xp: rewardXp,
      p_reward_coins: rewardCoins,
    });
    if (error) raise(error);
    return data;
  },

  async join(code: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('join_friend_quest', {
      p_code: code,
    });
    if (error) raise(error);
    return data;
  },

  async claim(questId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('claim_friend_quest_reward', {
      p_quest_id: questId,
    });
    if (error) raise(error);
    return data;
  },
};
