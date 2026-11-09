import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Data hadiah gagal dimuat.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export const rewardsRepository = {
  async fetchQuests(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_quests');
    if (error) raise(error);
    return data ?? {};
  },

  async claimQuest(questId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('claim_quest_reward', {
      p_quest_id: questId,
    });
    if (error) raise(error);
    return data ?? {};
  },

  async fetchAchievements(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_achievements');
    if (error) raise(error);
    return data ?? {};
  },

  async fetchShop(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_shop_catalog');
    if (error) raise(error);
    return data ?? {};
  },

  async purchaseItem(itemId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('purchase_shop_item', {
      p_item_id: itemId,
    });
    if (error) raise(error);
    return data ?? {};
  },

  async fetchInventory(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_inventory');
    if (error) raise(error);
    return data ?? {};
  },

  async useItem(itemId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('use_inventory_item', {
      p_item_id: itemId,
    });
    if (error) raise(error);
    return data ?? {};
  },
};
