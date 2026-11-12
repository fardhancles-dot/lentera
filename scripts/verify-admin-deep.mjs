/**
 * Deep Admin verification: question bank + media, users, gamification, social,
 * system permission matrix, and production maintenance mode.
 *
 * Uses a temporary developer account and a temporary player account, creates
 * isolated draft content, and cleans every row and storage object in `finally`.
 * The maintenance flag is always forced back to false.
 *
 *   node --env-file=.env scripts/verify-admin-deep.mjs http://localhost:5199
 */
import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';

const base = (process.argv[2] ?? 'http://localhost:5199').replace(/\/$/, '');
const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || (url ? new URL(url).hostname.split('.')[0] : '');

if (!url || !anonKey || !accessToken || !ref) {
  console.error('Env Supabase tidak lengkap untuk verifikasi admin.');
  process.exit(1);
}

const stamp = Date.now();
const suffix = String(stamp).slice(-8);
const devEmail = `dev-verify-${stamp}@example.com`;
const devPassword = `${randomBytes(18).toString('base64url')}Aa1!`;
const devUsername = `dev_${suffix}`;
const playerEmail = `player-verify-${stamp}@example.com`;
const playerPassword = `${randomBytes(18).toString('base64url')}Aa1!`;
const playerUsername = `ply_${suffix}`;
const subjectSlug = `deep-mapel-${stamp}`;
const courseSlug = `deep-kursus-${stamp}`;
const levelSlug = `deep-level-${stamp}`;
const unitSlug = `deep-unit-${stamp}`;
const lessonSlug = `deep-lesson-${stamp}`;
const questionPrompt = `Soal verifikasi bank soal ${suffix}`;
const questionPromptEdited = `${questionPrompt} edit`;
const mediaAlt = `Media verifikasi ${suffix}`;
const questCode = `verify-quest-${suffix}`;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

const failures = [];
const ok = (label, detail = '') => console.log(`ok   ${label}${detail ? ` — ${detail}` : ''}`);
const fail = (label, detail = '') => {
  failures.push(label);
  console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
};

async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Management API HTTP ${response.status}`);
  return response.json();
}

async function createUser(email, password, displayName, username, role) {
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: displayName } }),
  });
  if (!response.ok) throw new Error(`Gagal membuat akun ${username} (HTTP ${response.status})`);
  const created = await response.json();
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  const profile = await fetch(`${url}/rest/v1/profiles?id=eq.${created.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ username, display_name: displayName, onboarding_completed: true }),
  });
  if (!profile.ok) throw new Error(`Gagal menyiapkan profil ${username} (HTTP ${profile.status})`);
  if (role !== 'player') {
    const rolePatch = await fetch(`${url}/rest/v1/user_roles?user_id=eq.${created.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    });
    if (!rolePatch.ok) throw new Error(`Gagal memberi role ${role} (HTTP ${rolePatch.status})`);
  }
  return created.id;
}

async function login(page, email, password) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL((target) => !target.pathname.endsWith('/login'), { timeout: 25_000 });
  if (page.url().includes('/onboarding')) throw new Error(`Akun ${email} masih di onboarding`);
}

async function tokenFor(email, password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(`Login REST gagal (HTTP ${response.status})`);
  return body.access_token;
}

async function playerSettingsWrite(token) {
  return fetch(`${url}/rest/v1/user_settings?user_id=eq.${playerId}`, {
    method: 'PATCH',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ daily_goal_minutes: 15 }),
  });
}

const restHeaders = () => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
});

let serviceKey = '';
let devId = '';
let playerId = '';
let subjectId = '';
let lessonId = '';
let questionId = '';
let friendshipId = '';
let mediaId = '';
let mediaPath = '';
let browser;

try {
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!keysResponse.ok) throw new Error(`Gagal mengambil API keys (HTTP ${keysResponse.status})`);
  serviceKey = (await keysResponse.json()).find((key) => key.name === 'service_role')?.api_key ?? '';
  if (!serviceKey) throw new Error('service_role key tidak ditemukan');

  const initial = await sql('select maintenance_mode from public.site_settings where id');
  if (initial[0]?.maintenance_mode) {
    throw new Error('Maintenance mode sudah aktif sebelum pengujian; matikan dulu agar tidak mengganggu pemain.');
  }

  devId = await createUser(devEmail, devPassword, 'Developer Verifikasi', devUsername, 'developer');
  playerId = await createUser(playerEmail, playerPassword, 'Pemain Verifikasi', playerUsername, 'player');
  ok('akun developer dan pemain sementara dibuat', `${devUsername} / ${playerUsername}`);

  const hierarchy = await sql(`
    with s as (
      insert into public.subjects (slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
      values ('${subjectSlug}', 'Mapel Verifikasi Deep', 'Deep', 'Konten sementara verifikasi.', 'verifikasi', 'book', '#58CC02', 'development', false, 999)
      returning id
    ), c as (
      insert into public.courses (subject_id, slug, title, description, category, icon_key, sort_order, is_published)
      select id, '${courseSlug}', 'Kursus Verifikasi Deep', 'Konten sementara.', 'verifikasi', 'book', 1, false from s returning id
    ), lv as (
      insert into public.course_levels (course_id, slug, title, description, difficulty, sort_order, is_published)
      select id, '${levelSlug}', 'Level Verifikasi Deep', 'Konten sementara.', 'beginner', 1, false from c returning id
    ), u as (
      insert into public.units (course_level_id, slug, title, description, objectives, reward_coins, sort_order, is_published)
      select id, '${unitSlug}', 'Unit Verifikasi Deep', 'Konten sementara.', array[]::text[], 0, 1, false from lv returning id
    ), les as (
      insert into public.lessons (unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, hearts_enabled, sort_order, is_published)
      select id, '${lessonSlug}', 'Lesson Verifikasi Deep', 'Konten sementara.', 'lesson', 5, 10, 2, true, 1, false from u returning id
    )
    select (select id from s) as subject_id, (select id from les) as lesson_id;
  `);
  subjectId = hierarchy[0].subject_id;
  lessonId = hierarchy[0].lesson_id;
  ok('hierarki draft terisolasi dibuat untuk bank soal');

  const friendship = await sql(`
    insert into public.friendships (requester_id, addressee_id, status, responded_at)
    values ('${devId}', '${playerId}', 'accepted', now())
    returning id;
  `);
  friendshipId = friendship[0].id;
  ok('relasi pertemanan uji dibuat untuk moderasi');

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
  const errors = [];
  context.on('page', (page) => {
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
  });
  const page = await context.newPage();

  await login(page, devEmail, devPassword);
  ok('login developer berhasil', new URL(page.url()).pathname);

  // -------------------------------------------------------------------------
  // Media upload
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/media`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Unggah media' }).waitFor({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Unggah media' }).click();
  let dialog = page.getByRole('dialog', { name: 'Unggah media' });
  await dialog.locator('input[name="file"]').setInputFiles({ name: 'verifikasi.png', mimeType: 'image/png', buffer: png });
  await dialog.locator('input[name="alt"]').fill(mediaAlt);
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 30_000 });
  const mediaCard = page.locator('.admin-media-card').filter({ hasText: mediaAlt }).first();
  await mediaCard.waitFor({ timeout: 20_000 });
  const mediaRows = await sql(
    `select id, storage_path, url, status from public.media_assets where alt_text = '${mediaAlt}'`,
  );
  if (mediaRows.length === 1 && mediaRows[0].status === 'active') {
    mediaId = mediaRows[0].id;
    mediaPath = mediaRows[0].storage_path;
    ok('upload media lewat UI tersimpan di storage + database', mediaRows[0].storage_path);
  } else {
    fail('upload media lewat UI tersimpan di storage + database', JSON.stringify(mediaRows));
  }

  // -------------------------------------------------------------------------
  // Question bank CRUD
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/questions`, { waitUntil: 'domcontentloaded' });
  await page.locator('select[name="lesson"]').waitFor({ timeout: 20_000 });
  await page.locator('select[name="lesson"]').selectOption(lessonId);
  await page.getByRole('button', { name: 'Tambah soal' }).waitFor({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Tambah soal' }).click();
  dialog = page.getByRole('dialog', { name: 'Tambah soal' });
  await dialog.locator('select[name="lessonId"]').selectOption(lessonId);
  await dialog.locator('textarea[name="prompt"]').fill(questionPrompt);
  await dialog.locator('textarea[name="explanation"]').fill('Penjelasan verifikasi.');
  const optionLabels = dialog.locator('input[name="optionLabel"]');
  await optionLabels.nth(0).fill('Pilihan benar');
  await optionLabels.nth(1).fill('Pilihan salah');
  await dialog.getByRole('button', { name: 'Tambah media' }).click();
  const mediaRow = dialog.locator('.admin-media-row').last();
  await mediaRow.getByRole('button', { name: 'Library' }).click();
  const picker = page.getByRole('dialog', { name: 'Pilih media' });
  await picker.locator('.admin-media-card--pick').filter({ hasText: mediaAlt }).first().click({ timeout: 20_000 });
  await picker.waitFor({ state: 'detached', timeout: 10_000 });
  const pickedUrl = await mediaRow.locator('input[name="mediaUrl"]').inputValue();
  if (pickedUrl && pickedUrl.includes('content-media')) ok('media picker mengisi URL soal');
  else fail('media picker mengisi URL soal', pickedUrl);
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 25_000 });
  await page.getByText(questionPrompt, { exact: false }).first().waitFor({ timeout: 20_000 });
  ok('create soal lewat UI');

  const questionRows = await sql(
    `select id, prompt, is_active from public.questions where lesson_id = '${lessonId}'`,
  );
  if (questionRows.length === 1 && questionRows[0].is_active) {
    questionId = questionRows[0].id;
    ok('soal tersimpan di database', questionId.slice(0, 8));
  } else {
    fail('soal tersimpan di database', JSON.stringify(questionRows));
  }
  if (questionId) {
    const detail = await sql(`
      select
        (select count(*)::int from public.question_options where question_id = '${questionId}') as options,
        (select count(*)::int from public.question_options where question_id = '${questionId}' and is_correct) as correct,
        (select count(*)::int from public.question_media where question_id = '${questionId}') as media
    `);
    if (detail[0]?.options === 2 && detail[0]?.correct === 1 && detail[0]?.media === 1) {
      ok('pilihan, kunci, dan media soal tersimpan', JSON.stringify(detail[0]));
    } else {
      fail('pilihan, kunci, dan media soal tersimpan', JSON.stringify(detail[0]));
    }
  }

  const questionRow = page.locator('tr').filter({ hasText: questionPrompt }).first();
  await questionRow.getByRole('button', { name: 'Edit' }).click();
  dialog = page.getByRole('dialog', { name: 'Edit soal' });
  await dialog.locator('textarea[name="prompt"]').fill(questionPromptEdited);
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 25_000 });
  const editedQuestion = await sql(`select prompt from public.questions where id = '${questionId}'`);
  if (editedQuestion[0]?.prompt === questionPromptEdited) ok('update soal lewat UI');
  else fail('update soal lewat UI', JSON.stringify(editedQuestion));

  const editedRow = page.locator('tr').filter({ hasText: questionPromptEdited }).first();
  await editedRow.getByRole('button', { name: 'Arsipkan' }).click();
  let reasonDialog = page.getByRole('dialog', { name: 'Arsipkan soal' });
  await reasonDialog.locator('textarea[name="reason"]').fill('Verifikasi arsip soal');
  await reasonDialog.getByRole('button', { name: 'Arsipkan', exact: true }).click();
  await reasonDialog.waitFor({ state: 'detached', timeout: 20_000 });
  const archivedQuestion = await sql(`select is_active from public.questions where id = '${questionId}'`);
  if (archivedQuestion[0]?.is_active === false) ok('arsip soal lewat UI');
  else fail('arsip soal lewat UI', JSON.stringify(archivedQuestion));

  // -------------------------------------------------------------------------
  // Users: detail + reward center
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/users`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="user-search"]').waitFor({ timeout: 20_000 });
  await page.locator('input[name="user-search"]').fill(playerUsername);
  await page.waitForTimeout(700);
  const userRow = page.locator('tr').filter({ hasText: playerUsername }).first();
  await userRow.waitFor({ timeout: 20_000 });
  await userRow.getByRole('button', { name: 'Detail' }).click();
  await page.locator('.admin-user-detail').waitFor({ timeout: 20_000 });
  const detailName = (await page.locator('.admin-user-detail h2').textContent())?.trim();
  if (detailName === 'Pemain Verifikasi') ok('detail pengguna terbuka');
  else fail('detail pengguna terbuka', String(detailName));
  await page.getByRole('button', { name: 'Kirim hadiah' }).click();
  dialog = page.getByRole('dialog', { name: 'Reward Center' });
  await dialog.locator('input[name="coins"]').fill('3');
  await dialog.locator('input[name="xp"]').fill('7');
  await dialog.locator('input[name="reason"]').fill('Verifikasi Reward Center');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  const reward = await sql(`
    select
      (select count(*)::int from public.coin_transactions where user_id = '${playerId}' and amount = 3) as coins,
      (select count(*)::int from public.user_xp_ledger where user_id = '${playerId}' and amount = 7) as xp
  `);
  if (reward[0]?.coins === 1 && reward[0]?.xp === 1) ok('Reward Center menulis ledger koin + XP');
  else fail('Reward Center menulis ledger koin + XP', JSON.stringify(reward[0]));

  // -------------------------------------------------------------------------
  // Gamification: tabs + temporary inactive quest
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/gamification`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Tambah', exact: true }).waitFor({ timeout: 20_000 });
  for (const tab of ['Quest & Misi', 'Achievement', 'Toko', 'Level Pemain', 'Streak', 'Liga', 'Event']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await page.waitForTimeout(250);
    const headingCount = await page.getByText(tab, { exact: true }).count();
    if (headingCount >= 2) ok(`tab gamifikasi ${tab} dirender`);
    else fail(`tab gamifikasi ${tab} dirender`, `teks ditemukan ${headingCount}x`);
  }
  await page.getByRole('button', { name: 'Quest & Misi', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Tambah Quest & Misi' });
  await dialog.locator('input[name="code"]').fill(questCode);
  await dialog.locator('input[name="title"]').fill(`Quest Verifikasi ${suffix}`);
  await dialog.locator('select[name="cadence"]').selectOption('weekly');
  await dialog.locator('select[name="metric"]').selectOption('xp');
  await dialog.locator('input[name="target"]').fill('1');
  await dialog.locator('input[name="rewardCoins"]').fill('1');
  await dialog.locator('input[name="icon"]').fill('target');
  await dialog.locator('input[name="sortOrder"]').fill('9999');
  await dialog.locator('textarea[name="description"]').fill('Quest sementara verifikasi.');
  await dialog.locator('input[name="isActive"]').uncheck();
  await dialog.locator('input[name="reason"]').fill('Verifikasi katalog gamifikasi');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  const quest = await sql(`select is_active from public.quest_definitions where code = '${questCode}'`);
  if (quest[0]?.is_active === false) ok('create quest nonaktif lewat UI');
  else fail('create quest nonaktif lewat UI', JSON.stringify(quest));

  // -------------------------------------------------------------------------
  // Social: moderation of the seeded friendship
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/social`, { waitUntil: 'domcontentloaded' });
  const socialRow = page.locator('tr').filter({ hasText: playerUsername }).filter({ hasText: devUsername }).first();
  await socialRow.waitFor({ timeout: 20_000 });
  await socialRow.getByRole('button', { name: 'Hapus relasi' }).click();
  reasonDialog = page.getByRole('dialog', { name: 'Moderasi pertemanan' });
  await reasonDialog.locator('textarea[name="reason"]').fill('Verifikasi moderasi pertemanan');
  await reasonDialog.getByRole('button', { name: 'Hapus relasi', exact: true }).click();
  await reasonDialog.waitFor({ state: 'detached', timeout: 20_000 });
  await socialRow.waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
  const friendshipLeft = await sql(`select count(*)::int as count from public.friendships where id = '${friendshipId}'`);
  if (friendshipLeft[0]?.count === 0) ok('moderasi pertemanan lewat UI');
  else fail('moderasi pertemanan lewat UI', JSON.stringify(friendshipLeft));

  // -------------------------------------------------------------------------
  // System: developer sees editable matrix and can toggle admin permission
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/system`, { waitUntil: 'domcontentloaded' });
  const analyticsToggle = page.locator('input[aria-label="Izin admin Lihat analytics"]');
  await analyticsToggle.waitFor({ timeout: 20_000 });
  if (await analyticsToggle.isEnabled()) ok('developer mendapat matriks izin yang dapat diedit');
  else fail('developer mendapat matriks izin yang dapat diedit');
  await analyticsToggle.uncheck();
  await page.waitForTimeout(1000);
  const removedPermission = await sql(
    `select count(*)::int as count from public.role_permissions where role = 'admin' and permission = 'analytics.read'`,
  );
  if (removedPermission[0]?.count === 0) ok('cabut izin admin lewat matriks');
  else fail('cabut izin admin lewat matriks', JSON.stringify(removedPermission));
  await analyticsToggle.check();
  await page.waitForTimeout(1000);
  const restoredPermission = await sql(
    `select count(*)::int as count from public.role_permissions where role = 'admin' and permission = 'analytics.read'`,
  );
  if (restoredPermission[0]?.count === 1) ok('kembalikan izin admin lewat matriks');
  else fail('kembalikan izin admin lewat matriks', JSON.stringify(restoredPermission));
  const auditText = await page.locator('.admin-panel').filter({ hasText: 'Append-only' }).textContent();
  if (auditText?.includes(devUsername)) ok('audit log menampilkan aktivitas developer uji');
  else fail('audit log menampilkan aktivitas developer uji');

  // -------------------------------------------------------------------------
  // Maintenance mode: ON -> player write blocked, read allowed, banner visible
  // -------------------------------------------------------------------------
  const playerToken = await tokenFor(playerEmail, playerPassword);
  await page.goto(`${base}/admin/website`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="maintenanceMode"]').waitFor({ timeout: 20_000 });
  await page.locator('input[name="maintenanceMode"]').check();
  await page.locator('input[name="reason"]').fill('Verifikasi maintenance mode production');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await page.waitForTimeout(1200);
  const enabled = await sql('select maintenance_mode from public.site_settings where id');
  if (enabled[0]?.maintenance_mode) ok('maintenance mode diaktifkan lewat UI');
  else fail('maintenance mode diaktifkan lewat UI', JSON.stringify(enabled));

  const blocked = await playerSettingsWrite(playerToken);
  const blockedBody = await blocked.json().catch(() => ({}));
  if (!blocked.ok && String(blockedBody.message ?? '').includes('pemeliharaan')) {
    ok('tulis pemain ditolak saat maintenance', `HTTP ${blocked.status}`);
  } else {
    fail('tulis pemain ditolak saat maintenance', `HTTP ${blocked.status} ${JSON.stringify(blockedBody)}`);
  }

  const readResponse = await fetch(`${url}/rest/v1/rpc/get_public_site_content`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const readBody = await readResponse.json().catch(() => ({}));
  if (readResponse.ok && readBody?.settings?.siteName) {
    ok('baca konten publik tetap tersedia saat maintenance', readBody.settings.siteName);
  } else {
    fail('baca konten publik tetap tersedia saat maintenance', `HTTP ${readResponse.status}`);
  }

  const playerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const playerPage = await playerContext.newPage();
  try {
    await login(playerPage, playerEmail, playerPassword);
    await playerPage.goto(`${base}/app`, { waitUntil: 'domcontentloaded' });
    await playerPage.locator('.site-announcement--maintenance').waitFor({ timeout: 15_000 });
    ok('banner maintenance tampil untuk pemain');
  } catch (error) {
    fail('banner maintenance tampil untuk pemain', error instanceof Error ? error.message : String(error));
  }

  await page.goto(`${base}/admin/website`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="maintenanceMode"]').waitFor({ timeout: 20_000 });
  await page.locator('input[name="maintenanceMode"]').uncheck();
  await page.locator('input[name="reason"]').fill('Selesai verifikasi maintenance mode');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await page.waitForTimeout(1200);
  const disabled = await sql('select maintenance_mode from public.site_settings where id');
  if (disabled[0]?.maintenance_mode === false) ok('maintenance mode dimatikan lewat UI');
  else fail('maintenance mode dimatikan lewat UI', JSON.stringify(disabled));

  const allowed = await playerSettingsWrite(playerToken);
  if (allowed.ok) ok('tulis pemain kembali normal setelah maintenance');
  else fail('tulis pemain kembali normal setelah maintenance', `HTTP ${allowed.status}`);

  if (errors.length === 0) ok('tidak ada console error selama alur developer');
  else fail('tidak ada console error selama alur developer', errors.slice(0, 3).join(' | '));
} catch (error) {
  fail('verifikasi deep berhenti', error instanceof Error ? error.message : String(error));
  if (browser) {
    const pages = browser.contexts().flatMap((context) => context.pages());
    if (pages[0]) {
      await pages[0].screenshot({ path: 'test-results/admin-deep-failure.png' }).catch(() => {});
    }
  }
} finally {
  try {
    await sql('update public.site_settings set maintenance_mode = false where id');
    const flag = await sql('select maintenance_mode from public.site_settings where id');
    if (flag[0]?.maintenance_mode === false) ok('maintenance dipastikan nonaktif');
    else fail('maintenance dipastikan nonaktif', JSON.stringify(flag));
  } catch (error) {
    fail('maintenance dipastikan nonaktif', error instanceof Error ? error.message : String(error));
  }

  try {
    if (friendshipId) await sql(`delete from public.friendships where id = '${friendshipId}'`);
    await sql(`delete from public.quest_definitions where code = '${questCode}'`);
    if (subjectId) await sql(`delete from public.subjects where id = '${subjectId}'`);
    if (mediaId) await sql(`delete from public.media_assets where id = '${mediaId}'`);
    await sql(`
      insert into public.role_permissions (role, permission)
      values ('admin', 'analytics.read')
      on conflict do nothing
    `);
    const safeLesson = lessonId || '00000000-0000-0000-0000-000000000000';
    const leftover = await sql(`
      select
        (select count(*)::int from public.subjects where slug = '${subjectSlug}') as subjects,
        (select count(*)::int from public.questions where lesson_id = '${safeLesson}') as questions,
        (select count(*)::int from public.quest_definitions where code = '${questCode}') as quests,
        (select count(*)::int from public.friendships where id = coalesce(nullif('${friendshipId}', '')::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) as friendships,
        (select count(*)::int from public.media_assets where alt_text = '${mediaAlt}') as media,
        (select count(*)::int from public.role_permissions where role = 'admin' and permission = 'analytics.read') as analytics
    `);
    const rows = leftover[0];
    if (
      rows.subjects === 0 && rows.questions === 0 && rows.quests === 0 &&
      rows.friendships === 0 && rows.media === 0 && rows.analytics === 1
    ) {
      ok('data uji database dibersihkan', JSON.stringify(rows));
    } else {
      fail('data uji database dibersihkan', JSON.stringify(rows));
    }
  } catch (error) {
    fail('data uji database dibersihkan', error instanceof Error ? error.message : String(error));
  }

  if (mediaPath && serviceKey) {
    try {
      const encoded = mediaPath.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`${url}/storage/v1/object/content-media/${encoded}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (response.ok || response.status === 404) ok('objek media di storage dihapus');
      else fail('objek media di storage dihapus', `HTTP ${response.status}`);
    } catch (error) {
      fail('objek media di storage dihapus', error instanceof Error ? error.message : String(error));
    }
  }

  for (const [id, label] of [[devId, 'developer'], [playerId, 'pemain']]) {
    if (!id || !serviceKey) continue;
    try {
      const response = await fetch(`${url}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (response.ok) ok(`akun ${label} uji dihapus`);
      else fail(`akun ${label} uji dihapus`, `HTTP ${response.status}`);
    } catch (error) {
      fail(`akun ${label} uji dihapus`, error instanceof Error ? error.message : String(error));
    }
  }
  if (browser) await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verifikasi gagal.`);
  process.exitCode = 1;
} else {
  console.log('\nSemua verifikasi admin mendalam lulus.');
}
