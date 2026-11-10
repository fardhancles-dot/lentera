import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  adminAccount,
  createTemporaryUser,
  deleteTemporaryUser,
  generateActionLink,
} from './admin';
import { collectPageErrors } from './helpers';

const BASE_URL = 'http://localhost:4173';

test('signup confirmation link activates a new account', async ({ page }) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN is required to generate a signup link');
  if (!admin) return;

  const email = `qa.confirm.${Date.now()}@lentera.test`;
  const password = `Baru-${randomUUID()}`;

  // Dibuat belum terkonfirmasi, sama seperti hasil form register.
  const user = await createTemporaryUser(admin, email, password, false);

  try {
    const link = await generateActionLink(admin, 'signup', email, `${BASE_URL}/app`);

    const errors = collectPageErrors(page);
    await page.goto(link);
    await expect(page).toHaveURL(/\/(app|onboarding)/, { timeout: 30_000 });
    await expect(page.locator('main#main, .onboarding')).toBeVisible({ timeout: 30_000 });

    const profile = await fetch(`${admin.url}/auth/v1/admin/users/${user.id}`, {
      headers: admin.adminHeaders,
    });
    expect(profile.ok, 'akun uji terbaca admin').toBeTruthy();
    const account = (await profile.json()) as { email_confirmed_at?: string | null };
    expect(account.email_confirmed_at, 'email terkonfirmasi lewat tautan').toBeTruthy();

    const tokenResponse = await fetch(`${admin.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: admin.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(tokenResponse.ok, 'akun terkonfirmasi bisa login').toBeTruthy();

    expect(errors).toEqual([]);
  } finally {
    await deleteTemporaryUser(admin, user.id);
  }
});
