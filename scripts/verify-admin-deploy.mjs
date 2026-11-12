/**
 * Read-only verification for the deployed Admin CMS.
 *
 * Checks remote catalog objects through the Management API and exercises the
 * public RPCs with the anon key. It never writes data or changes the schema.
 *
 *   node --env-file=.env scripts/verify-admin-deploy.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  if (!existsSync('.env')) return;
  for (const rawLine of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const failures = [];
const ok = (label, detail = '') => console.log(`ok   ${label}${detail ? ` — ${detail}` : ''}`);
const fail = (label, detail = '') => {
  failures.push(label);
  console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
};

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref =
  process.env.SUPABASE_PROJECT_REF ||
  (url ? new URL(url).hostname.split('.')[0] : '');

if (!url || !anonKey) {
  console.error('VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib tersedia di .env');
  process.exit(1);
}

async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`Management API HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Management API tanpa hasil');
  return rows[0];
}

const catalogQuery = `
  select jsonb_build_object(
    'tables', (
      select count(*)::int from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'site_settings', 'content_pages', 'announcements',
          'media_assets', 'role_permissions', 'admin_permissions'
        )
    ),
    'functions', (
      select count(*)::int from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'admin_get_context', 'admin_get_overview', 'admin_save_subject',
          'admin_save_question', 'admin_reorder', 'admin_get_site_settings',
          'admin_save_game_catalog', 'admin_set_user_role',
          'admin_set_role_permission', 'admin_content_health',
          'get_public_site_content', 'get_public_page',
          'get_active_announcements', 'site_maintenance_active',
          'enforce_maintenance_mode'
        )
    ),
    'maintenanceTriggers', (
      select count(*)::int from pg_trigger
      where tgname = 'maintenance_guard' and not tgisinternal
    ),
    'questionsRls', (
      select relrowsecurity from pg_class
      where oid = 'public.questions'::regclass
    ),
    'questionPolicies', (
      select count(*)::int from pg_policies
      where schemaname = 'public'
        and tablename in ('questions', 'question_options', 'question_answers', 'question_pairs')
    ),
    'anonAdminExecute', has_function_privilege('anon', 'public.admin_get_context()', 'EXECUTE'),
    'authAdminExecute', has_function_privilege('authenticated', 'public.admin_get_context()', 'EXECUTE'),
    'maintenanceActive', public.site_maintenance_active()
  ) as payload
`;

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function expect(label, condition, detail = '') {
  if (condition) ok(label, detail);
  else fail(label, detail);
}

try {
  const catalog = (await sql(catalogQuery)).payload;

  expect('6 tabel CMS ada di remote', catalog.tables === 6, String(catalog.tables));
  expect('15 fungsi admin/publik ada di remote', catalog.functions === 15, String(catalog.functions));
  expect('trigger maintenance terpasang di 30 tabel', catalog.maintenanceTriggers === 30, String(catalog.maintenanceTriggers));
  expect('RLS tabel questions aktif', catalog.questionsRls === true);
  expect(
    'tabel jawaban tetap tanpa policy publik',
    catalog.questionPolicies === 0,
    String(catalog.questionPolicies),
  );
  expect('anon tidak boleh mengeksekusi RPC admin', catalog.anonAdminExecute === false);
  expect('authenticated boleh mengeksekusi RPC admin', catalog.authAdminExecute === true);
  expect('maintenance mode default mati', catalog.maintenanceActive === false);

  const site = await supabase.rpc('get_public_site_content');
  expect('get_public_site_content dapat dipanggil anon', !site.error, site.error?.message);
  const settings = site.data?.settings ?? {};
  expect(
    'site settings publik memiliki nama situs',
    typeof settings.siteName === 'string' && settings.siteName.length > 0,
    String(settings.siteName ?? ''),
  );
  const pages = Array.isArray(site.data?.pages) ? site.data.pages : [];
  expect('daftar halaman publik berupa array', Array.isArray(site.data?.pages), String(pages.length));

  const missing = await supabase.rpc('get_public_page', { p_slug: 'halaman-tidak-ada-verifikasi' });
  expect('halaman tidak dikenal mengembalikan null', !missing.error && missing.data === null);

  const announcements = await supabase.rpc('get_active_announcements');
  expect(
    'get_active_announcements dapat dipanggil anon',
    !announcements.error && Array.isArray(announcements.data),
    announcements.error?.message,
  );

  if (pages.length > 0) {
    const slug = pages[0].slug;
    const page = await supabase.rpc('get_public_page', { p_slug: slug });
    expect(
      'halaman terbit dapat dibaca publik',
      !page.error && page.data?.slug === slug && Array.isArray(page.data?.blocks),
      String(slug),
    );
  } else {
    console.log('info  belum ada halaman terbit; route /p/:slug belum bisa diuji dengan konten nyata');
  }

  const questions = await supabase.from('questions').select('id').limit(1);
  expect(
    'anon tidak dapat membaca langsung tabel questions',
    questions.error !== null || (questions.data ?? []).length === 0,
    questions.data ? `${questions.data.length} baris` : questions.error?.message,
  );

  const admin = await supabase.rpc('admin_get_context');
  expect('RPC admin menolak anon', admin.error !== null, admin.error?.message);

  // Exercise the staff path without creating an account: set the JWT subject
  // to an existing staff id for the duration of this read-only query.
  const staffQuery = `
    with staff as (
      select user_id from public.user_roles
      where role in ('developer', 'admin')
      order by case role when 'developer' then 0 else 1 end
      limit 1
    ), cfg as (
      select
        set_config('request.jwt.claim.sub', staff.user_id::text, true),
        set_config(
          'request.jwt.claims',
          jsonb_build_object('sub', staff.user_id::text, 'role', 'authenticated')::text,
          true
        )
      from staff
    )
    select jsonb_build_object(
      'role', public.admin_get_context()->>'role',
      'dashboard', (public.admin_get_context()->'permissions') ? 'dashboard.read',
      'overview', public.admin_get_overview() ? 'players'
    ) as payload
    from cfg
  `;
  const staffRows = await (async () => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: staffQuery }),
    });
    if (!response.ok) throw new Error(`Management API HTTP ${response.status}`);
    return response.json();
  })();
  if (staffRows.length === 0) {
    console.log('info  tidak ada akun staff; jalur otorisasi admin tidak dapat diuji');
  } else {
    const staff = staffRows[0].payload;
    expect('RPC admin berjalan untuk staff', staff.role === 'developer' || staff.role === 'admin', String(staff.role));
    expect('staff memiliki izin dashboard.read', staff.dashboard === true);
    expect('admin_get_overview mengembalikan data', staff.overview === true);
  }
} catch (error) {
  fail('verifikasi berhenti', error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verifikasi gagal.`);
  process.exitCode = 1;
} else {
  console.log('\nSemua verifikasi remote lulus.');
}
