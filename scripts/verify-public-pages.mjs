/**
 * Browser smoke check for CMS-driven public pages.
 *
 *   node scripts/verify-public-pages.mjs http://127.0.0.1:5199 [published-slug]
 *
 * Uses the system Chrome channel so no extra browser download is needed.
 */
import { chromium } from '@playwright/test';

const base = (process.argv[2] ?? 'http://127.0.0.1:5199').replace(/\/$/, '');
const publishedSlug = process.argv[3] ?? '';
const failures = [];

function ok(label, detail = '') {
  console.log(`ok   ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
  failures.push(label);
  console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

try {
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 30_000 });
  const brand = (await page.locator('.brand__name').first().textContent())?.trim() ?? '';
  if (brand) ok('landing menampilkan nama situs', brand);
  else fail('landing menampilkan nama situs');

  const title = await page.title();
  if (title.includes(brand || 'Lentera')) ok('judul dokumen memakai nama situs', title);
  else fail('judul dokumen memakai nama situs', title);

  // Render the CMS block renderer with a mocked published page. This does not
  // write test content into the project database.
  await page.route('**/rest/v1/rpc/get_public_page', async (route) => {
    const payload = route.request().postDataJSON?.() ?? {};
    if (payload.p_slug === 'verifikasi-render-cms') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slug: 'verifikasi-render-cms',
          title: 'Halaman Verifikasi',
          summary: 'Ringkasan uji render.',
          blocks: [
            { type: 'heading', text: 'Judul Blok' },
            { type: 'paragraph', text: 'Paragraf uji render.' },
            { type: 'list', items: ['Butir satu', 'Butir dua'] },
            { type: 'callout', text: 'Catatan penting.' },
          ],
          metaTitle: 'Halaman Verifikasi',
          metaDescription: 'Deskripsi uji.',
          ogImageUrl: '',
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${base}/p/verifikasi-render-cms`, { waitUntil: 'networkidle' });
  const renderedHeading = (await page.locator('.info-page__article h1').textContent())?.trim() ?? '';
  const blockHeading = (await page.locator('.info-block__heading').textContent())?.trim() ?? '';
  const listItems = await page.locator('.info-block__list li').count();
  if (
    renderedHeading === 'Halaman Verifikasi' &&
    blockHeading === 'Judul Blok' &&
    listItems === 2 &&
    (await page.locator('.info-block__callout').count()) === 1
  ) {
    ok('render blok halaman CMS berfungsi', `${blockHeading} · ${listItems} butir`);
  } else {
    fail('render blok halaman CMS berfungsi', `${renderedHeading}/${blockHeading}/${listItems}`);
  }

  await page.goto(`${base}/p/halaman-tidak-ada-verifikasi`, { waitUntil: 'networkidle' });
  const notFound = await page.getByText('Halaman tidak ditemukan').count();
  if (notFound > 0) ok('route /p/:slug menampilkan status tidak ditemukan');
  else fail('route /p/:slug menampilkan status tidak ditemukan');

  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  if (page.url().includes('/login')) ok('anon diarahkan ke login saat membuka /admin');
  else fail('anon diarahkan ke login saat membuka /admin', page.url());

  if (publishedSlug) {
    await page.goto(`${base}/p/${encodeURIComponent(publishedSlug)}`, { waitUntil: 'networkidle' });
    const article = page.locator('.info-page__article');
    await article.waitFor({ timeout: 10_000 });
    const heading = (await article.locator('h1').textContent())?.trim() ?? '';
    if (heading) ok('halaman CMS terbit dirender', heading);
    else fail('halaman CMS terbit dirender');
  } else {
    console.log('info  tidak ada slug terbit yang diberikan; render halaman CMS dilewati');
  }

  if (consoleErrors.length === 0) ok('tidak ada console error');
  else fail('tidak ada console error', consoleErrors.slice(0, 3).join(' | '));
} catch (error) {
  fail('browser smoke berhenti', error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} pemeriksaan browser gagal.`);
  process.exitCode = 1;
} else {
  console.log('\nSemua pemeriksaan browser lulus.');
}
