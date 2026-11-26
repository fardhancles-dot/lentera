import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appEnv } from '../../config/env';
import type { Database } from '../../types/database';

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!appEnv.isSupabaseConfigured) return null;
  if (client) return client;

  client = createClient<Database>(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-application-name': 'lentera-web' },
    },
  });

  return client;
}

export function requireSupabase(): SupabaseClient<Database> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
