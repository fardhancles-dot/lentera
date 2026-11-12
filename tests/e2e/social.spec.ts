import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  adminAccount,
  createTemporaryUser,
  deleteTemporaryUser,
  type AdminAccount,
} from './admin';
import { collectPageErrors, login, type Credentials } from './helpers';

/**
 * Alur Tahap 7 dengan dua akun sementara:
 * liga/event, pencarian + permintaan pertemanan, notifikasi, profil publik,
 * dan tiga tingkat privasi statistik (privat, teman, publik).
 *
 * Akun dibuat lewat Admin API dan dihapus di finally, jadi data pengguna asli
 * tidak disentuh. Tests skip bila SUPABASE_ACCESS_TOKEN tidak tersedia.
 */

type Pair = { host: Credentials; guest: Credentials; ids: string[] };

async function temporaryPair(admin: AdminAccount): Promise<Pair> {
  const stamp = `${Date.now()}.${randomUUID().slice(0, 8)}`;
  const host = { email: `qa.social.host.${stamp}@lentera.test`, password: `Uji-${randomUUID()}` };
  const guest = {
    email: `qa.social.guest.${stamp}@lentera.test`,
    password: `Uji-${randomUUID()}`,
  };
  const hostUser = await createTemporaryUser(admin, host.email, host.password, true);
  try {
    const guestUser = await createTemporaryUser(admin, guest.email, guest.password, true);
    return { host, guest, ids: [hostUser.id, guestUser.id] };
  } catch (error) {
    await deleteTemporaryUser(admin, hostUser.id);
    throw error;
  }
}

async function setVisibility(page: Page, value: 'friends' | 'public' | 'private'): Promise<void> {
  await page.goto('/settings');
  await page.locator('#profile-visibility').selectOption(value);
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.locator('.toast', { hasText: 'Pengaturan tersimpan.' })).toBeVisible();
}

test('league, friends, notifications, and profile privacy work across two accounts', async ({
  browser,
}) => {
  const admin = await adminAccount();
  test.skip(!admin, 'SUPABASE_ACCESS_TOKEN diperlukan untuk membuat akun uji sementara');
  if (!admin) return;

  const pair = await temporaryPair(admin);
  const hostPage = await browser.newPage();
  const guestPage = await browser.newPage();
  const hostErrors = collectPageErrors(hostPage);
  const guestErrors = collectPageErrors(guestPage);

  try {
    const hostLogin = await login(hostPage, pair.host);
    expect(hostLogin.ok, hostLogin.ok ? '' : hostLogin.reason).toBeTruthy();
    const guestLogin = await login(guestPage, pair.guest);
    expect(guestLogin.ok, guestLogin.ok ? '' : guestLogin.reason).toBeTruthy();

    await hostPage.goto('/profile');
    const hostUsername = await hostPage.locator('input[name="username"]').inputValue();
    expect(hostUsername).toBeTruthy();
    await expect(hostPage.locator('.profile-hero .profile-tier')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.profile-hero .profile-level')).toBeVisible();
    await expect(hostPage.locator('.profile-hero .profile-level__label')).toContainText(/LV \d+/);

    // 0. Navigasi komunitas pindah ke hamburger menu di header mobile.
    await hostPage.setViewportSize({ width: 390, height: 844 });
    await hostPage.goto('/app');
    await expect(hostPage.locator('.social-shortcuts')).toHaveCount(0);
    await expect(hostPage.locator('.bottom-nav__item')).toHaveCount(5);
    const mobileHeader = hostPage.locator('.topbar__mobile');
    await expect(mobileHeader.locator('.header-hamburger')).toBeVisible();
    await expect(mobileHeader.locator('.header-shop')).toBeVisible();
    await expect(mobileHeader.locator('.header-resources .resource-chip')).toHaveCount(3);
    await expect(mobileHeader.locator('.resource-chip--hearts')).toContainText('5/5');
    await expect(mobileHeader.locator('.resource-chip--coin .resource-chip__value')).not.toHaveText('—');
    await expect(mobileHeader.locator('.resource-chip--streak .resource-chip__value')).not.toHaveText('—');
    await expect(mobileHeader.locator('.header-avatar')).toBeVisible();
    const headerOrder = await mobileHeader.evaluate((node) =>
      Array.from(node.children).map((child) => {
        if (child.classList.contains('header-hamburger')) return 'hamburger';
        if (child.classList.contains('header-shop')) return 'shop';
        if (child.classList.contains('header-resources')) return 'resources';
        if (child.classList.contains('header-avatar')) return 'avatar';
        return 'other';
      }),
    );
    expect(headerOrder).toEqual(['hamburger', 'shop', 'resources', 'avatar']);
    const resourceOrder = await mobileHeader.locator('.header-resources > *').evaluateAll((nodes) =>
      nodes.map((node) =>
        ['hearts', 'coin', 'streak'].find((key) => node.classList.contains(`resource-chip--${key}`)),
      ),
    );
    expect(resourceOrder).toEqual(['hearts', 'coin', 'streak']);
    const overflow = await hostPage.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(2);
    await hostPage.getByRole('button', { name: 'Buka menu' }).click();
    await expect(hostPage.locator('.drawer-nav__item')).toHaveCount(4);
    await expect(hostPage.locator('.drawer-nav__item[href="/settings"]')).toBeVisible();
    await expect(hostPage.locator('.drawer-nav__item[href="/leaderboard"]')).toBeVisible();
    await expect(hostPage.locator('.drawer-nav__item[href="/notifications"]')).toBeVisible();
    await hostPage.locator('.drawer-nav__item[href="/friends"]').click();
    await expect(hostPage).toHaveURL(/\/friends$/);
    await hostPage.setViewportSize({ width: 1280, height: 900 });

    // 1. Liga mingguan dan event aktif tampil untuk akun baru.
    await hostPage.goto('/leaderboard');
    await expect(hostPage.locator('.league__hero')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.league__hero')).toContainText('Liga mingguan');
    await expect(hostPage.locator('.league__members .league-row')).not.toHaveCount(0);
    await expect(hostPage.locator('.event-card')).toContainText('Event mingguan');
    await expect(hostPage.locator('.event-card .progress')).toBeVisible();

    // 2. Tab global memuat papan peringkat dan baris pemain sendiri.
    await hostPage.getByRole('button', { name: 'Global' }).click();
    await expect(hostPage.locator('.board-row--viewer')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.board-week')).toContainText('XP dari lesson dan latihan');

    // 3. Nama akun tamu dibaca dari profilnya.
    await guestPage.goto('/profile');
    const guestUsername = await guestPage.locator('input[name="username"]').inputValue();
    expect(guestUsername).toBeTruthy();

    // 4. Host mencari tamu dan mengirim permintaan pertemanan lewat UI.
    await hostPage.goto('/friends');
    await hostPage.locator('input[name="player-search"]').fill(guestUsername);
    await hostPage.getByRole('button', { name: 'Cari', exact: true }).click();
    const guestResult = hostPage.locator('.friend-results .friend-row', {
      hasText: `@${guestUsername}`,
    });
    await expect(guestResult).toBeVisible({ timeout: 30_000 });
    await guestResult.getByRole('button', { name: 'Tambah', exact: true }).click();
    await expect(hostPage.locator('.toast', { hasText: 'Permintaan dikirim' })).toBeVisible();

    // 5. Tamu menerima notifikasi lalu menerima permintaan dari halaman Teman.
    await guestPage.goto('/notifications');
    await expect(
      guestPage.locator('.notification', { hasText: 'Permintaan pertemanan baru' }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(guestPage.locator('.notification--unread').first()).toBeVisible();

    await guestPage.goto('/friends');
    const incoming = guestPage.locator('.friend-section', { hasText: 'Permintaan masuk' });
    await expect(incoming).toBeVisible({ timeout: 30_000 });
    await incoming.getByRole('button', { name: 'Terima', exact: true }).click();
    await expect(guestPage.locator('.toast', { hasText: 'sekarang berteman' })).toBeVisible();
    await expect(
      guestPage.locator('.friend-section', { hasText: 'Temanmu' }).locator('.friend-row', {
        hasText: `@${hostUsername}`,
      }),
    ).toBeVisible();

    // 6. Host mendapat notifikasi penerimaan dan bisa menandai semua dibaca.
    await hostPage.goto('/notifications');
    const accepted = hostPage.locator('.notification', {
      hasText: 'Permintaan pertemanan diterima',
    });
    await expect(accepted.first()).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.notification--unread').first()).toBeVisible();
    await hostPage.getByRole('button', { name: 'Tandai semua dibaca' }).click();
    await expect(
      hostPage.locator('.toast', { hasText: 'Semua notifikasi ditandai dibaca.' }),
    ).toBeVisible();
    await hostPage.reload();
    await expect(hostPage.locator('.notification').first()).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.notification--unread')).toHaveCount(0);

    // 7. Daftar teman host memuat tamu.
    await hostPage.goto('/friends');
    await expect(
      hostPage.locator('.friend-section', { hasText: 'Temanmu' }).locator('.friend-row', {
        hasText: `@${guestUsername}`,
      }),
    ).toBeVisible({ timeout: 30_000 });

    // 8. Profil pemain: teman melihat statistik (default visibilitas "teman").
    await hostPage.goto(`/players/${guestUsername}`);
    await expect(hostPage.locator('.player-card__name')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.player-stats')).toBeVisible();
    await expect(hostPage.locator('.player-card .profile-tier')).toBeVisible();
    await expect(hostPage.locator('.player-card .profile-level')).toBeVisible();
    await expect(hostPage.locator('.player-card .profile-level__label')).toContainText(/LV \d+/);
    await expect(hostPage.locator('.player-card__privacy')).toContainText('Hanya teman');

    // 9. Privat menyembunyikan statistik bahkan dari teman.
    await setVisibility(guestPage, 'private');
    await hostPage.goto(`/players/${guestUsername}`);
    await expect(hostPage.locator('.player-locked')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.player-stats')).toHaveCount(0);
    await expect(hostPage.locator('.player-card .profile-level')).toHaveCount(0);
    await expect(hostPage.locator('.player-card__privacy')).toContainText('Privat');

    // 10. "Teman" membuka statistik lagi, lalu menghapus teman menutupnya.
    await setVisibility(guestPage, 'friends');
    await hostPage.goto(`/players/${guestUsername}`);
    await expect(hostPage.locator('.player-stats')).toBeVisible({ timeout: 30_000 });

    await hostPage.goto('/friends');
    const friendRow = hostPage.locator('.friend-section', { hasText: 'Temanmu' }).locator('.friend-row', {
      hasText: `@${guestUsername}`,
    });
    hostPage.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await friendRow.getByRole('button', { name: 'Hapus', exact: true }).click();
    await expect(hostPage.locator('.toast', { hasText: 'dihapus dari daftar teman' })).toBeVisible();

    await hostPage.goto(`/players/${guestUsername}`);
    await expect(hostPage.locator('.player-locked')).toBeVisible({ timeout: 30_000 });

    // 11. Publik membuka statistik untuk non-teman.
    await setVisibility(guestPage, 'public');
    await hostPage.goto(`/players/${guestUsername}`);
    await expect(hostPage.locator('.player-stats')).toBeVisible({ timeout: 30_000 });
    await expect(hostPage.locator('.player-card__privacy')).toContainText('terbuka untuk semua');

    // 12. Halaman tidak menghasilkan error runtime.
    expect(hostErrors).toEqual([]);
    expect(guestErrors).toEqual([]);
  } finally {
    await hostPage.close();
    await guestPage.close();
    for (const id of pair.ids) await deleteTemporaryUser(admin, id);
  }
});
