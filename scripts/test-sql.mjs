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
  check(stats.questions === 225, '225 questions are seeded', String(stats.questions));
  check(
    stats.node_kinds === 6,
    'lesson, review, challenge, practice, checkpoint, and legendary nodes exist',
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
  check(miniData.pairs === 15, 'matching questions store 15 pairs', String(miniData.pairs));
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

  const users = await db.query(`
    insert into auth.users (email) values ('player-one@example.com'), ('player-two@example.com')
    returning id, email
  `);
  const user1 = users.rows.find((row) => row.email.startsWith('player-one')).id;
  const user2 = users.rows.find((row) => row.email.startsWith('player-two')).id;
  check(Boolean(user1 && user2), 'trigger created two auth users');
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
  check(start.attemptId && start.questions.length === 5, 'start_lesson returns 5 questions');
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
     order by q.sort_order`,
    [firstNode.lesson_id],
  );
  check(details.rows.length === 5, 'question bank loaded for grading');

  let first = true;
  for (const question of details.rows) {
    let answer;
    if (first) {
      answer = question.type === 'multiple_choice'
        ? { optionId: question.wrong_option }
        : { text: 'jawaban-salah' };
      first = false;
    } else {
      answer = question.type === 'multiple_choice'
        ? { optionId: question.correct_option }
        : { text: question.answer };
    }

    const result = await db.query(
      'select public.submit_attempt_answer($1, $2, $3::jsonb) as payload',
      [attemptId, question.id, JSON.stringify(answer)],
    );
    const payload = result.rows[0].payload;
    if (question === details.rows[0]) {
      check(payload.isCorrect === false, 'wrong answer is graded incorrect');
      check(Boolean(payload.explanation), 'wrong answer returns an explanation');
      check(Boolean(payload.correctAnswer), 'wrong answer returns the correct answer for feedback');

      const duplicate = await db.query(
        'select public.submit_attempt_answer($1, $2, $3::jsonb) as payload',
        [attemptId, question.id, JSON.stringify(answer)],
      );
      check(duplicate.rows[0].payload.alreadyAnswered === true, 'duplicate answer is idempotent');
    }
  }

  const early = await db.query('select public.complete_lesson_attempt($1) as payload', [attemptId]);
  check(Boolean(early.rows[0].payload.passed), 'lesson completes with 80% accuracy');

  const summary = early.rows[0].payload;
  check(summary.correctCount === 4 && summary.totalCount === 5, 'summary counts 4 of 5 correct');
  check(summary.accuracy === 80, 'accuracy is 80');
  check(summary.xpAwarded === 10 && summary.coinsAwarded === 2, 'rewards awarded once on first pass');

  const repeat = await db.query('select public.complete_lesson_attempt($1) as payload', [attemptId]);
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
     from public.questions q where q.lesson_id = $1 and q.is_active order by q.sort_order`,
    [secondNode.lesson_id],
  );
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
  check(miniStart.questions.length === 20, 'mini-game lesson payload has 20 questions');
  check(!miniPayload.includes('is_correct'), 'mini-game payload never exposes is_correct');
  check(!miniPayload.includes('question_answers'), 'mini-game payload never exposes answers');
  check(!miniPayload.includes('right_label'), 'mini-game payload never exposes pair rows');
  const matchingQuestion = miniStart.questions.find((question) => question.type === 'matching_pairs');
  check(
    matchingQuestion?.leftItems.length === 4 && matchingQuestion?.rightItems.length === 4,
    'matching payload sends separate four-item columns',
  );
  const pictureQuestion = miniStart.questions.find(
    (question) => question.type === 'picture_identification',
  );
  check(
    pictureQuestion?.media.some(
      (media) => media.kind === 'image' && media.url === '/assets/pictures/book.svg',
    ),
    'picture payload includes the image media',
  );
  const fillQuestion = miniStart.questions.find((question) => question.type === 'fill_blank');
  check(
    fillQuestion?.prompt.includes('__'),
    'fill blank payload keeps the inline blank marker',
  );

  const listeningQuestion = miniStart.questions.find(
    (question) => question.type === 'listening',
  );
  check(
    typeof listeningQuestion?.scene?.speech === 'string' &&
      listeningQuestion.scene.speech.length > 0,
    'listening payload includes the speech transcript for text-to-speech',
  );
  const conversationQuestion = miniStart.questions.find(
    (question) => question.type === 'conversation',
  );
  check(
    conversationQuestion?.scene?.npc?.name === 'Bu Rani' &&
      conversationQuestion?.scene?.screens?.length === 1,
    'conversation payload includes the NPC scene',
  );
  const storyQuestion = miniStart.questions.find((question) => question.type === 'story');
  check(
    storyQuestion?.scene?.screens?.length === 3,
    'story payload includes all three screens',
  );

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
