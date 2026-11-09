import { requireSupabase } from '../services/supabase/client';
import type { AppRole, ProfileRow, UserSettingsRow } from '../types/database';

export interface ProfileUpdate {
  username?: string;
  display_name?: string;
  avatar_key?: string;
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
