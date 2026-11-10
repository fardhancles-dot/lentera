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

test('recovery link lets a player set a new password', async ({ page }) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN is required to generate a recovery link');
  if (!admin) return;

  const email = `qa.reset.${Date.now()}@lentera.test`;
  const oldPassword = `Lama-${randomUUID()}`;
  const newPassword = 'ResetUji!2026';

  const user = await createTemporaryUser(admin, email, oldPassword, true);
  try {
    const link = await generateActionLink(admin, 'recovery', email, `${BASE_URL}/reset-password`);

    const errors = collectPageErrors(page);
    await page.goto(link);
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
    await deleteTemporaryUser(admin, user.id);
  }
});
