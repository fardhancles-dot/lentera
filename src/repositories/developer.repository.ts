import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Aksi developer gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * Semua aksi dashboard lewat RPC security definer. Browser tidak pernah
 * menulis audit log, saldo, atau hadiah secara langsung.
 */
export const developerRepository = {
  async getOverview(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_developer_overview');
    if (error) raise(error);
    return data;
  },

  async getUsers(query: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_developer_users', {
      p_query: query,
    });
    if (error) raise(error);
    return data;
  },

  async getAuditLogs(limit = 30): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_audit_logs', {
      p_limit: limit,
    });
    if (error) raise(error);
    return data;
  },

  async grantReward(
    userId: string,
    coins: number,
    xp: number,
    reason: string,
  ): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('grant_reward', {
      p_user_id: userId,
      p_coins: coins,
      p_xp: xp,
      p_reason: reason,
    });
    if (error) raise(error);
    return data;
  },

  async broadcastNotification(title: string, body: string, link: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('broadcast_notification', {
      p_title: title,
      p_body: body,
      p_link: link,
    });
    if (error) raise(error);
    return data;
  },
};
