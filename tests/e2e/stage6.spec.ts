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

test('audio engine starts and schedules sound after a user gesture', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    if (!Original) return;

    const probe = { contexts: 0, oscillators: 0, running: 0 };
    (window as unknown as { __audioProbe?: typeof probe }).__audioProbe = probe;

    class ProbeContext extends Original {
      constructor() {
        super();
        probe.contexts += 1;
        this.addEventListener('statechange', () => {
          if (this.state === 'running') probe.running += 1;
        });
      }

      createOscillator(): OscillatorNode {
        probe.oscillators += 1;
        return super.createOscillator();
      }
    }

    Object.defineProperty(window, 'AudioContext', { value: ProbeContext });
  });

  const errors = collectErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  // Music reschedules once per bar; the first bar plus click SFX is enough to
  // prove the engine is running instead of silently failing autoplay.
  await page.waitForTimeout(4500);

  const probe = await page.evaluate(
    () => (window as unknown as { __audioProbe?: { contexts: number; oscillators: number; running: number } }).__audioProbe,
  );
  expect(probe?.contexts ?? 0).toBeGreaterThanOrEqual(1);
  expect(probe?.running ?? 0).toBeGreaterThanOrEqual(1);
  expect(probe?.oscillators ?? 0).toBeGreaterThanOrEqual(4);

  expect(errors.filter((error) => /audio/i.test(error))).toEqual([]);
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
  const area = page.locator('.adventure-map__area');

  await expect(area).toHaveText(new RegExp(`Area \\d+ dari ${levelCount}`));
  await expect(page.locator('.adventure-map__legend')).toContainText('Sedang dikerjakan');

  if (levelCount > 1) {
    const second = levels.nth(1);
    await second.focus();
    await expect(second).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(second).toHaveAttribute('aria-pressed', 'true');
    const title = (await second.textContent())?.trim() ?? '';
    await expect(page.locator('.adventure-map__title')).toHaveText(title);
    await expect(area).toHaveText(new RegExp(`Area 2 dari ${levelCount}`));
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

  // A phone gets the compact logical canvas (node labels stay 15px) instead of
  // shrinking the desktop map, and its nodes must use the compact coordinates.
  await expect(frame.locator('canvas')).toHaveAttribute('width', '420');

  const navItems = page.locator('.bottom-nav__item');
  expect(await navItems.count()).toBe(6);
  for (let index = 0; index < (await navItems.count()); index += 1) {
    const itemBox = await navItems.nth(index).boundingBox();
    expect(itemBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  expect(errors.filter((error) => /phaser|audio/i.test(error))).toEqual([]);
});
