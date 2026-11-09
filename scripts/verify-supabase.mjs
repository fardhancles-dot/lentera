import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const failures = [];

function ok(label) {
  console.log(`ok   ${label}`);
}

function fail(label, detail = '') {
  failures.push(label);
  console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

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

function answerFor(question) {
  if (question.type === 'multiple_choice') {
    const label = question.prompt.includes('pagi hari')
      ? 'Good morning'
      : question.prompt.includes('apple')
        ? 'Apel'
        : question.prompt.includes('memperkenalkan nama')
          ? 'My name is Kiko'
          : question.prompt.includes('Bentuk jamak')
            ? 'books'
            : null;

    if (!label) throw new Error(`Tidak ada kunci uji untuk prompt: ${question.prompt}`);
    const option = question.options.find((item) => item.label === label);
    if (!option) throw new Error(`Opsi "${label}" tidak ditemukan.`);
    return { optionId: option.id };
  }

  if (question.type === 'picture_identification') {
    const image = question.media.find((item) => item.kind === 'image')?.url ?? '';
    const label = image.includes('book')
      ? 'book'
      : image.includes('globe')
        ? 'globe'
        : image.includes('laptop')
          ? 'laptop'
          : null;
    if (!label) throw new Error(`Gambar uji tidak dikenal: ${image}`);
    const option = question.options.find((item) => item.label === label);
    if (!option) throw new Error(`Opsi "${label}" tidak ditemukan.`);
    return { optionId: option.id };
  }

  if (question.type === 'matching_pairs') {
    const meanings = new Map([
      ['apple', 'apel'],
      ['book', 'buku'],
      ['house', 'rumah'],
      ['water', 'air'],
    ]);
    const matches = question.leftItems.map((left) => {
      const rightLabel = meanings.get(left.label);
      const right = question.rightItems.find((item) => item.label === rightLabel);
      if (!right) throw new Error(`Pasangan untuk "${left.label}" tidak ditemukan.`);
      return { leftId: left.id, rightId: right.id };
    });
    return { matches };
  }

  if (question.type === 'fill_blank') {
    return { text: question.prompt.includes('How do you') ? 'spell' : 'goes' };
  }

  if (question.type === 'word_bank' || question.type === 'sentence_builder') {
    return { text: 'She goes to school every day' };
  }

  throw new Error(`Tipe soal belum didukung skrip verifikasi: ${question.type}`);
}

loadEnv();

const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const email = (process.env.E2E_EMAIL ?? '').trim();
const password = process.env.E2E_PASSWORD ?? '';

if (!url || !anonKey) {
  console.error(
    'FAIL Konfigurasi kosong. Buat .env dari .env.example lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  );
  process.exit(1);
}

if (!email || !password) {
  console.error(
    'FAIL Akun uji belum diisi. Tambahkan E2E_EMAIL dan E2E_PASSWORD ke .env (akun dengan role developer).',
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

try {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError || !auth.user) {
    fail('login akun uji', authError?.message ?? 'session kosong');
    throw new Error('login gagal');
  }
  ok('login akun uji');

  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (roleError) fail('baca role akun uji', roleError.message);
  const role = roleRow?.role ?? 'player';
  ok(`role akun uji: ${role}`);
  if (role !== 'developer' && role !== 'admin') {
    fail('akun uji harus developer/admin', 'jalankan bootstrap_developer lalu coba lagi');
    throw new Error('role tidak memadai');
  }

  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('id, slug')
    .eq('slug', 'greetings-vocabulary')
    .limit(1);
  if (lessonError || !lessons?.[0]) {
    fail('cari lesson greetings-vocabulary', lessonError?.message ?? 'tidak ditemukan');
    throw new Error('lesson tidak ditemukan');
  }

  const { data: nodes, error: nodeError } = await supabase
    .from('learning_nodes')
    .select('id')
    .eq('lesson_id', lessons[0].id)
    .eq('is_active', true)
    .limit(1);
  if (nodeError || !nodes?.[0]) {
    fail('cari node playable', nodeError?.message ?? 'tidak ditemukan');
    throw new Error('node tidak ditemukan');
  }

  const { data: start, error: startError } = await supabase.rpc('start_lesson', {
    p_node_id: nodes[0].id,
  });
  if (startError || !start?.attemptId) {
    fail('start_lesson', startError?.message ?? 'payload kosong');
    throw new Error('start_lesson gagal');
  }
  ok('start_lesson membuat attempt');

  const payloadText = JSON.stringify(start);
  if (Array.isArray(start.questions) && start.questions.length === 12) {
    ok('payload berisi 12 soal');
  } else {
    fail('payload berisi 12 soal', String(start.questions?.length));
  }
  if (!payloadText.includes('is_correct')) ok('payload tidak membocorkan is_correct');
  else fail('payload tidak membocorkan is_correct');
  if (!payloadText.includes('question_answers')) ok('payload tidak membocorkan tabel jawaban');
  else fail('payload tidak membocorkan tabel jawaban');
  if (!payloadText.includes('right_label')) ok('payload tidak membocorkan baris pasangan');
  else fail('payload tidak membocorkan baris pasangan');

  const matching = start.questions.find((question) => question.type === 'matching_pairs');
  if (matching?.leftItems.length === 4 && matching?.rightItems.length === 4) {
    ok('matching mengirim dua kolom terpisah');
  } else {
    fail('matching mengirim dua kolom terpisah');
  }

  const picture = start.questions.find(
    (question) => question.type === 'picture_identification',
  );
  if (
    picture?.media.some(
      (media) => media.kind === 'image' && media.url === '/assets/pictures/book.svg',
    )
  ) {
    ok('picture mengirim media gambar');
  } else {
    fail('picture mengirim media gambar');
  }

  const fill = start.questions.find((question) => question.type === 'fill_blank');
  if (/_{2,}/.test(fill?.prompt ?? '')) ok('fill blank menyimpan penanda rumpang');
  else fail('fill blank menyimpan penanda rumpang');

  let correct = 0;
  for (const question of start.questions) {
    let answer;
    try {
      answer = answerFor(question);
    } catch (error) {
      fail(`buat jawaban uji: ${question.type}`, error.message);
      continue;
    }

    const { data: result, error: answerError } = await supabase.rpc(
      'submit_attempt_answer',
      {
        p_attempt_id: start.attemptId,
        p_question_id: question.id,
        p_answer: answer,
      },
    );
    if (answerError) {
      fail(`nilai soal ${question.type}`, answerError.message);
      continue;
    }
    if (result?.isCorrect) correct += 1;
    else fail(`nilai soal ${question.type}`, 'jawaban uji dinilai salah');
  }

  if (correct === 12) ok('12 jawaban uji dinilai benar di server');
  else fail('12 jawaban uji dinilai benar di server', `${correct}/12`);

  const { data: summary, error: summaryError } = await supabase.rpc(
    'complete_lesson_attempt',
    { p_attempt_id: start.attemptId },
  );
  if (summaryError) {
    fail('complete_lesson_attempt', summaryError.message);
  } else {
    if (summary.totalCount === 12 && summary.correctCount === 12) {
      ok('hasil lesson menghitung 12/12');
    } else {
      fail(
        'hasil lesson menghitung 12/12',
        `${summary.correctCount}/${summary.totalCount}`,
      );
    }
    if (summary.accuracy === 100) ok('akurasi hasil 100%');
    else fail('akurasi hasil 100%', String(summary.accuracy));
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: pairError } = await anon.from('question_pairs').select('id').limit(1);
  if (pairError) ok('question_pairs tidak bisa dibaca tanpa sesi');
  else fail('question_pairs tidak bisa dibaca tanpa sesi');
} catch (error) {
  if (failures.length === 0) fail('verifikasi berhenti', error.message);
} finally {
  await supabase.auth.signOut();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verifikasi Supabase gagal.`);
  process.exitCode = 1;
} else {
  console.log('\nSemua verifikasi Supabase lulus.');
}
