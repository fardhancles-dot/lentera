import { expect, test, type Page } from '@playwright/test';
import { answerFirstQuestion, collectPageErrors, login } from './helpers';

const ROUTES: { path: string; heading: RegExp }[] = [
  { path: '/app', heading: /Halo|Selamat|Beranda|Hari ini/i },
  { path: '/learn', heading: /Belajar/i },
  { path: '/practice', heading: /Latihan/i },
  { path: '/wallet', heading: /Wallet/i },
  { path: '/quests', heading: /Misi/i },
  { path: '/shop', heading: /Toko/i },
  { path: '/mastery', heading: /Penguasaan/i },
  { path: '/profile', heading: /Profil/i },
  { path: '/settings', heading: /Pengaturan/i },
];

async function assertNoOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(2);
}

test('every app route renders without page errors', async ({ page }) => {
  const errors = collectPageErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  for (const route of ROUTES) {
    await page.goto(route.path);
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('.topbar__title')).toContainText(route.heading);

    // The catalog must actually render: a 403 from subject_overview used to
    // leave /learn and /practice empty even though the shell still mounted.
    if (route.path === '/learn') {
      await expect(page.locator('.subject-card').first()).toBeVisible({
        timeout: 30_000,
      });
    }
  }

  expect(errors).toEqual([]);
});

test('lesson starts, answers, shows feedback, and advances', async ({ page }) => {
  const errors = collectPageErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.goto('/learn/bahasa-inggris');
  await expect(page.locator('.journey-map')).toBeVisible({ timeout: 30_000 });
  const lessonLink = page.locator('a.journey-stop--level[href$="/play"]').first();
  test.skip((await lessonLink.count()) === 0, 'no playable lesson in the QA account');

  // A level click must open the game directly, with no detail-lesson step.
  await lessonLink.click();
  await page.waitForURL(/\/lesson\/.+\/play$/);

  await expect(page.locator('.play-shell')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Riwayat percobaan' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Mulai lesson|Main lagi/ })).toHaveCount(0);
  await expect(page.locator('.play-prompt').first()).toBeVisible();

  const answered = await answerFirstQuestion(page);
  test.skip(!answered, 'first question uses a mechanic that needs manual input');

  const check = page.getByRole('button', { name: /Periksa jawaban/ });
  await expect(check).toBeEnabled();
  await check.click();

  const feedback = page.locator('.play-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(/Benar|Belum tepat|Jawaban benar|Coba/i);

  // One question per level: the first feedback already offers the result.
  const next = page.getByRole('button', { name: 'Lihat hasil' });
  await expect(next).toBeVisible();

  expect(errors).toEqual([]);
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ['/app', '/learn', '/learn/bahasa-inggris', '/practice', '/wallet']) {
    await page.goto(path);
    await expect(page.locator('main#main')).toBeVisible();
    await assertNoOverflow(page);
  }

  const map = page.locator('.journey-map');
  await page.goto('/learn/bahasa-inggris');
  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(map.locator('.journey-stop').first()).toBeVisible();
  await assertNoOverflow(page);
});

test('reduced motion keeps the map usable', async ({ page }) => {
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/learn/bahasa-inggris');

  const map = page.locator('.journey-map');
  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(map).toHaveAttribute('data-reduced-motion', 'true');
  await expect(map.locator('.journey-stop').first()).toBeVisible();
  await expect(map.locator('.journey-map__title')).not.toBeEmpty();
});
