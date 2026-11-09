import type { Page } from '@playwright/test';

export type LoginResult = { ok: true } | { ok: false; reason: string };

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

export async function login(page: Page): Promise<LoginResult> {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    return { ok: false, reason: 'E2E_EMAIL / E2E_PASSWORD are not configured' };
  }

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  try {
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 30_000 });
  } catch {
    const alerts = await page
      .locator('[role="alert"]')
      .allTextContents()
      .catch(() => []);
    const message = alerts.map((text) => text.trim()).filter(Boolean).join(' · ');
    return {
      ok: false,
      reason: `test account could not sign in${message ? `: ${message}` : ''}`,
    };
  }

  if (page.url().includes('/onboarding')) {
    // Only the dedicated QA account reaches this branch.
    const display = page.locator('input[name="displayName"]');
    if (!(await display.inputValue())) await display.fill('QA Lentera');

    for (let step = 0; step < 3; step += 1) {
      if (!page.url().includes('/onboarding')) break;
      await page.locator('.onboarding__actions .btn').last().click();
      await page.waitForTimeout(1200);
    }

    try {
      await page.waitForURL(/\/app/, { timeout: 30_000 });
    } catch {
      return { ok: false, reason: 'could not finish onboarding for the test account' };
    }
  }

  return { ok: true };
}
