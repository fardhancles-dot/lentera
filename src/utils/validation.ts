export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letters, digits, spaces, and common username symbols. Emoji and other
// pictographic characters are not part of the allowlist.
const USERNAME_PATTERN = /^[A-Za-z0-9 @_.!$%&+-]{3,20}$/;

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

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface TimezoneGroup {
  country: string;
  zones: TimezoneOption[];
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    country: 'INDONESIA',
    zones: [
      { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
      { value: 'Asia/Pontianak', label: 'Asia/Pontianak (WIB)' },
      { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
      { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
    ],
  },
  { country: 'AFGHANISTAN', zones: [{ value: 'Asia/Kabul', label: 'Asia/Kabul (Afghanistan)' }] },
  { country: 'ARAB SAUDI', zones: [{ value: 'Asia/Riyadh', label: 'Asia/Riyadh (Arab Saudi)' }] },
  { country: 'ARMENIA', zones: [{ value: 'Asia/Yerevan', label: 'Asia/Yerevan (Armenia)' }] },
  { country: 'AZERBAIJAN', zones: [{ value: 'Asia/Baku', label: 'Asia/Baku (Azerbaijan)' }] },
  { country: 'BAHRAIN', zones: [{ value: 'Asia/Bahrain', label: 'Asia/Bahrain (Bahrain)' }] },
  { country: 'BANGLADESH', zones: [{ value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh)' }] },
  { country: 'BHUTAN', zones: [{ value: 'Asia/Thimphu', label: 'Asia/Thimphu (Bhutan)' }] },
  { country: 'BRUNEI DARUSSALAM', zones: [{ value: 'Asia/Brunei', label: 'Asia/Brunei (Brunei Darussalam)' }] },
  {
    country: 'CHINA',
    zones: [
      { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China)' },
      { value: 'Asia/Urumqi', label: 'Asia/Urumqi (China)' },
    ],
  },
  { country: 'FILIPINA', zones: [{ value: 'Asia/Manila', label: 'Asia/Manila (Filipina)' }] },
  { country: 'GEORGIA', zones: [{ value: 'Asia/Tbilisi', label: 'Asia/Tbilisi (Georgia)' }] },
  { country: 'HONG KONG', zones: [{ value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (Hong Kong)' }] },
  { country: 'INDIA', zones: [{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (India)' }] },
  { country: 'IRAK', zones: [{ value: 'Asia/Baghdad', label: 'Asia/Baghdad (Irak)' }] },
  { country: 'IRAN', zones: [{ value: 'Asia/Tehran', label: 'Asia/Tehran (Iran)' }] },
  { country: 'ISRAEL', zones: [{ value: 'Asia/Jerusalem', label: 'Asia/Jerusalem (Israel)' }] },
  { country: 'JEPANG', zones: [{ value: 'Asia/Tokyo', label: 'Asia/Tokyo (Jepang)' }] },
  { country: 'KAMBOJA', zones: [{ value: 'Asia/Phnom_Penh', label: 'Asia/Phnom_Penh (Kamboja)' }] },
  {
    country: 'KAZAKHSTAN',
    zones: [
      { value: 'Asia/Almaty', label: 'Asia/Almaty (Kazakhstan)' },
      { value: 'Asia/Aqtobe', label: 'Asia/Aqtobe (Kazakhstan)' },
      { value: 'Asia/Atyrau', label: 'Asia/Atyrau (Kazakhstan)' },
      { value: 'Asia/Oral', label: 'Asia/Oral (Kazakhstan)' },
      { value: 'Asia/Qostanay', label: 'Asia/Qostanay (Kazakhstan)' },
      { value: 'Asia/Qyzylorda', label: 'Asia/Qyzylorda (Kazakhstan)' },
    ],
  },
  { country: 'KIRGIZSTAN', zones: [{ value: 'Asia/Bishkek', label: 'Asia/Bishkek (Kirgizstan)' }] },
  { country: 'KOREA SELATAN', zones: [{ value: 'Asia/Seoul', label: 'Asia/Seoul (Korea Selatan)' }] },
  { country: 'KOREA UTARA', zones: [{ value: 'Asia/Pyongyang', label: 'Asia/Pyongyang (Korea Utara)' }] },
  { country: 'KUWAIT', zones: [{ value: 'Asia/Kuwait', label: 'Asia/Kuwait (Kuwait)' }] },
  { country: 'LAOS', zones: [{ value: 'Asia/Vientiane', label: 'Asia/Vientiane (Laos)' }] },
  { country: 'LEBANON', zones: [{ value: 'Asia/Beirut', label: 'Asia/Beirut (Lebanon)' }] },
  { country: 'MAKAU', zones: [{ value: 'Asia/Macau', label: 'Asia/Macau (Makau)' }] },
  {
    country: 'MALAYSIA',
    zones: [
      { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (Malaysia)' },
      { value: 'Asia/Kuching', label: 'Asia/Kuching (Malaysia)' },
    ],
  },
  { country: 'MALADEWA', zones: [{ value: 'Indian/Maldives', label: 'Indian/Maldives (Maladewa)' }] },
  {
    country: 'MONGOLIA',
    zones: [
      { value: 'Asia/Ulaanbaatar', label: 'Asia/Ulaanbaatar (Mongolia)' },
      { value: 'Asia/Hovd', label: 'Asia/Hovd (Mongolia)' },
      { value: 'Asia/Choibalsan', label: 'Asia/Choibalsan (Mongolia)' },
    ],
  },
  { country: 'MYANMAR', zones: [{ value: 'Asia/Yangon', label: 'Asia/Yangon (Myanmar)' }] },
  { country: 'NEPAL', zones: [{ value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (Nepal)' }] },
  { country: 'OMAN', zones: [{ value: 'Asia/Muscat', label: 'Asia/Muscat (Oman)' }] },
  { country: 'PAKISTAN', zones: [{ value: 'Asia/Karachi', label: 'Asia/Karachi (Pakistan)' }] },
  {
    country: 'PALESTINA',
    zones: [
      { value: 'Asia/Gaza', label: 'Asia/Gaza (Palestina)' },
      { value: 'Asia/Hebron', label: 'Asia/Hebron (Palestina)' },
    ],
  },
  { country: 'QATAR', zones: [{ value: 'Asia/Qatar', label: 'Asia/Qatar (Qatar)' }] },
  {
    country: 'SIPRUS',
    zones: [
      { value: 'Asia/Nicosia', label: 'Asia/Nicosia (Siprus)' },
      { value: 'Asia/Famagusta', label: 'Asia/Famagusta (Siprus)' },
    ],
  },
  { country: 'SINGAPURA', zones: [{ value: 'Asia/Singapore', label: 'Asia/Singapore (Singapura)' }] },
  { country: 'SRI LANKA', zones: [{ value: 'Asia/Colombo', label: 'Asia/Colombo (Sri Lanka)' }] },
  { country: 'SURIAH', zones: [{ value: 'Asia/Damascus', label: 'Asia/Damascus (Suriah)' }] },
  { country: 'TAIWAN', zones: [{ value: 'Asia/Taipei', label: 'Asia/Taipei (Taiwan)' }] },
  { country: 'TAJIKISTAN', zones: [{ value: 'Asia/Dushanbe', label: 'Asia/Dushanbe (Tajikistan)' }] },
  { country: 'THAILAND', zones: [{ value: 'Asia/Bangkok', label: 'Asia/Bangkok (Thailand)' }] },
  { country: 'TIMOR LESTE', zones: [{ value: 'Asia/Dili', label: 'Asia/Dili (Timor Leste)' }] },
  { country: 'TURKI', zones: [{ value: 'Europe/Istanbul', label: 'Europe/Istanbul (Turki)' }] },
  { country: 'TURKMENISTAN', zones: [{ value: 'Asia/Ashgabat', label: 'Asia/Ashgabat (Turkmenistan)' }] },
  { country: 'UNI EMIRAT ARAB', zones: [{ value: 'Asia/Dubai', label: 'Asia/Dubai (Uni Emirat Arab)' }] },
  {
    country: 'UZBEKISTAN',
    zones: [
      { value: 'Asia/Tashkent', label: 'Asia/Tashkent (Uzbekistan)' },
      { value: 'Asia/Samarkand', label: 'Asia/Samarkand (Uzbekistan)' },
    ],
  },
  { country: 'VIETNAM', zones: [{ value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (Vietnam)' }] },
  { country: 'YAMAN', zones: [{ value: 'Asia/Aden', label: 'Asia/Aden (Yaman)' }] },
  { country: 'YORDANIA', zones: [{ value: 'Asia/Amman', label: 'Asia/Amman (Yordania)' }] },
];

export const TIMEZONE_OPTIONS: TimezoneOption[] = TIMEZONE_GROUPS.flatMap(
  (group) => group.zones,
);

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

export const MIN_PASSWORD_LENGTH = 6;

export function validatePassword(raw: string): ValidationResult<string> {
  if (!raw) return { ok: false, message: 'Password wajib diisi.' };
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.` };
  }
  // 72 bytes is the bcrypt limit Supabase Auth uses; longer values are truncated.
  if (raw.length > 72) return { ok: false, message: 'Password maksimal 72 karakter.' };
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

export const OTP_CODE_LENGTH = 6;

export function validateOtpCode(raw: string): ValidationResult<string> {
  const value = raw.trim();
  if (!value) return { ok: false, message: 'Kode verifikasi wajib diisi.' };
  if (!new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`).test(value)) {
    return { ok: false, message: `Kode verifikasi terdiri dari ${OTP_CODE_LENGTH} angka.` };
  }
  return { ok: true, value };
}

export function validateUsername(raw: string): ValidationResult<string> {
  const value = raw.trim();
  if (!value) return { ok: false, message: 'Username wajib diisi.' };
  if (value.length < 3) return { ok: false, message: 'Username minimal 3 karakter.' };
  if (value.length > 20) return { ok: false, message: 'Username maksimal 20 karakter.' };
  if (!USERNAME_PATTERN.test(value)) {
    return {
      ok: false,
      message: 'Gunakan huruf, angka, spasi, atau simbol @ _ . ! $ % & + -',
    };
  }
  if (RESERVED_USERNAMES.has(value.toLowerCase())) {
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
