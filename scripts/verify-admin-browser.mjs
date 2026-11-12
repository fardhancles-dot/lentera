/**
 * End-to-end verification of the Admin CMS against the configured project.
 *
 * Creates a temporary admin account with a random password, drives the real UI
 * in Chrome, checks subject CRUD and a published CMS page, then removes the
 * account and every test row it created. The password is never printed.
 *
 *   node --env-file=.env scripts/verify-admin-browser.mjs http://localhost:5199
 *
 * Required env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN,
 * SUPABASE_PROJECT_REF.
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
const subjectSlug = `verifikasi-mapel-${stamp}`;
const subjectName = `Mapel Verifikasi ${suffix}`;
const subjectNameEdited = `${subjectName} Edit`;
const pageSlug = `verifikasi-halaman-${stamp}`;
const pageTitle = `Halaman Verifikasi ${suffix}`;
const pageTitleEdited = `${pageTitle} Edit`;
const email = `staff-verify-${stamp}@example.com`;
const password = `${randomBytes(18).toString('base64url')}Aa1!`;
const username = `stf_${suffix}`;

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

let serviceKey = '';
let userId = '';
let browser;

try {
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!keysResponse.ok) throw new Error(`Gagal mengambil API keys (HTTP ${keysResponse.status})`);
  const keys = await keysResponse.json();
  serviceKey = keys.find((key) => key.name === 'service_role')?.api_key ?? '';
  if (!serviceKey) throw new Error('service_role key tidak ditemukan');

  const siteResponse = await fetch(`${url}/rest/v1/rpc/get_public_site_content`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const site = await siteResponse.json();
  if (site?.settings?.registrationEnabled === false) {
    throw new Error('Registrasi sedang dinonaktifkan; akun staff uji tidak dapat dibuat.');
  }

  const createResponse = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'Staff Verifikasi' },
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Gagal membuat akun uji (HTTP ${createResponse.status})`);
  }
  const created = await createResponse.json();
  userId = created.id;
  if (!userId) throw new Error('Akun uji tidak mengembalikan id');
  ok('akun staff uji dibuat', email);

  const restHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  const profilePatch = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: restHeaders,
    body: JSON.stringify({
      username,
      display_name: 'Staff Verifikasi',
      onboarding_completed: true,
    }),
  });
  if (!profilePatch.ok) throw new Error(`Gagal menyiapkan profil uji (HTTP ${profilePatch.status})`);
  const rolePatch = await fetch(`${url}/rest/v1/user_roles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: restHeaders,
    body: JSON.stringify({ role: 'admin' }),
  });
  if (!rolePatch.ok) throw new Error(`Gagal memberi role admin (HTTP ${rolePatch.status})`);
  ok('profil onboarding dan role admin disiapkan', username);

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

  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL((target) => !target.pathname.endsWith('/login'), { timeout: 25_000 });
  if (page.url().includes('/onboarding')) {
    throw new Error('Akun uji masih diarahkan ke onboarding');
  }
  ok('login staff berhasil', new URL(page.url()).pathname);

  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  await page.locator('.admin-metric').first().waitFor({ timeout: 20_000 });
  const metricCount = await page.locator('.admin-metric').count();
  if (metricCount > 0 && !(await page.locator('.admin-empty-page').count())) {
    ok('dashboard admin terbuka dengan metrik', `${metricCount} kartu`);
  } else {
    fail('dashboard admin terbuka dengan metrik');
  }

  await page.goto(`${base}/admin/curriculum`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Tambah mapel' }).waitFor({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.locator('input[name="name"]').fill(subjectName);
  await dialog.locator('input[name="slug"]').fill(subjectSlug);
  await dialog.locator('input[name="category"]').fill('verifikasi');
  await dialog.locator('input[name="iconKey"]').fill('book');
  await dialog.locator('input[name="accentColor"]').fill('#58CC02');
  await dialog.locator('select[name="status"]').selectOption('active');
  await dialog.locator('textarea[name="description"]').fill('Mapel sementara untuk verifikasi CRUD.');
  await dialog.locator('input[name="reason"]').fill('Verifikasi CRUD admin lewat browser');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  await page.getByText(subjectName, { exact: false }).first().waitFor({ timeout: 20_000 });
  ok('create mapel lewat UI');

  const createdSubject = await sql(
    `select id, name, status from public.subjects where slug = '${subjectSlug}'`,
  );
  if (createdSubject.length === 1 && createdSubject[0].status === 'active') {
    ok('mapel tersimpan di database', createdSubject[0].status);
  } else {
    fail('mapel tersimpan di database', JSON.stringify(createdSubject));
  }

  const subjectBranch = page.locator('.admin-tree > .admin-tree__branch').filter({ hasText: subjectName }).first();
  await subjectBranch.getByRole('button', { name: 'Edit mapel' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('input[name="name"]').fill(subjectNameEdited);
  await dialog.locator('input[name="reason"]').fill('Verifikasi edit mapel');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  await page.getByText(subjectNameEdited, { exact: false }).first().waitFor({ timeout: 20_000 });
  ok('update mapel lewat UI');

  const editedSubject = await sql(
    `select name from public.subjects where slug = '${subjectSlug}'`,
  );
  if (editedSubject[0]?.name === subjectNameEdited) ok('edit mapel tersimpan di database');
  else fail('edit mapel tersimpan di database', JSON.stringify(editedSubject));

  const editedBranch = page.locator('.admin-tree > .admin-tree__branch').filter({ hasText: subjectNameEdited }).first();
  await editedBranch.getByRole('button', { name: 'Edit mapel' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('select[name="status"]').selectOption('inactive');
  await dialog.locator('input[name="reason"]').fill('Verifikasi arsip mapel');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  const archivedSubject = await sql(
    `select status from public.subjects where slug = '${subjectSlug}'`,
  );
  if (archivedSubject[0]?.status === 'inactive') ok('arsip mapel lewat UI');
  else fail('arsip mapel lewat UI', JSON.stringify(archivedSubject));

  await page.goto(`${base}/admin/website`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Halaman', exact: true }).click();
  await page.getByRole('button', { name: 'Halaman baru' }).waitFor({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Halaman baru' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('input[name="title"]').fill(pageTitle);
  await dialog.locator('input[name="slug"]').fill(pageSlug);
  await dialog.locator('select[name="status"]').selectOption('published');
  await dialog.locator('textarea[name="summary"]').fill('Ringkasan halaman verifikasi.');
  await dialog.locator('input[name="metaTitle"]').fill(pageTitle);
  await dialog.locator('textarea[name="metaDescription"]').fill('Deskripsi meta verifikasi.');
  await dialog.getByRole('button', { name: 'Tambah blok' }).click();
  let blocks = dialog.locator('.admin-block');
  await blocks.first().locator('select[name="blockType"]').selectOption('heading');
  await blocks.first().locator('textarea[name="blockText"]').fill('Judul Publik Verifikasi');
  await dialog.getByRole('button', { name: 'Tambah blok' }).click();
  blocks = dialog.locator('.admin-block');
  await blocks.nth(1).locator('textarea[name="blockText"]').fill('Paragraf publik dari verifikasi CMS.');
  await dialog.locator('input[name="reason"]').fill('Verifikasi publikasi halaman CMS');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  await page.getByText(pageTitle, { exact: false }).first().waitFor({ timeout: 20_000 });
  ok('create + publish halaman CMS lewat UI');

  const savedPage = await sql(
    `select status, jsonb_array_length(blocks) as blocks from public.content_pages where slug = '${pageSlug}'`,
  );
  if (savedPage[0]?.status === 'published' && savedPage[0]?.blocks === 2) {
    ok('halaman tersimpan dan terbit di database', `${savedPage[0].blocks} blok`);
  } else {
    fail('halaman tersimpan dan terbit di database', JSON.stringify(savedPage));
  }

  const publicPage = await context.newPage();
  await publicPage.goto(`${base}/p/${pageSlug}`, { waitUntil: 'domcontentloaded' });
  await publicPage.locator('.info-page__article h1').waitFor({ timeout: 20_000 });
  const publicTitle = (await publicPage.locator('.info-page__article h1').textContent())?.trim();
  const publicHeading = (await publicPage.locator('.info-block__heading').textContent())?.trim();
  const publicParagraph = (await publicPage.locator('.info-block__paragraph').textContent())?.trim();
  if (
    publicTitle === pageTitle &&
    publicHeading === 'Judul Publik Verifikasi' &&
    publicParagraph === 'Paragraf publik dari verifikasi CMS.'
  ) {
    ok('halaman CMS terbit tampil di /p/:slug', publicTitle);
  } else {
    fail('halaman CMS terbit tampil di /p/:slug', `${publicTitle} / ${publicHeading}`);
  }

  const pageRow = page.locator('tr').filter({ hasText: pageTitle }).first();
  await pageRow.getByRole('button', { name: 'Edit' }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('input[name="title"]').fill(pageTitleEdited);
  await dialog.locator('input[name="reason"]').fill('Verifikasi edit halaman CMS');
  await dialog.locator('button[type="submit"]').click();
  await dialog.waitFor({ state: 'detached', timeout: 20_000 });
  const editedPage = await sql(
    `select title from public.content_pages where slug = '${pageSlug}'`,
  );
  if (editedPage[0]?.title === pageTitleEdited) ok('update halaman CMS lewat UI');
  else fail('update halaman CMS lewat UI', JSON.stringify(editedPage));

  const publicAfterEdit = await context.newPage();
  await publicAfterEdit.goto(`${base}/p/${pageSlug}`, { waitUntil: 'domcontentloaded' });
  await publicAfterEdit.locator('.info-page__article h1').waitFor({ timeout: 20_000 });
  const rerenderedTitle = (await publicAfterEdit.locator('.info-page__article h1').textContent())?.trim();
  if (rerenderedTitle === pageTitleEdited) ok('perubahan halaman terlihat publik');
  else fail('perubahan halaman terlihat publik', String(rerenderedTitle));

  if (errors.length === 0) ok('tidak ada console error selama alur admin');
  else fail('tidak ada console error selama alur admin', errors.slice(0, 3).join(' | '));
} catch (error) {
  fail('verifikasi browser berhenti', error instanceof Error ? error.message : String(error));
  if (browser) {
    const pages = browser.contexts().flatMap((context) => context.pages());
    if (pages[0]) {
      await pages[0].screenshot({ path: 'test-results/admin-verify-failure.png' }).catch(() => {});
    }
  }
} finally {
  try {
    await sql(`delete from public.content_pages where slug = '${pageSlug}'`);
    await sql(`delete from public.subjects where slug = '${subjectSlug}'`);
    const leftover = await sql(
      `select
        (select count(*)::int from public.content_pages where slug = '${pageSlug}') as pages,
        (select count(*)::int from public.subjects where slug = '${subjectSlug}') as subjects`,
    );
    if (leftover[0].pages === 0 && leftover[0].subjects === 0) {
      ok('data uji dibersihkan');
    } else {
      fail('data uji dibersihkan', JSON.stringify(leftover[0]));
    }
  } catch (error) {
    fail('data uji dibersihkan', error instanceof Error ? error.message : String(error));
  }

  if (userId && serviceKey) {
    try {
      const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (response.ok) ok('akun staff uji dihapus');
      else fail('akun staff uji dihapus', `HTTP ${response.status}`);
    } catch (error) {
      fail('akun staff uji dihapus', error instanceof Error ? error.message : String(error));
    }
  }
  if (browser) await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verifikasi gagal.`);
  process.exitCode = 1;
} else {
  console.log('\nSemua verifikasi admin lewat browser lulus.');
}
