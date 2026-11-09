import { isAvatarKey } from '../config/avatars';
import { profileRepository, type SettingsUpdate } from '../repositories/profile.repository';
import type { SessionUser, ServiceResult } from '../types/auth';
import type { ProfileRow, UserSettingsRow } from '../types/database';
import {
  validateBio,
  validateDailyGoal,
  validateDisplayName,
  validateTimezone,
  validateUsername,
  validateVolume,
} from '../utils/validation';

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

export interface ProfileInput {
  username: string;
  displayName: string;
  avatarKey: string;
  bio: string;
}

export interface ProfileSettingsInput {
  locale: 'id' | 'en';
  timezone: string;
  dailyGoalMinutes: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  reducedMotion: boolean;
  emailOptIn: boolean;
}

export interface OnboardingInput {
  username: string;
  displayName: string;
  avatarKey: string;
  dailyGoalMinutes: number;
  timezone: string;
}

export const profileService = {
  async loadSessionUser(userId: string, email: string): Promise<SessionUser | null> {
    const [profile, settings, role] = await Promise.all([
      profileRepository.fetchProfile(userId),
      profileRepository.fetchSettings(userId),
      profileRepository.fetchRole(userId).catch(() => 'player' as const),
    ]);

    if (!profile || !settings) return null;

    return { id: userId, email, profile, settings, role };
  },

  async saveProfile(user: SessionUser, input: ProfileInput): Promise<ServiceResult<ProfileRow>> {
    const username = validateUsername(input.username);
    if (!username.ok) return { ok: false, message: username.message, field: 'username' };

    const displayName = validateDisplayName(input.displayName);
    if (!displayName.ok) {
      return { ok: false, message: displayName.message, field: 'displayName' };
    }

    const bio = validateBio(input.bio);
    if (!bio.ok) return { ok: false, message: bio.message };

    if (!isAvatarKey(input.avatarKey)) {
      return { ok: false, message: 'Avatar yang dipilih tidak dikenali.' };
    }

    try {
      if (await profileRepository.isUsernameTaken(username.value, user.id)) {
        return {
          ok: false,
          message: 'Username sudah dipakai pemain lain. Pilih yang lain.',
          field: 'username',
        };
      }

      const updated = await profileRepository.updateProfile(user.id, {
        username: username.value,
        display_name: displayName.value,
        avatar_key: input.avatarKey,
        bio: bio.value,
      });

      return { ok: true, data: updated };
    } catch (error) {
      console.error('[profile] save failed', error);
      if (hasCode(error, '23505')) {
        return {
          ok: false,
          message: 'Username sudah dipakai pemain lain. Pilih yang lain.',
          field: 'username',
        };
      }
      return { ok: false, message: 'Profil tidak dapat disimpan. Coba lagi.' };
    }
  },

  async saveSettings(
    userId: string,
    input: ProfileSettingsInput,
  ): Promise<ServiceResult<UserSettingsRow>> {
    const goal = validateDailyGoal(input.dailyGoalMinutes);
    if (!goal.ok) return { ok: false, message: goal.message };

    const timezone = validateTimezone(input.timezone);
    if (!timezone.ok) return { ok: false, message: timezone.message };

    const volumes = [input.musicVolume, input.sfxVolume, input.voiceVolume];
    for (const volume of volumes) {
      const checked = validateVolume(volume);
      if (!checked.ok) return { ok: false, message: checked.message };
    }

    if (input.locale !== 'id' && input.locale !== 'en') {
      return { ok: false, message: 'Bahasa tidak dikenali.' };
    }

    const patch: SettingsUpdate = {
      locale: input.locale,
      timezone: timezone.value,
      daily_goal_minutes: goal.value,
      music_volume: input.musicVolume,
      sfx_volume: input.sfxVolume,
      voice_volume: input.voiceVolume,
      reduced_motion: input.reducedMotion,
      email_opt_in: input.emailOptIn,
    };

    try {
      const updated = await profileRepository.updateSettings(userId, patch);
      return { ok: true, data: updated };
    } catch (error) {
      console.error('[settings] save failed', error);
      return { ok: false, message: 'Pengaturan tidak dapat disimpan. Coba lagi.' };
    }
  },

  async completeOnboarding(
    user: SessionUser,
    input: OnboardingInput,
  ): Promise<ServiceResult<ProfileRow>> {
    const username = validateUsername(input.username);
    if (!username.ok) return { ok: false, message: username.message, field: 'username' };

    const displayName = validateDisplayName(input.displayName);
    if (!displayName.ok) {
      return { ok: false, message: displayName.message, field: 'displayName' };
    }

    const goal = validateDailyGoal(input.dailyGoalMinutes);
    if (!goal.ok) return { ok: false, message: goal.message };

    const timezone = validateTimezone(input.timezone);
    if (!timezone.ok) return { ok: false, message: timezone.message };

    if (!isAvatarKey(input.avatarKey)) {
      return { ok: false, message: 'Avatar yang dipilih tidak dikenali.' };
    }

    try {
      if (await profileRepository.isUsernameTaken(username.value, user.id)) {
        return {
          ok: false,
          message: 'Username sudah dipakai pemain lain. Pilih yang lain.',
          field: 'username',
        };
      }

      const profile = await profileRepository.completeOnboarding({
        username: username.value,
        displayName: displayName.value,
        avatarKey: input.avatarKey,
        dailyGoal: goal.value,
        timezone: timezone.value,
      });

      return { ok: true, data: profile };
    } catch (error) {
      console.error('[onboarding] failed', error);
      if (hasCode(error, '23505')) {
        return {
          ok: false,
          message: 'Username sudah dipakai pemain lain. Pilih yang lain.',
          field: 'username',
        };
      }
      if (hasCode(error, '42501')) {
        return { ok: false, message: 'Sesi Anda tidak memiliki izin. Silakan masuk kembali.' };
      }
      return { ok: false, message: 'Penyimpanan profil gagal. Coba lagi.' };
    }
  },
};
