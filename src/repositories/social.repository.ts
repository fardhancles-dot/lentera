import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan sosial gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export interface PlayerLevelThreshold {
  level: number;
  xpRequired: number;
}

/**
 * Semua state sosial dan liga ditulis RPC security definer. Browser tidak
 * pernah mengirim XP, peringkat, atau jumlah hadiah.
 */
export const socialRepository = {
  async searchPlayers(query: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('search_players', { p_query: query });
    if (error) raise(error);
    return data;
  },

  async sendFriendRequest(username: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('send_friend_request', {
      p_username: username,
    });
    if (error) raise(error);
    return data;
  },

  async respondFriendRequest(requestId: string, accept: boolean): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('respond_friend_request', {
      p_request_id: requestId,
      p_accept: accept,
    });
    if (error) raise(error);
    return data;
  },

  async removeFriend(userId: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('remove_friend', { p_user_id: userId });
    if (error) raise(error);
    return data;
  },

  async getFriends(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_friends');
    if (error) raise(error);
    return data;
  },

  async getFriendProfile(username: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_friend_profile', {
      p_username: username,
    });
    if (error) raise(error);
    return data;
  },

  /**
   * Level thresholds are public reference data. The profile RPC returns level
   * and total XP; this lets the browser derive the same progress bar the server
   * uses without adding gameplay state to the client.
   */
  async getLevelThresholds(): Promise<PlayerLevelThreshold[]> {
    const { data, error } = await requireSupabase()
      .from('player_levels')
      .select('level, xp_required')
      .order('level', { ascending: true });
    if (error) raise(error);

    return (data ?? [])
      .map((row) => ({
        level: Number(row.level),
        xpRequired: Number(row.xp_required),
      }))
      .filter((row) => Number.isFinite(row.level) && Number.isFinite(row.xpRequired));
  },

  async getFriendActivity(limit = 20): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_friend_activity', {
      p_limit: limit,
    });
    if (error) raise(error);
    return data;
  },

  async getLeaderboard(scope: 'global' | 'friends'): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_leaderboard', { p_scope: scope });
    if (error) raise(error);
    return data;
  },

  async getMyLeague(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_league');
    if (error) raise(error);
    return data;
  },

  async claimLeagueReward(weekStart: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('claim_league_reward', {
      p_week_start: weekStart,
    });
    if (error) raise(error);
    return data;
  },

  async getActiveEvent(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_active_event');
    if (error) raise(error);
    return data;
  },

  async claimEventReward(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('claim_event_reward');
    if (error) raise(error);
    return data;
  },

  async getNotifications(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_my_notifications');
    if (error) raise(error);
    return data;
  },

  async markNotificationsRead(id?: string): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('mark_notifications_read', {
      ...(id ? { p_id: id } : {}),
    });
    if (error) raise(error);
    return data;
  },
};
