import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  adminAccount,
  createTemporaryUser,
  deleteTemporaryUser,
  type AdminAccount,
} from './admin';
import { collectPageErrors, login } from './helpers';

/**
 * Tahap 8: Developer Dashboard diuji dengan akun staff QA dan satu akun
 * pemain sementara. Akun pemilik tidak dipakai. Hadiah hanya dikirim ke akun
 * sementara; broadcast valid tidak dijalankan agar tidak menyentuh pemain asli.
 */

async function deleteTemporaryAudit(
  admin: AdminAccount,
  targetId: string,
): Promise<boolean> {
  const response = await fetch(
    `${admin.url}/rest/v1/audit_logs?target_id=eq.${encodeURIComponent(targetId)}`,
    {
      method: 'DELETE',
      headers: { ...admin.adminHeaders, Prefer: 'return=minimal' },
    },
  );
  return response.ok;
}

test('developer dashboard grants a reward and keeps audit staff-only', async ({ browser }) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN diperlukan untuk membuat akun uji sementara');
  if (!admin) return;

  const stamp = `${Date.now()}.${randomUUID().slice(0, 8)}`;
  const account = {
    email: `qa.developer.player.${stamp}@lentera.test`,
    password: `Uji-${randomUUID()}`,
  };
  const reason = `Uji dashboard ${stamp}`;
  const temporary = await createTemporaryUser(admin, account.email, account.password, true);
  const staffPage = await browser.newPage();
  const playerPage = await browser.newPage();
  const staffErrors = collectPageErrors(staffPage);
  const playerErrors = collectPageErrors(playerPage);

  try {
    const staffLogin = await login(staffPage);
    expect(staffLogin.ok, staffLogin.ok ? '' : staffLogin.reason).toBeTruthy();
    const playerLogin = await login(playerPage, account);
    expect(playerLogin.ok, playerLogin.ok ? '' : playerLogin.reason).toBeTruthy();

    // Staff membuka dashboard dan melihat metrik nyata.
    await staffPage.goto('/developer');
    await expect(
      staffPage.getByRole('heading', { name: 'Developer Dashboard', level: 1 }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(staffPage.locator('.dev-metric')).toHaveCount(6, { timeout: 30_000 });

    // Cari akun sementara berdasarkan email.
    await staffPage.locator('input[name="developer-search"]').fill(account.email);
    await staffPage.getByRole('button', { name: 'Cari', exact: true }).click();
    const playerRow = staffPage.locator('.dev-user', { hasText: account.email });
    await expect(playerRow).toBeVisible({ timeout: 30_000 });
    await playerRow.getByRole('button', { name: 'Pilih', exact: true }).click();
    await expect(staffPage.locator('.dev-selected')).toContainText('@');

    // Reward Center mengirim Koin dan XP hanya ke akun sementara.
    await staffPage.locator('input[name="reward-coins"]').fill('3');
    await staffPage.locator('input[name="reward-xp"]').fill('5');
    await staffPage.locator('input[name="reward-reason"]').fill(reason);
    await staffPage.getByRole('button', { name: 'Kirim hadiah' }).click();
    await expect(
      staffPage.locator('.toast', { hasText: '+3 Koin, +5 XP' }),
    ).toBeVisible({ timeout: 30_000 });

    // Aksi tercatat di audit log dan bisa dibaca staff.
    const auditRow = staffPage.locator('.audit-row', { hasText: reason });
    await expect(auditRow.first()).toBeVisible({ timeout: 30_000 });
    await expect(auditRow.first()).toContainText('Hadiah dikirim');

    // Form broadcast tersedia, tetapi pengiriman valid tidak dijalankan dari
    // E2E karena akan membuat notifikasi untuk seluruh pemain asli.
    await expect(staffPage.locator('textarea[name="broadcast-body"]')).toBeVisible();
    await expect(
      staffPage.getByRole('button', { name: 'Kirim broadcast' }),
    ).toBeVisible();

    // Pemain menerima saldo dan riwayat ledger.
    await playerPage.goto('/wallet');
    await expect(playerPage.locator('.wallet-hero__value')).toHaveText('3', {
      timeout: 30_000,
    });
    await expect(
      playerPage.locator('.wallet-tx', { hasText: 'Hadiah developer' }).first(),
    ).toBeVisible();

    // Pemain biasa tidak bisa membuka dashboard developer.
    await playerPage.goto('/developer');
    await expect(playerPage).toHaveURL(/\/app$/, { timeout: 30_000 });
    await expect(playerPage.locator('a[href="/developer"]')).toHaveCount(0);

    expect(staffErrors).toEqual([]);
    expect(playerErrors).toEqual([]);
  } finally {
    await staffPage.close();
    await playerPage.close();
    // Baris audit append-only adalah bukti aksi; hanya baris uji ini yang
    // dibersihkan lewat service role agar dashboard tidak terisi data uji.
    const auditCleaned = await deleteTemporaryAudit(admin, temporary.id);
    if (!auditCleaned) {
      console.warn(`baris audit uji untuk ${temporary.id} tidak dapat dibersihkan`);
    }
    await deleteTemporaryUser(admin, temporary.id);
  }
});
