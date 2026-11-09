#!/usr/bin/env node
/**
 * Menerapkan migration perbaikan view katalog ke project Supabase nyata, lalu
 * memverifikasi hasilnya lewat PostgREST sebagai akun uji.
 *
 * Butuh Personal Access Token Supabase (bukan anon key):
 *   https://supabase.com/dashboard/account/tokens
 *
 * Pemakaian:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npm run db:apply-catalog-fix
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npm run db:apply-catalog-fix -- --dry-run
 *
 * Project ref diambil dari SUPABASE_PROJECT_REF, atau diturunkan dari
 * VITE_SUPABASE_URL di `.env`. Token tidak pernah ditulis ke log.
 */
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const MIGRATION = 'supabase/migrations/20261110150000_subject_overview_owner.sql';
const API = 'https://api.supabase.com/v1';
const dryRun = process.argv.includes('--dry-run');

function loadEnv() {
  if (!existsSync('.env')) return;
  const text = readFileSync('.env', 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

/** View ini tidak punya body fungsi, jadi pemisahan per `;` aman. */
function splitStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function projectRef(url) {
  const fromEnv = (process.env.SUPABASE_PROJECT_REF ?? '').trim();
  if (fromEnv) return fromEnv;
  const match = url.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : '';
}

loadEnv();

const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const email = (process.env.E2E_EMAIL ?? '').trim();
const password = process.env.E2E_PASSWORD ?? '';
const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
const ref = projectRef(url);

const sql = await readFile(MIGRATION, 'utf8');
const statements = splitStatements(sql);

if (!ref) {
  console.error(
    'Project ref tidak ditemukan. Set SUPABASE_PROJECT_REF atau VITE_SUPABASE_URL di `.env`.',
  );
  process.exit(1);
}

if (dryRun) {
  console.log(`Target : https://api.supabase.com/v1/projects/${ref}/database/query`);
  console.log(`Token  : ${token ? 'terdeteksi (tidak ditampilkan)' : 'TIDAK ADA'}`);
  console.log(`File   : ${MIGRATION} (${statements.length} statement)`);
  statements.forEach((statement, index) => {
    console.log(`\n--- statement ${index + 1} ---\n${statement};`);
  });
  process.exit(0);
}

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN belum diset.');
  console.error('Buat token di https://supabase.com/dashboard/account/tokens lalu jalankan:');
  console.error('  SUPABASE_ACCESS_TOKEN=sbp_xxx npm run db:apply-catalog-fix');
  console.error('Alternatif: terapkan file migration lewat SQL Editor atau `supabase db push`.');
  process.exit(1);
}

async function runStatement(statement) {
  const response = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: `${statement};` }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`HTTP ${response.status} — ${detail}`);
  }
}

try {
  for (const [index, statement] of statements.entries()) {
    const label = statement.split('\n')[0].slice(0, 70);
    await runStatement(statement);
    console.log(`ok   statement ${index + 1}/${statements.length}: ${label}`);
  }
} catch (error) {
  console.error(`Gagal menerapkan migration: ${error.message}`);
  process.exit(1);
}

if (!url || !anonKey || !email || !password) {
  console.log('\nMigration diterapkan. Verifikasi UI dilewati: kredensial akun uji belum lengkap.');
  process.exit(0);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

try {
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw new Error(`login akun uji gagal: ${authError.message}`);

  const { data, error } = await supabase
    .from('subject_overview')
    .select('slug, lesson_count, question_count')
    .eq('slug', 'pemrograman-web')
    .maybeSingle();

  if (error) throw new Error(`view belum terbaca pemain: ${error.message}`);

  if (data?.lesson_count === 8 && data?.question_count === 30) {
    console.log('\nok   subject_overview terbaca pemain (8 lesson, 30 soal)');
    console.log('Perbaikan selesai: katalog kembali memakai view dan log 403 hilang.');
  } else {
    console.error(
      `\nFAIL agregat tak terduga: ${JSON.stringify(data)} — migration mungkin diterapkan di project lain.`,
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`\nFAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  await supabase.auth.signOut();
}
