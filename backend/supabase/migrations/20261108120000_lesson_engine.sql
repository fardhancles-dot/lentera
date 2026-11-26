-- Lentera · Lesson engine
-- Player browsers never receive answer keys. Questions are delivered without
-- correct options, answers are graded here, and completion writes progress and
-- rewards exactly once per attempt.

do $$
begin
  create type public.attempt_status as enum ('in_progress', 'completed', 'abandoned');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  node_id uuid not null references public.learning_nodes (id) on delete cascade,
  status public.attempt_status not null default 'in_progress',
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  score integer not null default 0 check (score >= 0),
  max_score integer not null default 0 check (max_score >= 0),
  accuracy integer not null default 0 check (accuracy between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists lesson_attempts_user_idx
  on public.lesson_attempts (user_id, started_at desc);
create index if not exists lesson_attempts_lesson_idx
  on public.lesson_attempts (lesson_id, status);

-- One active attempt per player and lesson prevents duplicated grading.
create unique index if not exists lesson_attempts_one_active_idx
  on public.lesson_attempts (user_id, lesson_id)
  where status = 'in_progress';

create table if not exists public.answer_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.lesson_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer jsonb not null,
  is_correct boolean not null,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists answer_attempts_user_question_idx
  on public.answer_attempts (user_id, question_id);

-- ---------------------------------------------------------------------------
-- Economy ledgers (Stage 5 foundation, written only by the completion RPC)
-- ---------------------------------------------------------------------------
create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount > 0),
  source text not null default 'lesson',
  lesson_attempt_id uuid unique references public.lesson_attempts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists user_xp_ledger_user_idx
  on public.user_xp_ledger (user_id, created_at desc);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount <> 0),
  source text not null default 'lesson',
  lesson_attempt_id uuid unique references public.lesson_attempts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists coin_transactions_user_idx
  on public.coin_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Text normalization and grading
-- ---------------------------------------------------------------------------
create or replace function public.normalize_answer_text(value text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select lower(btrim(regexp_replace(coalesce(value, ''), '\s+', ' ', 'g')));
$$;

create or replace function public.grade_question(p_question_id uuid, p_answer jsonb)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_type public.question_type;
  v_option uuid;
  v_text text;
  v_matches jsonb;
  v_pair_count integer;
  v_left_count integer;
  v_right_count integer;
begin
  select type into v_type from public.questions where id = p_question_id;
  if v_type is null then
    return false;
  end if;

  if v_type in ('multiple_choice', 'picture_identification') then
    begin
      v_option := nullif(p_answer ->> 'optionId', '')::uuid;
    exception when others then
      return false;
    end;

    return exists (
      select 1 from public.question_options
      where id = v_option and question_id = p_question_id and is_correct
    );
  end if;

  if v_type = 'matching_pairs' then
    v_matches := p_answer -> 'matches';

    if v_matches is null or jsonb_typeof(v_matches) <> 'array' then
      return false;
    end if;

    select count(*)::integer into v_pair_count
    from public.question_pairs
    where question_id = p_question_id;

    if v_pair_count = 0 or jsonb_array_length(v_matches) <> v_pair_count then
      return false;
    end if;

    select
      count(distinct item ->> 'leftId')::integer,
      count(distinct item ->> 'rightId')::integer
    into v_left_count, v_right_count
    from jsonb_array_elements(v_matches) as t(item);

    if v_left_count <> v_pair_count or v_right_count <> v_pair_count then
      return false;
    end if;

    return not exists (
      select 1
      from jsonb_array_elements(v_matches) as t(item)
      where not exists (
        select 1
        from public.question_pairs p
        where p.question_id = p_question_id
          and p.left_id::text = item ->> 'leftId'
          and p.right_id::text = item ->> 'rightId'
      )
    );
  end if;

  if v_type in (
    'typing', 'fill_blank', 'translation', 'word_bank',
    'sentence_builder', 'listening', 'speaking', 'conversation', 'story'
  ) then
    v_text := coalesce(p_answer ->> 'text', '');
    if btrim(v_text) = '' then
      return false;
    end if;

    return exists (
      select 1
      from public.question_answers a
      where a.question_id = p_question_id
        and case
          when a.is_case_sensitive then btrim(a.answer) = btrim(v_text)
          else public.normalize_answer_text(a.answer) = public.normalize_answer_text(v_text)
        end
    );
  end if;

  return false;
end;
$$;

revoke all on function public.normalize_answer_text(text) from public, anon, authenticated;
revoke all on function public.grade_question(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Start lesson: validate access/unlock, then return a sanitized question set
-- ---------------------------------------------------------------------------
create or replace function public.start_lesson(p_node_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_node public.learning_nodes;
  v_lesson public.lessons;
  v_course_id uuid;
  v_subject_slug text;
  v_question_count integer;
  v_attempt_id uuid;
  v_questions jsonb;
  v_locked boolean := false;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select n.* into v_node
  from public.learning_nodes n
  join public.units u on u.id = n.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where n.id = p_node_id
    and n.is_active
    and u.is_published
    and lv.is_published
    and c.is_published
    and s.status = 'active';

  if v_node.id is null then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  select lv.course_id, s.slug into v_course_id, v_subject_slug
  from public.units u
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where u.id = v_node.unit_id;

  if v_node.lesson_id is null then
    raise exception 'node_not_playable' using errcode = '22023';
  end if;

  select * into v_lesson
  from public.lessons
  where id = v_node.lesson_id and is_published;

  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_question_count
  from public.questions
  where lesson_id = v_lesson.id and is_active;

  if v_question_count = 0 then
    raise exception 'lesson_has_no_questions' using errcode = '22023';
  end if;

  -- Only developer/admin preview may open a lesson outside its sequence.
  if not public.is_staff() then
    with ordered as (
      select
        n.id,
        row_number() over (order by lv.sort_order, u.sort_order, n.sort_order, n.id) as rn
      from public.learning_nodes n
      join public.units u on u.id = n.unit_id
      join public.course_levels lv on lv.id = u.course_level_id
      where lv.course_id = v_course_id
        and n.is_active
        and n.lesson_id is not null
    ), target as (
      select rn from ordered where id = p_node_id
    )
    select exists (
      select 1
      from ordered o
      cross join target t
      where o.rn < t.rn
        and not exists (
          select 1 from public.user_node_progress p
          where p.user_id = v_user
            and p.node_id = o.id
            and p.status = 'completed'
        )
    ) into v_locked;

    if v_locked then
      raise exception 'lesson_locked' using errcode = '42501';
    end if;
  end if;

  -- A new attempt supersedes unfinished attempts for the same lesson.
  update public.lesson_attempts
     set status = 'abandoned'
   where user_id = v_user
     and lesson_id = v_lesson.id
     and status = 'in_progress';

  insert into public.lesson_attempts (
    user_id, lesson_id, node_id, total_count, max_score
  )
  select
    v_user,
    v_lesson.id,
    p_node_id,
    count(*)::integer,
    coalesce(sum(points), 0)::integer
  from public.questions
  where lesson_id = v_lesson.id and is_active
  returning id into v_attempt_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'type', q.type,
      'topic', q.topic,
      'difficulty', q.difficulty,
      'instruction', q.instruction,
      'prompt', q.prompt,
      'hint', q.hint,
      'points', q.points,
      'options', coalesce((
        select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label) order by o.sort_order)
        from public.question_options o
        where o.question_id = q.id
      ), '[]'::jsonb),
      'leftItems', coalesce((
        select jsonb_agg(
          jsonb_build_object('id', p.left_id, 'label', p.left_label) order by p.sort_order
        )
        from public.question_pairs p
        where p.question_id = q.id
      ), '[]'::jsonb),
      'rightItems', coalesce((
        select jsonb_agg(
          jsonb_build_object('id', p.right_id, 'label', p.right_label)
          order by md5(p.right_id::text)
        )
        from public.question_pairs p
        where p.question_id = q.id
      ), '[]'::jsonb),
      'media', coalesce((
        select jsonb_agg(jsonb_build_object(
          'kind', m.media_kind, 'url', m.url, 'alt', m.alt_text
        ) order by m.sort_order)
        from public.question_media m
        where m.question_id = q.id
      ), '[]'::jsonb),
      'scene', coalesce(q.scene, '{}'::jsonb)
    ) order by q.sort_order, q.id
  ), '[]'::jsonb) into v_questions
  from public.questions q
  where q.lesson_id = v_lesson.id and q.is_active;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'lesson', jsonb_build_object(
      'id', v_lesson.id,
      'slug', v_lesson.slug,
      'title', v_lesson.title,
      'description', v_lesson.description,
      'kind', v_lesson.kind,
      'subjectSlug', v_subject_slug,
      'xpReward', v_lesson.xp_reward,
      'coinReward', v_lesson.coin_reward,
      'heartsEnabled', v_lesson.hearts_enabled
    ),
    'questions', v_questions
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Submit one answer: grade immediately, store once per question
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.lesson_attempts;
  v_question public.questions;
  v_existing public.answer_attempts;
  v_correct boolean;
  v_points integer := 0;
  v_explanation text;
  v_correct_answer text;
  v_answered integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.lesson_attempts
  where id = p_attempt_id and user_id = v_user
  for update;

  if v_attempt.id is null then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_not_active' using errcode = '22023';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id and lesson_id = v_attempt.lesson_id and is_active;

  if v_question.id is null then
    raise exception 'question_not_in_lesson' using errcode = '22023';
  end if;

  select * into v_existing
  from public.answer_attempts
  where attempt_id = p_attempt_id and question_id = p_question_id;

  if v_existing.id is null then
    v_correct := public.grade_question(p_question_id, p_answer);
    v_points := case when v_correct then v_question.points else 0 end;

    insert into public.answer_attempts (
      attempt_id, user_id, question_id, answer, is_correct, points_awarded
    )
    values (
      p_attempt_id, v_user, p_question_id, coalesce(p_answer, '{}'::jsonb), v_correct, v_points
    )
    on conflict (attempt_id, question_id) do nothing;

    if found then
      update public.lesson_attempts
         set correct_count = correct_count + case when v_correct then 1 else 0 end,
             score = score + v_points
       where id = p_attempt_id;
    else
      select * into v_existing
      from public.answer_attempts
      where attempt_id = p_attempt_id and question_id = p_question_id;
      v_correct := v_existing.is_correct;
      v_points := v_existing.points_awarded;
    end if;
  else
    v_correct := v_existing.is_correct;
    v_points := v_existing.points_awarded;
  end if;

  select explanation into v_explanation
  from public.questions where id = p_question_id;

  select case
    when v_question.type in ('multiple_choice', 'picture_identification') then (
      select label from public.question_options
      where question_id = p_question_id and is_correct
      order by sort_order limit 1
    )
    when v_question.type = 'matching_pairs' then (
      select string_agg(
        left_label || ' = ' || right_label, '; ' order by sort_order
      )
      from public.question_pairs
      where question_id = p_question_id
    )
    else (
      select answer from public.question_answers
      where question_id = p_question_id
      order by id limit 1
    )
  end into v_correct_answer;

  select count(*)::integer into v_answered
  from public.answer_attempts
  where attempt_id = p_attempt_id;

  return jsonb_build_object(
    'questionId', p_question_id,
    'isCorrect', v_correct,
    'pointsAwarded', v_points,
    'explanation', coalesce(v_explanation, ''),
    'correctAnswer', coalesce(v_correct_answer, ''),
    'hint', v_question.hint,
    'answeredCount', v_answered,
    'totalCount', v_attempt.total_count,
    'alreadyAnswered', v_existing.id is not null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Complete lesson: write progress and rewards exactly once
-- ---------------------------------------------------------------------------
create or replace function public.complete_lesson_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.lesson_attempts;
  v_lesson public.lessons;
  v_course_id uuid;
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_score integer;
  v_max_score integer;
  v_accuracy integer;
  v_passed boolean;
  v_was_completed boolean := false;
  v_xp integer := 0;
  v_coins integer := 0;
  v_duration integer;
  v_total_xp integer;
  v_wallet integer;
  v_attempts integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.lesson_attempts
  where id = p_attempt_id and user_id = v_user
  for update;

  if v_attempt.id is null then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  -- Serialize completions for the same node so rewards can never be duplicated.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user::text || ':' || v_attempt.node_id::text, 0)
  );

  select * into v_lesson
  from public.lessons
  where id = v_attempt.lesson_id;

  select lv.course_id into v_course_id
  from public.units u
  join public.course_levels lv on lv.id = u.course_level_id
  where u.id = v_lesson.unit_id;

  if v_attempt.status = 'completed' then
    select coalesce(sum(amount), 0)::integer into v_total_xp
    from public.user_xp_ledger where user_id = v_user;

    select coalesce(coins, 0) into v_wallet
    from public.user_wallets where user_id = v_user;

    return jsonb_build_object(
      'alreadyCompleted', true,
      'passed', v_attempt.accuracy >= 60,
      'correctCount', v_attempt.correct_count,
      'totalCount', v_attempt.total_count,
      'score', v_attempt.score,
      'maxScore', v_attempt.max_score,
      'accuracy', v_attempt.accuracy,
      'durationSeconds', greatest(0, extract(epoch from (v_attempt.completed_at - v_attempt.started_at))::integer),
      'xpAwarded', 0,
      'coinsAwarded', 0,
      'totalXp', v_total_xp,
      'coinBalance', coalesce(v_wallet, 0)
    );
  end if;

  if v_attempt.status = 'abandoned' then
    raise exception 'attempt_abandoned' using errcode = '22023';
  end if;

  v_total := v_attempt.total_count;
  v_max_score := v_attempt.max_score;

  if v_total = 0 then
    raise exception 'attempt_incomplete' using errcode = '22023';
  end if;

  select count(*)::integer into v_answered
  from public.answer_attempts where attempt_id = p_attempt_id;

  if v_answered < v_total then
    raise exception 'attempt_incomplete' using errcode = '22023';
  end if;

  select
    count(*) filter (where is_correct)::integer,
    coalesce(sum(points_awarded), 0)::integer
  into v_correct, v_score
  from public.answer_attempts
  where attempt_id = p_attempt_id;

  v_accuracy := case
    when v_total > 0 then round((v_correct::numeric / v_total) * 100)::integer
    else 0
  end;
  v_passed := v_accuracy >= 60;

  update public.lesson_attempts
     set status = 'completed',
         completed_at = now(),
         correct_count = v_correct,
         total_count = v_total,
         score = v_score,
         max_score = v_max_score,
         accuracy = v_accuracy
   where id = p_attempt_id;

  select exists (
    select 1 from public.user_node_progress
    where user_id = v_user and node_id = v_attempt.node_id and status = 'completed'
  ) into v_was_completed;

  insert into public.user_node_progress (
    user_id, node_id, status, best_score, attempts, completed_at
  )
  values (
    v_user,
    v_attempt.node_id,
    case when v_passed then 'completed'::public.node_progress_status else 'in_progress'::public.node_progress_status end,
    v_score,
    1,
    case when v_passed then now() else null end
  )
  on conflict (user_id, node_id) do update set
    status = case
      when public.user_node_progress.status = 'completed' then 'completed'::public.node_progress_status
      when excluded.status = 'completed' then 'completed'::public.node_progress_status
      else 'in_progress'::public.node_progress_status
    end,
    best_score = greatest(public.user_node_progress.best_score, excluded.best_score),
    attempts = public.user_node_progress.attempts + 1,
    completed_at = coalesce(public.user_node_progress.completed_at, excluded.completed_at),
    updated_at = now();

  if v_passed and not v_was_completed then
    v_xp := v_lesson.xp_reward;
    v_coins := v_lesson.coin_reward;

    insert into public.user_course_progress (user_id, course_id, xp, completed_lessons)
    values (v_user, v_course_id, v_xp, 1)
    on conflict (user_id, course_id) do update set
      xp = public.user_course_progress.xp + v_xp,
      completed_lessons = public.user_course_progress.completed_lessons + 1,
      updated_at = now();

    if v_xp > 0 then
      insert into public.user_xp_ledger (user_id, amount, source, lesson_attempt_id)
      values (v_user, v_xp, 'lesson', p_attempt_id)
      on conflict (lesson_attempt_id) do nothing;
    end if;

    if v_coins > 0 then
      insert into public.coin_transactions (user_id, amount, source, lesson_attempt_id)
      values (v_user, v_coins, 'lesson', p_attempt_id)
      on conflict (lesson_attempt_id) do nothing;

      insert into public.user_wallets (user_id, coins)
      values (v_user, v_coins)
      on conflict (user_id) do update set
        coins = public.user_wallets.coins + v_coins,
        updated_at = now();
    end if;
  end if;

  select coalesce(sum(amount), 0)::integer into v_total_xp
  from public.user_xp_ledger where user_id = v_user;

  select coalesce(coins, 0) into v_wallet
  from public.user_wallets where user_id = v_user;

  select attempts into v_attempts
  from public.user_node_progress
  where user_id = v_user and node_id = v_attempt.node_id;

  v_duration := greatest(0, extract(epoch from (now() - v_attempt.started_at))::integer);

  return jsonb_build_object(
    'alreadyCompleted', false,
    'passed', v_passed,
    'correctCount', v_correct,
    'totalCount', v_total,
    'score', v_score,
    'maxScore', v_max_score,
    'accuracy', v_accuracy,
    'durationSeconds', v_duration,
    'xpAwarded', v_xp,
    'coinsAwarded', v_coins,
    'totalXp', v_total_xp,
    'coinBalance', coalesce(v_wallet, 0),
    'attempts', coalesce(v_attempts, 1)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and privileges
-- ---------------------------------------------------------------------------
alter table public.lesson_attempts enable row level security;
alter table public.answer_attempts enable row level security;
alter table public.user_wallets enable row level security;
alter table public.user_xp_ledger enable row level security;
alter table public.coin_transactions enable row level security;

drop policy if exists "lesson_attempts_select_own" on public.lesson_attempts;
create policy "lesson_attempts_select_own"
  on public.lesson_attempts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "answer_attempts_select_own" on public.answer_attempts;
create policy "answer_attempts_select_own"
  on public.answer_attempts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_wallets_select_own" on public.user_wallets;
create policy "user_wallets_select_own"
  on public.user_wallets for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_xp_ledger_select_own" on public.user_xp_ledger;
create policy "user_xp_ledger_select_own"
  on public.user_xp_ledger for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "coin_transactions_select_own" on public.coin_transactions;
create policy "coin_transactions_select_own"
  on public.coin_transactions for select to authenticated
  using (user_id = auth.uid());

revoke all on public.lesson_attempts from anon, authenticated;
revoke all on public.answer_attempts from anon, authenticated;
revoke all on public.user_wallets from anon, authenticated;
revoke all on public.user_xp_ledger from anon, authenticated;
revoke all on public.coin_transactions from anon, authenticated;

grant select on public.lesson_attempts to authenticated;
grant select on public.answer_attempts to authenticated;
grant select on public.user_wallets to authenticated;
grant select on public.user_xp_ledger to authenticated;
grant select on public.coin_transactions to authenticated;

revoke all on function public.start_lesson(uuid) from public, anon;
revoke all on function public.submit_attempt_answer(uuid, uuid, jsonb) from public, anon;
revoke all on function public.complete_lesson_attempt(uuid) from public, anon;
grant execute on function public.start_lesson(uuid) to authenticated;
grant execute on function public.submit_attempt_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.complete_lesson_attempt(uuid) to authenticated;
