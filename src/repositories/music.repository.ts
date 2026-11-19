import { requireSupabase } from '../services/supabase/client';
import type { Json } from '../types/database';

function raise(error: { message: string } | null): never {
  throw new Error(error?.message ?? 'Musik latar gagal dimuat.');
}

export const musicRepository = {
  async getActiveMusic(): Promise<Json> {
    const { data, error } = await requireSupabase().rpc('get_background_music');
    if (error) raise(error);
    return data;
  },
};
