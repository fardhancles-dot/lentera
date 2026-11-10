import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  adminAccount,
  createTemporaryUser,
  deleteTemporaryUser,
  type AdminAccount,
} from './admin';
import { collectPageErrors, login, type Credentials } from './helpers';

const TITLE_PREFIX = 'E2E Quest';
const REWARD_XP = 5;
const REWARD_COINS = 1;
const TARGET_XP = 20;

/**
 * Dua jalur:
 * - E2E_FRIEND_EMAIL/_PASSWORD + E2E_FRIEND_EMAIL_2/_PASSWORD_2 (akun nyata milik
 *   pemilik proyek) dipakai bila keempatnya tersedia.
 * - Tanpa itu, test membuat dua akun sementara lewat Admin API. Keduanya dihapus di
 *   finally, sehingga data pengguna asli tidak tersentuh.
 *
 * Semua progres dibuat lewat RPC server yang sama dengan aplikasi; browser hanya
 * dipakai untuk membuat/melihat quest dan mengklaim hadiah.
 */

type Pair = { host: Credentials; partner: Credentials; disposable: boolean };

function envPair(): Pair | null {
  const host = {
    email: (process.env.E2E_FRIEND_EMAIL ?? '').trim(),
    password: (process.env.E2E_FRIEND_PASSWORD ?? '').trim(),
  };
  const partner = {
    email: (process.env.E2E_FRIEND_EMAIL_2 ?? '').trim(),
    password: (process.env.E2E_FRIEND_PASSWORD_2 ?? '').trim(),
  };
  return host.email && host.password && partner.email && partner.password
    ? { host, partner, disposable: false }
    : null;
}

async function temporaryPair(admin: AdminAccount): Promise<Pair & { ids: string[] }> {
  const stamp = `${Date.now()}.${randomUUID().slice(0, 8)}`;
  const host = { email: `qa.fq.host.${stamp}@lentera.test`, password: `Uji-${randomUUID()}` };
  const partner = { email: `qa.fq.partner.${stamp}@lentera.test`, password: `Uji-${randomUUID()}` };
  const hostUser = await createTemporaryUser(admin, host.email, host.password, true);
  try {
    const partnerUser = await createTemporaryUser(admin, partner.email, partner.password, true);
    return { host, partner, disposable: true, ids: [hostUser.id, partnerUser.id] };
  } catch (error) {
    await deleteTemporaryUser(admin, hostUser.id);
    throw error;
  }
}

async function cleanupTestQuests(): Promise<void> {
  const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
  const ref =
    (process.env.SUPABASE_PROJECT_REF ?? '').trim() ||
    (process.env.VITE_SUPABASE_URL ?? '').match(
      /^https?:\/\/([a-z0-9-]+)\.supabase\.co/i,
    )?.[1];
  if (!token || !ref) return;

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `delete from public.friend_quests where title like '${TITLE_PREFIX} %';`,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    console.warn(`[e2e] cleanup Friends Quest dilewati: HTTP ${response.status} ${detail}`);
  }
}

async function accessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    for (const [key, value] of Object.entries(localStorage)) {
      if (!key.includes('-auth-token')) continue;
      try {
        const parsed = JSON.parse(value) as { access_token?: string };
        if (parsed.access_token) return parsed.access_token;
      } catch {
        // Bukan sesi Supabase; lanjut.
      }
    }
    return '';
  });
  expect(token, 'sesi Supabase tersedia di browser').not.toBe('');
  return token;
}

type RpcResult<T> = { data: T | null; status: number; error: string | null };

async function rpc<T>(
  page: Page,
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const response = await page.request.post(`${url}/rest/v1/rpc/${name}`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: args,
  });
  const body = await response.text();
  let data: T | null = null;
  let error: string | null = null;
  try {
    const parsed = JSON.parse(body) as T & { message?: string; details?: string };
    if (response.ok()) data = parsed;
    else error = parsed.message ?? parsed.details ?? body.slice(0, 200);
  } catch {
    if (!response.ok()) error = body.slice(0, 200);
  }
  return { data, status: response.status(), error };
}

async function restGet<T>(page: Page, token: string, path: string): Promise<T> {
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const response = await page.request.get(`${url}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `GET ${path} berhasil`).toBeTruthy();
  return (await response.json()) as T;
}

async function coins(page: Page, token: string): Promise<number> {
  const rows = await restGet<{ coins: number }[]>(page, token, 'user_wallets?select=coins');
  return rows[0]?.coins ?? 0;
}

/** English → Indonesian pairs used by match madness in the seeded curriculum. */
const MEANINGS = new Map([
  ['apple', 'apel'],
  ['book', 'buku'],
  ['house', 'rumah'],
  ['water', 'air'],
  ['pencil', 'pensil'],
  ['teacher', 'guru'],
  ['classroom', 'ruang kelas'],
  ['homework', 'pekerjaan rumah'],
  ['library', 'perpustakaan'],
  ['chair', 'kursi'],
  ['read', 'membaca'],
  ['write', 'menulis'],
  ['listen', 'mendengarkan'],
  ['speak', 'berbicara'],
  ['study', 'belajar'],
]);

type PracticeQuestion = {
  id: string;
  leftItems: { id: string; label: string }[];
  rightItems: { id: string; label: string }[];
};

/** Menyelesaikan satu sesi match madness dengan jawaban benar lewat RPC server. */
async function completeMatchMadness(page: Page, token: string): Promise<number> {
  const courses = await restGet<{ id: string }[]>(
    page,
    token,
    'courses?select=id&slug=eq.bahasa-inggris&limit=1',
  );
  expect(courses[0]?.id, 'course bahasa-inggris tersedia').toBeTruthy();

  const start = await rpc<{
    sessionId: string;
    questions: PracticeQuestion[];
  }>(page, token, 'start_practice', {
    p_mode: 'match_madness',
    p_course_id: courses[0]!.id,
  });
  expect(start.error, 'start_practice').toBeNull();
  expect(start.data?.sessionId).toBeTruthy();

  for (const question of start.data!.questions) {
    const matches = question.leftItems.map((left) => {
      const right = question.rightItems.find((item) => item.label === MEANINGS.get(left.label));
      expect(right, `pasangan untuk "${left.label}"`).toBeTruthy();
      return { leftId: left.id, rightId: right!.id };
    });
    const answer = await rpc<{ isCorrect: boolean }>(page, token, 'submit_practice_answer', {
      p_session_id: start.data!.sessionId,
      p_question_id: question.id,
      p_answer: { matches },
      p_elapsed_ms: 1200,
    });
    expect(answer.error, 'submit_practice_answer').toBeNull();
    expect(answer.data?.isCorrect, `jawaban ${question.id} dinilai benar`).toBeTruthy();
  }

  const complete = await rpc<{ xpAwarded: number }>(
    page,
    token,
    'complete_practice_session',
    { p_session_id: start.data!.sessionId },
  );
  expect(complete.error, 'complete_practice_session').toBeNull();
  expect(complete.data?.xpAwarded ?? 0).toBeGreaterThan(0);
  return complete.data!.xpAwarded;
}

test.beforeAll(async () => {
  await cleanupTestQuests();
});

test.afterAll(async () => {
  await cleanupTestQuests();
});

test('two accounts contribute, sync, and claim one Friends Quest reward each', async ({
  browser,
}) => {
  const admin = await adminAccount();
  let pair = envPair();
  let temporary: string[] = [];

  if (!pair) {
    test.skip(!admin, 'Isi E2E_FRIEND_* atau SUPABASE_ACCESS_TOKEN untuk uji dua akun');
    if (!admin) return;
    const created = await temporaryPair(admin);
    pair = created;
    temporary = created.ids;
  }

  const title = `${TITLE_PREFIX} ${Date.now()}`;
  const hostPage = await browser.newPage();
  const partnerPage = await browser.newPage();
  const hostErrors = collectPageErrors(hostPage);
  const partnerErrors = collectPageErrors(partnerPage);

  try {
    const hostLogin = await login(hostPage, pair.host);
    expect(hostLogin.ok, hostLogin.ok ? '' : hostLogin.reason).toBeTruthy();
    const partnerLogin = await login(partnerPage, pair.partner);
    expect(partnerLogin.ok, partnerLogin.ok ? '' : partnerLogin.reason).toBeTruthy();

    const hostToken = await accessToken(hostPage);
    const partnerToken = await accessToken(partnerPage);

    // 1. Pembuat membuat quest lewat UI.
    await hostPage.goto('/friends-quest');
    await hostPage.locator('input[name="quest-title"]').fill(title);
    await hostPage.locator('input[name="quest-target"]').fill(String(TARGET_XP));
    await hostPage.locator('input[name="quest-reward-xp"]').fill(String(REWARD_XP));
    await hostPage.locator('input[name="quest-reward-coins"]').fill(String(REWARD_COINS));
    await hostPage.getByRole('button', { name: 'Buat quest' }).click();

    const hostCard = hostPage.locator('.friend-quest', { hasText: title }).first();
    await expect(hostCard).toBeVisible({ timeout: 30_000 });
    await expect(hostCard).toContainText('1/8 anggota');
    const code = (await hostCard.locator('.friend-quest__code').innerText()).trim();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    const questId = await (async () => {
      const list = await rpc<{ id: string; code: string }[]>(
        hostPage,
        hostToken,
        'get_my_friend_quests',
        {},
      );
      expect(list.error).toBeNull();
      return list.data!.find((quest) => quest.code === code)?.id ?? '';
    })();
    expect(questId, 'quest baru ada di daftar server').toBeTruthy();

    // 2. Akun kedua bergabung lewat UI.
    await partnerPage.goto('/friends-quest');
    await partnerPage.locator('input[name="quest-code"]').fill(code);
    await partnerPage.getByRole('button', { name: 'Gabung quest' }).click();
    const partnerCard = partnerPage.locator('.friend-quest', { hasText: title }).first();
    await expect(partnerCard).toBeVisible({ timeout: 30_000 });
    await expect(partnerCard).toContainText('2/8 anggota');
    await expect(partnerCard.getByRole('button', { name: /Belum bisa diklaim/ })).toBeDisabled();

    // 3. Kedua akun benar-benar belajar lewat server. Dua sesi per akun supaya
    //    masing-masing pasti menyumbang sebelum target 20 XP tercapai.
    const hostXp = (await completeMatchMadness(hostPage, hostToken)) +
      (await completeMatchMadness(hostPage, hostToken));
    const partnerXp = (await completeMatchMadness(partnerPage, partnerToken)) +
      (await completeMatchMadness(partnerPage, partnerToken));
    // Satu sesi match madness sempurna memberi 6 XP. Dua sesi per akun (12 XP)
    // membuat host belum menyelesaikan target 20 XP, sehingga kontribusi akun
    // kedua benar-benar ikut dihitung sebelum quest selesai.
    expect(hostXp).toBeGreaterThan(0);
    expect(partnerXp).toBeGreaterThan(0);
    expect(hostXp + partnerXp).toBeGreaterThanOrEqual(TARGET_XP);

    // 4. Progres tersinkron di kedua sisi setelah refresh.
    await hostPage.reload();
    const completedCard = hostPage.locator('.friend-quest', { hasText: title }).first();
    await expect(completedCard).toContainText(`${hostXp + partnerXp} / ${TARGET_XP} XP`, {
      timeout: 30_000,
    });
    await expect(completedCard).toContainText('Selesai');
    await expect(completedCard.getByRole('button', { name: 'Klaim hadiah' })).toBeEnabled();
    await expect(completedCard.locator('.friend-quest__member')).toHaveCount(2);

    await partnerPage.reload();
    const partnerCompleted = partnerPage.locator('.friend-quest', { hasText: title }).first();
    await expect(partnerCompleted).toContainText('Selesai', { timeout: 30_000 });
    await expect(partnerCompleted.getByRole('button', { name: 'Klaim hadiah' })).toBeEnabled();
    await expect(partnerCompleted).toContainText(`${hostXp + partnerXp} / ${TARGET_XP} XP`);

    // 5. Klaim bersamaan: tepat satu hadiah, yang kedua idempoten.
    const hostCoinsBefore = await coins(hostPage, hostToken);
    const concurrent = await Promise.all([
      rpc<{ alreadyClaimed: boolean; xpAwarded: number; coinsAwarded: number }>(
        hostPage,
        hostToken,
        'claim_friend_quest_reward',
        { p_quest_id: questId },
      ),
      rpc<{ alreadyClaimed: boolean; xpAwarded: number; coinsAwarded: number }>(
        hostPage,
        hostToken,
        'claim_friend_quest_reward',
        { p_quest_id: questId },
      ),
    ]);
    expect(concurrent.map((result) => result.error)).toEqual([null, null]);
    const awarded = concurrent.filter((result) => result.data?.alreadyClaimed === false);
    const repeated = concurrent.filter((result) => result.data?.alreadyClaimed === true);
    expect(awarded).toHaveLength(1);
    expect(repeated).toHaveLength(1);
    expect(awarded[0]!.data!.xpAwarded).toBe(REWARD_XP);
    expect(awarded[0]!.data!.coinsAwarded).toBe(REWARD_COINS);
    expect(repeated[0]!.data!.xpAwarded).toBe(0);
    expect(await coins(hostPage, hostToken)).toBe(hostCoinsBefore + REWARD_COINS);

    // Klaim ketiga tetap tidak menambah apa pun.
    const third = await rpc<{ alreadyClaimed: boolean; xpAwarded: number }>(
      hostPage,
      hostToken,
      'claim_friend_quest_reward',
      { p_quest_id: questId },
    );
    expect(third.data?.alreadyClaimed).toBe(true);
    expect(third.data?.xpAwarded).toBe(0);
    expect(await coins(hostPage, hostToken)).toBe(hostCoinsBefore + REWARD_COINS);

    // 6. Akun kedua mengklaim lewat UI, lalu tidak bisa mengklaim lagi.
    const partnerCoinsBefore = await coins(partnerPage, partnerToken);
    await partnerCompleted.getByRole('button', { name: 'Klaim hadiah' }).click();
    await expect(partnerPage.getByText(/Hadiah diterima:/)).toBeVisible({ timeout: 15_000 });
    await expect(
      partnerPage
        .locator('.friend-quest', { hasText: title })
        .getByRole('button', { name: /Hadiah sudah diklaim/ }),
    ).toBeDisabled();
    expect(await coins(partnerPage, partnerToken)).toBe(partnerCoinsBefore + REWARD_COINS);

    const partnerRepeat = await rpc<{ alreadyClaimed: boolean; xpAwarded: number }>(
      partnerPage,
      partnerToken,
      'claim_friend_quest_reward',
      { p_quest_id: questId },
    );
    expect(partnerRepeat.data?.alreadyClaimed).toBe(true);
    expect(partnerRepeat.data?.xpAwarded).toBe(0);

    // 7. Refresh dan login ulang mempertahankan progres.
    await hostPage.reload();
    await expect(
      hostPage.locator('.friend-quest', { hasText: title }).first(),
    ).toContainText('Hadiah sudah diklaim', { timeout: 30_000 });

    const relogin = await browser.newPage();
    const reloginErrors = collectPageErrors(relogin);
    await login(relogin, pair.partner);
    await relogin.goto('/friends-quest');
    const persisted = relogin.locator('.friend-quest', { hasText: title }).first();
    await expect(persisted).toContainText('Selesai', { timeout: 30_000 });
    await expect(persisted).toContainText(`${hostXp + partnerXp} / ${TARGET_XP} XP`);
    await expect(
      persisted.getByRole('button', { name: /Hadiah sudah diklaim/ }),
    ).toBeDisabled();
    expect(reloginErrors).toEqual([]);
    await relogin.close();

    // 8. Keamanan: non-anggota tidak dapat melihat atau mengklaim quest.
    const guard = await rpc<{ id: string }>(hostPage, hostToken, 'create_friend_quest', {
      p_title: `${TITLE_PREFIX} Guard ${Date.now()}`,
      p_target_xp: 1000,
      p_reward_xp: 0,
      p_reward_coins: 0,
    });
    expect(guard.error).toBeNull();
    expect(guard.data?.id).toBeTruthy();

    const partnerList = await rpc<{ id: string }[]>(
      partnerPage,
      partnerToken,
      'get_my_friend_quests',
      {},
    );
    expect(partnerList.data?.some((quest) => quest.id === guard.data!.id)).toBe(false);
    const nonMemberClaim = await rpc<unknown>(
      partnerPage,
      partnerToken,
      'claim_friend_quest_reward',
      { p_quest_id: guard.data!.id },
    );
    expect(nonMemberClaim.status).toBeGreaterThanOrEqual(400);
    expect(nonMemberClaim.error).toContain('friend_quest_not_member');

    // 9. Keamanan: judul quest yang memuat HTML tidak boleh dieksekusi saat toast
    //    bergabung menampilkannya (regresi XSS pada showToast).
    const xssTitle = `${TITLE_PREFIX} <img src=x onerror=window.__fqXss=1>`;
    const xssQuest = await rpc<{ id: string; code: string }>(
      hostPage,
      hostToken,
      'create_friend_quest',
      {
        p_title: xssTitle,
        p_target_xp: 100,
        p_reward_xp: 0,
        p_reward_coins: 0,
      },
    );
    expect(xssQuest.error).toBeNull();
    await partnerPage.locator('input[name="quest-code"]').fill(xssQuest.data!.code);
    await partnerPage.getByRole('button', { name: 'Gabung quest' }).click();
    await expect(partnerPage.locator('.toast', { hasText: xssTitle })).toBeVisible({
      timeout: 15_000,
    });
    expect(
      await partnerPage.evaluate(
        () => (window as unknown as { __fqXss?: number }).__fqXss,
      ),
    ).toBeUndefined();

    // 10. Keamanan: kontribusi tidak bisa diubah langsung lewat PostgREST.
    const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
    const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
    const tamper = await partnerPage.request.patch(
      `${url}/rest/v1/friend_quest_members?quest_id=eq.${questId}`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${partnerToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        data: { contribution_xp: 9999 },
      },
    );
    expect(tamper.status()).toBeGreaterThanOrEqual(400);
    const afterTamper = await rpc<{ id: string; totalXp: number }[]>(
      hostPage,
      hostToken,
      'get_my_friend_quests',
      {},
    );
    expect(afterTamper.data?.find((quest) => quest.id === questId)?.totalXp).toBe(
      hostXp + partnerXp,
    );

    // 11. Penyelesaian sesi yang sama tidak menambah XP/contribution dua kali.
    const listBefore = await rpc<{ id: string; totalXp: number }[]>(
      hostPage,
      hostToken,
      'get_my_friend_quests',
      {},
    );
    const beforeTotal = listBefore.data?.find((quest) => quest.id === questId)?.totalXp;
    const duplicate = await rpc<{ xpAwarded: number }>(
      hostPage,
      hostToken,
      'complete_practice_session',
      { p_session_id: (await latestPracticeSession(hostPage, hostToken)) ?? '' },
    );
    // Sesi terakhir host sudah selesai; RPC harus menolak/mengembalikan 0.
    if (!duplicate.error) expect(duplicate.data?.xpAwarded ?? 0).toBe(0);
    const listAfter = await rpc<{ id: string; totalXp: number }[]>(
      hostPage,
      hostToken,
      'get_my_friend_quests',
      {},
    );
    expect(listAfter.data?.find((quest) => quest.id === questId)?.totalXp).toBe(beforeTotal);

    expect(hostErrors).toEqual([]);
    expect(partnerErrors).toEqual([]);
  } finally {
    await hostPage.close();
    await partnerPage.close();
    if (temporary.length && admin) {
      for (const id of temporary) await deleteTemporaryUser(admin, id);
    }
  }
});

/** ID sesi latihan terakhir host, untuk menguji penyelesaian ulang. */
async function latestPracticeSession(page: Page, token: string): Promise<string | null> {
  const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const response = await page.request.get(
    `${url}/rest/v1/practice_sessions?select=id&order=started_at.desc&limit=1`,
    { headers: { apikey: anon, Authorization: `Bearer ${token}` } },
  );
  if (!response.ok()) return null;
  const rows = (await response.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}
