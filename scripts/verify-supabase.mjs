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

  if (question.type === 'listening') {
    const label = question.prompt.includes('instruksi')
      ? 'Tolong buka bukumu ke halaman sepuluh.'
      : 'Selamat pagi, apa kabar hari ini?';
    const option = question.options.find((item) => item.label === label);
    if (!option) throw new Error(`Opsi "${label}" tidak ditemukan.`);
    return { optionId: option.id };
  }

  if (question.type === 'conversation') {
    const label = "Good morning, Ma'am. We are fine, thank you.";
    const option = question.options.find((item) => item.label === label);
    if (!option) throw new Error(`Opsi "${label}" tidak ditemukan.`);
    return { optionId: option.id };
  }

  if (question.type === 'story') {
    const label = 'Karena lampu taman mati dan taman menjadi gelap.';
    const option = question.options.find((item) => item.label === label);
    if (!option) throw new Error(`Opsi "${label}" tidak ditemukan.`);
    return { optionId: option.id };
  }

  if (question.type === 'speaking') {
    return { text: 'Good morning, how are you?' };
  }

  if (question.type === 'translation') {
    return { text: 'I read a book in the library' };
  }

  if (question.type === 'matching_pairs') {
    const meanings = new Map([
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

  // Migration 20261110150000 makes the catalog view run with owner rights while
  // `questions` stays revoked. Before it is applied this check fails with
  // "permission denied for table questions", which is the expected signal.
  const { data: catalog, error: catalogError } = await supabase
    .from('subject_overview')
    .select('slug, lesson_count, question_count')
    .eq('slug', 'pemrograman-web')
    .maybeSingle();
  if (catalogError) {
    fail('view katalog bisa dibaca pemain', catalogError.message);
  } else if (catalog?.lesson_count !== 8 || catalog?.question_count !== 30) {
    fail('view katalog bisa dibaca pemain', JSON.stringify(catalog));
  } else {
    ok('view katalog bisa dibaca pemain (8 lesson, 30 soal)');
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
  if (Array.isArray(start.questions) && start.questions.length === 20) {
    ok('payload berisi 20 soal');
  } else {
    fail('payload berisi 20 soal', String(start.questions?.length));
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

  for (const type of ['listening', 'speaking', 'conversation', 'story']) {
    const sceneQuestion = start.questions.find((question) => question.type === type);
    const hasScene =
      sceneQuestion?.scene &&
      typeof sceneQuestion.scene === 'object' &&
      Object.keys(sceneQuestion.scene).length > 0;
    if (hasScene) ok(`scene ${type} terkirim`);
    else fail(`scene ${type} terkirim`);
  }

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

  if (correct === 20) ok('20 jawaban uji dinilai benar di server');
  else fail('20 jawaban uji dinilai benar di server', `${correct}/20`);

  const { data: summary, error: summaryError } = await supabase.rpc(
    'complete_lesson_attempt',
    { p_attempt_id: start.attemptId },
  );
  if (summaryError) {
    fail('complete_lesson_attempt', summaryError.message);
  } else {
    if (summary.totalCount === 20 && summary.correctCount === 20) {
      ok('hasil lesson menghitung 20/20');
    } else {
      fail(
        'hasil lesson menghitung 20/20',
        `${summary.correctCount}/${summary.totalCount}`,
      );
    }
    if (summary.accuracy === 100) ok('akurasi hasil 100%');
    else fail('akurasi hasil 100%', String(summary.accuracy));
  }

  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, slug')
    .eq('slug', 'bahasa-inggris')
    .limit(1);
  if (courseError || !courses?.[0]) {
    fail('cari course bahasa-inggris', courseError?.message ?? 'tidak ditemukan');
    throw new Error('course tidak ditemukan');
  }

  const { data: quest, error: questError } = await supabase.rpc('create_friend_quest', {
    p_title: 'Verifikasi Friends Quest',
    p_target_xp: 20,
    p_reward_xp: 5,
    p_reward_coins: 1,
  });
  if (questError || !quest?.id || !/^[A-Z0-9]{6}$/.test(quest.code ?? '')) {
    fail('create_friend_quest', questError?.message ?? 'payload kosong');
    throw new Error('create_friend_quest gagal');
  }
  ok('create_friend_quest membuat quest dengan kode');

  const { data: practice, error: practiceError } = await supabase.rpc('start_practice', {
    p_mode: 'match_madness',
    p_course_id: courses[0].id,
  });
  if (practiceError || !practice?.sessionId) {
    fail('start_practice match madness', practiceError?.message ?? 'payload kosong');
    throw new Error('start_practice gagal');
  }
  ok('start_practice membuat sesi latihan');
  if (practice.questionCount === 3) ok('match madness memilih 3 soal');
  else fail('match madness memilih 3 soal', String(practice.questionCount));
  if (practice.timeLimitSeconds === 90) ok('match madness memakai batas 90 detik');
  else fail('match madness memakai batas 90 detik', String(practice.timeLimitSeconds));
  if (
    Array.isArray(practice.questions) &&
    practice.questions.length > 0 &&
    practice.questions.every((question) => question.type === 'matching_pairs')
  ) {
    ok('match madness hanya memakai soal matching');
  } else {
    fail('match madness hanya memakai soal matching');
  }
  if (!JSON.stringify(practice).includes('is_correct')) {
    ok('payload latihan tidak membocorkan is_correct');
  } else {
    fail('payload latihan tidak membocorkan is_correct');
  }

  const practiceMeanings = new Map([
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

  let practiceCorrect = 0;
  for (const question of practice.questions) {
    const matches = question.leftItems.map((left) => {
      const right = question.rightItems.find(
        (item) => item.label === practiceMeanings.get(left.label),
      );
      if (!right) throw new Error(`Pasangan untuk "${left.label}" tidak ditemukan.`);
      return { leftId: left.id, rightId: right.id };
    });

    const { data: result, error: answerError } = await supabase.rpc(
      'submit_practice_answer',
      {
        p_session_id: practice.sessionId,
        p_question_id: question.id,
        p_answer: { matches },
        p_elapsed_ms: 1200,
      },
    );
    if (answerError) {
      fail('nilai jawaban latihan', answerError.message);
      continue;
    }
    if (result?.isCorrect) practiceCorrect += 1;
    else fail('nilai jawaban latihan', 'jawaban uji dinilai salah');
  }

  if (practiceCorrect === practice.questionCount) {
    ok(`semua ${practiceCorrect} jawaban latihan dinilai benar`);
  } else {
    fail('semua jawaban latihan dinilai benar', `${practiceCorrect}/${practice.questionCount}`);
  }

  const { data: practiceSummary, error: completeError } = await supabase.rpc(
    'complete_practice_session',
    { p_session_id: practice.sessionId },
  );
  if (completeError) {
    fail('complete_practice_session', completeError.message);
  } else {
    if (practiceSummary.accuracy === 100) ok('akurasi latihan 100%');
    else fail('akurasi latihan 100%', String(practiceSummary.accuracy));
    if (practiceSummary.xpAwarded > 0) ok('latihan memberi XP');
    else fail('latihan memberi XP', String(practiceSummary.xpAwarded));
    if (practiceSummary.score > practiceSummary.totalCount) {
      ok('skor latihan memuat bonus kecepatan/combo');
    } else {
      fail('skor latihan memuat bonus kecepatan/combo', String(practiceSummary.score));
    }

    const { data: repeatSummary, error: repeatError } = await supabase.rpc(
      'complete_practice_session',
      { p_session_id: practice.sessionId },
    );
    if (repeatError) {
      fail('penyelesaian latihan ulang', repeatError.message);
    } else if (
      repeatSummary.alreadyCompleted === true &&
      repeatSummary.xpAwarded === 0 &&
      repeatSummary.totalXp === practiceSummary.totalXp
    ) {
      ok('penyelesaian ulang tidak menambah XP');
    } else {
      fail('penyelesaian ulang tidak menambah XP');
    }
  }

  for (let round = 0; round < 3; round += 1) {
    const { data: extra, error: extraError } = await supabase.rpc('start_practice', {
      p_mode: 'match_madness',
      p_course_id: courses[0].id,
    });
    if (extraError || !extra?.sessionId) {
      fail('start_practice tambahan untuk Friends Quest', extraError?.message ?? 'payload kosong');
      break;
    }

    for (const question of extra.questions) {
      const matches = question.leftItems.map((left) => {
        const right = question.rightItems.find(
          (item) => item.label === practiceMeanings.get(left.label),
        );
        if (!right) throw new Error(`Pasangan untuk "${left.label}" tidak ditemukan.`);
        return { leftId: left.id, rightId: right.id };
      });
      const { error: extraAnswerError } = await supabase.rpc('submit_practice_answer', {
        p_session_id: extra.sessionId,
        p_question_id: question.id,
        p_answer: { matches },
        p_elapsed_ms: 1200,
      });
      if (extraAnswerError) {
        fail('nilai jawaban latihan tambahan', extraAnswerError.message);
      }
    }

    const { data: extraSummary, error: extraCompleteError } = await supabase.rpc(
      'complete_practice_session',
      { p_session_id: extra.sessionId },
    );
    if (extraCompleteError || !(extraSummary?.xpAwarded > 0)) {
      fail(
        'selesaikan latihan tambahan untuk Friends Quest',
        extraCompleteError?.message ?? String(extraSummary?.xpAwarded),
      );
      break;
    }
  }

  const { data: quests, error: questsError } = await supabase.rpc('get_my_friend_quests');
  const currentQuest = Array.isArray(quests)
    ? quests.find((item) => item.id === quest.id)
    : null;
  if (questsError || !currentQuest) {
    fail('get_my_friend_quests memuat quest', questsError?.message ?? 'quest tidak ditemukan');
  } else {
    if (currentQuest.status === 'completed' && currentQuest.totalXp >= 20) {
      ok('XP latihan dihitung ke target Friends Quest');
    } else {
      fail(
        'XP latihan dihitung ke target Friends Quest',
        `${currentQuest.status} · ${currentQuest.totalXp}`,
      );
    }

    if (currentQuest.canClaim === true) ok('Friends Quest selesai dapat diklaim');
    else fail('Friends Quest selesai dapat diklaim');
  }

  const { data: claim, error: claimError } = await supabase.rpc(
    'claim_friend_quest_reward',
    { p_quest_id: quest.id },
  );
  if (claimError) {
    fail('claim_friend_quest_reward', claimError.message);
  } else if (
    claim.alreadyClaimed === false &&
    claim.xpAwarded === 5 &&
    claim.coinsAwarded === 1
  ) {
    ok('klaim Friends Quest memberi hadiah sesuai konfigurasi');
  } else {
    fail('klaim Friends Quest memberi hadiah sesuai konfigurasi');
  }

  const { data: repeatClaim, error: repeatClaimError } = await supabase.rpc(
    'claim_friend_quest_reward',
    { p_quest_id: quest.id },
  );
  if (repeatClaimError) {
    fail('klaim Friends Quest ulang', repeatClaimError.message);
  } else if (repeatClaim.alreadyClaimed === true && repeatClaim.xpAwarded === 0) {
    ok('klaim Friends Quest ulang tidak menambah hadiah');
  } else {
    fail('klaim Friends Quest ulang tidak menambah hadiah');
  }

  const { data: playerState, error: playerStateError } = await supabase.rpc(
    'get_player_state',
  );
  if (playerStateError) {
    fail('get_player_state', playerStateError.message);
  } else {
    const hearts = playerState?.hearts;
    const streak = playerState?.streak;
    const level = playerState?.level;

    if (
      typeof playerState?.totalXp === 'number' &&
      typeof playerState?.coins === 'number' &&
      hearts?.max === 5 &&
      typeof hearts?.current === 'number' &&
      typeof hearts?.nextRefillSeconds === 'number' &&
      Array.isArray(streak?.activityDays) &&
      typeof level?.level === 'number' &&
      level?.progressPercent >= 0 &&
      level?.progressPercent <= 100
    ) {
      ok('get_player_state mengembalikan Hearts, Streak, level, dan Koin');
    } else {
      fail('get_player_state mengembalikan Hearts, Streak, level, dan Koin', JSON.stringify(playerState));
    }

    if (hearts?.current >= hearts?.max) {
      const { data: refill, error: refillError } = await supabase.rpc('refill_hearts');
      if (refillError) {
        fail('refill_hearts saat penuh', refillError.message);
      } else if (refill?.alreadyFull === true && refill?.coinsSpent === 0) {
        ok('refill_hearts saat penuh tidak memakai Koin');
      } else {
        fail('refill_hearts saat penuh tidak memakai Koin', JSON.stringify(refill));
      }
    }
  }

  const { data: walletRpc, error: walletRpcError } = await supabase.rpc('get_my_wallet');
  if (walletRpcError) {
    fail('get_my_wallet', walletRpcError.message);
  } else if (
    Array.isArray(walletRpc?.transactions) &&
    Array.isArray(walletRpc?.xpTransactions) &&
    typeof walletRpc?.coins === 'number' &&
    Array.isArray(walletRpc?.levelRewards) &&
    walletRpc.levelRewards.length === 30 &&
    Array.isArray(walletRpc?.streakMilestones) &&
    walletRpc.streakMilestones.length === 6
  ) {
    ok('get_my_wallet mengembalikan saldo, riwayat, hadiah level, dan milestone');
  } else {
    fail(
      'get_my_wallet mengembalikan saldo, riwayat, hadiah level, dan milestone',
      JSON.stringify(walletRpc),
    );
  }

  const { data: levelTable, error: levelTableError } = await supabase
    .from('player_levels')
    .select('level, xp_required, reward_coins')
    .order('level');
  if (levelTableError || levelTable?.length !== 30) {
    fail(
      'tabel player_levels berisi 30 level',
      levelTableError?.message ?? String(levelTable?.length),
    );
  } else if (
    levelTable[0]?.xp_required === 0 &&
    levelTable[29]?.xp_required === 9400 &&
    levelTable.every((level) => typeof level.reward_coins === 'number')
  ) {
    ok('tabel player_levels berisi 30 level dengan ambang XP dan hadiah');
  } else {
    fail('tabel player_levels berisi 30 level dengan ambang XP dan hadiah');
  }

  const { data: questRpc, error: questRpcError } = await supabase.rpc('get_my_quests');
  if (questRpcError) {
    fail('get_my_quests', questRpcError.message);
  } else if (
    Array.isArray(questRpc?.quests) &&
    questRpc.quests.length === 6 &&
    questRpc.quests.every(
      (quest) =>
        typeof quest.progress === 'number' &&
        typeof quest.target === 'number' &&
        typeof quest.canClaim === 'boolean',
    )
  ) {
    ok('get_my_quests mengembalikan 3 misi harian dan 3 mingguan');
  } else {
    fail('get_my_quests mengembalikan 3 misi harian dan 3 mingguan', JSON.stringify(questRpc));
  }

  const { data: invalidQuest, error: invalidQuestError } = await supabase.rpc(
    'claim_quest_reward',
    { p_quest_id: '00000000-0000-4000-8000-000000000000' },
  );
  if (invalidQuestError?.message.includes('quest_not_found') || !invalidQuest) {
    ok('claim_quest_reward menolak misi yang tidak ada');
  } else {
    fail('claim_quest_reward menolak misi yang tidak ada', JSON.stringify(invalidQuest));
  }

  const { data: achievementRpc, error: achievementRpcError } = await supabase.rpc(
    'get_my_achievements',
  );
  if (achievementRpcError) {
    fail('get_my_achievements', achievementRpcError.message);
  } else if (
    achievementRpc?.total === 8 &&
    Array.isArray(achievementRpc?.achievements) &&
    achievementRpc.achievements.every(
      (achievement) =>
        typeof achievement.progress === 'number' &&
        (achievement.unlockedAt === null || typeof achievement.unlockedAt === 'string'),
    )
  ) {
    ok('get_my_achievements mengembalikan 8 pencapaian dan progres');
  } else {
    fail('get_my_achievements mengembalikan 8 pencapaian dan progres', JSON.stringify(achievementRpc));
  }

  const { data: shopRpc, error: shopRpcError } = await supabase.rpc('get_shop_catalog');
  if (shopRpcError) {
    fail('get_shop_catalog', shopRpcError.message);
  } else if (
    typeof shopRpc?.coins === 'number' &&
    Array.isArray(shopRpc?.items) &&
    shopRpc.items.length === 2 &&
    shopRpc.items.every(
      (item) => typeof item.priceCoins === 'number' && typeof item.canBuy === 'boolean',
    )
  ) {
    ok('get_shop_catalog mengembalikan dua item dengan harga server');
  } else {
    fail('get_shop_catalog mengembalikan dua item dengan harga server', JSON.stringify(shopRpc));
  }

  const { data: invalidPurchase, error: invalidPurchaseError } = await supabase.rpc(
    'purchase_shop_item',
    { p_item_id: '00000000-0000-4000-8000-000000000000' },
  );
  if (invalidPurchaseError?.message.includes('shop_item_not_found') || !invalidPurchase) {
    ok('purchase_shop_item menolak item yang tidak ada');
  } else {
    fail('purchase_shop_item menolak item yang tidak ada', JSON.stringify(invalidPurchase));
  }

  const { data: inventoryRpc, error: inventoryRpcError } = await supabase.rpc(
    'get_my_inventory',
  );
  if (inventoryRpcError) {
    fail('get_my_inventory', inventoryRpcError.message);
  } else if (
    typeof inventoryRpc?.coins === 'number' &&
    typeof inventoryRpc?.streakFreezes === 'number' &&
    Array.isArray(inventoryRpc?.items)
  ) {
    ok('get_my_inventory mengembalikan tas dan jumlah perisai');
  } else {
    fail('get_my_inventory mengembalikan tas dan jumlah perisai', JSON.stringify(inventoryRpc));
  }

  const { data: invalidUse, error: invalidUseError } = await supabase.rpc(
    'use_inventory_item',
    { p_item_id: '00000000-0000-4000-8000-000000000000' },
  );
  if (invalidUseError?.message.includes('inventory_item_not_owned') || !invalidUse) {
    ok('use_inventory_item menolak item yang tidak dimiliki');
  } else {
    fail('use_inventory_item menolak item yang tidak dimiliki', JSON.stringify(invalidUse));
  }

  const { data: masteryRpc, error: masteryRpcError } = await supabase.rpc('get_my_mastery');
  const masterySummary = masteryRpc?.summary;
  if (masteryRpcError) {
    fail('get_my_mastery', masteryRpcError.message);
  } else if (
    typeof masterySummary?.tracked === 'number' &&
    typeof masterySummary?.due === 'number' &&
    typeof masterySummary?.accuracy === 'number' &&
    Array.isArray(masteryRpc?.courses) &&
    masterySummary.tracked >= 1 &&
    masterySummary.accuracy >= 0
  ) {
    ok('get_my_mastery mengembalikan ringkasan dan progres soal terlacak');
  } else {
    fail('get_my_mastery mengembalikan ringkasan dan progres soal terlacak', JSON.stringify(masteryRpc));
  }

  const { data: scheduledReview, error: scheduledReviewError } = await supabase.rpc(
    'start_scheduled_review',
    { p_course_id: courses[0].id },
  );
  if (scheduledReview?.sessionId) {
    ok('start_scheduled_review membuat sesi dari soal jatuh tempo');
  } else if (scheduledReviewError?.message.includes('practice_no_due_reviews')) {
    ok('start_scheduled_review menolak dengan benar saat belum ada soal jatuh tempo');
  } else {
    fail(
      'start_scheduled_review membuat sesi atau menolak dengan practice_no_due_reviews',
      scheduledReviewError?.message ?? JSON.stringify(scheduledReview),
    );
  }

  const { data: rewardNodes, error: rewardNodesError } = await supabase
    .from('learning_nodes')
    .select('id, slug, reward_coins, reward_xp')
    .eq('node_type', 'reward')
    .eq('is_active', true);
  if (
    !rewardNodesError &&
    rewardNodes?.length === 22 &&
    rewardNodes.every((node) => node.reward_coins > 0 && node.reward_xp > 0)
  ) {
    ok('tabel learning_nodes berisi 22 node hadiah dengan Koin dan XP');
  } else {
    fail(
      'tabel learning_nodes berisi 22 node hadiah dengan Koin dan XP',
      rewardNodesError?.message ?? String(rewardNodes?.length),
    );
  }

  const { data: unknownReward, error: unknownRewardError } = await supabase.rpc(
    'claim_reward_node',
    { p_node_id: '00000000-0000-4000-8000-000000000000' },
  );
  if (unknownRewardError?.message.includes('reward_not_found') || !unknownReward) {
    ok('claim_reward_node menolak node yang tidak ada');
  } else {
    fail('claim_reward_node menolak node yang tidak ada', JSON.stringify(unknownReward));
  }

  const { error: masteryWriteError } = await supabase
    .from('user_question_mastery')
    .update({ mastery_level: 5 })
    .eq('user_id', auth.user.id);
  if (masteryWriteError) ok('pemain tidak bisa mengubah mastery langsung');
  else fail('pemain tidak bisa mengubah mastery langsung');

  const { error: rewardClaimWriteError } = await supabase
    .from('user_reward_claims')
    .insert({ user_id: auth.user.id, coins: 9999, xp: 9999 });
  if (rewardClaimWriteError) ok('pemain tidak bisa menulis klaim hadiah langsung');
  else fail('pemain tidak bisa menulis klaim hadiah langsung');

  const { data: questDefinitions, error: questDefinitionsError } = await supabase
    .from('quest_definitions')
    .select('code, cadence, target')
    .eq('is_active', true);
  if (!questDefinitionsError && questDefinitions?.length === 6) {
    ok('tabel quest_definitions berisi enam misi aktif');
  } else {
    fail(
      'tabel quest_definitions berisi enam misi aktif',
      questDefinitionsError?.message ?? String(questDefinitions?.length),
    );
  }

  const { data: streakMilestones, error: streakMilestonesError } = await supabase
    .from('streak_milestones')
    .select('days, reward_coins')
    .order('days');
  if (!streakMilestonesError && streakMilestones?.length === 6) {
    ok('tabel streak_milestones berisi enam milestone');
  } else {
    fail(
      'tabel streak_milestones berisi enam milestone',
      streakMilestonesError?.message ?? String(streakMilestones?.length),
    );
  }

  const { data: achievementDefinitions, error: achievementDefinitionsError } = await supabase
    .from('achievement_definitions')
    .select('code, target')
    .eq('is_active', true);
  if (!achievementDefinitionsError && achievementDefinitions?.length === 8) {
    ok('tabel achievement_definitions berisi delapan pencapaian');
  } else {
    fail(
      'tabel achievement_definitions berisi delapan pencapaian',
      achievementDefinitionsError?.message ?? String(achievementDefinitions?.length),
    );
  }

  const { data: shopItems, error: shopItemsError } = await supabase
    .from('shop_items')
    .select('slug, price_coins, max_stack')
    .eq('is_active', true);
  if (!shopItemsError && shopItems?.length === 2) {
    ok('tabel shop_items berisi dua item aktif');
  } else {
    fail(
      'tabel shop_items berisi dua item aktif',
      shopItemsError?.message ?? String(shopItems?.length),
    );
  }

  const { error: inventoryWriteError } = await supabase
    .from('user_inventory')
    .update({ quantity: 99 })
    .eq('user_id', auth.user.id);
  if (inventoryWriteError) ok('pemain tidak bisa mengubah inventory langsung');
  else fail('pemain tidak bisa mengubah inventory langsung');

  const { data: ownHearts, error: ownHeartsError } = await supabase
    .from('user_hearts')
    .select('current_hearts, max_hearts');
  if (ownHeartsError || ownHearts?.length !== 1) {
    fail(
      'RLS Hearts hanya mengembalikan milik sendiri',
      ownHeartsError?.message ?? String(ownHearts?.length),
    );
  } else {
    ok('RLS Hearts hanya mengembalikan milik sendiri');
  }

  const { error: heartsWriteError } = await supabase
    .from('user_hearts')
    .update({ current_hearts: 5 })
    .eq('user_id', auth.user.id);
  if (heartsWriteError) ok('pemain tidak bisa mengubah Hearts langsung');
  else fail('pemain tidak bisa mengubah Hearts langsung');

  const { data: ownStreaks, error: ownStreaksError } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak');
  if (ownStreaksError || ownStreaks?.length !== 1) {
    fail(
      'RLS Streak hanya mengembalikan milik sendiri',
      ownStreaksError?.message ?? String(ownStreaks?.length),
    );
  } else {
    ok('RLS Streak hanya mengembalikan milik sendiri');
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: pairError } = await anon.from('question_pairs').select('id').limit(1);
  if (pairError) ok('question_pairs tidak bisa dibaca tanpa sesi');
  else fail('question_pairs tidak bisa dibaca tanpa sesi');

  const { error: practiceRlsError } = await anon
    .from('practice_sessions')
    .select('id')
    .limit(1);
  if (practiceRlsError) ok('practice_sessions tidak bisa dibaca tanpa sesi');
  else fail('practice_sessions tidak bisa dibaca tanpa sesi');

  const { error: heartsRlsError } = await anon
    .from('user_hearts')
    .select('current_hearts')
    .limit(1);
  if (heartsRlsError) ok('user_hearts tidak bisa dibaca tanpa sesi');
  else fail('user_hearts tidak bisa dibaca tanpa sesi');
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
