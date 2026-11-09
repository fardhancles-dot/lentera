import { describe, expect, it } from 'vitest';
import type { AuthError } from '@supabase/supabase-js';
import { mapAuthError } from '../src/services/authErrors';

function authError(message: string, code = ''): AuthError {
  return { name: 'AuthApiError', message, status: 400, code } as unknown as AuthError;
}

describe('mapAuthError', () => {
  it('maps invalid credentials', () => {
    expect(mapAuthError(authError('Invalid login credentials', 'invalid_credentials'))).toContain(
      'Email atau password salah',
    );
  });

  it('maps unverified emails', () => {
    expect(mapAuthError(authError('Email not confirmed'))).toContain('belum diverifikasi');
  });

  it('maps duplicate registration', () => {
    expect(mapAuthError(authError('User already registered'))).toContain('sudah terdaftar');
  });

  it('maps expired recovery links', () => {
    expect(mapAuthError(authError('Token has expired', 'otp_expired'))).toContain('kedaluwarsa');
  });

  it('maps rate limits', () => {
    expect(mapAuthError(authError('Email rate limit exceeded'))).toContain('Tunggu');
  });

  it('never leaks unknown backend messages', () => {
    const message = mapAuthError(authError('unexpected internal detail'));
    expect(message).not.toContain('unexpected internal detail');
    expect(message).toContain('Terjadi kesalahan');
  });

  it('handles a missing error object', () => {
    expect(mapAuthError(null)).toContain('Terjadi kesalahan');
  });
});
