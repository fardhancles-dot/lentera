import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Data progres gagal dimuat.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export const playerRepository = {
  async fetchState(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_player_state');
    if (error) raise(error);
    return data ?? {};
  },

  async fetchWallet(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_wallet');
    if (error) raise(error);
    return data ?? {};
  },

  async refillHearts(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('refill_hearts');
    if (error) raise(error);
    return data ?? {};
  },
};
