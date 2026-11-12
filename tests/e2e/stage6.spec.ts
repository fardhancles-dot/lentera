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

test('adventure map renders every level, scrolls over a fixed backdrop, and fits a phone', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.goto('/learn/bahasa-inggris');
  const map = page.locator('.journey-map');
  const scroll = page.locator('.journey-map__scroll');

  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(map.locator('.journey-map__title')).not.toBeEmpty();
  await expect(map.locator('.journey-stop').first()).toBeVisible();

  const stops = map.locator('.journey-stop');
  expect(await stops.count()).toBeGreaterThan(3);
  await expect(map.locator('.journey-stop--reward').first()).toBeVisible();

  const canScroll = await scroll.evaluate((element) => element.scrollHeight > element.clientHeight + 20);
  expect(canScroll).toBe(true);

  const active = map.locator('.journey-stop[aria-current="step"]');
  expect(await active.count()).toBeLessThanOrEqual(1);
  if (await active.count()) {
    await expect(active).toHaveAttribute('aria-current', 'step');
  }

  // Reset to the top, then scroll manually so the movement check does not
  // depend on where the active node happened to be auto-focused.
  await scroll.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.waitForTimeout(100);
  const tracked = stops.nth(3);
  const backdropBefore = await map.locator('.journey-map__backdrop').boundingBox();
  const activeBefore = await tracked.boundingBox();
  await scroll.evaluate((element) => {
    element.scrollTop += 120;
  });
  await page.waitForTimeout(180);
  const backdropAfter = await map.locator('.journey-map__backdrop').boundingBox();
  const activeAfter = await tracked.boundingBox();

  expect(Math.abs((backdropAfter?.y ?? 0) - (backdropBefore?.y ?? 0))).toBeLessThan(2);
  expect(activeAfter?.y ?? 0).toBeLessThan((activeBefore?.y ?? 0) - 80);

  const mute = page.locator('.topbar__actions button[aria-pressed]');
  if (await mute.count()) {
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await expect(map).toBeVisible();
  await expect(stops.first()).toBeVisible();

  const box = await map.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(500);

  const orbBox = await tracked.locator('.journey-stop__orb').boundingBox();
  expect(orbBox?.height ?? 0).toBeGreaterThanOrEqual(60);

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(2);

  const navItems = page.locator('.bottom-nav__item');
  expect(await navItems.count()).toBe(5);
  for (let index = 0; index < (await navItems.count()); index += 1) {
    const itemBox = await navItems.nth(index).boundingBox();
    expect(itemBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  expect(errors.filter((error) => /phaser|audio/i.test(error))).toEqual([]);
});
