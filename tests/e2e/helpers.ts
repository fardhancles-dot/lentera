import type { Page } from '@playwright/test';

export type LoginResult = { ok: true } | { ok: false; reason: string };
export type Credentials = { email: string; password: string };

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** Second account for two-player flows; tests skip themselves when absent. */
export function secondAccount(): Credentials | null {
  const email = process.env.E2E_EMAIL_2;
  const password = process.env.E2E_PASSWORD_2;
  return email && password ? { email, password } : null;
}

/**
 * Answers whichever mechanic the current question renders. Returns false when
 * the question needs an input this helper cannot fill.
 */
export async function answerFirstQuestion(page: Page): Promise<boolean> {
  const option = page.locator('.play-option').first();
  if (await option.count()) {
    await option.click();
    return true;
  }

  const picture = page.locator('.play-picture-option').first();
  if (await picture.count()) {
    await picture.click();
    return true;
  }

  const bankToken = page.locator('.play-bank button').first();
  if (await bankToken.count()) {
    for (let index = 0; index < 12; index += 1) {
      const token = page.locator('.play-bank button').first();
      if (!(await token.count())) break;
      await token.click();
    }
    return true;
  }

  const columns = page.locator('.play-pair-column');
  if ((await columns.count()) === 2) {
    // Matching pairs needs one pick per column; clicking both columns in DOM
    // order would only reselect the left side.
    const left = columns.nth(0).locator('button');
    const right = columns.nth(1).locator('button');
    const total = Math.min(await left.count(), await right.count());
    for (let index = 0; index < total; index += 1) {
      await left.nth(index).click();
      await right.nth(index).click();
    }
    return total > 0;
  }

  const pair = page.locator('.play-pair').first();
  if (await pair.count()) {
    const pairs = page.locator('.play-pair');
    const total = await pairs.count();
    for (let index = 0; index < total; index += 1) {
      const candidate = pairs.nth(index);
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        await page.waitForTimeout(120);
      }
    }
    return true;
  }

  const input = page.locator('.play-input').first();
  if (await input.count()) {
    await input.fill('contoh jawaban');
    return true;
  }

  return false;
}

export async function login(page: Page, account?: Credentials): Promise<LoginResult> {
  const email = account?.email ?? process.env.E2E_EMAIL;
  const password = account?.password ?? process.env.E2E_PASSWORD;
  if (!email || !password) {
    return {
      ok: false,
      reason: account
        ? 'second test account credentials are not configured'
        : 'E2E_EMAIL / E2E_PASSWORD are not configured',
    };
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
