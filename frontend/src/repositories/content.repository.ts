import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

interface LooseClient {
  rpc(name: string, args?: Record<string, unknown>): Promise<{ data: Json; error: { message: string; code?: string } | null }>;
}

function client(): LooseClient {
  return requireSupabase() as unknown as LooseClient;
}

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Konten situs tidak dapat dimuat.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

/**
 * Public CMS reads. All three RPCs are granted to anon/authenticated and only
 * return published pages, active announcements, and the single site settings row.
 */
export const contentRepository = {
  async getSiteContent(): Promise<Json> {
    const { data, error } = await client().rpc('get_public_site_content');
    if (error) raise(error);
    return data;
  },

  async getPage(slug: string): Promise<Json> {
    const { data, error } = await client().rpc('get_public_page', {
      p_slug: slug,
    });
    if (error) raise(error);
    return data;
  },

  async getAnnouncements(): Promise<Json> {
    const { data, error } = await client().rpc('get_active_announcements');
    if (error) raise(error);
    return data;
  },
};
