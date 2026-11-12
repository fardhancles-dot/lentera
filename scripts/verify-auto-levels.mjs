/**
 * End-to-end verification for automatic levels:
 * admin Bank Soal -> level node + lesson -> public map -> one-question gameplay.
 *
 * Creates a temporary developer, a temporary player, and one test level in
 * Pemrograman Web, then removes every row it created. Existing content and
 * player progress are never modified.
 *
 *   node --env-file=.env scripts/verify-auto-levels.mjs http://localhost:5199
 */
import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';

const base = (process.argv[2] ?? 'http://localhost:5199').replace(/\/$/, '');
const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || (url ? new URL(url).hostname.split('.')[0] : '');

if (!url || !anonKey || !accessToken || !ref) {
  console.error('Env Supabase tidak lengkap untuk verifikasi level otomatis.');
  process.exit(1);
}

const stamp = Date.now();
const suffix = String(stamp).slice(-8);
const devEmail = `auto-dev-${stamp}@example.com`;
const devPassword = `${randomBytes(18).toString('base64url')}Aa1!`;
const devUsername = `adev_${suffix}`;
const playerEmail = `auto-player-${stamp}@example.com`;
const playerPassword = `${randomBytes(18).toString('base64url')}Aa1!`;
const playerUsername = `aply_${suffix}`;
let questionPrompt = `Soal uji level otomatis ${suffix}?`;
const subjectSlug = 'pemrograman-web';

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

async function rpc(name, token, payload) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

let serviceKey = '';
let devId = '';
let playerId = '';
let subjectId = '';
let secondQuestionId = '';
let secondNodeId = '';
let secondLessonId = '';
let secondPrompt = '';
let nodeId = '';
let lessonId = '';
let questionId = '';
let correctOptionId = '';
let initialMax = 0;
let browser;

try {
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!keysResponse.ok) throw new Error(`Gagal mengambil API keys (HTTP ${keysResponse.status})`);
  serviceKey = (await keysResponse.json()).find((key) => key.name === 'service_role')?.api_key ?? '';
  if (!serviceKey) throw new Error('service_role key tidak ditemukan');

  const baseline = await sql(`
    select s.id as subject_id,
      coalesce(max(n.level_number), 0) as max_level
    from public.subjects s
    left join public.courses c on c.subject_id = s.id
    left join public.course_levels lv on lv.course_id = c.id
    left join public.units u on u.course_level_id = lv.id
    left join public.learning_nodes n on n.unit_id = u.id
    where s.slug = '${subjectSlug}'
    group by s.id;
  `);
  subjectId = baseline[0].subject_id;
  initialMax = Number(baseline[0].max_level);
  if (!subjectId || initialMax < 1) throw new Error('Baseline Pemrograman Web tidak valid.');

  devId = await createUser(devEmail, devPassword, 'Developer Level Otomatis', devUsername, 'developer');
  playerId = await createUser(playerEmail, playerPassword, 'Pemain Level Otomatis', playerUsername, 'player');
  ok('akun developer dan pemain sementara dibuat', `${devUsername} / ${playerUsername}`);

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
  // Bank Soal: choose subject, add one question, no lesson picker.
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/questions`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Bank soal', exact: true, level: 2 }).waitFor({ timeout: 20_000 });
  const subjectSelect = page.locator('select[name="subject"]');
  await subjectSelect.selectOption({ label: 'Pemrograman Web' });
  await page.getByText(`${initialMax} level`, { exact: true }).waitFor({ timeout: 20_000 });
  const lessonPicker = page.locator('select[name="lesson"]');
  if (await lessonPicker.count()) fail('pilihan lesson sudah dihapus dari Bank Soal');
  else ok('Bank Soal hanya memakai pilihan mata pelajaran');

  await page.getByRole('button', { name: 'Tambah soal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah soal' });
  await dialog.waitFor({ timeout: 20_000 });
  if ((await dialog.locator('select[name="lessonId"]').count()) > 0) {
    fail('form tambah soal tidak lagi meminta lesson');
  } else {
    ok('form tambah soal tidak meminta lesson');
  }
  await dialog.locator('textarea[name="prompt"]').fill(questionPrompt);
  const optionInputs = dialog.locator('input[name="optionLabel"]');
  await optionInputs.nth(0).fill('Jawaban benar uji');
  await optionInputs.nth(1).fill('Jawaban salah uji');
  const correctRadio = dialog.locator('input[name="optionCorrect"]').nth(0);
  await correctRadio.check();
  await dialog.getByRole('button', { name: 'Simpan & buat level' }).click();
  await dialog.waitFor({ state: 'detached', timeout: 25_000 });
  ok('soal baru disimpan lewat UI');

  const created = await sql(`
    select q.id as question_id, q.lesson_id, n.id as node_id, n.level_number, n.is_active,
      (select o.id from public.question_options o where o.question_id = q.id and o.is_correct limit 1) as option_id
    from public.questions q
    join public.learning_nodes n on n.question_id = q.id
    where q.prompt = '${questionPrompt}'
    limit 1;
  `);
  if (!created.length) throw new Error('Soal uji tidak ditemukan setelah disimpan.');
  questionId = created[0].question_id;
  lessonId = created[0].lesson_id;
  nodeId = created[0].node_id;
  correctOptionId = created[0].option_id;
  const levelNumber = Number(created[0].level_number);

  if (levelNumber === initialMax + 1 && created[0].is_active) {
    ok('level berikutnya dibuat otomatis dan terhubung ke soal', `Level ${levelNumber}`);
  } else {
    fail('level berikutnya dibuat otomatis dan terhubung ke soal', JSON.stringify(created[0]));
  }

  const sameLesson = await sql(`
    select count(*)::int as count from public.learning_nodes n
    where n.lesson_id = '${lessonId}' and n.question_id is not null;
  `);
  if (sameLesson[0].count === 1) ok('setiap level otomatis memiliki lesson sendiri');
  else fail('setiap level otomatis memiliki lesson sendiri', JSON.stringify(sameLesson[0]));

  // The numbering is per subject: Basis Data also starts at Level 9 without
  // touching Pemrograman Web's sequence.
  const devToken = await tokenFor(devEmail, devPassword);
  const basisData = await sql(`
    select id from public.subjects where slug = 'basis-data';
  `);
  secondPrompt = `Soal uji level Basis Data ${suffix}?`;
  const second = await rpc('admin_create_question_level', devToken, {
    p_payload: {
      subjectId: basisData[0].id,
      slug: `uji-level-basis-data-${stamp}`,
      type: 'multiple_choice',
      prompt: secondPrompt,
      difficulty: 'beginner',
      points: 10,
      options: [
        { label: 'Benar', isCorrect: true, sortOrder: 0 },
        { label: 'Salah', isCorrect: false, sortOrder: 1 },
      ],
      answers: [],
      pairs: [],
      media: [],
      scene: {},
    },
    p_reason: 'Uji urutan level per mata pelajaran',
  });
  secondQuestionId = second.id;
  secondNodeId = second.nodeId;
  secondLessonId = second.lessonId;
  if (Number(second.levelNumber) === initialMax + 1 && second.subjectId === basisData[0].id) {
    ok('Basis Data memiliki urutan level sendiri', `Level ${second.levelNumber}`);
  } else {
    fail('Basis Data memiliki urutan level sendiri', JSON.stringify(second));
  }
  const pwStill = await sql(`
    select max(level_number)::int as max_level from public.learning_nodes n
    join public.units u on u.id = n.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    where s.slug = 'pemrograman-web';
  `);
  if (Number(pwStill[0]?.max_level) === levelNumber) ok('level Basis Data tidak menggeser Pemrograman Web');
  else fail('level Basis Data tidak menggeser Pemrograman Web', JSON.stringify(pwStill[0]));

  // Edit the question: prompt changes, node and level number must not.
  const editedPrompt = `${questionPrompt} edit`;
  const createdRow = page.locator('tbody tr').filter({ hasText: questionPrompt });
  await createdRow.getByRole('button', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Edit soal' });
  await editDialog.waitFor({ timeout: 20_000 });
  await editDialog.locator('textarea[name="prompt"]').fill(editedPrompt);
  await editDialog.getByRole('button', { name: 'Simpan soal' }).click();
  try {
    await editDialog.waitFor({ state: 'detached', timeout: 25_000 });
  } catch {
    const message = await editDialog.locator('.admin-form-error').textContent().catch(() => '');
    throw new Error(`Edit soal gagal: ${message || 'dialog tetap terbuka'}`);
  }
  const afterEdit = await sql(`
    select q.prompt, n.id as node_id, n.level_number
    from public.questions q join public.learning_nodes n on n.question_id = q.id
    where q.id = '${questionId}';
  `);
  if (
    afterEdit[0]?.prompt === editedPrompt &&
    afterEdit[0]?.node_id === nodeId &&
    Number(afterEdit[0]?.level_number) === levelNumber
  ) {
    ok('edit soal tidak mengubah level atau relasinya');
    questionPrompt = editedPrompt;
  } else {
    fail('edit soal tidak mengubah level atau relasinya', JSON.stringify(afterEdit[0]));
  }

  // -------------------------------------------------------------------------
  // Map Editor: level appears with its linked question.
  // -------------------------------------------------------------------------
  await page.goto(`${base}/admin/map`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Map level', exact: true, level: 2 }).waitFor({ timeout: 20_000 });
  await page.locator('select[name="map-subject"]').selectOption({ label: 'Pemrograman Web' });
  await page.getByText(`Level ${levelNumber}`, { exact: true }).waitFor({ timeout: 20_000 });
  const mapText = await page.locator('.admin-panel').filter({ hasText: 'Map level' }).innerText();
  if (mapText.includes(questionPrompt)) ok('Map Editor menampilkan soal yang terhubung dengan level');
  else fail('Map Editor menampilkan soal yang terhubung dengan level');

  // -------------------------------------------------------------------------
  // Public map: count levels/questions, no chapter wording.
  // -------------------------------------------------------------------------
  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerContext.newPage();
  await login(playerPage, playerEmail, playerPassword);
  await playerPage.goto(`${base}/learn/${subjectSlug}`, { waitUntil: 'domcontentloaded' });
  await playerPage.locator('.journey-map').waitFor({ timeout: 25_000 });
  const meta = (await playerPage.locator('.journey-map__meta').innerText()).replace(/\s+/g, ' ');
  const expectedMeta = `${levelNumber} Level · ${levelNumber} Soal`;
  if (meta.includes(expectedMeta)) ok('peta publik menghitung level = soal', meta);
  else fail('peta publik menghitung level = soal', meta);
  if (!/bab/i.test(meta)) ok('peta publik tidak lagi menampilkan jumlah bab');
  else fail('peta publik tidak lagi menampilkan jumlah bab', meta);
  if (await playerPage.getByRole('button', { name: new RegExp(`Level ${levelNumber}`) }).count()) {
    ok(`node Level ${levelNumber} tampil di peta publik (mobile)`);
  } else {
    fail(`node Level ${levelNumber} tampil di peta publik (mobile)`);
  }

  // -------------------------------------------------------------------------
  // Gameplay: unlock the new level for the temporary player, play one question.
  // -------------------------------------------------------------------------
  await sql(`
    insert into public.user_node_progress (user_id, node_id, status, best_score, attempts, completed_at)
    select '${playerId}', n.id, 'completed', 10, 1, now()
    from public.learning_nodes n
    join public.units u on u.id = n.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    where c.subject_id = '${subjectId}'
      and n.question_id is not null
      and n.is_active
      and n.level_number < ${levelNumber}
    on conflict (user_id, node_id) do update set status = 'completed', completed_at = now();
  `);

  const refreshedOption = await sql(`
    select id from public.question_options
    where question_id = '${questionId}' and is_correct limit 1;
  `);
  correctOptionId = refreshedOption[0]?.id ?? correctOptionId;

  const playerToken = await tokenFor(playerEmail, playerPassword);
  const started = await rpc('start_lesson', playerToken, { p_node_id: nodeId });
  const served = started.questions?.[0];
  if (served?.id === questionId && served?.prompt === questionPrompt && started.questions.length === 1) {
    ok('game memuat tepat satu soal yang terhubung dengan level', served.prompt);
  } else {
    fail('game memuat tepat satu soal yang terhubung dengan level', JSON.stringify(started));
  }

  const answer = await rpc('submit_attempt_answer', playerToken, {
    p_attempt_id: started.attemptId,
    p_question_id: questionId,
    p_answer: { optionId: correctOptionId },
  });
  if (answer.isCorrect === true) ok('jawaban benar dinilai oleh backend');
  else fail('jawaban benar dinilai oleh backend', JSON.stringify(answer));

  await rpc('complete_lesson_attempt', playerToken, { p_attempt_id: started.attemptId });
  const progress = await sql(`
    select n.level_number, p.status,
      (select count(*)::int from public.user_node_progress x where x.user_id = '${playerId}' and x.status = 'completed') as completed_count
    from public.learning_nodes n
    join public.user_node_progress p on p.node_id = n.id and p.user_id = '${playerId}'
    where n.id = '${nodeId}';
  `);
  if (Number(progress[0]?.level_number) === levelNumber && progress[0]?.status === 'completed') {
    ok('penyelesaian Level baru tercatat untuk pemain', `Level ${levelNumber}`);
  } else {
    fail('penyelesaian Level baru tercatat untuk pemain', JSON.stringify(progress[0]));
  }
  if (Number(progress[0]?.completed_count) === levelNumber) {
    ok('progres level sebelumnya tetap utuh', `${progress[0].completed_count} level selesai`);
  } else {
    fail('progres level sebelumnya tetap utuh', JSON.stringify(progress[0]));
  }
  const attemptCount = await sql(`
    select total_count, status from public.lesson_attempts where id = '${started.attemptId}';
  `);
  if (attemptCount[0]?.total_count === 1 && attemptCount[0]?.status === 'completed') {
    ok('attempt level hanya berisi satu soal dan selesai');
  } else {
    fail('attempt level hanya berisi satu soal dan selesai', JSON.stringify(attemptCount[0]));
  }

  // Archive/reactivate through the UI. The level must pause, disappear from the
  // public map, then come back with the same number.
  await page.goto(`${base}/admin/questions`, { waitUntil: 'domcontentloaded' });
  await page.locator('select[name="subject"]').selectOption({ label: 'Pemrograman Web' });
  const activeRow = page.locator('tbody tr').filter({ hasText: questionPrompt });
  await activeRow.waitFor({ timeout: 20_000 });
  await activeRow.getByRole('button', { name: 'Arsipkan' }).click();
  const archiveDialog = page.getByRole('dialog', { name: 'Arsipkan soal' });
  await archiveDialog.locator('textarea[name="reason"]').fill('Uji arsip level otomatis');
  await archiveDialog.getByRole('button', { name: 'Arsipkan', exact: true }).click();
  await archiveDialog.waitFor({ state: 'detached', timeout: 20_000 });
  const paused = await sql(`
    select n.is_active, n.level_number from public.learning_nodes n where n.id = '${nodeId}';
  `);
  if (paused[0]?.is_active === false && Number(paused[0]?.level_number) === levelNumber) {
    ok('arsip soal menonaktifkan level tanpa mengubah nomornya');
  } else {
    fail('arsip soal menonaktifkan level tanpa mengubah nomornya', JSON.stringify(paused[0]));
  }

  await playerPage.goto(`${base}/learn/${subjectSlug}`, { waitUntil: 'domcontentloaded' });
  await playerPage.locator('.journey-map').waitFor({ timeout: 25_000 });
  const pausedMeta = (await playerPage.locator('.journey-map__meta').innerText()).replace(/\s+/g, ' ');
  if (pausedMeta.includes(`${levelNumber - 1} Level · ${levelNumber - 1} Soal`)) {
    ok('level yang diarsipkan hilang dari peta publik', pausedMeta);
  } else {
    fail('level yang diarsipkan hilang dari peta publik', pausedMeta);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('select[name="subject"]').waitFor({ timeout: 20_000 });
  await page.locator('select[name="subject"]').selectOption({ label: 'Pemrograman Web' });
  const archivedRow = page.locator('tbody tr').filter({ hasText: questionPrompt });
  await archivedRow.waitFor({ timeout: 20_000 });
  await archivedRow.getByRole('button', { name: 'Aktifkan' }).click();
  await archivedRow.getByRole('button', { name: 'Arsipkan' }).waitFor({ timeout: 20_000 });
  const restored = await sql(`
    select is_active, level_number from public.learning_nodes where id = '${nodeId}';
  `);
  if (restored[0]?.is_active === true && Number(restored[0]?.level_number) === levelNumber) {
    ok('aktifkan kembali memulihkan level yang sama');
  } else {
    fail('aktifkan kembali memulihkan level yang sama', JSON.stringify(restored[0]));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/admin/map`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Map level', exact: true, level: 2 }).waitFor({ timeout: 20_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow <= 2) ok('Map Editor tidak menyebabkan overflow horizontal di mobile');
  else fail('Map Editor tidak menyebabkan overflow horizontal di mobile', `${overflow}px`);

  if (errors.length === 0) ok('tidak ada console error di browser');
  else fail('tidak ada console error di browser', errors.slice(0, 3).join(' | '));
} catch (error) {
  fail('verifikasi level otomatis berhenti', error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close().catch(() => {});
  try {
    if (questionId) {
      await sql(`
        delete from public.answer_attempts where user_id = '${playerId}';
        delete from public.lesson_attempts where user_id = '${playerId}';
        delete from public.user_node_progress where user_id = '${playerId}';
        delete from public.user_course_progress where user_id = '${playerId}';
        delete from public.user_xp_ledger where user_id = '${playerId}';
        delete from public.coin_transactions where user_id = '${playerId}';
        delete from public.learning_nodes where id = '${nodeId}';
        delete from public.questions where id = '${questionId}';
        delete from public.lessons where id = '${lessonId}';
      `);
      if (secondQuestionId) {
        await sql(`
          delete from public.learning_nodes where id = '${secondNodeId}';
          delete from public.questions where id = '${secondQuestionId}';
          delete from public.lessons where id = '${secondLessonId}';
        `);
      }
      const leftovers = await sql(`
        select
          (select count(*)::int from public.questions where id = '${questionId}') as question,
          (select count(*)::int from public.learning_nodes where id = '${nodeId}') as node,
          (select count(*)::int from public.lessons where id = '${lessonId}') as lesson,
          (select count(*)::int from public.questions where prompt = '${secondPrompt}') as second_question,
          (select count(*)::int from public.learning_nodes where id = '${secondNodeId}') as second_node;
      `);
      if (
        leftovers[0].question === 0 && leftovers[0].node === 0 && leftovers[0].lesson === 0 &&
        leftovers[0].second_question === 0 && leftovers[0].second_node === 0
      ) {
        ok('soal, level, dan lesson uji dihapus');
      } else {
        fail('soal, level, dan lesson uji dihapus', JSON.stringify(leftovers[0]));
      }
    }
    if (devId) {
      await fetch(`${url}/auth/v1/admin/users/${devId}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
    }
    if (playerId) {
      await fetch(`${url}/auth/v1/admin/users/${playerId}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
    }
    if (devId && playerId) {
      const accounts = await sql(`
        select count(*)::int as count from auth.users
        where email in ('${devEmail}', '${playerEmail}');
      `);
      if (accounts[0].count === 0) ok('akun uji dihapus');
      else fail('akun uji dihapus');
    }
  } catch (error) {
    fail('cleanup verifikasi gagal', error instanceof Error ? error.message : String(error));
  }
}

if (failures.length) {
  console.error(`\n${failures.length} verifikasi gagal.`);
  process.exit(1);
}
console.log('\nSemua verifikasi level otomatis lulus.');
