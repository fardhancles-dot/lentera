import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';

const db = await PGlite.create({ extensions: { citext } });
const failures = [];

function check(condition, label, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
  } else {
    failures.push(label);
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function run(file) {
  const sql = await readFile(file, 'utf8');
  await db.exec(sql);
  console.log(`migration ok: ${file}`);
}

async function asUser(userId) {
  await db.query(`select set_config('app.user_id', $1, false)`, [userId]);
}

async function expectError(label, sql, params, expected) {
  try {
    await db.query(sql, params);
    check(false, label, 'no error raised');
  } catch (error) {
    const message = String(error?.message ?? error);
    check(message.includes(expected), label, message);
  }
}

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create or replace function auth.uid()
    returns uuid language sql stable
    as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;
  `);
  console.log('auth stub ok');

  await run('supabase/migrations/20261108090000_identity.sql');
  await run('supabase/migrations/20261108100000_curriculum.sql');
  await run('supabase/migrations/20261108105000_curriculum_overview.sql');
  await run('supabase/migrations/20261108107000_question_pairs.sql');
  await run('supabase/migrations/20261108109000_question_scenes.sql');
  await run('supabase/migrations/20261108110000_curriculum_seed.sql');
  await run('supabase/migrations/20261108120000_lesson_engine.sql');
  await run('supabase/migrations/20261109100000_practice_engine.sql');
  await run('supabase/migrations/20261110100000_friends_quest.sql');
  await run('supabase/migrations/20261110120000_progression_economy.sql');
  await run('supabase/migrations/20261110130000_tahap5_rewards.sql');
  await run('supabase/migrations/20261110140000_mastery_review_rewards.sql');
  await run('supabase/migrations/20261110150000_subject_overview_owner.sql');
  await run('supabase/migrations/20261111100000_social_league.sql');
  await run('supabase/migrations/20261111110000_developer_dashboard.sql');
  await run('supabase/migrations/20261112100000_one_question_per_level.sql');
  await run('supabase/migrations/20261112110000_admin_foundation.sql');
  await run('supabase/migrations/20261112120000_admin_curriculum.sql');
  await run('supabase/migrations/20261112130000_admin_content.sql');
  await run('supabase/migrations/20261112140000_admin_gamification.sql');
  await run('supabase/migrations/20261112150000_maintenance_mode.sql');

  const content = await db.query(`
    select
      (select count(*) from public.subjects where status = 'active')::int as active_subjects,
      (select count(*) from public.lessons)::int as lessons,
      (select count(*) from public.questions)::int as questions,
      (select count(distinct node_type) from public.learning_nodes)::int as node_kinds,
      (select count(distinct type) from public.questions)::int as question_types
  `);
  const stats = content.rows[0];
  check(stats.active_subjects === 8, '8 primary subjects are active', String(stats.active_subjects));
  check(stats.lessons === 57, '57 lessons are seeded', String(stats.lessons));
  check(stats.questions === 231, '231 questions are seeded', String(stats.questions));
  check(
    stats.node_kinds === 7,
    'all seven node kinds, including reward, exist',
    String(stats.node_kinds),
  );
  check(stats.question_types === 12, 'all twelve question types are seeded', String(stats.question_types));

  const miniGameData = await db.query(`
    select
      (select count(*) from public.questions q
       join public.lessons l on l.id = q.lesson_id
       where l.slug = 'greetings-vocabulary')::int as lesson_questions,
      (select count(*) from public.question_pairs)::int as pairs,
      (select count(*) from public.question_media where media_kind = 'image')::int as images,
      (select count(distinct q.type) from public.questions q
       where q.type in ('word_bank', 'sentence_builder', 'matching_pairs', 'fill_blank', 'picture_identification'))::int as minigame_types,
      (select count(*) from public.questions q
       join public.lessons l on l.id = q.lesson_id
       join public.units u on u.id = l.unit_id
       join public.course_levels lv on lv.id = u.course_level_id
       join public.courses c on c.id = lv.course_id
       join public.subjects s on s.id = c.subject_id
       where s.slug = 'bahasa-inggris')::int as english_questions
  `);
  const miniData = miniGameData.rows[0];
  check(miniData.lesson_questions === 20, 'greetings lesson has 20 questions', String(miniData.lesson_questions));
  check(miniData.pairs === 19, 'matching questions store 19 pairs', String(miniData.pairs));
  check(miniData.images === 3, 'three picture questions have image media', String(miniData.images));
  check(miniData.minigame_types === 5, 'five mini-game question types are seeded', String(miniData.minigame_types));
  check(miniData.english_questions === 45, 'English has 45 questions', String(miniData.english_questions));

  const miniQuestions = await db.query(
    `select q.id, q.type, q.slug
     from public.questions q
     join public.lessons l on l.id = q.lesson_id
     where l.slug = 'greetings-vocabulary'
       and q.slug in (
         'en-wordbank-daily-routine', 'en-builder-daily-routine',
         'en-fill-daily-routine', 'en-matching-vocabulary', 'en-picture-book'
       )`,
  );
  const miniBySlug = Object.fromEntries(miniQuestions.rows.map((row) => [row.slug, row]));
  check(miniQuestions.rows.length === 5, 'all five mini-game samples are seeded');

  const matchingPairs = await db.query(
    `select left_id, right_id from public.question_pairs
     where question_id = $1 order by sort_order`,
    [miniBySlug['en-matching-vocabulary'].id],
  );
  const matches = matchingPairs.rows.map((pair) => ({
    leftId: pair.left_id,
    rightId: pair.right_id,
  }));
  const grade = async (slug, answer) => {
    const result = await db.query('select public.grade_question($1, $2::jsonb) as correct', [
      miniBySlug[slug].id,
      JSON.stringify(answer),
    ]);
    return result.rows[0].correct;
  };
  check(await grade('en-matching-vocabulary', { matches }), 'matching pairs grades a full correct set');
  check(
    !(await grade('en-matching-vocabulary', {
      matches: matches.map((pair, index) => ({
        leftId: pair.leftId,
        rightId: matches[(index + 1) % matches.length].rightId,
      })),
    })),
    'matching pairs rejects crossed pairs',
  );
  check(
    !(await grade('en-matching-vocabulary', { matches: matches.slice(0, 2) })),
    'matching pairs rejects an incomplete set',
  );
  check(
    !(await grade('en-matching-vocabulary', {
      matches: [...matches.slice(0, 3), { leftId: matches[0].leftId, rightId: matches[0].rightId }],
    })),
    'matching pairs rejects duplicate left ids',
  );
  check(
    await grade('en-fill-daily-routine', { text: '  GOES ' }),
    'fill blank grading is case-insensitive and trims spaces',
  );
  check(
    !(await grade('en-fill-daily-routine', { text: 'go' })),
    'fill blank rejects a wrong word',
  );
  check(
    await grade('en-wordbank-daily-routine', { text: 'She goes to school every day' }),
    'word bank grades the correct token order',
  );
  check(
    !(await grade('en-wordbank-daily-routine', { text: 'goes She school to every day' })),
    'word bank rejects the wrong token order',
  );
  check(
    await grade('en-builder-daily-routine', { text: 'She goes to school every day' }),
    'sentence builder grades the correct sentence',
  );
  check(
    !(await grade('en-builder-daily-routine', { text: 'She to goes school every day' })),
    'sentence builder rejects a scrambled sentence',
  );
  const bookOption = await db.query(
    `select id from public.question_options
     where question_id = $1 and is_correct limit 1`,
    [miniBySlug['en-picture-book'].id],
  );
  check(
    await grade('en-picture-book', { optionId: bookOption.rows[0].id }),
    'picture identification grades the matching option',
  );
  check(
    !(await grade('en-picture-book', { optionId: '00000000-0000-4000-8000-000000000000' })),
    'picture identification rejects an unknown option',
  );

  const stageFourQuestions = await db.query(
    `select id, slug, type, scene from public.questions
     where slug in (
       'en-listening-classroom', 'en-listening-greeting', 'en-speaking-greeting',
       'en-translation-library', 'en-conversation-teacher', 'en-story-kiko-garden'
     )`,
  );
  const stageFour = Object.fromEntries(
    stageFourQuestions.rows.map((row) => [row.slug, row]),
  );
  check(stageFourQuestions.rows.length === 6, 'all six dialogue questions are seeded');
  check(
    stageFour['en-listening-classroom']?.scene?.speech === 'Please open your book to page ten.',
    'listening question stores its speech transcript',
  );
  check(
    stageFour['en-conversation-teacher']?.scene?.npc?.name === 'Bu Rani' &&
      stageFour['en-conversation-teacher']?.scene?.screens?.length === 1,
    'conversation question stores an NPC and dialogue line',
  );
  check(
    stageFour['en-story-kiko-garden']?.scene?.screens?.length === 3,
    'story question stores three scene screens',
  );
  check(
    stageFour['en-speaking-greeting']?.scene?.speech?.length > 0,
    'speaking question stores a model sentence',
  );
  check(
    stageFour['en-listening-classroom']?.scene?.lang === 'en-US',
    'English listening declares the en-US locale',
  );
  check(
    stageFour['en-conversation-teacher']?.scene?.responses?.length === 4,
    'conversation stores one NPC reaction per option',
  );
  check(
    stageFour['en-story-kiko-garden']?.scene?.screens?.[1]?.choices?.length === 2,
    'story stores an ungraded response choice',
  );

  const indonesianStageFour = await db.query(
    `select id, slug, type, prompt, scene from public.questions
     where slug in (
       'id-listening-ejaan', 'id-speaking-perpustakaan',
       'id-fill-dua-rumpang', 'id-conversation-guru', 'id-story-kalimat-efektif'
     )`,
  );
  const indoFour = Object.fromEntries(
    indonesianStageFour.rows.map((row) => [row.slug, row]),
  );
  check(indonesianStageFour.rows.length === 5, 'five Indonesian Stage 4 questions are seeded');
  check(
    indoFour['id-listening-ejaan']?.scene?.lang === 'id-ID',
    'Indonesian listening declares the id-ID locale',
  );
  check(
    (indoFour['id-fill-dua-rumpang']?.prompt?.match(/_{2,}/g) ?? []).length === 2,
    'Indonesian fill blank stores two inline blanks',
  );
  check(
    indoFour['id-conversation-guru']?.scene?.responses?.length === 4,
    'Indonesian conversation stores four NPC reactions',
  );
  check(
    indoFour['id-story-kalimat-efektif']?.scene?.screens?.[1]?.choices?.length === 3,
    'Indonesian story stores three response choices',
  );

  const gradeIndo = async (slug, answer) => {
    const result = await db.query('select public.grade_question($1, $2::jsonb) as correct', [
      indoFour[slug].id,
      JSON.stringify(answer),
    ]);
    return result.rows[0].correct;
  };
  check(
    await gradeIndo('id-fill-dua-rumpang', { text: 'membaca menulis' }),
    'multi-blank fill accepts both words in order',
  );
  check(
    !(await gradeIndo('id-fill-dua-rumpang', { text: 'menulis membaca' })),
    'multi-blank fill rejects the reversed order',
  );

  const gradeFour = async (slug, answer) => {
    const result = await db.query('select public.grade_question($1, $2::jsonb) as correct', [
      stageFour[slug].id,
      JSON.stringify(answer),
    ]);
    return result.rows[0].correct;
  };

  const optionIdFor = async (slug, correct) => {
    const result = await db.query(
      `select id from public.question_options
       where question_id = $1 and is_correct = $2 order by sort_order limit 1`,
      [stageFour[slug].id, correct],
    );
    return result.rows[0]?.id;
  };

  check(
    await gradeFour('en-listening-classroom', {
      optionId: await optionIdFor('en-listening-classroom', true),
    }),
    'listening grades the matching option',
  );
  check(
    !(await gradeFour('en-listening-classroom', {
      optionId: await optionIdFor('en-listening-classroom', false),
    })),
    'listening rejects a wrong option',
  );
  check(
    await gradeFour('en-conversation-teacher', {
      optionId: await optionIdFor('en-conversation-teacher', true),
    }),
    'conversation grades the polite response',
  );
  check(
    !(await gradeFour('en-conversation-teacher', {
      optionId: await optionIdFor('en-conversation-teacher', false),
    })),
    'conversation rejects an impolite response',
  );
  check(
    await gradeFour('en-story-kiko-garden', {
      optionId: await optionIdFor('en-story-kiko-garden', true),
    }),
    'story grades the comprehension answer',
  );
  check(
    !(await gradeFour('en-story-kiko-garden', {
      optionId: await optionIdFor('en-story-kiko-garden', false),
    })),
    'story rejects a wrong comprehension answer',
  );
  check(
    await gradeFour('en-speaking-greeting', { text: 'Good morning, how are you?' }),
    'speaking accepts the recognized sentence',
  );
  check(
    !(await gradeFour('en-speaking-greeting', { text: 'Good night, see you' })),
    'speaking rejects an unrelated sentence',
  );
  check(
    await gradeFour('en-translation-library', { text: 'i read a book in the library' }),
    'translation accepts the correct English sentence',
  );
  check(
    !(await gradeFour('en-translation-library', { text: 'I reads a book at library' })),
    'translation rejects a wrong sentence',
  );

  const nodeKinds = await db.query(
    `select node_type::text as node_type, count(*)::int as count
     from public.learning_nodes group by node_type`,
  );
  const nodeCounts = Object.fromEntries(nodeKinds.rows.map((row) => [row.node_type, row.count]));
  for (const nodeType of ['practice', 'checkpoint', 'legendary']) {
    check(
      nodeCounts[nodeType] === 7,
      `seven ${nodeType} nodes are seeded`,
      String(nodeCounts[nodeType] ?? 0),
    );
  }

  const emptyPlayable = await db.query(
    `select count(*)::int as count
     from public.learning_nodes n
     join public.lessons l on l.id = n.lesson_id
     join public.units u on u.id = n.unit_id
     join public.course_levels lv on lv.id = u.course_level_id
     join public.courses c on c.id = lv.course_id
     join public.subjects s on s.id = c.subject_id
     where n.is_active and s.is_primary
       and not exists (
         select 1 from public.questions q where q.lesson_id = l.id and q.is_active
       )`,
  );
  check(
    emptyPlayable.rows[0].count === 0,
    'every playable node of a primary subject has questions',
    String(emptyPlayable.rows[0].count),
  );

  const stageThreeNodes = await db.query(
    `select count(*)::int as count
     from public.learning_nodes n
     join public.lessons l on l.id = n.lesson_id
     where n.node_type in ('practice', 'checkpoint', 'legendary')
       and (select count(*) from public.questions q where q.lesson_id = l.id) >= 3`,
  );
  check(
    stageThreeNodes.rows[0].count === 21,
    'all 21 practice/checkpoint/legendary nodes are playable with at least 3 questions',
    String(stageThreeNodes.rows[0].count),
  );

  const stageOrder = await db.query(
    `select
       string_agg(n.node_type::text, ',' order by lv.sort_order, u.sort_order, n.sort_order) as types,
       string_agg(lv.slug, ',' order by lv.sort_order, u.sort_order, n.sort_order) as levels
     from public.learning_nodes n
     join public.units u on u.id = n.unit_id
     join public.course_levels lv on lv.id = u.course_level_id
     join public.courses c on c.id = lv.course_id
     join public.subjects s on s.id = c.subject_id
     where s.slug = 'pemrograman-web'
       and n.node_type in ('practice', 'checkpoint', 'legendary')`,
  );
  check(
    stageOrder.rows[0]?.types === 'practice,checkpoint,legendary',
    'path orders practice before checkpoint before legendary',
    String(stageOrder.rows[0]?.types),
  );
  check(
    stageOrder.rows[0]?.levels === 'elementary,elementary,intermediate',
    'practice and checkpoint sit in level 2; legendary closes level 3',
    String(stageOrder.rows[0]?.levels),
  );

  const overview = await db.query(
    `select lesson_count, question_count from public.subject_overview where slug = 'pemrograman-web'`,
  );
  check(
    overview.rows[0]?.lesson_count === 8 && overview.rows[0]?.question_count === 30,
    'subject overview aggregates the eight lessons and 30 questions',
    JSON.stringify(overview.rows[0] ?? null),
  );

  // Regression guard: players may only read the aggregate view even though
  // `questions` is revoked for them. This failed before the owner-rights fix.
  await db.exec('set role authenticated');
  try {
    const playerOverview = await db.query(
      `select lesson_count, question_count from public.subject_overview where slug = 'pemrograman-web'`,
    );
    check(
      playerOverview.rows[0]?.lesson_count === 8 &&
        playerOverview.rows[0]?.question_count === 30,
      'signed-in player can read subject overview without question access',
      JSON.stringify(playerOverview.rows[0] ?? null),
    );
  } finally {
    await db.exec('reset role');
  }

  const users = await db.query(`
    insert into auth.users (email) values
      ('player-one@example.com'), ('player-two@example.com'), ('player-three@example.com')
    returning id, email
  `);
  const user1 = users.rows.find((row) => row.email.startsWith('player-one')).id;
  const user2 = users.rows.find((row) => row.email.startsWith('player-two')).id;
  const user3 = users.rows.find((row) => row.email.startsWith('player-three')).id;
  check(Boolean(user1 && user2 && user3), 'trigger created three auth users');
  await asUser(user1);

  const path = await db.query(`
    select n.id as node_id, n.title as node_title, l.id as lesson_id, l.slug, l.xp_reward, l.coin_reward,
      lv.sort_order as level_order, u.sort_order as unit_order, n.sort_order as node_order
    from public.learning_nodes n
    join public.lessons l on l.id = n.lesson_id
    join public.units u on u.id = n.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    where s.slug = 'pemrograman-web'
    order by lv.sort_order, u.sort_order, n.sort_order
  `);
  check(path.rows.length === 8, 'pemrograman-web has 8 playable nodes', String(path.rows.length));
  const firstNode = path.rows[0];
  const secondNode = path.rows[1];

  await expectError(
    'second node is locked before the first is complete',
    'select public.start_lesson($1)',
    [secondNode.node_id],
    'lesson_locked',
  );

  const started = await db.query('select public.start_lesson($1) as payload', [firstNode.node_id]);
  const start = started.rows[0].payload;
  check(
    start.attemptId && start.questions.length === 1,
    'start_lesson returns exactly one question per level',
    String(start.questions?.length),
  );
  const rawPayload = JSON.stringify(start);
  check(!rawPayload.includes('is_correct'), 'payload never exposes is_correct');
  check(!rawPayload.includes('question_answers'), 'payload never exposes answer table');

  const attemptId = start.attemptId;
  const details = await db.query(
    `select q.id, q.type,
       (select id from public.question_options where question_id = q.id and is_correct order by sort_order limit 1) as correct_option,
       (select id from public.question_options where question_id = q.id and not is_correct order by sort_order limit 1) as wrong_option,
       (select answer from public.question_answers where question_id = q.id order by id limit 1) as answer
     from public.questions q
     where q.lesson_id = $1 and q.is_active
     order by q.sort_order, q.id
     limit 1`,
    [firstNode.lesson_id],
  );
  check(details.rows.length === 1, 'the level question is loaded for grading');

  const question = details.rows[0];
  check(
    question.id === start.questions[0].id,
    'the played question is the first question of the lesson bank',
  );
  const wrongAnswer = question.type === 'multiple_choice'
    ? { optionId: question.wrong_option }
    : { text: 'jawaban-salah' };
  const wrongResult = await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb) as payload',
    [attemptId, question.id, JSON.stringify(wrongAnswer)],
  );
  const wrongPayload = wrongResult.rows[0].payload;
  check(wrongPayload.isCorrect === false, 'wrong answer is graded incorrect');
  check(Boolean(wrongPayload.explanation), 'wrong answer returns an explanation');
  check(Boolean(wrongPayload.correctAnswer), 'wrong answer returns the correct answer for feedback');
  check(wrongPayload.totalCount === 1, 'answer feedback reports a one-question level');

  const duplicate = await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb) as payload',
    [attemptId, question.id, JSON.stringify(wrongAnswer)],
  );
  check(duplicate.rows[0].payload.alreadyAnswered === true, 'duplicate answer is idempotent');

  const failed = await db.query('select public.complete_lesson_attempt($1) as payload', [attemptId]);
  check(
    failed.rows[0].payload.passed === false &&
      failed.rows[0].payload.correctCount === 0 &&
      failed.rows[0].payload.totalCount === 1 &&
      failed.rows[0].payload.accuracy === 0,
    'one wrong answer fails a one-question level',
    JSON.stringify(failed.rows[0].payload),
  );
  check(
    failed.rows[0].payload.xpAwarded === 0 && failed.rows[0].payload.coinsAwarded === 0,
    'a failed level grants no XP or Coins',
  );

  const retryStart = await db.query('select public.start_lesson($1) as payload', [firstNode.node_id]);
  const retryAttempt = retryStart.rows[0].payload.attemptId;
  check(
    retryStart.rows[0].payload.questions.length === 1 &&
      retryStart.rows[0].payload.questions[0].id === question.id,
    'retrying a level presents the same single question',
  );
  const correctAnswer = question.type === 'multiple_choice'
    ? { optionId: question.correct_option }
    : { text: question.answer };
  await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb)',
    [retryAttempt, question.id, JSON.stringify(correctAnswer)],
  );

  const early = await db.query('select public.complete_lesson_attempt($1) as payload', [retryAttempt]);
  check(Boolean(early.rows[0].payload.passed), 'the correct answer completes the level');

  const summary = early.rows[0].payload;
  check(summary.correctCount === 1 && summary.totalCount === 1, 'summary counts 1 of 1 correct');
  check(summary.accuracy === 100, 'accuracy is 100');
  check(summary.xpAwarded === 10 && summary.coinsAwarded === 2, 'rewards awarded once on first pass');

  const repeat = await db.query('select public.complete_lesson_attempt($1) as payload', [retryAttempt]);
  check(repeat.rows[0].payload.alreadyCompleted === true, 'repeat completion is idempotent');
  check(repeat.rows[0].payload.xpAwarded === 0, 'repeat completion grants no XP');

  const ledger = await db.query('select count(*)::int as count, coalesce(sum(amount),0)::int as total from public.user_xp_ledger where user_id = $1', [user1]);
  check(ledger.rows[0].count === 1 && ledger.rows[0].total === 10, 'XP ledger has exactly one entry');
  const wallet = await db.query('select coins from public.user_wallets where user_id = $1', [user1]);
  check(wallet.rows[0].coins === 2, 'coin wallet has 2 coins');

  const progress = await db.query(
    `select p.status, c.completed_lessons, c.xp
     from public.user_node_progress p
     join public.learning_nodes n on n.id = p.node_id
     join public.units u on u.id = n.unit_id
     join public.course_levels lv on lv.id = u.course_level_id
     join public.user_course_progress c on c.course_id = lv.course_id and c.user_id = p.user_id
     where p.user_id = $1 and p.node_id = $2`,
    [user1, firstNode.node_id],
  );
  check(
    progress.rows[0]?.status === 'completed' &&
      progress.rows[0]?.completed_lessons === 1 &&
      progress.rows[0]?.xp === 10,
    'node and course progress persisted',
    JSON.stringify(progress.rows[0] ?? null),
  );

  const unlocked = await db.query('select public.start_lesson($1) as payload', [secondNode.node_id]);
  check(Boolean(unlocked.rows[0].payload.attemptId), 'next node unlocks after completion');
  const reviewAttempt = unlocked.rows[0].payload.attemptId;

  await expectError(
    'completion before answering every question is rejected',
    'select public.complete_lesson_attempt($1)',
    [reviewAttempt],
    'attempt_incomplete',
  );

  const reviewQuestions = await db.query(
    `select q.id, q.type,
       (select id from public.question_options where question_id = q.id and is_correct limit 1) as correct_option,
       (select answer from public.question_answers where question_id = q.id order by id limit 1) as answer
     from public.questions q where q.lesson_id = $1 and q.is_active
     order by q.sort_order, q.id limit 1`,
    [secondNode.lesson_id],
  );
  check(reviewQuestions.rows.length === 1, 'the next level also delivers one question');
  for (const question of reviewQuestions.rows) {
    const answer = question.type === 'multiple_choice'
      ? { optionId: question.correct_option }
      : { text: question.answer };
    await db.query('select public.submit_attempt_answer($1, $2, $3::jsonb)', [
      reviewAttempt,
      question.id,
      JSON.stringify(answer),
    ]);
  }
  const reviewSummary = await db.query('select public.complete_lesson_attempt($1) as payload', [reviewAttempt]);
  check(reviewSummary.rows[0].payload.accuracy === 100, 'review lesson can reach 100%');
  check(reviewSummary.rows[0].payload.totalXp === 20, 'global XP accumulates across lessons');

  const replayStart = await db.query('select public.start_lesson($1) as payload', [firstNode.node_id]);
  const replayId = replayStart.rows[0].payload.attemptId;
  check(replayStart.rows[0].payload.questions.length === 1, 'replay also loads one question');
  for (const question of details.rows) {
    const answer = question.type === 'multiple_choice'
      ? { optionId: question.correct_option }
      : { text: question.answer };
    await db.query('select public.submit_attempt_answer($1, $2, $3::jsonb)', [
      replayId,
      question.id,
      JSON.stringify(answer),
    ]);
  }
  const replay = await db.query('select public.complete_lesson_attempt($1) as payload', [replayId]);
  check(replay.rows[0].payload.xpAwarded === 0, 'replaying a completed lesson grants no XP');
  const ledgerAfterReplay = await db.query(
    'select count(*)::int as count from public.user_xp_ledger where user_id = $1',
    [user1],
  );
  check(ledgerAfterReplay.rows[0].count === 2, 'replay did not add a ledger row');

  // RLS: user one must not see user two's attempt, and cannot edit a wallet.
  await db.query(
    `insert into public.lesson_attempts (user_id, lesson_id, node_id, total_count, max_score)
     values ($1, $2, $3, 1, 10)`,
    [user2, firstNode.lesson_id, firstNode.node_id],
  );
  const total = await db.query('select count(*)::int as count from public.lesson_attempts');
  await db.exec('set role authenticated');
  await asUser(user1);
  const visible = await db.query('select count(*)::int as count from public.lesson_attempts');
  check(
    visible.rows[0].count === total.rows[0].count - 1,
    'RLS hides another player’s attempts',
    `${visible.rows[0].count} vs ${total.rows[0].count}`,
  );
  await expectError(
    'RLS blocks direct wallet edits',
    'update public.user_wallets set coins = 999 where user_id = $1',
    [user1],
    'permission denied',
  );
  await expectError(
    'pairs are not readable by players',
    'select count(*) from public.question_pairs',
    [],
    'permission denied',
  );
  await db.exec('reset role');

  await asUser(user1);

  // -------------------------------------------------------------------------
  // Progression: Hearts, Streak, account level, and wallet RPCs.
  // -------------------------------------------------------------------------
  await asUser(user3);
  const initialProgress = await db.query('select public.get_player_state() as payload');
  check(
    initialProgress.rows[0].payload.hearts.current === 5 &&
      initialProgress.rows[0].payload.hearts.max === 5,
    'new player starts with five Hearts',
    JSON.stringify(initialProgress.rows[0].payload.hearts),
  );
  check(initialProgress.rows[0].payload.streak.current === 0, 'new player starts with a zero streak');
  check(initialProgress.rows[0].payload.coins === 0, 'new player starts with an empty wallet');

  const levelTwo = await db.query('select public.player_level_for_xp(100) as payload');
  check(levelTwo.rows[0].payload.level === 2, '100 XP reaches account level 2');
  check(levelTwo.rows[0].payload.title === 'Penjelajah', 'level 2 exposes its title');
  check(levelTwo.rows[0].payload.progressPercent === 0, 'fresh level 2 starts at 0% progress');

  await db.query(
    'update public.user_hearts set current_hearts = 0, last_refill_at = now() where user_id = $1',
    [user3],
  );
  await expectError(
    'zero Hearts blocks starting a lesson',
    'select public.start_lesson($1)',
    [firstNode.node_id],
    'hearts_empty',
  );

  await db.query(
    'update public.user_hearts set current_hearts = 5, last_refill_at = now() where user_id = $1',
    [user3],
  );
  const heartStart = await db.query('select public.start_lesson($1) as payload', [firstNode.node_id]);
  const heartAttempt = heartStart.rows[0].payload.attemptId;
  const heartQuestions = await db.query(
    `select q.id, q.type,
       (select id from public.question_options where question_id = q.id and is_correct order by sort_order limit 1) as correct_option,
       (select id from public.question_options where question_id = q.id and not is_correct order by sort_order limit 1) as wrong_option,
       (select answer from public.question_answers where question_id = q.id order by id limit 1) as answer
     from public.questions q
     where q.lesson_id = $1 and q.is_active
     order by q.sort_order
     limit 2`,
    [firstNode.lesson_id],
  );
  const firstHeartQuestion = heartQuestions.rows[0];
  const secondHeartQuestion = heartQuestions.rows[1];
  const wrongHeartAnswer = firstHeartQuestion.wrong_option
    ? { optionId: firstHeartQuestion.wrong_option }
    : { text: 'jawaban-salah' };

  const wrongHeart = await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb) as payload',
    [heartAttempt, firstHeartQuestion.id, JSON.stringify(wrongHeartAnswer)],
  );
  check(wrongHeart.rows[0].payload.isCorrect === false, 'Hearts test submits a wrong answer');
  await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb)',
    [heartAttempt, firstHeartQuestion.id, JSON.stringify(wrongHeartAnswer)],
  );
  const heartsAfterDuplicate = await db.query(
    'select current_hearts from public.user_hearts where user_id = $1',
    [user3],
  );
  check(
    heartsAfterDuplicate.rows[0].current_hearts === 4,
    'wrong answer removes one Heart and a duplicate does not remove another',
    String(heartsAfterDuplicate.rows[0].current_hearts),
  );

  const correctHeartAnswer = secondHeartQuestion.correct_option
    ? { optionId: secondHeartQuestion.correct_option }
    : { text: secondHeartQuestion.answer };
  await db.query('select public.submit_attempt_answer($1, $2, $3::jsonb)', [
    heartAttempt,
    secondHeartQuestion.id,
    JSON.stringify(correctHeartAnswer),
  ]);
  const heartsAfterCorrect = await db.query(
    'select current_hearts from public.user_hearts where user_id = $1',
    [user3],
  );
  check(heartsAfterCorrect.rows[0].current_hearts === 4, 'a correct answer does not spend a Heart');

  // The XP ledger is the source of truth for Streak and level. Quest XP is
  // deliberately excluded from the activity streak.
  await db.query(
    "insert into public.user_xp_ledger (user_id, amount, source) values ($1, 100, 'lesson')",
    [user3],
  );
  const afterLevelXp = await db.query('select public.get_player_state() as payload');
  const levelState = afterLevelXp.rows[0].payload;
  check(levelState.totalXp === 100, 'XP ledger total is server-derived', String(levelState.totalXp));
  check(levelState.level.level === 2, 'account level follows the XP threshold');
  check(levelState.streak.current === 1, 'first activity creates a one-day streak');
  check(levelState.streak.longest === 1, 'streak also records the longest run');
  check(levelState.todayXp === 100, 'today XP comes from the ledger');

  await db.query(
    "insert into public.user_xp_ledger (user_id, amount, source) values ($1, 10, 'practice')",
    [user3],
  );
  await db.query(
    "insert into public.user_xp_ledger (user_id, amount, source) values ($1, 25, 'friend_quest_reward')",
    [user3],
  );
  const afterMoreXp = await db.query('select public.get_player_state() as payload');
  check(afterMoreXp.rows[0].payload.totalXp === 135, 'quest XP is included in total XP');
  check(
    afterMoreXp.rows[0].payload.streak.current === 1,
    'quest XP does not extend the activity streak',
  );
  check(
    afterMoreXp.rows[0].payload.level.progressPercent === 23,
    'level progress uses the XP gap to the next threshold',
    String(afterMoreXp.rows[0].payload.level.progressPercent),
  );

  await db.query(
    `insert into public.user_wallets (user_id, coins) values ($1, 10)
     on conflict (user_id) do update set coins = excluded.coins`,
    [user3],
  );
  await db.query(
    'update public.user_hearts set current_hearts = 2, last_refill_at = now() where user_id = $1',
    [user3],
  );
  await db.exec('set role authenticated');
  await asUser(user3);
  await expectError(
    'refill rejects a wallet with insufficient coins',
    'select public.refill_hearts()',
    [],
    'not_enough_coins',
  );
  await db.exec('reset role');
  const rejectedRefill = await db.query(
    'select current_hearts from public.user_hearts where user_id = $1',
    [user3],
  );
  check(rejectedRefill.rows[0].current_hearts === 2, 'failed refill leaves Hearts unchanged');

  await db.query('update public.user_wallets set coins = 100 where user_id = $1', [user3]);
  await db.exec('set role authenticated');
  await asUser(user3);
  const refill = await db.query('select public.refill_hearts() as payload');
  const refillPayload = refill.rows[0].payload;
  check(refillPayload.hearts.current === 5, 'refill restores Hearts to the maximum');
  check(refillPayload.coins === 70, 'refill deducts 10 Coins per missing Heart');
  check(refillPayload.coinsSpent === 30 && refillPayload.heartsRestored === 3, 'refill reports its server cost');

  const walletPayload = await db.query('select public.get_my_wallet() as payload');
  const walletRpc = walletPayload.rows[0].payload;
  check(Array.isArray(walletRpc.transactions), 'wallet returns a coin transaction list');
  check(
    walletRpc.transactions.some((transaction) => transaction.source === 'heart_refill' && transaction.amount === -30),
    'refill writes a negative coin transaction',
  );
  check(
    Array.isArray(walletRpc.xpTransactions) && walletRpc.xpTransactions.length === 3,
    'wallet returns the XP ledger history',
  );

  const fullRefill = await db.query('select public.refill_hearts() as payload');
  check(fullRefill.rows[0].payload.alreadyFull === true, 'refill on full Hearts is idempotent');
  check(fullRefill.rows[0].payload.coinsSpent === 0, 'full refill spends no Coins');

  await db.exec('reset role');
  await asUser(user3);
  await db.exec('set role authenticated');
  const visibleHearts = await db.query('select count(*)::int as count from public.user_hearts');
  check(visibleHearts.rows[0].count === 1, 'RLS hides another player’s Hearts');
  const visibleStreaks = await db.query('select count(*)::int as count from public.user_streaks');
  check(visibleStreaks.rows[0].count === 1, 'RLS hides another player’s Streak');
  const visibleLevels = await db.query('select count(*)::int as count from public.player_levels');
  check(visibleLevels.rows[0].count === 30, 'authenticated players can read the level table');
  await expectError(
    'RLS blocks direct Hearts edits',
    'update public.user_hearts set current_hearts = 5 where user_id = $1',
    [user3],
    'permission denied',
  );
  await db.exec('reset role');

  await asUser(user1);

  // -------------------------------------------------------------------------
  // Practice engine: timed modes, combo scoring, and idempotent XP.
  // -------------------------------------------------------------------------
  const courseRows = await db.query(
    `select s.slug, c.id
     from public.courses c
     join public.subjects s on s.id = c.subject_id
     where s.slug in ('bahasa-inggris', 'pemrograman-web')`,
  );
  const englishCourse = courseRows.rows.find((row) => row.slug === 'bahasa-inggris').id;
  const webCourse = courseRows.rows.find((row) => row.slug === 'pemrograman-web').id;

  const correctAnswerFor = async (question) => {
    if (question.type === 'matching_pairs') {
      const pairs = await db.query(
        'select left_id, right_id from public.question_pairs where question_id = $1',
        [question.id],
      );
      return {
        matches: pairs.rows.map((pair) => ({ leftId: pair.left_id, rightId: pair.right_id })),
      };
    }

    const answerRow = await db.query(
      `select
         (select id from public.question_options where question_id = $1 and is_correct limit 1) as option_id,
         (select answer from public.question_answers where question_id = $1 order by id limit 1) as text_answer`,
      [question.id],
    );

    return answerRow.rows[0].option_id
      ? { optionId: answerRow.rows[0].option_id }
      : { text: answerRow.rows[0].text_answer };
  };

  const timedStart = await db.query('select public.start_practice(\'timed\', $1) as payload', [
    englishCourse,
  ]);
  const timed = timedStart.rows[0].payload;
  check(timed.questions.length === 10, 'timed practice returns 10 questions');
  check(timed.timeLimitSeconds === 120, 'timed practice carries a 120 second limit');
  check(!JSON.stringify(timed).includes('is_correct'), 'practice payload never exposes is_correct');
  check(!JSON.stringify(timed).includes('question_answers'), 'practice payload never exposes answers');

  for (const question of timed.questions) {
    const answer = await correctAnswerFor(question);
    await db.query('select public.submit_practice_answer($1, $2, $3::jsonb, $4)', [
      timed.sessionId,
      question.id,
      JSON.stringify(answer),
      3000,
    ]);
  }

  const timedSummaryResult = await db.query(
    'select public.complete_practice_session($1) as payload',
    [timed.sessionId],
  );
  const timedSummary = timedSummaryResult.rows[0].payload;
  check(timedSummary.accuracy === 100, 'timed practice can reach 100% accuracy');
  check(timedSummary.passed === true, 'timed practice passes at 100%');
  check(timedSummary.xpAwarded === 20, 'timed practice grants capped practice XP');
  check(
    timedSummary.score > timedSummary.maxScore,
    'speed and combo bonuses raise the practice score above base points',
    `${timedSummary.score} vs ${timedSummary.maxScore}`,
  );
  check(timedSummary.bestCombo >= 10, 'combo keeps rising on a perfect run');

  const timedRepeat = await db.query(
    'select public.complete_practice_session($1) as payload',
    [timed.sessionId],
  );
  check(timedRepeat.rows[0].payload.alreadyCompleted === true, 'practice completion is idempotent');
  check(timedRepeat.rows[0].payload.xpAwarded === 0, 'repeat practice completion grants no XP');

  const practiceLedger = await db.query(
    `select count(*)::int as count, coalesce(sum(amount), 0)::int as total
     from public.user_xp_ledger where source = 'practice' and user_id = $1`,
    [user1],
  );
  check(
    practiceLedger.rows[0].count === 1 && practiceLedger.rows[0].total === 20,
    'practice XP is written once to the ledger',
    JSON.stringify(practiceLedger.rows[0]),
  );

  const madnessStart = await db.query(
    "select public.start_practice('match_madness', $1) as payload",
    [englishCourse],
  );
  const madness = madnessStart.rows[0].payload;
  check(madness.questions.length === 3, 'match madness returns three matching rounds');
  check(
    madness.questions.every((question) => question.type === 'matching_pairs'),
    'match madness only uses matching pair questions',
  );
  check(madness.timeLimitSeconds === 90, 'match madness carries a 90 second limit');

  await expectError(
    'unit review requires a unit',
    "select public.start_practice('unit_review', $1, null)",
    [englishCourse],
    'practice_unit_required',
  );

  const unitRow = await db.query(
    `select u.id
     from public.units u
     join public.course_levels lv on lv.id = u.course_level_id
     join public.courses c on c.id = lv.course_id
     join public.subjects s on s.id = c.subject_id
     where s.slug = 'bahasa-inggris'
     order by lv.sort_order, u.sort_order limit 1`,
  );
  const unitStart = await db.query(
    "select public.start_practice('unit_review', $1, $2) as payload",
    [englishCourse, unitRow.rows[0].id],
  );
  check(
    unitStart.rows[0].payload.questions.length >= 3,
    'unit review returns the questions of the selected unit',
    String(unitStart.rows[0].payload.questions.length),
  );

  const mistakesStart = await db.query(
    "select public.start_practice('mistakes', $1) as payload",
    [webCourse],
  );
  check(
    mistakesStart.rows[0].payload.questions.length >= 1,
    'mistakes review finds previously wrong answers',
  );

  const sessionCount = await db.query('select count(*)::int as count from public.practice_sessions');
  await db.exec('set role authenticated');
  await asUser(user2);
  const hiddenSessions = await db.query('select count(*)::int as count from public.practice_sessions');
  check(
    hiddenSessions.rows[0].count === 0,
    'RLS hides another player’s practice sessions',
    `${hiddenSessions.rows[0].count} vs ${sessionCount.rows[0].count}`,
  );
  await expectError(
    'players cannot insert practice sessions directly',
    `insert into public.practice_sessions (user_id, course_id, mode, question_count)
     values ($1, $2, 'timed', 1)`,
    [user2, englishCourse],
    'permission denied',
  );
  await db.exec('reset role');

  await asUser(user1);

  // -------------------------------------------------------------------------
  // Friends Quest: invite code, shared XP, RLS isolation, and idempotent claim.
  // -------------------------------------------------------------------------
  const createdQuest = await db.query(
    `select public.create_friend_quest('Belajar Bersama', 30, 25, 10) as payload`,
  );
  const quest = createdQuest.rows[0].payload;
  check(Boolean(quest?.id && /^[A-Z0-9]{6}$/.test(quest.code)), 'friend quest is created with an invite code');
  check(quest.targetXp === 30 && quest.rewardXp === 25 && quest.rewardCoins === 10, 'friend quest stores target and rewards');
  check(quest.memberCount === 1 && quest.viewerContribution === 0, 'creator becomes the first member with zero contribution');

  await db.exec('set role authenticated');
  await asUser(user2);
  const hiddenQuest = await db.query('select count(*)::int as count from public.friend_quests');
  check(hiddenQuest.rows[0].count === 0, 'RLS hides a friend quest from non-members');
  const joinedQuest = await db.query('select public.join_friend_quest($1) as payload', [quest.code]);
  check(
    joinedQuest.rows[0].payload.memberCount === 2,
    'a player can join a friend quest with the invite code',
  );
  check(
    (await db.query('select count(*)::int as count from public.friend_quests')).rows[0].count === 1,
    'RLS exposes the friend quest after joining',
  );
  await db.exec('reset role');

  await asUser(user1);
  const questPractice = await db.query(
    "select public.start_practice('timed', $1) as payload",
    [webCourse],
  );
  const questSession = questPractice.rows[0].payload;
  for (const question of questSession.questions) {
    const answer = await correctAnswerFor(question);
    await db.query('select public.submit_practice_answer($1, $2, $3::jsonb, $4)', [
      questSession.sessionId,
      question.id,
      JSON.stringify(answer),
      3000,
    ]);
  }
  const questPracticeSummary = await db.query(
    'select public.complete_practice_session($1) as payload',
    [questSession.sessionId],
  );
  check(questPracticeSummary.rows[0].payload.xpAwarded === 20, 'quest practice awards its own XP');

  const afterPractice = await db.query('select public.get_my_friend_quests() as payload');
  const questAfterPractice = afterPractice.rows[0].payload[0];
  check(
    questAfterPractice.totalXp === 20 && questAfterPractice.viewerContribution === 20,
    'practice XP is counted toward the shared quest total',
    JSON.stringify(questAfterPractice),
  );
  check(questAfterPractice.status === 'active', 'quest stays active below its target');

  await asUser(user2);
  const questLessonPath = await db.query(
    `select n.id as node_id, l.id as lesson_id
     from public.learning_nodes n
     join public.lessons l on l.id = n.lesson_id
     join public.units u on u.id = n.unit_id
     join public.course_levels lv on lv.id = u.course_level_id
     join public.courses c on c.id = lv.course_id
     join public.subjects s on s.id = c.subject_id
     where s.slug = 'pemrograman-web'
     order by lv.sort_order, u.sort_order, n.sort_order
     limit 1`,
  );
  const questLesson = questLessonPath.rows[0];
  const questAttempt = await db.query('select public.start_lesson($1) as payload', [
    questLesson.node_id,
  ]);
  const questAttemptId = questAttempt.rows[0].payload.attemptId;
  const questQuestions = await db.query(
    `select q.id,
       (select id from public.question_options where question_id = q.id and is_correct limit 1) as correct_option,
       (select answer from public.question_answers where question_id = q.id order by id limit 1) as answer
     from public.questions q where q.lesson_id = $1 and q.is_active
     order by q.sort_order, q.id limit 1`,
    [questLesson.lesson_id],
  );
  check(questAttempt.rows[0].payload.questions.length === 1, 'quest lesson attempt carries one question');
  for (const question of questQuestions.rows) {
    const answer = question.correct_option
      ? { optionId: question.correct_option }
      : { text: question.answer };
    await db.query('select public.submit_attempt_answer($1, $2, $3::jsonb)', [
      questAttemptId,
      question.id,
      JSON.stringify(answer),
    ]);
  }
  const questLessonSummary = await db.query(
    'select public.complete_lesson_attempt($1) as payload',
    [questAttemptId],
  );
  check(questLessonSummary.rows[0].payload.xpAwarded === 10, 'second member earns lesson XP');

  const completedQuest = await db.query('select public.get_my_friend_quests() as payload');
  const questCompleted = completedQuest.rows[0].payload[0];
  check(questCompleted.status === 'completed', 'quest completes when combined XP reaches the target');
  check(questCompleted.totalXp === 30, 'quest total combines both members', String(questCompleted.totalXp));
  check(questCompleted.canClaim === true, 'completed quest exposes the claim action');

  await asUser(user1);
  const claim = await db.query('select public.claim_friend_quest_reward($1) as payload', [quest.id]);
  check(claim.rows[0].payload.alreadyClaimed === false, 'first claim is accepted');
  check(
    claim.rows[0].payload.xpAwarded === 25 && claim.rows[0].payload.coinsAwarded === 10,
    'claim awards the configured XP and coins',
  );
  const claimRepeat = await db.query('select public.claim_friend_quest_reward($1) as payload', [quest.id]);
  check(claimRepeat.rows[0].payload.alreadyClaimed === true, 'second claim is rejected as already claimed');
  check(claimRepeat.rows[0].payload.xpAwarded === 0, 'second claim grants no XP');

  const questLedger = await db.query(
    `select count(*)::int as count
     from public.user_xp_ledger
     where friend_quest_id = $1 and user_id = $2 and source = 'friend_quest_reward'`,
    [quest.id, user1],
  );
  check(questLedger.rows[0].count === 1, 'friend quest reward is written once to the ledger');

  await asUser(user3);
  await expectError(
    'a non-member cannot claim a friend quest reward',
    'select public.claim_friend_quest_reward($1)',
    [quest.id],
    'friend_quest_not_member',
  );

  await asUser(user1);
  const staffCheck = await db.query('select public.is_staff() as staff');
  check(staffCheck.rows[0].staff === false, 'player is not staff');

  // Staff preview lets the test inspect the real mini-game payload without
  // replaying every earlier node in the English course.
  const miniNode = await db.query(
    `select n.id from public.learning_nodes n
     join public.lessons l on l.id = n.lesson_id
     where l.slug = 'greetings-vocabulary' limit 1`,
  );
  await db.query(`update public.user_roles set role = 'developer' where user_id = $1`, [user1]);
  const miniStartResult = await db.query('select public.start_lesson($1) as payload', [
    miniNode.rows[0].id,
  ]);
  await db.query(`update public.user_roles set role = 'player' where user_id = $1`, [user1]);
  const miniStart = miniStartResult.rows[0].payload;
  const miniPayload = JSON.stringify(miniStart);
  check(
    miniStart.questions.length === 1,
    'a lesson with a 20-question bank still delivers one question',
    String(miniStart.questions?.length),
  );
  check(!miniPayload.includes('is_correct'), 'mini-game payload never exposes is_correct');
  check(!miniPayload.includes('question_answers'), 'mini-game payload never exposes answers');
  check(!miniPayload.includes('right_label'), 'mini-game payload never exposes pair rows');

  // Every active subject uses the same one-question level flow.
  const subjectNodes = await db.query(
    `select distinct on (s.slug) s.slug, n.id as node_id
     from public.subjects s
     join public.courses c on c.subject_id = s.id
     join public.course_levels lv on lv.course_id = c.id
     join public.units u on u.course_level_id = lv.id
     join public.learning_nodes n on n.unit_id = u.id
     where s.status = 'active' and n.is_active and n.lesson_id is not null
       and exists (
         select 1 from public.questions q
         where q.lesson_id = n.lesson_id and q.is_active
       )
     order by s.slug, lv.sort_order, u.sort_order, n.sort_order`,
  );
  const playableSubjects = await db.query(
    `select count(distinct s.id)::int as count
     from public.subjects s
     join public.courses c on c.subject_id = s.id
     join public.course_levels lv on lv.course_id = c.id
     join public.units u on u.course_level_id = lv.id
     join public.learning_nodes n on n.unit_id = u.id
     where s.status = 'active' and n.is_active and n.lesson_id is not null
       and exists (
         select 1 from public.questions q
         where q.lesson_id = n.lesson_id and q.is_active
       )`,
  );
  check(
    subjectNodes.rows.length === playableSubjects.rows[0].count,
    'every active subject with playable content is checked',
    `${subjectNodes.rows.length} vs ${playableSubjects.rows[0].count}`,
  );
  await db.query(`update public.user_roles set role = 'developer' where user_id = $1`, [user1]);
  for (const row of subjectNodes.rows) {
    const payload = (
      await db.query('select public.start_lesson($1) as payload', [row.node_id])
    ).rows[0].payload;
    check(
      payload.questions.length === 1,
      `${row.slug} level delivers exactly one question`,
      String(payload.questions?.length),
    );
  }
  await db.query(`update public.user_roles set role = 'player' where user_id = $1`, [user1]);

  // -------------------------------------------------------------------------
  // Stage 5 remainder: level rewards, milestones, quests, achievements,
  // shop, and inventory. User three already has lesson/practice XP.
  // -------------------------------------------------------------------------
  await db.exec('reset role');
  await asUser(user3);

  const levelRewardRows = await db.query(
    `select count(*)::int as count, coalesce(max(coins), 0)::int as coins
     from public.user_level_rewards where user_id = $1`,
    [user3],
  );
  check(
    levelRewardRows.rows[0].count === 1 && levelRewardRows.rows[0].coins === 25,
    'level 2 reward is granted once with the configured coins',
    JSON.stringify(levelRewardRows.rows[0]),
  );
  const levelRewardTx = await db.query(
    `select count(*)::int as count from public.coin_transactions
     where user_id = $1 and source = 'level_reward' and amount = 25`,
    [user3],
  );
  check(levelRewardTx.rows[0].count === 1, 'level reward writes one coin transaction');

  await db.exec('set role authenticated');
  const questPayload = await db.query('select public.get_my_quests() as payload');
  const questState = questPayload.rows[0].payload;
  check(
    questState.quests.length === 6 &&
      questState.quests.filter((quest) => quest.cadence === 'daily').length === 3 &&
      questState.quests.filter((quest) => quest.cadence === 'weekly').length === 3,
    'quest RPC returns three daily and three weekly quests',
    JSON.stringify(questState.quests?.map((quest) => quest.code)),
  );
  const dailyXpQuest = questState.quests.find((quest) => quest.code === 'daily-xp-50');
  check(dailyXpQuest?.progress === 110, 'daily XP quest reads server-written XP only', String(dailyXpQuest?.progress));
  check(dailyXpQuest?.canClaim === true, 'completed daily quest can be claimed');

  const questClaim = await db.query('select public.claim_quest_reward($1) as payload', [dailyXpQuest.id]);
  check(
    questClaim.rows[0].payload.alreadyClaimed === false &&
      questClaim.rows[0].payload.coinsAwarded === 20,
    'quest claim awards its server-configured coins',
  );
  const questClaimRepeat = await db.query(
    'select public.claim_quest_reward($1) as payload',
    [dailyXpQuest.id],
  );
  check(
    questClaimRepeat.rows[0].payload.alreadyClaimed === true &&
      questClaimRepeat.rows[0].payload.coinsAwarded === 0,
    'quest claim is idempotent for the same period',
  );
  const questRewardTx = await db.query(
    `select count(*)::int as count from public.coin_transactions
     where user_id = $1 and source = 'quest_reward' and amount = 20`,
    [user3],
  );
  check(questRewardTx.rows[0].count === 1, 'quest claim writes one coin transaction');

  const achievementPayload = await db.query('select public.get_my_achievements() as payload');
  const achievementState = achievementPayload.rows[0].payload;
  check(
    achievementState.total === 8 && achievementState.unlockedCount >= 2,
    'achievement RPC returns the catalog and unlocked badges',
    JSON.stringify({ total: achievementState.total, unlocked: achievementState.unlockedCount }),
  );
  check(
    achievementState.achievements.find((achievement) => achievement.code === 'first-lesson')?.unlockedAt,
    'first lesson achievement unlocks automatically',
  );

  await db.exec('reset role');
  await db.query(
    `update public.user_streaks
     set current_streak = 6, longest_streak = 6,
         last_activity_date = (now() at time zone 'Asia/Jakarta')::date - 1,
         updated_at = now()
     where user_id = $1`,
    [user3],
  );
  await db.query(
    "insert into public.user_xp_ledger (user_id, amount, source) values ($1, 1, 'lesson')",
    [user3],
  );
  const streakAfterMilestone = await db.query(
    'select public.get_player_state() as payload',
  );
  check(
    streakAfterMilestone.rows[0].payload.streak.current === 7,
    'streak advances from six to seven through the ledger trigger',
  );
  const milestoneRows = await db.query(
    `select count(*)::int as count, coalesce(sum(coins), 0)::int as coins
     from public.user_streak_milestones where user_id = $1`,
    [user3],
  );
  check(
    milestoneRows.rows[0].count === 2 && milestoneRows.rows[0].coins === 70,
    'crossing seven days grants the 3-day and 7-day milestones once',
    JSON.stringify(milestoneRows.rows[0]),
  );
  const milestoneTx = await db.query(
    `select count(*)::int as count from public.coin_transactions
     where user_id = $1 and source = 'streak_milestone'`,
    [user3],
  );
  check(milestoneTx.rows[0].count === 2, 'streak milestones write their coin transactions');

  await db.query('update public.user_wallets set coins = 500 where user_id = $1', [user3]);
  await db.exec('set role authenticated');
  await asUser(user3);
  const shopPayload = await db.query('select public.get_shop_catalog() as payload');
  const shopState = shopPayload.rows[0].payload;
  check(shopState.items.length === 2 && shopState.coins === 500, 'shop returns two items and the server balance');
  const potion = shopState.items.find((item) => item.slug === 'heart-potion');
  const freeze = shopState.items.find((item) => item.slug === 'streak-freeze');
  check(
    potion?.priceCoins === 80 && freeze?.priceCoins === 120,
    'shop prices come from the catalog',
  );

  const potionPurchase = await db.query('select public.purchase_shop_item($1) as payload', [potion.id]);
  check(
    potionPurchase.rows[0].payload.coinBalance === 420 &&
      potionPurchase.rows[0].payload.quantity === 1,
    'purchase deducts the configured price and adds inventory',
  );
  const freezePurchase = await db.query('select public.purchase_shop_item($1) as payload', [freeze.id]);
  check(
    freezePurchase.rows[0].payload.coinBalance === 300 &&
      freezePurchase.rows[0].payload.quantity === 1,
    'second purchase updates the wallet and inventory atomically',
  );

  await db.exec('reset role');
  await db.query(
    'update public.user_hearts set current_hearts = 1, last_refill_at = now() where user_id = $1',
    [user3],
  );
  await db.exec('set role authenticated');
  await asUser(user3);
  const potionUse = await db.query('select public.use_inventory_item($1) as payload', [potion.id]);
  check(
    potionUse.rows[0].payload.effect === 'hearts' &&
      potionUse.rows[0].payload.restored === 3 &&
      potionUse.rows[0].payload.hearts.current === 4 &&
      potionUse.rows[0].payload.quantity === 0,
    'heart potion restores three Hearts and consumes the item',
  );
  const freezeUse = await db.query('select public.use_inventory_item($1) as payload', [freeze.id]);
  check(
    freezeUse.rows[0].payload.effect === 'freeze' &&
      freezeUse.rows[0].payload.freezes === 1 &&
      freezeUse.rows[0].payload.quantity === 0,
    'streak shield activates and consumes the item',
  );

  await db.exec('reset role');
  await db.query('update public.user_wallets set coins = 0 where user_id = $1', [user3]);
  await db.exec('set role authenticated');
  await asUser(user3);
  await expectError(
    'purchase rejects a wallet without enough coins',
    'select public.purchase_shop_item($1)',
    [potion.id],
    'not_enough_coins',
  );
  await asUser(user2);
  const ownInventory = await db.query('select count(*)::int as count from public.user_inventory');
  check(ownInventory.rows[0].count === 0, 'RLS hides another player’s inventory');
  await expectError(
    'players cannot edit inventory directly',
    'update public.user_inventory set quantity = 9 where user_id = $1',
    [user3],
    'permission denied',
  );
  await db.exec('reset role');

  // -------------------------------------------------------------------------
  // Stage 5 remainder: per-question mastery, scheduled review, and level
  // reward nodes. A fresh player keeps the assertions independent.
  // -------------------------------------------------------------------------
  await db.exec('reset role');
  const masteryUser = await db.query(
    `insert into auth.users (email) values ('player-four@example.com') returning id`,
  );
  const user4 = masteryUser.rows[0].id;
  await asUser(user4);

  const rewardNodes = await db.query(
    `select count(*)::int as count,
       count(*) filter (where reward_coins > 0 and reward_xp > 0)::int as rewarded,
       (select count(*)::int from (
          select u.course_level_id
          from public.learning_nodes n
          join public.units u on u.id = n.unit_id
          where n.node_type = 'reward'
          group by u.course_level_id
          having count(*) <> 1
        ) duplicate_levels) as duplicate_levels
     from public.learning_nodes where node_type = 'reward'`,
  );
  check(
    rewardNodes.rows[0].count === 22 && rewardNodes.rows[0].rewarded === 22,
    'every course level has one reward node with Coins and XP',
    JSON.stringify(rewardNodes.rows[0]),
  );
  check(
    rewardNodes.rows[0].duplicate_levels === 0,
    'no course level has more than one reward node',
    String(rewardNodes.rows[0].duplicate_levels),
  );

  const firstEnglishNode = await db.query(
    `select n.id as node_id, l.id as lesson_id, lv.id as level_id
     from public.learning_nodes n
     join public.lessons l on l.id = n.lesson_id
     join public.units u on u.id = n.unit_id
     join public.course_levels lv on lv.id = u.course_level_id
     join public.courses c on c.id = lv.course_id
     join public.subjects s on s.id = c.subject_id
     where s.slug = 'bahasa-inggris' and n.is_active
     order by lv.sort_order, u.sort_order, n.sort_order
     limit 1`,
  );
  const firstEnglish = firstEnglishNode.rows[0];
  const firstEnglishReward = await db.query(
    `select n.id, n.reward_coins, n.reward_xp
     from public.learning_nodes n
     join public.units u on u.id = n.unit_id
     where u.course_level_id = $1 and n.node_type = 'reward'
     limit 1`,
    [firstEnglish.level_id],
  );
  const rewardNode = firstEnglishReward.rows[0];

  await expectError(
    'scheduled review rejects a player without due questions',
    'select public.start_scheduled_review($1)',
    [englishCourse],
    'practice_no_due_reviews',
  );

  const masteryLesson = await db.query('select public.start_lesson($1) as payload', [
    firstEnglish.node_id,
  ]);
  const masteryQuestion = await db.query(
    `select q.id, q.type,
       (select id from public.question_options where question_id = q.id and not is_correct order by sort_order limit 1) as wrong_option
     from public.questions q
     where q.lesson_id = $1 and q.is_active
     order by q.sort_order limit 1`,
    [firstEnglish.lesson_id],
  );
  const masteryTarget = masteryQuestion.rows[0];
  const wrongMasteryAnswer = masteryTarget.wrong_option
    ? { optionId: masteryTarget.wrong_option }
    : { text: 'jawaban-salah' };
  await db.query(
    'select public.submit_attempt_answer($1, $2, $3::jsonb)',
    [masteryLesson.rows[0].payload.attemptId, masteryTarget.id, JSON.stringify(wrongMasteryAnswer)],
  );

  const masteryAfterWrong = await db.query(
    `select mastery_level, interval_days, correct_count, attempts,
       next_review_at > now() + interval '9 minutes' as due_soon,
       next_review_at < now() + interval '11 minutes' as not_too_late
     from public.user_question_mastery where user_id = $1 and question_id = $2`,
    [user4, masteryTarget.id],
  );
  check(
    masteryAfterWrong.rows[0]?.mastery_level === 0 &&
      masteryAfterWrong.rows[0]?.interval_days === 0 &&
      masteryAfterWrong.rows[0]?.due_soon &&
      masteryAfterWrong.rows[0]?.not_too_late,
    'wrong answer schedules the question again in about ten minutes',
    JSON.stringify(masteryAfterWrong.rows[0] ?? null),
  );

  await db.query(
    'update public.user_question_mastery set next_review_at = now() - interval \'1 minute\' where user_id = $1 and question_id = $2',
    [user4, masteryTarget.id],
  );

  const correctMasteryAnswer = await correctAnswerFor(masteryTarget);
  await db.exec('set role authenticated');
  await asUser(user4);
  const masteryBoard = await db.query('select public.get_my_mastery() as payload');
  const masteryPayload = masteryBoard.rows[0].payload;
  const englishMastery = masteryPayload.courses.find(
    (course) => course.subjectSlug === 'bahasa-inggris',
  );
  check(
    masteryPayload.summary.tracked === 1 &&
      masteryPayload.summary.due === 1 &&
      masteryPayload.summary.accuracy === 0,
    'mastery RPC reports one tracked question and one due review',
    JSON.stringify(masteryPayload.summary),
  );
  check(
    englishMastery?.due === 1 && englishMastery?.tracked === 1,
    'mastery RPC groups due questions by course',
    JSON.stringify(englishMastery ?? null),
  );

  const scheduled = await db.query('select public.start_scheduled_review($1) as payload', [
    englishCourse,
  ]);
  const scheduledPayload = scheduled.rows[0].payload;
  check(
    scheduledPayload.mode === 'scheduled_review' &&
      scheduledPayload.questions.length === 1 &&
      scheduledPayload.questions[0].id === masteryTarget.id,
    'scheduled review returns only the due question',
    JSON.stringify({
      mode: scheduledPayload.mode,
      count: scheduledPayload.questions?.length,
      id: scheduledPayload.questions?.[0]?.id,
    }),
  );

  await db.query('select public.submit_practice_answer($1, $2, $3::jsonb, $4)', [
    scheduledPayload.sessionId,
    masteryTarget.id,
    JSON.stringify(correctMasteryAnswer),
    2000,
  ]);
  await db.exec('reset role');
  const masteryAfterReview = await db.query(
    `select mastery_level, interval_days, correct_streak, correct_count, attempts
     from public.user_question_mastery where user_id = $1 and question_id = $2`,
    [user4, masteryTarget.id],
  );
  check(
    masteryAfterReview.rows[0]?.mastery_level === 1 &&
      masteryAfterReview.rows[0]?.interval_days === 1 &&
      masteryAfterReview.rows[0]?.correct_count === 1 &&
      masteryAfterReview.rows[0]?.attempts === 2,
    'a correct review raises mastery and moves the next review one day out',
    JSON.stringify(masteryAfterReview.rows[0] ?? null),
  );

  await db.exec('set role authenticated');
  await asUser(user4);
  await expectError(
    'reward node is locked before the level is complete',
    'select public.claim_reward_node($1)',
    [rewardNode.id],
    'reward_locked',
  );
  await db.exec('reset role');

  await db.query(
    `insert into public.user_node_progress (user_id, node_id, status, best_score, attempts, completed_at)
     select $1, n.id, 'completed', 100, 1, now()
     from public.learning_nodes n
     join public.units u on u.id = n.unit_id
     where u.course_level_id = $2 and n.is_active and n.lesson_id is not null
     on conflict (user_id, node_id) do update set
       status = 'completed', best_score = 100, completed_at = now()`,
    [user4, firstEnglish.level_id],
  );

  await db.exec('set role authenticated');
  await asUser(user4);
  const rewardClaim = await db.query('select public.claim_reward_node($1) as payload', [
    rewardNode.id,
  ]);
  const rewardPayload = rewardClaim.rows[0].payload;
  check(
    rewardPayload.alreadyClaimed === false &&
      rewardPayload.coinsAwarded === rewardNode.reward_coins &&
      rewardPayload.xpAwarded === rewardNode.reward_xp,
    'claiming a reward node grants its configured Coins and XP',
    JSON.stringify(rewardPayload),
  );

  const rewardRepeat = await db.query('select public.claim_reward_node($1) as payload', [
    rewardNode.id,
  ]);
  check(
    rewardRepeat.rows[0].payload.alreadyClaimed === true &&
      rewardRepeat.rows[0].payload.coinsAwarded === 0 &&
      rewardRepeat.rows[0].payload.xpAwarded === 0,
    'reward node claim is idempotent',
    JSON.stringify(rewardRepeat.rows[0].payload),
  );

  await db.exec('reset role');
  const rewardWallet = await db.query(
    'select coins from public.user_wallets where user_id = $1',
    [user4],
  );
  const rewardLedger = await db.query(
    `select count(*)::int as count, coalesce(sum(amount), 0)::int as total
     from public.user_xp_ledger
     where user_id = $1 and source = 'reward_node'`,
    [user4],
  );
  const rewardCoinLedger = await db.query(
    `select count(*)::int as count, coalesce(sum(amount), 0)::int as total
     from public.coin_transactions
     where user_id = $1 and source = 'reward_node'`,
    [user4],
  );
  check(
    rewardWallet.rows[0].coins === rewardNode.reward_coins,
    'reward Coins are written to the wallet once',
    String(rewardWallet.rows[0].coins),
  );
  check(
    rewardLedger.rows[0].count === 1 && rewardLedger.rows[0].total === rewardNode.reward_xp,
    'reward XP is written to the ledger once',
    JSON.stringify(rewardLedger.rows[0]),
  );
  check(
    rewardCoinLedger.rows[0].count === 1 &&
      rewardCoinLedger.rows[0].total === rewardNode.reward_coins,
    'reward Coins are written to the coin ledger once',
    JSON.stringify(rewardCoinLedger.rows[0]),
  );

  await db.exec('set role authenticated');
  await asUser(user2);
  const hiddenRewardClaims = await db.query(
    'select count(*)::int as count from public.user_reward_claims',
  );
  check(hiddenRewardClaims.rows[0].count === 0, 'RLS hides another player’s reward claims');
  await expectError(
    'players cannot edit mastery directly',
    'update public.user_question_mastery set mastery_level = 5 where user_id = $1',
    [user4],
    'permission denied',
  );
  await db.exec('reset role');

  // -------------------------------------------------------------------------
  // Tahap 7: pertemanan, privasi, leaderboard, liga, event, dan notifikasi.
  // -------------------------------------------------------------------------
  await db.query(
    `update public.profiles set onboarding_completed = true
     where id = any($1::uuid[])`,
    [[user1, user2, user3, user4]],
  );
  const stage7Profiles = await db.query(
    `select id, username from public.profiles where id = any($1::uuid[])`,
    [[user1, user2, user3, user4]],
  );
  const usernameOf = (id) =>
    stage7Profiles.rows.find((row) => row.id === id)?.username;
  const user2Name = usernameOf(user2);
  const user4Name = usernameOf(user4);

  await db.exec('set role authenticated');
  await asUser(user1);
  const search = await db.query('select public.search_players($1) as payload', [user2Name]);
  check(
    search.rows[0].payload.length === 1 && search.rows[0].payload[0].relation === 'none',
    'player search finds another player with no relation',
    JSON.stringify(search.rows[0].payload),
  );
  await expectError(
    'player search rejects a one-character query',
    "select public.search_players('p')",
    [],
    'search_query_too_short',
  );

  const sentRequest = await db.query(
    'select public.send_friend_request($1) as payload',
    [user2Name],
  );
  check(
    sentRequest.rows[0].payload.status === 'pending' &&
      Boolean(sentRequest.rows[0].payload.requestId),
    'friend request is stored as pending',
    JSON.stringify(sentRequest.rows[0].payload),
  );
  const requestId = sentRequest.rows[0].payload.requestId;

  await db.exec('reset role');
  const requestNotification = await db.query(
    `select count(*)::int as count from public.notifications
     where user_id = $1 and kind = 'friend_request' and read_at is null`,
    [user2],
  );
  check(
    requestNotification.rows[0].count === 1,
    'friend request creates one unread notification for the recipient',
    String(requestNotification.rows[0].count),
  );

  await db.exec('set role authenticated');
  await asUser(user2);
  const incoming = await db.query('select public.get_my_friends() as payload');
  check(
    incoming.rows[0].payload.incoming.length === 1 &&
      incoming.rows[0].payload.incoming[0].requestId === requestId,
    'recipient sees the incoming friend request',
    JSON.stringify(incoming.rows[0].payload.incoming),
  );
  const accepted = await db.query(
    'select public.respond_friend_request($1, true) as payload',
    [requestId],
  );
  check(accepted.rows[0].payload.status === 'accepted', 'recipient can accept the request');

  await asUser(user1);
  const friends = await db.query('select public.get_my_friends() as payload');
  const friendPayload = friends.rows[0].payload;
  check(
    friendPayload.friends.length === 1 &&
      friendPayload.friends[0].userId === user2 &&
      friendPayload.incoming.length === 0,
    'accepted request appears in both friends lists',
    JSON.stringify(friendPayload),
  );
  check(
    friendPayload.friends[0].friendStreak >= 1,
    'friends who both earned XP today share a one-day friend streak',
    String(friendPayload.friends[0].friendStreak),
  );
  await expectError(
    'a duplicate friend request is rejected',
    'select public.send_friend_request($1)',
    [user2Name],
    'already_friends',
  );

  const friendProfile = await db.query(
    'select public.get_friend_profile($1) as payload',
    [user2Name],
  );
  check(
    friendProfile.rows[0].payload.statsVisible === true &&
      friendProfile.rows[0].payload.isFriend === true,
    'a friend can see profile stats under the default friends-only visibility',
    JSON.stringify(friendProfile.rows[0].payload),
  );

  await asUser(user3);
  const strangerProfile = await db.query(
    'select public.get_friend_profile($1) as payload',
    [user2Name],
  );
  check(
    strangerProfile.rows[0].payload.statsVisible === false &&
      strangerProfile.rows[0].payload.totalXp === null,
    'a stranger cannot see a friends-only profile',
    JSON.stringify(strangerProfile.rows[0].payload),
  );

  await db.exec('reset role');
  await db.query(
    "update public.user_settings set profile_visibility = 'private' where user_id = $1",
    [user2],
  );
  await db.exec('set role authenticated');
  await asUser(user1);
  const privateFriend = await db.query(
    'select public.get_friend_profile($1) as payload',
    [user2Name],
  );
  check(
    privateFriend.rows[0].payload.statsVisible === false,
    'a private profile hides stats even from a friend',
  );
  await db.exec('reset role');
  await db.query(
    "update public.user_settings set profile_visibility = 'public' where user_id = $1",
    [user2],
  );
  await db.exec('set role authenticated');
  await asUser(user3);
  const publicProfile = await db.query(
    'select public.get_friend_profile($1) as payload',
    [user2Name],
  );
  check(
    publicProfile.rows[0].payload.statsVisible === true,
    'a public profile is visible to any signed-in player',
  );

  await db.exec('reset role');
  await db.query(
    "update public.user_settings set profile_visibility = 'private' where user_id = $1",
    [user3],
  );
  await db.exec('set role authenticated');
  await asUser(user1);

  const leaderboard = await db.query("select public.get_leaderboard('global') as payload");
  check(
    leaderboard.rows[0].payload.entries.some((entry) => entry.userId === user1),
    'global leaderboard includes a player with weekly XP',
    JSON.stringify(leaderboard.rows[0].payload.entries.slice(0, 3)),
  );
  check(
    !leaderboard.rows[0].payload.entries.some((entry) => entry.userId === user3),
    'global leaderboard excludes private profiles',
  );
  const friendBoard = await db.query("select public.get_leaderboard('friends') as payload");
  check(
    friendBoard.rows[0].payload.entries.every(
      (entry) => entry.userId === user1 || entry.isFriend || entry.isViewer,
    ) && friendBoard.rows[0].payload.entries.some((entry) => entry.userId === user2),
    'friends leaderboard contains the viewer and accepted friends only',
    JSON.stringify(friendBoard.rows[0].payload.entries),
  );

  const league = await db.query('select public.get_my_league() as payload');
  const leaguePayload = league.rows[0].payload;
  check(
    leaguePayload.tier === 1 && leaguePayload.members.length === 1 &&
      leaguePayload.rank === 1 && leaguePayload.canClaimReward === false,
    'a new player starts alone in the first league with no reward to claim',
    JSON.stringify(leaguePayload),
  );

  // Sepuluh anggota untuk menguji promosi dan degradasi secara deterministik.
  await db.exec('reset role');
  const dummyUsers = await db.query(
    `insert into auth.users (email)
     select 'league-dummy-' || n || '@example.com' from generate_series(1, 16) n
     returning id`,
  );
  const dummies = dummyUsers.rows.map((row) => row.id);
  const currentWeek = await db.query('select public.league_week_start(now()) as week');
  const previousWeek = currentWeek.rows[0].week;
  const prevWeekDate = new Date(previousWeek);
  prevWeekDate.setUTCDate(prevWeekDate.getUTCDate() - 7);
  const prevWeek = prevWeekDate.toISOString().slice(0, 10);

  await db.exec('reset role');
  const tierOneGroup = await db.query(
    `insert into public.league_groups (tier, week_start) values (1, $1) returning id`,
    [prevWeek],
  );
  const tierFiveGroup = await db.query(
    `insert into public.league_groups (tier, week_start) values (5, $1) returning id`,
    [prevWeek],
  );
  const tierOneMembers = [user1, ...dummies.slice(0, 9)];
  for (let index = 0; index < tierOneMembers.length; index += 1) {
    await db.query(
      `insert into public.league_members (group_id, user_id, week_start, weekly_xp)
       values ($1, $2, $3, $4)`,
      [tierOneGroup.rows[0].id, tierOneMembers[index], prevWeek, 100 - index * 10],
    );
  }
  const tierFiveMembers = [user2, user3, user4, ...dummies.slice(9, 16)];
  for (let index = 0; index < tierFiveMembers.length; index += 1) {
    await db.query(
      `insert into public.league_members (group_id, user_id, week_start, weekly_xp)
       values ($1, $2, $3, $4)`,
      [tierFiveGroup.rows[0].id, tierFiveMembers[index], prevWeek, 100 - index * 10],
    );
  }

  // finalize_league_group menghitung ulang weekly_xp dari ledger. Tanpa ledger
  // minggu lalu semua anggota bernilai 0 dan peringkat hanya ditentukan UUID,
  // sehingga seed harus mencerminkan sumber kebenaran yang sama.
  const seedLeagueXp = async (members) => {
    for (let index = 0; index < members.length; index += 1) {
      await db.query(
        `delete from public.user_xp_ledger
         where user_id = $1
           and created_at >= $2::date
           and created_at < ($2::date + interval '7 days')`,
        [members[index], prevWeek],
      );
      await db.query(
        `insert into public.user_xp_ledger (user_id, amount, source, created_at)
         values ($1, $2, 'lesson', ($3::date + interval '3 days') at time zone 'UTC')`,
        [members[index], 100 - index * 10, prevWeek],
      );
    }
  };
  await seedLeagueXp(tierOneMembers);
  await seedLeagueXp(tierFiveMembers);

  await db.query('select public.finalize_league_group($1)', [tierOneGroup.rows[0].id]);
  await db.query('select public.finalize_league_group($1)', [tierFiveGroup.rows[0].id]);
  const finalized = await db.query(
    `select user_id, rank, outcome, next_tier, reward_coins
     from public.league_results where week_start = $1 order by tier desc, rank`,
    [prevWeek],
  );
  const firstPlace = finalized.rows.find((row) => row.user_id === user1);
  const lastPlace = finalized.rows.find(
    (row) => row.user_id === dummies[15],
  );
  check(
    firstPlace?.rank === 1 && firstPlace?.outcome === 'promoted' && firstPlace?.next_tier === 2,
    'first place is promoted to the next league tier',
    JSON.stringify(firstPlace ?? null),
  );
  check(
    lastPlace?.outcome === 'demoted' && lastPlace?.next_tier === 4,
    'last place in a ten-player group is demoted one tier',
    JSON.stringify(lastPlace ?? null),
  );

  // Hapus keanggotaan minggu ini agar penempatan minggu berikutnya memakai
  // hasil finalisasi (juara tier 1 naik ke tier 2), bukan grup lama.
  await db.exec('reset role');
  await db.query(
    `delete from public.league_members where user_id = $1
       and week_start = public.league_week_start(now())`,
    [user1],
  );
  await db.query(
    `delete from public.league_groups g
     where g.week_start = public.league_week_start(now())
       and not exists (select 1 from public.league_members m where m.group_id = g.id)`,
  );
  await db.exec('set role authenticated');
  await asUser(user1);
  const leagueAfter = await db.query('select public.get_my_league() as payload');
  const afterPayload = leagueAfter.rows[0].payload;
  check(
    afterPayload.tier === 2 && afterPayload.previousResult?.rank === 1 &&
      afterPayload.previousResult?.outcome === 'promoted' &&
      afterPayload.previousResult?.nextTier === 2,
    'promotion places the player in the next tier and is shown as last week result',
    JSON.stringify({ tier: afterPayload.tier, previous: afterPayload.previousResult }),
  );
  check(
    afterPayload.canClaimReward === true &&
      afterPayload.previousResult?.rewardCoins === 15,
    'a finalized league result becomes claimable',
    JSON.stringify({ canClaim: afterPayload.canClaimReward }),
  );

  const walletBeforeLeague = await db.query(
    'select coins from public.user_wallets where user_id = $1',
    [user1],
  );
  const leagueClaim = await db.query(
    'select public.claim_league_reward($1) as payload',
    [prevWeek],
  );
  check(
    leagueClaim.rows[0].payload.alreadyClaimed === false &&
      leagueClaim.rows[0].payload.coinsAwarded === 15,
    'league reward is paid according to the tier',
    JSON.stringify(leagueClaim.rows[0].payload),
  );
  const leagueClaimRepeat = await db.query(
    'select public.claim_league_reward($1) as payload',
    [prevWeek],
  );
  check(
    leagueClaimRepeat.rows[0].payload.alreadyClaimed === true &&
      leagueClaimRepeat.rows[0].payload.coinsAwarded === 0,
    'league reward cannot be claimed twice',
  );
  await db.exec('reset role');
  const walletAfterLeague = await db.query(
    'select coins from public.user_wallets where user_id = $1',
    [user1],
  );
  check(
    walletAfterLeague.rows[0].coins === walletBeforeLeague.rows[0].coins + 15,
    'league reward is written to the wallet once',
    `${walletBeforeLeague.rows[0].coins} -> ${walletAfterLeague.rows[0].coins}`,
  );

  // Event mingguan memakai XP mingguan yang sama dan klaim Koin sekali.
  await db.query(
    "insert into public.user_xp_ledger (user_id, amount, source) values ($1, 100, 'lesson')",
    [user1],
  );
  await db.exec('set role authenticated');
  await asUser(user1);
  const event = await db.query('select public.get_active_event() as payload');
  const eventPayload = event.rows[0].payload;
  check(
    eventPayload.targetXp === 100 && eventPayload.progress === 100 &&
      eventPayload.canClaim === true && eventPayload.claimed === false,
    'weekly event reports capped progress and a claimable reward',
    JSON.stringify(eventPayload),
  );
  const eventClaim = await db.query('select public.claim_event_reward() as payload');
  check(
    eventClaim.rows[0].payload.alreadyClaimed === false &&
      eventClaim.rows[0].payload.coinsAwarded === 25,
    'weekly event awards its configured Coins',
    JSON.stringify(eventClaim.rows[0].payload),
  );
  const eventRepeat = await db.query('select public.claim_event_reward() as payload');
  check(
    eventRepeat.rows[0].payload.alreadyClaimed === true &&
      eventRepeat.rows[0].payload.coinsAwarded === 0,
    'weekly event reward is idempotent',
  );

  const notifications = await db.query('select public.get_my_notifications() as payload');
  check(
    notifications.rows[0].payload.unreadCount >= 1 &&
      notifications.rows[0].payload.items.length >= 1,
    'notifications include unread friend and league events',
    JSON.stringify({ unread: notifications.rows[0].payload.unreadCount }),
  );
  const marked = await db.query('select public.mark_notifications_read() as payload');
  check(marked.rows[0].payload.updated >= 1, 'mark all notifications read updates unread items');
  const afterMarked = await db.query('select public.get_my_notifications() as payload');
  check(
    afterMarked.rows[0].payload.unreadCount === 0,
    'notification list has no unread items after marking all',
  );

  // Permintaan dari user1 ke user4 hanya boleh dijawab user4.
  const fourth = await db.query(
    'select public.send_friend_request($1) as payload',
    [user4Name],
  );
  const fourthRequest = fourth.rows[0].payload.requestId;
  await asUser(user3);
  await expectError(
    'a third player cannot answer someone else friend request',
    'select public.respond_friend_request($1, true)',
    [fourthRequest],
    'friend_request_forbidden',
  );
  await asUser(user4);
  const fourthAccepted = await db.query(
    'select public.respond_friend_request($1, true) as payload',
    [fourthRequest],
  );
  check(fourthAccepted.rows[0].payload.status === 'accepted', 'addressee can answer their own request');

  await db.exec('reset role');
  const hiddenLeague = await db.query(
    'select count(*)::int as count from public.league_results where user_id <> $1',
    [user3],
  );
  check(hiddenLeague.rows[0].count > 0, 'admin can see all league results');
  await db.exec('set role authenticated');
  await asUser(user3);
  const ownLeague = await db.query('select count(*)::int as count from public.league_results');
  check(
    ownLeague.rows[0].count === 1,
    'RLS exposes only the viewer league result',
    String(ownLeague.rows[0].count),
  );
  const hiddenNotifications = await db.query(
    'select count(*)::int as count from public.notifications where user_id <> $1',
    [user3],
  );
  check(hiddenNotifications.rows[0].count === 0, 'RLS hides another player notifications');
  await expectError(
    'players cannot insert friendships directly',
    `insert into public.friendships (requester_id, addressee_id) values ($1, $2)`,
    [user1, user3],
    'permission denied',
  );
  await expectError(
    'players cannot update league members directly',
    'update public.league_members set weekly_xp = 9999',
    [],
    'permission denied',
  );
  await db.exec('reset role');
  await db.exec('set role authenticated');
  await asUser(user1);
  const removed = await db.query('select public.remove_friend($1) as payload', [user2]);
  check(removed.rows[0].payload.removed === true, 'a player can remove a friend');
  const afterRemove = await db.query('select public.get_my_friends() as payload');
  check(
    afterRemove.rows[0].payload.friends.every((friend) => friend.userId !== user2),
    'removed friend disappears from the friends list',
  );
  await db.exec('reset role');

  // -------------------------------------------------------------------------
  // Developer Dashboard: staff overview, user search, reward grants, broadcast,
  // audit log, and staff-only access. user1 becomes the developer for this block.
  // -------------------------------------------------------------------------
  await db.query("update public.user_roles set role = 'developer' where user_id = $1", [user1]);
  await db.query(
    'update public.profiles set onboarding_completed = true where id = any($1::uuid[])',
    [[user2, user3]],
  );
  await db.exec('set role authenticated');
  await asUser(user1);

  const developerOverview = await db.query('select public.get_developer_overview() as payload');
  const overviewPayload = developerOverview.rows[0].payload;
  check(
    overviewPayload.players.total >= 4 &&
      overviewPayload.players.staff >= 1 &&
      overviewPayload.content.lessons === 57 &&
      overviewPayload.content.questions === 231 &&
      typeof overviewPayload.activity.xpAwarded === 'number',
    'developer overview returns player, activity, and content totals',
    JSON.stringify(overviewPayload),
  );

  const developerUsers = await db.query(
    "select public.get_developer_users('player-two') as payload",
  );
  check(
    developerUsers.rows[0].payload.length === 1 &&
      developerUsers.rows[0].payload[0].userId === user2 &&
      developerUsers.rows[0].payload[0].email === 'player-two@example.com',
    'developer user search finds a player by email fragment',
    JSON.stringify(developerUsers.rows[0].payload),
  );

  const rewardGrant = await db.query(
    "select public.grant_reward($1, 7, 13, 'Uji hadiah developer') as payload",
    [user2],
  );
  const rewardGrantPayload = rewardGrant.rows[0].payload;
  check(
    rewardGrantPayload.coinsAwarded === 7 &&
      rewardGrantPayload.xpAwarded === 13 &&
      rewardGrantPayload.totalCoins >= 7 &&
      rewardGrantPayload.totalXp >= 13,
    'developer can grant coins and XP to one player',
    JSON.stringify(rewardGrantPayload),
  );
  await db.exec('reset role');
  const grantCoinRows = await db.query(
    "select count(*)::int as count from public.coin_transactions where user_id = $1 and source = 'developer_grant'",
    [user2],
  );
  const grantXpRows = await db.query(
    "select count(*)::int as count from public.user_xp_ledger where user_id = $1 and source = 'developer_grant'",
    [user2],
  );
  check(grantCoinRows.rows[0].count === 1, 'reward grant writes one coin transaction');
  check(grantXpRows.rows[0].count === 1, 'reward grant writes one XP ledger row');
  await db.exec('set role authenticated');
  await asUser(user1);

  const auditLogs = await db.query('select public.get_audit_logs(10) as payload');
  check(
    auditLogs.rows[0].payload.some(
      (entry) => entry.action === 'reward_grant' && entry.targetId === user2,
    ),
    'reward grant is recorded in the audit log',
    JSON.stringify(auditLogs.rows[0].payload.slice(0, 2)),
  );

  const broadcast = await db.query(
    "select public.broadcast_notification('Pemeliharaan', 'Server istirahat sebentar.', '/app') as payload",
  );
  check(
    broadcast.rows[0].payload.recipients >= 1 &&
      broadcast.rows[0].payload.title === 'Pemeliharaan',
    'staff broadcast creates notifications for onboarded players',
    JSON.stringify(broadcast.rows[0].payload),
  );
  await asUser(user2);
  const broadcastInbox = await db.query('select public.get_my_notifications() as payload');
  check(
    broadcastInbox.rows[0].payload.items.some((item) => item.title === 'Pemeliharaan'),
    'broadcast notification appears in the player inbox',
  );

  await expectError(
    'a player cannot read the developer overview',
    'select public.get_developer_overview()',
    [],
    'staff_required',
  );
  await expectError(
    'a player cannot grant rewards',
    "select public.grant_reward($1, 1, 1, 'bukan staff')",
    [user2],
    'staff_required',
  );
  await expectError(
    'a player cannot broadcast notifications',
    "select public.broadcast_notification('Pesan', 'Isi', '/app')",
    [],
    'staff_required',
  );
  const playerAuditCount = await db.query('select count(*)::int as count from public.audit_logs');
  check(
    playerAuditCount.rows[0].count === 0,
    'RLS hides the audit log from non-staff players',
    String(playerAuditCount.rows[0].count),
  );
  await expectError(
    'players cannot insert audit rows directly',
    "insert into public.audit_logs (action, target_type) values ('fake', 'player')",
    [],
    'permission denied',
  );
  await expectError(
    'players cannot call the internal audit helper',
    "select public.log_audit('fake', 'player', null, '{}'::jsonb)",
    [],
    'permission denied',
  );

  await asUser(user1);
  await expectError(
    'reward grant rejects an empty reward',
    "select public.grant_reward($1, 0, 0, 'kosong')",
    [user2],
    'reward_empty',
  );
  await expectError(
    'reward grant rejects negative coins',
    "select public.grant_reward($1, -1, 0, 'negatif')",
    [user2],
    'reward_coins_invalid',
  );
  await expectError(
    'broadcast rejects an external link',
    "select public.broadcast_notification('Pesan', 'Isi', 'https://contoh.com')",
    [],
    'broadcast_link_invalid',
  );

  // -------------------------------------------------------------------------
  // Admin CMS: permission context, full curriculum chain, question security,
  // catalog writes, and granular permission enforcement.
  // -------------------------------------------------------------------------
  const adminContext = await db.query('select public.admin_get_context() as payload');
  const adminContextPayload = adminContext.rows[0].payload;
  check(adminContextPayload.role === 'developer', 'developer gets the admin context');
  check(
    ['curriculum.edit', 'questions.edit', 'content.manage', 'system.manage', 'audit.read']
      .every((permission) => adminContextPayload.permissions.includes(permission)),
    'developer implicitly holds every admin permission',
    JSON.stringify(adminContextPayload.permissions),
  );
  check(adminContextPayload.catalog.length === 18, 'permission catalog exposes 18 entries');

  const adminOverview = await db.query('select public.admin_get_overview() as payload');
  const adminOverviewPayload = adminOverview.rows[0].payload;
  check(
    adminOverviewPayload.players.total >= 4 &&
      adminOverviewPayload.content.lessons === 57 &&
      adminOverviewPayload.content.questions === 231,
    'admin overview reads live player and content totals',
    JSON.stringify(adminOverviewPayload.content),
  );

  const createdSubject = await db.query(
    `select public.admin_save_subject($1::jsonb, 'Tambah mapel uji') as payload`,
    [JSON.stringify({
      slug: 'mapel-uji-admin', name: 'Mapel Uji Admin', shortName: 'Uji',
      description: 'Mapel untuk pengujian CMS.', category: 'uji', iconKey: 'book',
      accentColor: '#123456', status: 'development', isPrimary: false, sortOrder: 99,
    })],
  );
  const subjectRow = createdSubject.rows[0].payload;
  check(subjectRow.slug === 'mapel-uji-admin' && subjectRow.status === 'development', 'admin creates a development subject');

  const createdCourse = await db.query(
    `select public.admin_save_course($1::jsonb, 'Tambah kursus uji') as payload`,
    [JSON.stringify({
      subjectId: subjectRow.id, slug: 'kursus-uji-admin', title: 'Kursus Uji Admin',
      description: 'Kursus CMS.', category: 'uji', iconKey: 'book', sortOrder: 1,
      isPublished: false,
    })],
  );
  const courseRow = createdCourse.rows[0].payload;
  check(Boolean(courseRow.id) && !courseRow.is_published, 'admin creates an unpublished course');

  const createdLevel = await db.query(
    `select public.admin_save_level($1::jsonb, 'Tambah level uji') as payload`,
    [JSON.stringify({
      courseId: courseRow.id, slug: 'level-uji-admin', title: 'Level Uji Admin',
      description: 'Level CMS.', difficulty: 'beginner', sortOrder: 1, isPublished: false,
    })],
  );
  const levelRow = createdLevel.rows[0].payload;
  check(Boolean(levelRow.id) && !levelRow.is_published, 'admin creates an unpublished level');

  const createdUnit = await db.query(
    `select public.admin_save_unit($1::jsonb, 'Tambah unit uji') as payload`,
    [JSON.stringify({
      levelId: levelRow.id, slug: 'unit-uji-admin', title: 'Unit Uji Admin',
      description: 'Unit CMS.', objectives: ['Tujuan satu', 'Tujuan dua'],
      rewardCoins: 3, sortOrder: 1, isPublished: false,
    })],
  );
  const adminUnitRow = createdUnit.rows[0].payload;
  check(
    Boolean(adminUnitRow.id) && adminUnitRow.objectives.length === 2 && adminUnitRow.reward_coins === 3,
    'admin creates a unit with objectives and rewards',
    JSON.stringify(adminUnitRow),
  );

  const createdLesson = await db.query(
    `select public.admin_save_lesson($1::jsonb, 'Tambah lesson uji') as payload`,
    [JSON.stringify({
      unitId: adminUnitRow.id, slug: 'lesson-uji-admin', title: 'Lesson Uji Admin',
      description: 'Lesson CMS.', kind: 'lesson', estimatedMinutes: 4,
      xpReward: 12, coinReward: 4, heartsEnabled: true, sortOrder: 1,
      isPublished: false,
    })],
  );
  const lessonRow = createdLesson.rows[0].payload;
  check(
    Boolean(lessonRow.id) && lessonRow.xp_reward === 12 && !lessonRow.is_published,
    'admin creates an unpublished lesson with rewards',
  );

  const createdNode = await db.query(
    `select public.admin_save_node($1::jsonb, 'Tambah node uji') as payload`,
    [JSON.stringify({
      unitId: adminUnitRow.id, slug: 'node-uji-admin', title: 'Node Uji Admin',
      description: 'Node CMS.', nodeType: 'lesson', lessonId: lessonRow.id,
      sortOrder: 1, isActive: false,
    })],
  );
  const nodeRow = createdNode.rows[0].payload;
  check(Boolean(nodeRow.id) && nodeRow.lesson_id === lessonRow.id, 'admin links a map node to its lesson');

  const createdQuestion = await db.query(
    `select public.admin_save_question($1::jsonb, 'Tambah soal uji') as payload`,
    [JSON.stringify({
      lessonId: lessonRow.id, slug: 'soal-uji-admin', type: 'multiple_choice',
      instruction: 'Pilih jawaban benar.', prompt: 'Satu ditambah satu sama dengan?',
      explanation: 'Satu tambah satu adalah dua.', difficulty: 'beginner',
      points: 10, sortOrder: 1, isActive: false,
      options: [
        { label: 'Dua', isCorrect: true, sortOrder: 0 },
        { label: 'Tiga', isCorrect: false, sortOrder: 1 },
      ],
      answers: [], pairs: [], media: [], scene: {},
    })],
  );
  const questionRow = createdQuestion.rows[0].payload;
  check(
    questionRow.slug === 'soal-uji-admin' && questionRow.options.length === 2 &&
      questionRow.options.filter((option) => option.isCorrect).length === 1,
    'admin saves a question with exactly one correct key',
    JSON.stringify(questionRow),
  );

  const listedQuestions = await db.query(
    'select public.admin_list_questions($1) as payload',
    [lessonRow.id],
  );
  const listedQuestion = listedQuestions.rows[0].payload.items[0];
  check(
    listedQuestion?.prompt === 'Satu ditambah satu sama dengan?' && listedQuestion.isActive === false,
    'question bank lists the archived draft',
    JSON.stringify(listedQuestions.rows[0].payload),
  );

  await expectError(
    'question save rejects multiple correct options',
    'select public.admin_save_question($1::jsonb)',
    [JSON.stringify({
      lessonId: lessonRow.id, slug: 'soal-invalid-admin', type: 'multiple_choice',
      prompt: 'Pilih?', options: [
        { label: 'A', isCorrect: true }, { label: 'B', isCorrect: true },
      ],
    })],
    'question_exactly_one_correct',
  );

  const archivedQuestion = await db.query(
    "select public.admin_set_question_active($1, true, 'Aktifkan kembali') as payload",
    [questionRow.id],
  );
  check(archivedQuestion.rows[0].payload.isActive === true, 'admin can reactivate an archived question');

  const curriculums = await db.query('select public.admin_list_curriculum() as payload');
  const curriculumSubject = curriculums.rows[0].payload.find((row) => row.slug === 'mapel-uji-admin');
  check(
    curriculumSubject?.courses?.[0]?.levels?.[0]?.units?.[0]?.lessons?.[0]?.slug === 'lesson-uji-admin',
    'curriculum tree returns the full admin-created hierarchy',
  );

  const gamification = await db.query('select public.admin_get_gamification() as payload');
  const gamificationPayload = gamification.rows[0].payload;
  check(
    gamificationPayload.quests.length >= 6 && gamificationPayload.shopItems.length === 2 &&
      gamificationPayload.heartSettings.editable === false,
    'gamification catalog reads quests, shop, and read-only Heart constants',
    JSON.stringify(gamificationPayload.heartSettings),
  );

  const savedAchievement = await db.query(
    `select public.admin_save_game_catalog('achievement', $1::jsonb, 'Tambah achievement uji') as payload`,
    [JSON.stringify({
      code: 'admin-uji-achievement', title: 'Achievement Uji',
      description: 'Dibuat dari CMS.', metric: 'lesson', target: 5,
      icon: 'trophy', sortOrder: 99, isActive: true,
    })],
  );
  check(
    savedAchievement.rows[0].payload.code === 'admin-uji-achievement' &&
      savedAchievement.rows[0].payload.metric === 'lesson',
    'admin creates an achievement with a supported metric',
  );

  await expectError(
    'achievement save rejects an unsupported metric',
    "select public.admin_save_game_catalog('achievement', $1::jsonb)",
    [JSON.stringify({
      code: 'admin-bad-achievement', title: 'Salah', metric: 'followers', target: 1,
    })],
    'metric_invalid',
  );

  await db.query(
    `select public.admin_save_game_catalog('player_level', $1::jsonb, 'Uji level pemain')`,
    [JSON.stringify({ level: 3, title: 'Pelajar', xpRequired: 250, rewardCoins: 5 })],
  );
  await db.query(
    `select public.admin_save_game_catalog('streak_milestone', $1::jsonb, 'Uji milestone')`,
    [JSON.stringify({ days: 3, title: 'Tiga Hari Konsisten', rewardCoins: 20, icon: 'flame', sortOrder: 1 })],
  );
  await db.query(
    `select public.admin_save_game_catalog('league_tier', $1::jsonb, 'Uji tier liga')`,
    [JSON.stringify({ tier: 2, name: 'Tunas', accent: '#58CC02', sortOrder: 2 })],
  );
  await db.query(
    `select public.admin_save_game_catalog('shop_item', $1::jsonb, 'Uji item toko')`,
    [JSON.stringify({
      slug: 'admin-uji-item', name: 'Item Uji', kind: 'heart_potion',
      priceCoins: 12, maxStack: 2, icon: 'heart', sortOrder: 99, isActive: false,
      description: 'Item uji CMS.',
    })],
  );
  const eventRow = gamificationPayload.events[0];
  if (eventRow) {
    await db.query(
      `select public.admin_save_game_catalog('event', $1::jsonb, 'Uji event')`,
      [JSON.stringify({
        id: eventRow.id, weekStart: eventRow.weekStart, title: eventRow.title,
        description: eventRow.description, targetXp: eventRow.targetXp,
        rewardCoins: eventRow.rewardCoins, rewardXp: eventRow.rewardXp,
        startsAt: eventRow.startsAt, endsAt: eventRow.endsAt, isActive: true,
      })],
    );
  }
  const catalogKinds = await db.query(`
    select
      (select reward_coins from public.player_levels where level = 3) as level_reward,
      (select name from public.league_tiers where tier = 2) as tier_name,
      (select count(*)::int from public.shop_items where slug = 'admin-uji-item') as test_item
  `);
  check(
    catalogKinds.rows[0].level_reward === 5 &&
      catalogKinds.rows[0].tier_name === 'Tunas' &&
      catalogKinds.rows[0].test_item === 1,
    'all editable game catalogs save through the admin RPC',
    JSON.stringify(catalogKinds.rows[0]),
  );

  const socialFriendships = await db.query(
    "select public.admin_list_social('', '', 1, 10) as payload",
  );
  check(
    typeof socialFriendships.rows[0].payload.total === 'number' &&
      Array.isArray(socialFriendships.rows[0].payload.items),
    'admin social list returns paginated friendships',
  );
  const adminQuests = await db.query(
    "select public.admin_list_friend_quests('') as payload",
  );
  check(Array.isArray(adminQuests.rows[0].payload), 'admin friend quest list returns quests');

  const settingsSave = await db.query(
    `select public.admin_save_site_settings($1::jsonb, 'Uji pengaturan situs') as payload`,
    [JSON.stringify({ siteName: 'Lentera Uji', tagline: 'Belajar', registrationEnabled: false })],
  );
  check(
    settingsSave.rows[0].payload.site_name === 'Lentera Uji' &&
      settingsSave.rows[0].payload.registration_enabled === false,
    'admin saves site settings',
  );
  await db.exec('reset role');
  await expectError(
    'disabled registration is enforced by the database trigger',
    `insert into auth.users (email) values ('blocked-registration@example.com')`,
    [],
    'registration_disabled',
  );
  await db.exec('set role authenticated');
  await asUser(user1);
  await db.query(
    `select public.admin_save_site_settings($1::jsonb, 'Pulihkan registrasi')`,
    [JSON.stringify({ siteName: 'Lentera', registrationEnabled: true })],
  );

  const savedPage = await db.query(
    `select public.admin_save_page($1::jsonb, 'Uji halaman CMS') as payload`,
    [JSON.stringify({
      slug: 'halaman-uji-admin', title: 'Halaman Uji', summary: 'Uji blok.',
      status: 'draft', metaTitle: 'Halaman Uji', metaDescription: 'Deskripsi uji.',
      blocks: [
        { type: 'heading', text: 'Judul Uji' },
        { type: 'paragraph', text: 'Paragraf uji.' },
        { type: 'list', items: ['Satu', 'Dua'] },
      ],
    })],
  );
  check(
    savedPage.rows[0].payload.blocks.length === 3,
    'admin saves a structured content page',
  );
  await expectError(
    'content page rejects an unsupported block',
    'select public.admin_save_page($1::jsonb)',
    [JSON.stringify({
      slug: 'halaman-uji-invalid', title: 'Invalid', status: 'draft',
      blocks: [{ type: 'script', text: 'alert(1)' }],
    })],
    'block_type_invalid',
  );

  const savedAnnouncement = await db.query(
    `select public.admin_save_announcement($1::jsonb, 'Uji pengumuman') as payload`,
    [JSON.stringify({
      title: 'Pengumuman Uji', body: 'Isi pengumuman.', link: '/app',
      audience: 'all', startsAt: new Date().toISOString(), isActive: true,
    })],
  );
  check(
    savedAnnouncement.rows[0].payload.title === 'Pengumuman Uji',
    'admin saves an announcement',
  );
  const audience = await db.query("select public.admin_estimate_audience('all') as count");
  check(audience.rows[0].count >= 4, 'admin estimates broadcast audience');

  // Public CMS reads: drafts stay hidden, published pages and announcements
  // reach anonymous visitors, and staff-only announcements stay staff-only.
  await db.query("select set_config('app.user_id', '', false)");
  const draftPublic = await db.query(
    "select public.get_public_page('halaman-uji-admin') as payload",
  );
  check(draftPublic.rows[0].payload === null, 'draft content page is not public');

  await asUser(user1);
  await db.query(
    `select public.admin_save_page($1::jsonb, 'Terbitkan halaman uji')`,
    [JSON.stringify({
      id: savedPage.rows[0].payload.id,
      slug: 'halaman-uji-admin',
      title: 'Halaman Uji',
      summary: 'Uji blok.',
      status: 'published',
      blocks: savedPage.rows[0].payload.blocks,
    })],
  );
  await db.query(
    `select public.admin_save_announcement($1::jsonb, 'Uji pengumuman staff')`,
    [JSON.stringify({
      title: 'Khusus Staff', body: 'Hanya staff.', audience: 'staff',
      startsAt: new Date().toISOString(), isActive: true,
    })],
  );

  await db.query("select set_config('app.user_id', '', false)");
  const publicPage = await db.query(
    "select public.get_public_page('halaman-uji-admin') as payload",
  );
  check(
    publicPage.rows[0].payload?.blocks?.length === 3,
    'published content page is readable by the public',
  );
  const publicSite = await db.query('select public.get_public_site_content() as payload');
  check(
    publicSite.rows[0].payload.settings.siteName === 'Lentera' &&
      publicSite.rows[0].payload.pages.some((page) => page.slug === 'halaman-uji-admin'),
    'public site content exposes settings and published page links',
  );
  const anonAnnouncements = await db.query('select public.get_active_announcements() as payload');
  check(
    anonAnnouncements.rows[0].payload.some((item) => item.title === 'Pengumuman Uji') &&
      !anonAnnouncements.rows[0].payload.some((item) => item.title === 'Khusus Staff'),
    'anonymous visitors see public announcements but not staff announcements',
  );
  await asUser(user1);
  const staffAnnouncements = await db.query('select public.get_active_announcements() as payload');
  check(
    staffAnnouncements.rows[0].payload.some((item) => item.title === 'Khusus Staff'),
    'staff announcements are visible to staff',
  );

  const media = await db.query(
    `select public.admin_register_media(
       'test/uji.png', 'https://example.com/uji.png', 'image', 'image/png',
       1024, 'Gambar uji', 640, 480
     ) as payload`,
  );
  check(
    media.rows[0].payload.alt_text === 'Gambar uji' &&
      media.rows[0].payload.width === 640,
    'admin registers media metadata',
  );
  await expectError(
    'media register rejects SVG',
    `select public.admin_register_media(
       'test/uji.svg', 'https://example.com/uji.svg', 'image', 'image/svg+xml',
       100, 'SVG', null, null
     )`,
    [],
    'media_type_forbidden',
  );

  const health = await db.query('select public.admin_content_health() as payload');
  check(
    Array.isArray(health.rows[0].payload.publishedLessonsWithoutQuestions),
    'content health reports missing-question lessons',
  );

  await db.exec('reset role');
  const adminSubjectAudit = await db.query(
    `select count(*)::int as count from public.audit_logs
     where action = 'curriculum_subject_save' and target_id = $1`,
    [subjectRow.id],
  );
  check(adminSubjectAudit.rows[0].count === 1, 'subject creation writes an audit entry');
  await db.exec('set role authenticated');
  await asUser(user1);

  await db.exec('reset role');
  const adminUser = await db.query(
    `insert into auth.users (email) values ('admin-cms@example.com') returning id`,
  );
  const adminUserId = adminUser.rows[0].id;
  await db.exec('set role authenticated');
  await asUser(user1);
  await db.query(
    "select public.admin_set_user_role($1, 'admin', 'Uji admin CMS')",
    [adminUserId],
  );
  await asUser(adminUserId);
  const adminWorks = await db.query('select public.admin_get_overview() as payload');
  check(Boolean(adminWorks.rows[0].payload), 'admin role can read the admin overview');
  await expectError(
    'admin without roles.manage cannot change permissions',
    "select public.admin_set_role_permission('admin', 'questions.edit', false, 'uji')",
    [],
    'admin_permission_denied',
  );
  await asUser(user1);
  await db.query(
    "select public.admin_set_role_permission('admin', 'questions.edit', false, 'Uji pencabutan izin')",
  );
  await asUser(adminUserId);
  await expectError(
    'admin without questions.edit cannot save a question',
    'select public.admin_save_question($1::jsonb)',
    [JSON.stringify({
      lessonId: lessonRow.id, slug: 'soal-tanpa-izin', type: 'multiple_choice',
      prompt: 'Pilih?', options: [
        { label: 'A', isCorrect: true }, { label: 'B', isCorrect: false },
      ],
    })],
    'admin_permission_denied',
  );
  await asUser(user1);
  await db.query(
    "select public.admin_set_role_permission('admin', 'questions.edit', true, 'Pulihkan izin')",
  );
  await asUser(adminUserId);
  const restoredSave = await db.query(
    `select public.admin_save_question($1::jsonb, 'Izin dipulihkan') as payload`,
    [JSON.stringify({
      lessonId: lessonRow.id, slug: 'soal-izin-pulih', type: 'multiple_choice',
      prompt: 'Pilih?', options: [
        { label: 'A', isCorrect: true }, { label: 'B', isCorrect: false },
      ],
    })],
  );
  check(restoredSave.rows[0].payload.slug === 'soal-izin-pulih', 'restored permission allows the save');

  await asUser(user1);
  await db.query("select public.admin_set_user_role($1, 'player', 'Selesai uji')", [adminUserId]);
  await asUser(adminUserId);
  await expectError(
    'a demoted admin loses dashboard access',
    'select public.admin_get_overview()',
    [],
    'admin_permission_denied',
  );

  // Maintenance mode: the database guard blocks player writes, keeps reads
  // available, and exempts staff so they can still operate and turn it off.
  await db.exec('reset role');
  await db.query("update public.user_roles set role = 'admin' where user_id = $1", [user1]);
  await db.exec('set role authenticated');
  await asUser(user1);
  const maintenanceOn = await db.query(
    "select public.admin_save_site_settings($1::jsonb, 'Aktifkan maintenance') as payload",
    [JSON.stringify({ siteName: 'Lentera', maintenanceMode: true })],
  );
  check(
    maintenanceOn.rows[0].payload.maintenance_mode === true,
    'admin can enable maintenance mode',
  );

  await asUser(user2);
  await expectError(
    'maintenance mode blocks player writes',
    'update public.user_settings set locale = locale where user_id = $1',
    [user2],
    'pemeliharaan',
  );
  const readDuringMaintenance = await db.query(
    'select count(*)::int as count from public.subjects',
  );
  check(
    readDuringMaintenance.rows[0].count > 0,
    'reads remain available during maintenance',
  );

  await asUser(user1);
  const grantDuringMaintenance = await db.query(
    "select public.grant_reward($1, 2, 3, 'Hadiah saat maintenance') as payload",
    [user2],
  );
  check(
    Boolean(grantDuringMaintenance.rows[0].payload),
    'staff writes remain allowed during maintenance',
  );

  await db.query(
    "select public.admin_save_site_settings($1::jsonb, 'Matikan maintenance')",
    [JSON.stringify({ siteName: 'Lentera', maintenanceMode: false })],
  );
  await asUser(user2);
  let writesResumed = false;
  try {
    await db.query(
      'update public.user_settings set locale = locale where user_id = $1',
      [user2],
    );
    writesResumed = true;
  } catch {
    writesResumed = false;
  }
  check(writesResumed, 'player writes resume after maintenance is disabled');

  await db.exec('reset role');
  await db.query("update public.user_roles set role = 'player' where user_id = $1", [user1]);

  if (failures.length > 0) {
    console.error(`\n${failures.length} SQL smoke check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('\nAll SQL smoke checks passed.');
  }
} catch (error) {
  console.error('\nSQL smoke run crashed:', error);
  process.exitCode = 1;
} finally {
  await db.close();
}
