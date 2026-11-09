import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { collectPageErrors } from './helpers';

const BASE_URL = 'http://localhost:4173';

type AdminAccount = { ref: string; serviceKey: string; anonKey: string; url: string };

/**
 * Recovery links are normally delivered by email. To test the flow end to end
 * without a mailbox, the test asks Supabase for the link directly with the
 * service role key. The key is read from the Management API with the personal
 * access token already used for migrations, so nothing new has to be stored.
 */
async function adminAccount(): Promise<AdminAccount | null> {
  const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const ref =
    (process.env.SUPABASE_PROJECT_REF ?? '').trim() ||
    url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] ||
    '';
  if (!token || !ref || !anonKey) return null;

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const keys = (await response.json()) as { name?: string; api_key?: string }[];
  const serviceKey = keys.find((key) => key.name === 'service_role')?.api_key;
  if (!serviceKey) return null;

  return { ref, serviceKey, anonKey, url };
}

test('recovery link lets a player set a new password', async ({ page }) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN is required to generate a recovery link');
  if (!admin) return;

  const email = `qa.reset.${Date.now()}@lentera.test`;
  const oldPassword = `Lama-${randomUUID()}`;
  const newPassword = 'ResetUji!2026';
  const headers = {
    Authorization: `Bearer ${admin.serviceKey}`,
    apikey: admin.serviceKey,
    'Content-Type': 'application/json',
  };

  const created = await fetch(`${admin.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password: oldPassword, email_confirm: true }),
  });
  expect(created.ok, 'temporary account created').toBeTruthy();
  const user = (await created.json()) as { id: string };

  try {
    const linkResponse = await fetch(`${admin.url}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'recovery',
        email,
        redirect_to: `${BASE_URL}/reset-password`,
      }),
    });
    expect(linkResponse.ok, 'recovery link generated').toBeTruthy();
    const link = (await linkResponse.json()) as { action_link?: string };
    expect(link.action_link, 'recovery link present').toBeTruthy();

    const errors = collectPageErrors(page);
    await page.goto(link.action_link!);
    await expect(page).toHaveURL(/\/reset-password/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Buat password baru/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.getByRole('button', { name: 'Simpan password baru' }).click();

    await expect(page.locator('.auth-success')).toContainText('Password tersimpan', {
      timeout: 30_000,
    });

    const tokenResponse = await fetch(`${admin.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: admin.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });
    expect(tokenResponse.ok, 'new password signs in').toBeTruthy();

    expect(errors).toEqual([]);
  } finally {
    await fetch(`${admin.url}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers,
    });
  }
});
