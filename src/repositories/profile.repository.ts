import { requireSupabase } from '../services/supabase/client';
import type { AppRole, ProfileRow, UserSettingsRow } from '../types/database';

export interface ProfileUpdate {
  username?: string;
  display_name?: string;
  avatar_key?: string;
  avatar_url?: string | null;
  bio?: string;
}

export interface SettingsUpdate {
  locale?: 'id' | 'en';
  timezone?: string;
  daily_goal_minutes?: number;
  music_volume?: number;
  sfx_volume?: number;
  voice_volume?: number;
  reduced_motion?: boolean;
  email_opt_in?: boolean;
  profile_visibility?: 'public' | 'friends' | 'private';
  following_privacy?: 'public' | 'private';
}

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan database gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

export const profileRepository = {
  async fetchProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) raise(error);
    return data;
  },

  async fetchSettings(userId: string): Promise<UserSettingsRow | null> {
    const { data, error } = await requireSupabase()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) raise(error);
    return data;
  },

  async fetchRole(userId: string): Promise<AppRole> {
    const { data, error } = await requireSupabase()
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) raise(error);
    return data?.role ?? 'player';
  },

  async updateProfile(userId: string, patch: ProfileUpdate): Promise<ProfileRow> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) raise(error);
    return data;
  },

  async updateSettings(userId: string, patch: SettingsUpdate): Promise<UserSettingsRow> {
    const { data, error } = await requireSupabase()
      .from('user_settings')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) raise(error);
    return data;
  },

  /**
   * One fixed object per player (`avatars/<uid>/avatar`) with upsert, so old
   * photos are replaced instead of leaving orphaned files behind. The URL is
   * cache-busted after every upload because the path never changes.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = requireSupabase();
    const bucket = supabase.storage.from('avatars');
    const path = `${userId}/avatar`;
    const { error } = await bucket.upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });
    if (error) raise(error);

    const { data } = bucket.getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },

  async isUsernameTaken(username: string, exceptUserId: string): Promise<boolean> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', exceptUserId)
      .maybeSingle();
    if (error) raise(error);
    return data !== null;
  },

  async completeOnboarding(input: {
    username: string;
    displayName: string;
    avatarKey: string;
    dailyGoal: number;
    timezone: string;
  }): Promise<ProfileRow> {
    const { data, error } = await requireSupabase().rpc('complete_onboarding', {
      p_username: input.username,
      p_display_name: input.displayName,
      p_avatar_key: input.avatarKey,
      p_daily_goal: input.dailyGoal,
      p_timezone: input.timezone,
    });
    if (error) raise(error);
    return data as ProfileRow;
  },
};
