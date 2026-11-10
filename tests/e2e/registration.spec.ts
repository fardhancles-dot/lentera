import { expect, test } from '@playwright/test';
import { adminAccount, deleteTemporaryUser } from './admin';
import { collectPageErrors } from './helpers';

test('registration accepts a 6-character password without email verification', async ({ page }) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN is required to clean up the test account');
  if (!admin) return;

  const email = `qa.register.${Date.now()}@lentera.test`;
  const errors = collectPageErrors(page);
  let userId: string | null = null;

  try {
    await page.goto('/register');

    await expect(
      page.locator('.field__hint').filter({ hasText: 'Password minimal 6 karakter.' }),
    ).toBeVisible();
    expect(await page.locator('.password-meter').count()).toBe(0);

    await page.locator('input[name="displayName"]').fill('QA Register');
    await page.locator('input[name="email"]').fill(email);

    // Five characters must be rejected before any request is sent.
    await page.locator('input[name="password"]').fill('abc12');
    await page.locator('input[name="confirmPassword"]').fill('abc12');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator('.field__error').filter({ hasText: 'Password minimal 6 karakter.' }),
    ).toBeVisible();

    // Matching confirmation is still enforced.
    await page.locator('input[name="password"]').fill('abc123');
    await expect(page.locator('.field__hint[data-valid="true"]')).toContainText(
      'memenuhi syarat',
    );
    await page.locator('input[name="confirmPassword"]').fill('abc124');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator('.field__error').filter({ hasText: 'Konfirmasi password belum sama.' }),
    ).toBeVisible();

    // A 6-character password without capitals, digits, or symbols is accepted.
    await page.locator('input[name="confirmPassword"]').fill('abc123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
    await expect(page.locator('.onboarding')).toBeVisible();

    const list = await fetch(`${admin.url}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: admin.adminHeaders,
    });
    const payload = (await list.json()) as { users?: { id: string; email?: string }[] };
    userId = payload.users?.find((user) => user.email === email)?.id ?? null;
    expect(userId, 'test account exists in Supabase').toBeTruthy();
  } finally {
    if (userId) await deleteTemporaryUser(admin, userId);
  }

  expect(errors).toEqual([]);
});

test('auth forms have no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ['/register', '/login', '/forgot-password']) {
    await page.goto(path);
    await expect(page.locator('.auth-card')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(2);
  }
});
