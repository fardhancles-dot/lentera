import type { AuthError } from '@supabase/supabase-js';

const CODE_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email atau password salah. Periksa kembali lalu coba lagi.',
  email_not_confirmed:
    'Email belum diverifikasi. Buka tautan verifikasi di kotak masuk, lalu masuk kembali.',
  user_already_exists: 'Email ini sudah terdaftar. Coba masuk atau atur ulang password.',
  email_exists: 'Email ini sudah terdaftar. Coba masuk atau atur ulang password.',
  weak_password: 'Password terlalu lemah. Gunakan minimal 6 karakter.',
  same_password: 'Password baru harus berbeda dari password sebelumnya.',
  over_email_send_rate_limit:
    'Terlalu banyak email dikirim. Tunggu beberapa menit sebelum mencoba lagi.',
  over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  email_provider_disabled: 'Pendaftaran dengan email sedang dinonaktifkan pada project ini.',
  signup_disabled: 'Pendaftaran akun baru sedang dinonaktifkan.',
  otp_expired: 'Kode sudah kedaluwarsa. Minta kode baru.',
  flow_state_not_found: 'Tautan tidak valid atau sudah dipakai. Minta tautan baru.',
  session_not_found: 'Sesi tidak ditemukan. Silakan masuk kembali.',
  validation_failed: 'Data yang dikirim belum valid. Periksa kembali isian Anda.',
};

export function mapAuthError(error: AuthError | null | undefined): string {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';

  const message = error.message ?? '';
  const code = (error as AuthError & { code?: string }).code ?? '';

  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code]!;

  if (/invalid login credentials/i.test(message)) {
    return CODE_MESSAGES['invalid_credentials']!;
  }
  if (/email not confirmed/i.test(message)) {
    return CODE_MESSAGES['email_not_confirmed']!;
  }
  if (/user already registered|already been registered/i.test(message)) {
    return CODE_MESSAGES['user_already_exists']!;
  }
  if (/password should be at least|password is too short/i.test(message)) {
    return 'Password minimal 6 karakter.';
  }
  if (/token has expired or is invalid|invalid.*(otp|token)/i.test(message)) {
    return 'Kode verifikasi salah atau sudah kedaluwarsa. Minta kode baru.';
  }
  if (/rate limit/i.test(message)) {
    return CODE_MESSAGES['over_request_rate_limit']!;
  }
  if (/for security purposes/i.test(message)) {
    return 'Demi keamanan, tunggu beberapa detik sebelum mencoba lagi.';
  }
  if (/failed to fetch|network/i.test(message)) {
    return 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.';
  }

  return 'Terjadi kesalahan pada layanan akun. Coba lagi beberapa saat.';
}
