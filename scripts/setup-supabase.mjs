import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const API_BASE = 'https://api.supabase.com/v1';
const DEFAULT_REGION = 'ap-southeast-1';

function loadEnv() {
  if (!existsSync('.env')) return;
  const text = readFileSync('.env', 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
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

function value(key) {
  return (process.env[key] ?? '').trim();
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail =
      data && typeof data === 'object'
        ? (data.message ?? data.error ?? JSON.stringify(data))
        : String(data ?? '');
    const error = new Error(
      `${method} ${path} gagal (${response.status})${detail ? `: ${detail}` : ''}`,
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

function pickKey(keys, preferred) {
  const list = Array.isArray(keys) ? keys : (keys?.data ?? []);
  for (const name of preferred) {
    const match = list.find((item) => item.type === name || item.name === name);
    if (match?.api_key) return match.api_key;
  }
  return '';
}

function normalizeRef(ref) {
  if (!/^[a-z0-9]{20}$/.test(ref)) {
    fail(`SUPABASE_PROJECT_REF tidak valid: ${ref}. Nilainya 20 huruf/angka kecil.`);
  }
  return ref;
}

async function resolveProject(token) {
  const existingRef = value('SUPABASE_PROJECT_REF');
  if (existingRef) {
    const ref = normalizeRef(existingRef);
    const dbPassword = value('SUPABASE_DB_PASSWORD');
    if (!dbPassword) {
      fail('SUPABASE_DB_PASSWORD wajib diisi bila memakai project yang sudah ada.');
    }
    return { ref, dbPassword, created: false };
  }

  const organizations = await api('/organizations', { token });
  const orgList = Array.isArray(organizations) ? organizations : [];
  const wantedOrg = value('SUPABASE_ORG_ID');
  let organization = wantedOrg
    ? orgList.find((item) => item.id === wantedOrg)
    : orgList.length === 1
      ? orgList[0]
      : null;

  // A brand-new account often has no organization yet; create the free one so
  // the user does not have to click through the dashboard first.
  if (!organization && !wantedOrg && orgList.length === 0) {
    console.log('   belum ada organisasi; membuat organisasi baru...');
    organization = await api('/organizations', {
      method: 'POST',
      token,
      body: { name: value('SUPABASE_ORG_NAME') || 'Lentera' },
    });
  }

  if (!organization) {
    const options = orgList.map((item) => `${item.name} (${item.id})`).join(', ');
    fail(
      wantedOrg
        ? `Organisasi ${wantedOrg} tidak ditemukan pada akun ini.`
        : `Pilih organisasi lewat SUPABASE_ORG_ID. Organisasi tersedia: ${options || 'tidak ada'}.`,
    );
  }

  const name = value('SUPABASE_PROJECT_NAME') || `lentera-${randomBytes(2).toString('hex')}`;
  const region = value('SUPABASE_REGION') || DEFAULT_REGION;
  const dbPassword = value('SUPABASE_DB_PASSWORD') || randomBytes(24).toString('base64url');

  console.log(`   membuat project "${name}" di ${region} (paket gratis)...`);
  let created;
  try {
    created = await api('/projects', {
      method: 'POST',
      token,
      body: {
        organization_id: organization.id,
        name,
        region,
        db_pass: dbPassword,
      },
    });
  } catch (error) {
    if (error.status === 402) {
      fail('Kuota project paket gratis sudah penuh. Hapus project lama atau upgrade paket.');
    }
    throw error;
  }

  const ref = normalizeRef(created?.id ?? created?.ref ?? '');
  return { ref, dbPassword, created: true };
}

async function waitForProject(ref, token) {
  const deadline = Date.now() + 10 * 60 * 1000;
  let status = 'unknown';

  while (Date.now() < deadline) {
    const project = await api(`/projects/${ref}`, { token });
    status = project?.status ?? 'unknown';
    if (status === 'ACTIVE_HEALTHY') return;
    if (status === 'FAILED' || status === 'REMOVED') {
      fail(`Project berstatus ${status}. Periksa dashboard Supabase.`);
    }
    await sleep(5000);
  }

  fail(`Project belum aktif setelah 10 menit (status terakhir: ${status}).`);
}

function pushMigrations(ref, dbPassword, token) {
  console.log('   mendorong migration...');
  const args = [
    '--yes',
    'supabase',
    'db',
    'push',
    '--remote',
    ref,
    '--password',
    dbPassword,
    '--include-all',
    '--yes',
  ];
  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    // Node cannot execute npx.cmd directly on Windows without a shell.
    shell: process.platform === 'win32',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });

  if (result.error) console.error(`   ${result.error.message}`);
  if (result.status !== 0) {
    fail('supabase db push gagal. Periksa pesan di atas; migration belum dianggap selesai.');
  }
}

async function authRequest(url, serviceKey, path, options = {}) {
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

async function ensureQaUser(url, serviceKey, email, password) {
  console.log('   menyiapkan akun uji terverifikasi...');
  const created = await authRequest(url, serviceKey, '/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'QA Lentera' },
    }),
  });

  if (created.response.ok) return created.data?.id;

  if (created.response.status !== 422 && created.response.status !== 409) {
    fail(
      `Gagal membuat akun uji (${created.response.status}): ${
        created.data?.msg ?? created.data?.message ?? 'tidak diketahui'
      }`,
    );
  }

  const list = await authRequest(url, serviceKey, '/admin/users?page=1&per_page=1000');
  if (!list.response.ok) {
    fail('Akun uji sudah ada, tetapi daftar pengguna tidak dapat dibaca.');
  }
  const users = list.data?.users ?? list.data ?? [];
  const existing = users.find(
    (item) => String(item.email ?? '').toLowerCase() === email.toLowerCase(),
  );
  if (!existing?.id) {
    fail(`Akun ${email} dilaporkan sudah ada, tetapi tidak ditemukan saat dicari.`);
  }

  const updated = await authRequest(url, serviceKey, `/admin/users/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!updated.response.ok) {
    fail('Akun uji sudah ada, tetapi password-nya tidak dapat disetel ulang.');
  }
  return existing.id;
}

async function promoteDeveloper(ref, email, token) {
  const escaped = email.replace(/'/g, "''");
  await api(`/projects/${ref}/database/query`, {
    method: 'POST',
    token,
    body: { query: `select public.promote_developer('${escaped}');` },
  });
}

function updateEnvFile(updates) {
  const path = '.env';
  const lines = existsSync(path)
    ? readFileSync(path, 'utf8').split(/\r?\n/)
    : ['# Local secrets. Never commit this file.'];
  const pending = new Map(Object.entries(updates));

  const next = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match && pending.has(match[1])) {
      const replacement = `${match[1]}=${pending.get(match[1])}`;
      pending.delete(match[1]);
      return replacement;
    }
    return line;
  });

  for (const [key, entry] of pending) next.push(`${key}=${entry}`);
  while (next.length > 0 && next[next.length - 1] === '') next.pop();
  writeFileSync(path, `${next.join('\n')}\n`, { mode: 0o600 });
}

function runVerification() {
  console.log('\nMenjalankan verifikasi E2E (lesson + Practice Hub)...\n');
  const result = spawnSync(process.execPath, ['scripts/verify-supabase.mjs'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    fail('Verifikasi E2E gagal. Perbaiki temuan di atas lalu ulangi `npm run verify:supabase`.');
  }
}

async function main() {
  loadEnv();

  const dryRun = process.argv.includes('--dry-run');
  const skipVerify = process.argv.includes('--skip-verify');
  const token = value('SUPABASE_ACCESS_TOKEN');
  const region = value('SUPABASE_REGION') || DEFAULT_REGION;

  if (dryRun) {
    console.log('Rencana setup Supabase otomatis:');
    console.log(`  project      : ${value('SUPABASE_PROJECT_REF') || 'buat baru'}`);
    console.log(`  region       : ${region}`);
    console.log(
      `  access token : ${token ? 'tersedia' : 'BELUM diisi (wajib untuk menjalankan sungguhan)'}`,
    );
    console.log(
      `  organisasi   : ${value('SUPABASE_ORG_ID') || 'otomatis bila akun hanya punya satu organisasi'}`,
    );
    console.log(
      `  database pass: ${value('SUPABASE_DB_PASSWORD') ? 'tersedia' : 'akan dibuat otomatis'}`,
    );
    console.log('  langkah      : buat project → tunggu aktif → db push → buat akun QA →');
    console.log('                 jadikan developer → tulis .env → verifikasi lesson + practice');
    process.exit(0);
  }

  if (!token) {
    fail(
      'SUPABASE_ACCESS_TOKEN belum diisi. Buat token di Dashboard Supabase → Account → Access Tokens, lalu tambahkan ke .env.',
    );
  }

  console.log('Setup Supabase otomatis');

  const project = await resolveProject(token);
  if (project.created) console.log(`ok project dibuat: ${project.ref}`);
  else console.log(`ok memakai project yang ada: ${project.ref}`);

  await waitForProject(project.ref, token);
  console.log('ok project aktif');

  const keys = await api(`/projects/${project.ref}/api-keys?reveal=true`, { token });
  const anonKey = pickKey(keys, ['anon', 'publishable']);
  const serviceKey = pickKey(keys, ['service_role', 'secret']);
  if (!anonKey || !serviceKey) {
    fail('API key anon/publishable atau service role tidak ditemukan pada project.');
  }

  const url = `https://${project.ref}.supabase.co`;
  const baseEnv = {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_PROJECT_REF: project.ref,
    SUPABASE_DB_PASSWORD: project.dbPassword,
  };
  updateEnvFile(baseEnv);
  Object.assign(process.env, baseEnv);
  console.log('ok .env menyimpan kredensial project');

  pushMigrations(project.ref, project.dbPassword, token);
  console.log('ok migration selesai');

  const email = value('E2E_EMAIL') || `qa+${project.ref}@example.com`;
  const password =
    value('E2E_PASSWORD') || `Lentera-${randomBytes(12).toString('base64url')}`;

  await ensureQaUser(url, serviceKey, email, password);
  await promoteDeveloper(project.ref, email, token);
  console.log(`ok akun uji ${email} menjadi developer`);

  const envUpdates = {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_PROJECT_REF: project.ref,
    SUPABASE_DB_PASSWORD: project.dbPassword,
    E2E_EMAIL: email,
    E2E_PASSWORD: password,
  };
  updateEnvFile(envUpdates);
  // Keep the child verifier from inheriting stale values loaded earlier.
  Object.assign(process.env, envUpdates);
  console.log('ok .env diperbarui (nilai rahasia tidak ditampilkan)');

  if (!skipVerify) runVerification();

  console.log('Selesai. Dashboard: https://supabase.com/dashboard/project/' + project.ref);
}

main().catch((error) => {
  fail(error?.message ?? String(error));
});
