import { expect, test } from '@playwright/test';
import { collectPageErrors as collectErrors, login } from './helpers';

test('landing mascot canvas mounts and reacts to a click', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');

  const canvas = page.locator('.mascot-stage canvas');
  await expect(canvas).toBeVisible();
  await canvas.click({ position: { x: 40, y: 40 } });
  await page.waitForTimeout(400);

  expect(errors.filter((error) => /phaser|audio/i.test(error))).toEqual([]);
});

test('map renders, level buttons work with the keyboard, and the canvas resizes', async ({ page }) => {
  const errors = collectErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.goto('/learn/bahasa-inggris');
  const frame = page.locator('.adventure-map__frame');
  await expect(frame.locator('canvas')).toBeVisible({ timeout: 30_000 });

  const levels = page.locator('.adventure-map__level');
  const levelCount = await levels.count();

  if (levelCount > 1) {
    const second = levels.nth(1);
    await second.focus();
    await expect(second).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(second).toHaveAttribute('aria-pressed', 'true');
    const title = (await second.textContent())?.trim() ?? '';
    await expect(page.locator('.adventure-map__title')).toHaveText(title);
  }

  await expect(page.locator('.adventure-map [role="status"]')).not.toBeEmpty();

  const mute = page.locator('.topbar__actions button[aria-pressed]');
  if (await mute.count()) {
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(900);
  await expect(frame.locator('canvas')).toBeVisible();

  const box = await frame.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(300);

  expect(errors.filter((error) => /phaser|audio/i.test(error))).toEqual([]);
});
