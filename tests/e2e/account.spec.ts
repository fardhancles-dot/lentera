import { expect, test } from '@playwright/test';
import { collectPageErrors, login } from './helpers';

test('profile and settings save and persist after reload', async ({ page }) => {
  const errors = collectPageErrors(page);
  const session = await login(page);
  test.skip(!session.ok, session.ok ? '' : session.reason);

  await page.goto('/profile');
  const displayName = page.locator('input[name="displayName"]');
  await expect(displayName).toBeVisible({ timeout: 30_000 });
  const originalName = await displayName.inputValue();
  const temporaryName = `QA ${Date.now()}`.slice(0, 40);

  await displayName.fill(temporaryName);
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.locator('.toast')).toContainText('Profil berhasil disimpan');

  await page.reload();
  await expect(page.locator('input[name="displayName"]')).toHaveValue(temporaryName);

  // Restore the QA profile so repeated runs do not pile up changes.
  await page.locator('input[name="displayName"]').fill(originalName);
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.locator('.toast')).toContainText('Profil berhasil disimpan');
  await page.reload();
  await expect(page.locator('input[name="displayName"]')).toHaveValue(originalName);

  await page.goto('/settings');
  const reducedMotion = page.locator('#reduced-motion');
  await expect(reducedMotion).toBeVisible({ timeout: 30_000 });
  const wasChecked = await reducedMotion.isChecked();

  await reducedMotion.setChecked(!wasChecked);
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.toast')).toContainText('Pengaturan tersimpan');

  await page.reload();
  await expect(page.locator('#reduced-motion')).toBeChecked({ checked: !wasChecked });

  // Restore the original preference.
  await page.locator('#reduced-motion').setChecked(wasChecked);
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.toast')).toContainText('Pengaturan tersimpan');
  await page.reload();
  await expect(page.locator('#reduced-motion')).toBeChecked({ checked: wasChecked });

  expect(errors).toEqual([]);
});
