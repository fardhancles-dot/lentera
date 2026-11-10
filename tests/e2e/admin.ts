/**
 * Bantuan Supabase Admin API untuk E2E alur Auth yang biasanya butuh email.
 * Service role key dibaca dari Management API memakai personal access token
 * yang sudah dipakai untuk migration, jadi tidak ada kredensial baru di repo.
 * Kunci tidak pernah dicetak.
 */

export type AdminAccount = {
  ref: string;
  url: string;
  anonKey: string;
  adminHeaders: Record<string, string>;
};

export async function adminAccount(): Promise<AdminAccount | null> {
  const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const ref =
    (process.env.SUPABASE_PROJECT_REF ?? '').trim() ||
    url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] ||
    '';
  if (!token || !ref || !url || !anonKey) return null;

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const keys = (await response.json()) as { name?: string; api_key?: string }[];
  const serviceKey = keys.find((key) => key.name === 'service_role')?.api_key;
  if (!serviceKey) return null;

  return {
    ref,
    url,
    anonKey,
    adminHeaders: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
  };
}

export async function createTemporaryUser(
  admin: AdminAccount,
  email: string,
  password: string,
  confirmEmail: boolean,
): Promise<{ id: string }> {
  const response = await fetch(`${admin.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: admin.adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: confirmEmail }),
  });
  if (!response.ok) {
    throw new Error(`gagal membuat akun uji: HTTP ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as { id: string };
}

export async function deleteTemporaryUser(
  admin: AdminAccount,
  userId: string,
): Promise<void> {
  await fetch(`${admin.url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: admin.adminHeaders,
  });
}

export async function generateActionLink(
  admin: AdminAccount,
  type: 'recovery' | 'signup',
  email: string,
  redirectTo: string,
): Promise<string> {
  const response = await fetch(`${admin.url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: admin.adminHeaders,
    body: JSON.stringify({ type, email, redirect_to: redirectTo }),
  });
  if (!response.ok) {
    throw new Error(`gagal membuat tautan ${type}: HTTP ${response.status} ${await response.text()}`);
  }
  const payload = (await response.json()) as { action_link?: string };
  if (!payload.action_link) throw new Error(`tautan ${type} tidak dikembalikan Supabase`);
  return payload.action_link;
}
