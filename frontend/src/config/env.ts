const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const looksLikeUrl = /^https?:\/\/[^\s]+$/i.test(rawUrl);
const isTemplateValue =
  rawUrl.includes('your-project-ref') || rawKey === 'your-anon-public-key';

export const appEnv = {
  supabaseUrl: rawUrl,
  supabaseAnonKey: rawKey,
  /**
   * The app stays browsable without credentials, but every account action is
   * blocked and the UI explains that Supabase must be configured first.
   */
  isSupabaseConfigured: looksLikeUrl && rawKey.length >= 20 && !isTemplateValue,
} as const;
