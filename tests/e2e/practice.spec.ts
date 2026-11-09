import { expect, test } from '@playwright/test';
import { answerFirstQuestion, collectPageErrors, login } from './helpers';

test('practice hub starts a session and grades an answer', async ({ page }) => {
  const errors = collectPageErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  // Bahasa Inggris punya bank soal terlengkap, dan mode dengan tombol "Mulai"
  // tidak meminta pemilihan unit lebih dulu.
  await page.goto('/practice?subject=bahasa-inggris');
  const start = page.getByRole('button', { name: 'Mulai', exact: true }).first();
  await expect(start).toBeEnabled({ timeout: 30_000 });

  await start.click();
  await page.waitForURL(/\/practice\/play/);
  await expect(page.locator('.play-shell, .play-loading')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.play-prompt').first()).toBeVisible({ timeout: 30_000 });

  const answered = await answerFirstQuestion(page);
  test.skip(!answered, 'first practice question needs an input this test cannot fill');

  const check = page.getByRole('button', { name: /Periksa jawaban/ });
  test.skip(
    !(await check.isEnabled().catch(() => false)),
    'first practice question needs a mechanic this test cannot drive (e.g. microphone)',
  );
  await check.click();

  const feedback = page.locator('.play-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(/Benar|Belum tepat|Jawaban benar|Coba/i);
  await expect(page.getByRole('button', { name: /Lanjut|Lihat hasil/ })).toBeVisible();

  expect(errors).toEqual([]);
});
