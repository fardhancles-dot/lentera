import { expect, test } from '@playwright/test';
import { collectPageErrors, login, secondAccount } from './helpers';

const TITLE_PREFIX = 'E2E Quest';

/**
 * Test ini membuat quest sungguhan lewat UI. Data uji selalu diberi judul
 * berawalan "E2E Quest" dan dibersihkan sebelum/sesudah run supaya batas tiga
 * quest aktif tidak menumpuk. Pembersihan hanya jalan bila token Management API
 * tersedia; tanpa token, test tetap mencoba dan skip bila kuota quest penuh.
 */
async function cleanupTestQuests(): Promise<void> {
  const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
  const ref = (process.env.SUPABASE_PROJECT_REF ?? '').trim() ||
    (process.env.VITE_SUPABASE_URL ?? '').match(
      /^https?:\/\/([a-z0-9-]+)\.supabase\.co/i,
    )?.[1];
  if (!token || !ref) return;

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `delete from public.friend_quests where title like '${TITLE_PREFIX} %';`,
      }),
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    console.warn(`[e2e] cleanup Friends Quest dilewati: HTTP ${response.status} ${detail}`);
  }
}

test.beforeAll(async () => {
  await cleanupTestQuests();
});

test.afterAll(async () => {
  await cleanupTestQuests();
});

test('two accounts create and join the same Friends Quest', async ({ browser }) => {
  const partner = secondAccount();
  test.skip(
    !partner,
    'set E2E_EMAIL_2 / E2E_PASSWORD_2 to run the two-account Friends Quest flow',
  );
  if (!partner) return;

  const title = `${TITLE_PREFIX} ${Date.now()}`;

  const hostPage = await browser.newPage();
  const hostErrors = collectPageErrors(hostPage);
  const hostSession = await login(hostPage);
  test.skip(!hostSession.ok, hostSession.ok ? '' : `host: ${hostSession.reason}`);

  await hostPage.goto('/friends-quest');
  await hostPage.locator('input[name="quest-title"]').fill(title);
  await hostPage.locator('input[name="quest-target"]').fill('40');
  await hostPage.locator('input[name="quest-reward-xp"]').fill('10');
  await hostPage.locator('input[name="quest-reward-coins"]').fill('2');
  await hostPage.getByRole('button', { name: 'Buat quest' }).click();

  const hostCard = hostPage.locator('.friend-quest', { hasText: title }).first();
  await expect(hostCard).toBeVisible({ timeout: 30_000 });
  await expect(hostCard).toContainText('1/8 anggota');

  const code = (await hostCard.locator('.friend-quest__code').innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  const partnerPage = await browser.newPage();
  const partnerErrors = collectPageErrors(partnerPage);
  const partnerSession = await login(partnerPage, partner);
  test.skip(!partnerSession.ok, partnerSession.ok ? '' : `partner: ${partnerSession.reason}`);

  await partnerPage.goto('/friends-quest');
  await partnerPage.locator('input[name="quest-code"]').fill(code);
  await partnerPage.getByRole('button', { name: 'Gabung quest' }).click();

  const partnerCard = partnerPage.locator('.friend-quest', { hasText: title }).first();
  await expect(partnerCard).toBeVisible({ timeout: 30_000 });
  await expect(partnerCard).toContainText('2/8 anggota');
  await expect(partnerCard.getByRole('button', { name: /Belum bisa diklaim/ })).toBeDisabled();

  await hostPage.reload();
  const refreshedCard = hostPage.locator('.friend-quest', { hasText: title }).first();
  await expect(refreshedCard).toContainText('2/8 anggota');
  await expect(refreshedCard.locator('.friend-quest__member')).toHaveCount(2);
  await expect(refreshedCard.getByRole('button', { name: /Belum bisa diklaim/ })).toBeDisabled();

  expect(hostErrors).toEqual([]);
  expect(partnerErrors).toEqual([]);

  await partnerPage.close();
  await hostPage.close();
});
