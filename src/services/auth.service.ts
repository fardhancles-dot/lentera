import { authRepository } from '../repositories/auth.repository';
import type { ServiceResult } from '../types/auth';
import {
  normalizeEmail,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/validation';
import { mapAuthError } from './authErrors';

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<ServiceResult<{ needsEmailConfirmation: boolean }>> {
    const email = validateEmail(input.email);
    if (!email.ok) return { ok: false, message: email.message, field: 'email' };

    const displayName = validateDisplayName(input.displayName);
    if (!displayName.ok) {
      return { ok: false, message: displayName.message, field: 'displayName' };
    }

    const password = validatePassword(input.password);
    if (!password.ok) return { ok: false, message: password.message, field: 'password' };

    const confirmation = validatePasswordConfirmation(input.password, input.confirmPassword);
    if (!confirmation.ok) {
      return { ok: false, message: confirmation.message, field: 'password' };
    }

    try {
      const { data, error } = await authRepository.signUp(
        email.value,
        password.value,
        displayName.value,
      );

      if (error) {
        return { ok: false, message: mapAuthError(error), field: 'email' };
      }

      // With email confirmation enabled Supabase returns an empty identity list
      // for an address that is already registered.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          ok: false,
          message: 'Email ini sudah terdaftar. Coba masuk atau atur ulang password.',
          field: 'email',
        };
      }

      return { ok: true, data: { needsEmailConfirmation: !data.session } };
    } catch (error) {
      console.error('[auth] register failed', error);
      return { ok: false, message: 'Tidak dapat menghubungi server. Coba lagi.' };
    }
  },

  async login(email: string, password: string): Promise<ServiceResult<{ userId: string }>> {
    const validEmail = validateEmail(email);
    if (!validEmail.ok) return { ok: false, message: validEmail.message, field: 'email' };
    if (!password) return { ok: false, message: 'Password wajib diisi.', field: 'password' };

    try {
      const { data, error } = await authRepository.signIn(validEmail.value, password);
      if (error) return { ok: false, message: mapAuthError(error) };
      if (!data.user) return { ok: false, message: 'Sesi login tidak terbentuk. Coba lagi.' };
      return { ok: true, data: { userId: data.user.id } };
    } catch (error) {
      console.error('[auth] login failed', error);
      return { ok: false, message: 'Tidak dapat menghubungi server. Coba lagi.' };
    }
  },

  async logout(): Promise<ServiceResult<null>> {
    try {
      const { error } = await authRepository.signOut();
      if (error) return { ok: false, message: mapAuthError(error) };
      return { ok: true, data: null };
    } catch (error) {
      console.error('[auth] logout failed', error);
      return { ok: false, message: 'Tidak dapat keluar saat ini. Coba lagi.' };
    }
  },

  async requestPasswordReset(email: string): Promise<ServiceResult<null>> {
    const validEmail = validateEmail(email);
    if (!validEmail.ok) return { ok: false, message: validEmail.message, field: 'email' };

    try {
      const { error } = await authRepository.requestPasswordReset(validEmail.value);
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
          return { ok: false, message: mapAuthError(error) };
        }
        console.warn('[auth] reset request returned an error', error.message);
      }
      // Always report success so the form cannot be used to enumerate accounts.
      return { ok: true, data: null };
    } catch (error) {
      console.error('[auth] reset request failed', error);
      return { ok: false, message: 'Tidak dapat menghubungi server. Coba lagi.' };
    }
  },

  async updatePassword(password: string, confirmation: string): Promise<ServiceResult<null>> {
    const validPassword = validatePassword(password);
    if (!validPassword.ok) return { ok: false, message: validPassword.message, field: 'password' };

    const confirm = validatePasswordConfirmation(password, confirmation);
    if (!confirm.ok) return { ok: false, message: confirm.message, field: 'password' };

    try {
      const { error } = await authRepository.updatePassword(password);
      if (error) return { ok: false, message: mapAuthError(error) };
      return { ok: true, data: null };
    } catch (error) {
      console.error('[auth] update password failed', error);
      return { ok: false, message: 'Tidak dapat menyimpan password baru. Coba lagi.' };
    }
  },

  async resendConfirmation(email: string): Promise<ServiceResult<null>> {
    const validEmail = validateEmail(email);
    if (!validEmail.ok) return { ok: false, message: validEmail.message, field: 'email' };

    try {
      const { error } = await authRepository.resendConfirmation(normalizeEmail(email));
      if (error) return { ok: false, message: mapAuthError(error) };
      return { ok: true, data: null };
    } catch (error) {
      console.error('[auth] resend confirmation failed', error);
      return { ok: false, message: 'Tidak dapat mengirim ulang email verifikasi.' };
    }
  },
};
