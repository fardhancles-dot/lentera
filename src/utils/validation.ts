export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'developer',
  'lentera',
  'kiko',
  'support',
  'system',
  'moderator',
  'official',
  'staff',
  'root',
]);

export const DAILY_GOAL_OPTIONS = [
  { minutes: 5, title: 'Santai', description: '5 menit per hari' },
  { minutes: 10, title: 'Rutin', description: '10 menit per hari' },
  { minutes: 15, title: 'Serius', description: '15 menit per hari' },
  { minutes: 20, title: 'Intens', description: '20 menit per hari' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB — Asia/Jakarta' },
  { value: 'Asia/Makassar', label: 'WITA — Asia/Makassar' },
  { value: 'Asia/Jayapura', label: 'WIT — Asia/Jayapura' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore' },
  { value: 'UTC', label: 'UTC' },
] as const;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateEmail(raw: string): ValidationResult<string> {
  const value = normalizeEmail(raw);
  if (!value) return { ok: false, message: 'Email wajib diisi.' };
  if (value.length > 254) return { ok: false, message: 'Email terlalu panjang.' };
  if (!EMAIL_PATTERN.test(value)) {
    return { ok: false, message: 'Format email belum benar. Contoh: nama@email.com' };
  }
  return { ok: true, value };
}

export function validatePassword(raw: string): ValidationResult<string> {
  if (!raw) return { ok: false, message: 'Password wajib diisi.' };
  if (raw.length < 8) return { ok: false, message: 'Password minimal 8 karakter.' };
  if (raw.length > 72) return { ok: false, message: 'Password maksimal 72 karakter.' };
  if (!/[a-zA-Z]/.test(raw) || !/\d/.test(raw)) {
    return { ok: false, message: 'Gunakan minimal satu huruf dan satu angka.' };
  }
  return { ok: true, value: raw };
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationResult<string> {
  if (password !== confirmation) {
    return { ok: false, message: 'Konfirmasi password belum sama.' };
  }
  return { ok: true, value: confirmation };
}

/** 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  return 3;
}

export function validateUsername(raw: string): ValidationResult<string> {
  const value = raw.trim().toLowerCase();
  if (!value) return { ok: false, message: 'Username wajib diisi.' };
  if (value.length < 3) return { ok: false, message: 'Username minimal 3 karakter.' };
  if (value.length > 20) return { ok: false, message: 'Username maksimal 20 karakter.' };
  if (!USERNAME_PATTERN.test(value)) {
    return {
      ok: false,
      message: 'Gunakan huruf kecil, angka, atau garis bawah. Awali dengan huruf.',
    };
  }
  if (RESERVED_USERNAMES.has(value)) {
    return { ok: false, message: 'Username ini dipakai untuk sistem. Pilih yang lain.' };
  }
  return { ok: true, value };
}

export function validateDisplayName(raw: string): ValidationResult<string> {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (!value) return { ok: false, message: 'Nama tampilan wajib diisi.' };
  if (value.length > 40) return { ok: false, message: 'Nama tampilan maksimal 40 karakter.' };
  return { ok: true, value };
}

export function validateBio(raw: string): ValidationResult<string> {
  const value = raw.trim();
  if (value.length > 280) return { ok: false, message: 'Bio maksimal 280 karakter.' };
  return { ok: true, value };
}

export function validateDailyGoal(value: number): ValidationResult<number> {
  const allowed = DAILY_GOAL_OPTIONS.map((option) => option.minutes) as readonly number[];
  if (!allowed.includes(value)) {
    return { ok: false, message: 'Target harian tidak dikenali.' };
  }
  return { ok: true, value };
}

export function validateTimezone(value: string): ValidationResult<string> {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return { ok: true, value };
  } catch {
    return { ok: false, message: 'Zona waktu tidak dikenali.' };
  }
}

export function validateVolume(value: number): ValidationResult<number> {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    return { ok: false, message: 'Volume harus 0–100.' };
  }
  return { ok: true, value };
}

/** Builds a safe default username from an email address. */
export function suggestUsername(email: string): string {
  const local = normalizeEmail(email).split('@')[0] ?? '';
  let candidate = local.replace(/[^a-z0-9_]/g, '').slice(0, 18);
  if (!/^[a-z]/.test(candidate)) candidate = `p${candidate}`;
  if (candidate.length < 3) candidate = `player${candidate}`;
  return candidate.slice(0, 20);
}
