-- Lentera · Practice engine
-- Timed and targeted practice modes reuse the question bank and the same
-- server-side grading. The browser never receives answer keys, never submits a
-- score, and XP is written at most once per practice session.

do $$
begin
  create type public.practice_mode as enum (
    'match_madness', 'ramp_up', 'timed', 'mistakes',
    'personalized', 'unit_review', 'legendary'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.difficulty_rank(p_difficulty public.difficulty_band)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_difficulty
    when 'beginner' then 1
    when 'elementary' then 2
    when 'intermediate' then 3
    when 'upper_intermediate' then 4
    when 'advanced' then 5
    when 'expert' then 6
    else 0
  end;
$$;

-- Read-only helper so every practice mode selects from the same published
-- course scope. Players cannot call it directly.
create or replace function public.course_question_ids(p_course_id uuid)
returns table (
  question_id uuid,
  unit_id uuid,
  lesson_kind public.lesson_kind,
  difficulty public.difficulty_band,
  topic text,
  type public.question_type
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select q.id, u.id, l.kind, q.difficulty, q.topic, q.type
  from public.questions q
  join public.lessons l on l.id = q.lesson_id
  join public.units u on u.id = l.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where c.id = p_course_id
    and c.is_published
    and lv.is_published
    and u.is_published
    and l.is_published
    and q.is_active
    and s.status = 'active';
$$;

create or replace function public.correct_answer_text(p_question_id uuid)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_type public.question_type;
  v_text text;
begin
  select type into v_type from public.questions where id = p_question_id;

  if v_type in (
    'multiple_choice', 'picture_identification', 'listening', 'conversation', 'story'
  ) then
    select string_agg(label, ' / ' order by sort_order) into v_text
    from public.question_options
    where question_id = p_question_id and is_correct;
  elsif v_type = 'matching_pairs' then
    select string_agg(left_label || ' = ' || right_label, '; ' order by sort_order)
      into v_text
    from public.question_pairs
    where question_id = p_question_id;
  else
    select answer into v_text
    from public.question_answers
    where question_id = p_question_id
    order by id
    limit 1;
  end if;

  return coalesce(v_text, '');
end;
$$;

-- Choice-based scenes (listening, conversation, story) grade by option id.
-- Text answers keep the normalized comparison used by the lesson engine.
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
  if v_type is null or p_answer is null then
    return false;
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

  if p_answer ? 'optionId' then
    begin
      v_option := nullif(p_answer ->> 'optionId', '')::uuid;
    exception when others then
      return false;
    end;

    if v_option is null then
      return false;
    end if;

    return exists (
      select 1 from public.question_options
      where id = v_option and question_id = p_question_id and is_correct
    );
  end if;

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
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  mode public.practice_mode not null,
  status public.attempt_status not null default 'in_progress',
  question_count integer not null default 0 check (question_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  score integer not null default 0 check (score >= 0),
  max_score integer not null default 0 check (max_score >= 0),
  best_combo integer not null default 0 check (best_combo >= 0),
  time_limit_seconds integer not null default 0 check (time_limit_seconds >= 0),
  accuracy integer not null default 0 check (accuracy between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Existing installs created before accuracy was stored need the column too.
alter table public.practice_sessions
  add column if not exists accuracy integer not null default 0
  check (accuracy between 0 and 100);

create index if not exists practice_sessions_user_idx
  on public.practice_sessions (user_id, started_at desc);

create table if not exists public.practice_session_questions (
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (session_id, question_id),
  unique (session_id, sort_order)
);

create table if not exists public.practice_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer jsonb not null default '{}'::jsonb,
  is_correct boolean not null,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  combo integer not null default 1 check (combo >= 1),
  elapsed_ms integer not null default 0 check (elapsed_ms >= 0),
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create index if not exists practice_answers_user_idx
  on public.practice_answers (user_id, answered_at desc);

alter table public.user_xp_ledger
  add column if not exists practice_session_id uuid
  references public.practice_sessions (id) on delete set null;

create unique index if not exists user_xp_ledger_practice_idx
  on public.user_xp_ledger (practice_session_id)
  where practice_session_id is not null;

-- ---------------------------------------------------------------------------
-- Start a practice session
-- ---------------------------------------------------------------------------
create or replace function public.start_practice(
  p_mode public.practice_mode,
  p_course_id uuid,
  p_unit_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_session_id uuid;
  v_count integer;
  v_max_score integer;
  v_time_limit integer := 0;
  v_questions jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.courses c
    join public.subjects s on s.id = c.subject_id
    where c.id = p_course_id and c.is_published and s.status = 'active'
  ) then
    raise exception 'course_not_found' using errcode = 'P0002';
  end if;

  if p_mode = 'unit_review' then
    if p_unit_id is null then
      raise exception 'practice_unit_required' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.units u
      join public.course_levels lv on lv.id = u.course_level_id
      where u.id = p_unit_id and lv.course_id = p_course_id and u.is_published
    ) then
      raise exception 'practice_unit_not_found' using errcode = 'P0002';
    end if;
  end if;

  if p_mode = 'timed' then
    v_time_limit := 120;
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.course_question_ids(p_course_id)
      order by random() limit 10
    ) s;
  elsif p_mode = 'ramp_up' then
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.course_question_ids(p_course_id)
      order by public.difficulty_rank(difficulty), random() limit 10
    ) s;
  elsif p_mode = 'match_madness' then
    v_time_limit := 90;
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.course_question_ids(p_course_id)
      where type = 'matching_pairs'
      order by random() limit 3
    ) s;
  elsif p_mode = 'unit_review' then
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.course_question_ids(p_course_id)
      where unit_id = p_unit_id
      order by random() limit 12
    ) s;
  elsif p_mode = 'legendary' then
    select array_agg(question_id) into v_ids
    from (
      select question_id from public.course_question_ids(p_course_id)
      where lesson_kind = 'legendary'
      order by random() limit 10
    ) s;

    if coalesce(array_length(v_ids, 1), 0) < 3 then
      select array_agg(question_id) into v_ids
      from (
        select question_id from public.course_question_ids(p_course_id)
        order by public.difficulty_rank(difficulty) desc, random() limit 10
      ) s;
    end if;
  elsif p_mode = 'mistakes' then
    select array_agg(id) into v_ids
    from (
      select id from (
        select cq.question_id as id
        from public.course_question_ids(p_course_id) cq
        where cq.question_id in (
          select aa.question_id from public.answer_attempts aa
          where aa.user_id = v_user and not aa.is_correct
          union
          select pa.question_id from public.practice_answers pa
          where pa.user_id = v_user and not pa.is_correct
        )
        group by cq.question_id
      ) unique_ids
      order by random() limit 10
    ) s;

    if coalesce(array_length(v_ids, 1), 0) = 0 then
      raise exception 'practice_no_mistakes' using errcode = '22023';
    end if;
  else
    -- personalized: prefer topics the player has answered incorrectly before.
    select array_agg(id) into v_ids
    from (
      select id from (
        select cq.question_id as id
        from public.course_question_ids(p_course_id) cq
        where cq.topic in (
          select q2.topic
          from public.answer_attempts aa
          join public.questions q2 on q2.id = aa.question_id
          where aa.user_id = v_user and not aa.is_correct
          union
          select q3.topic
          from public.practice_answers pa
          join public.questions q3 on q3.id = pa.question_id
          where pa.user_id = v_user and not pa.is_correct
        )
        group by cq.question_id
      ) weak_topics
      order by random() limit 10
    ) s;

    if coalesce(array_length(v_ids, 1), 0) < 3 then
      select array_agg(id) into v_ids
      from (
        select id from (
          select cq.question_id as id
          from public.course_question_ids(p_course_id) cq
          where not exists (
            select 1 from public.answer_attempts aa
            where aa.user_id = v_user and aa.question_id = cq.question_id
          )
          group by cq.question_id
        ) unanswered
        order by random() limit 10
      ) s;
    end if;
  end if;

  v_count := coalesce(array_length(v_ids, 1), 0);

  if v_count = 0 then
    raise exception 'practice_not_enough_questions' using errcode = '22023';
  end if;

  if p_mode = 'match_madness' and v_count < 2 then
    raise exception 'practice_not_enough_questions' using errcode = '22023';
  end if;

  if p_mode not in ('match_madness', 'mistakes') and v_count < 3 then
    raise exception 'practice_not_enough_questions' using errcode = '22023';
  end if;

  select coalesce(sum(points), 0)::integer into v_max_score
  from public.questions where id = any (v_ids);

  insert into public.practice_sessions (
    user_id, course_id, unit_id, mode, question_count, max_score, time_limit_seconds
  )
  values (
    v_user, p_course_id, p_unit_id, p_mode, v_count, v_max_score, v_time_limit
  )
  returning id into v_session_id;

  insert into public.practice_session_questions (session_id, question_id, sort_order)
  select v_session_id, t.question_id, t.ord - 1
  from unnest(v_ids) with ordinality as t(question_id, ord);

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
    ) order by t.ord
  ), '[]'::jsonb) into v_questions
  from unnest(v_ids) with ordinality as t(question_id, ord)
  join public.questions q on q.id = t.question_id;

  return jsonb_build_object(
    'sessionId', v_session_id,
    'mode', p_mode,
    'courseId', p_course_id,
    'timeLimitSeconds', v_time_limit,
    'questionCount', v_count,
    'maxScore', v_max_score,
    'questions', v_questions
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Submit one practice answer (combination and speed scoring)
-- ---------------------------------------------------------------------------
create or replace function public.submit_practice_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_answer jsonb,
  p_elapsed_ms integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_question public.questions;
  v_existing public.practice_answers;
  v_previous public.practice_answers;
  v_correct boolean;
  v_combo integer := 1;
  v_points integer := 0;
  v_elapsed integer;
  v_answered integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_session
  from public.practice_sessions
  where id = p_session_id and user_id = v_user
  for update;

  if v_session.id is null then
    raise exception 'practice_not_found' using errcode = 'P0002';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'practice_not_active' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.practice_session_questions
    where session_id = p_session_id and question_id = p_question_id
  ) then
    raise exception 'question_not_in_practice' using errcode = '22023';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id and is_active;

  select * into v_existing
  from public.practice_answers
  where session_id = p_session_id and question_id = p_question_id;

  if v_existing.id is null then
    v_correct := public.grade_question(p_question_id, p_answer);

    select * into v_previous
    from public.practice_answers
    where session_id = p_session_id
    order by answered_at desc, id desc
    limit 1;

    if v_previous.id is not null and v_previous.is_correct then
      v_combo := v_previous.combo + 1;
    end if;

    v_elapsed := greatest(0, least(coalesce(p_elapsed_ms, 0), 600000));

    if v_correct then
      v_points := v_question.points;

      if v_session.mode in ('timed', 'ramp_up', 'match_madness') and v_elapsed between 1 and 6000 then
        v_points := v_points + 2;
      end if;

      v_points := v_points + least(5, greatest(0, v_combo - 1));
    end if;

    insert into public.practice_answers (
      session_id, user_id, question_id, answer, is_correct,
      points_awarded, combo, elapsed_ms
    )
    values (
      p_session_id, v_user, p_question_id, coalesce(p_answer, '{}'::jsonb), v_correct,
      v_points, v_combo, v_elapsed
    )
    on conflict (session_id, question_id) do nothing;

    if found then
      update public.practice_sessions
         set correct_count = correct_count + case when v_correct then 1 else 0 end,
             score = score + v_points,
             best_combo = greatest(best_combo, v_combo)
       where id = p_session_id;
    else
      select * into v_existing
      from public.practice_answers
      where session_id = p_session_id and question_id = p_question_id;
      v_correct := v_existing.is_correct;
      v_points := v_existing.points_awarded;
      v_combo := v_existing.combo;
    end if;
  else
    v_correct := v_existing.is_correct;
    v_points := v_existing.points_awarded;
    v_combo := v_existing.combo;
  end if;

  select count(*)::integer into v_answered
  from public.practice_answers
  where session_id = p_session_id;

  return jsonb_build_object(
    'questionId', p_question_id,
    'isCorrect', v_correct,
    'pointsAwarded', v_points,
    'combo', v_combo,
    'explanation', coalesce(v_question.explanation, ''),
    'correctAnswer', public.correct_answer_text(p_question_id),
    'answeredCount', v_answered,
    'totalCount', v_session.question_count,
    'alreadyAnswered', v_existing.id is not null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Complete a practice session (partial completion allowed on timeout)
-- ---------------------------------------------------------------------------
create or replace function public.complete_practice_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_answered integer;
  v_accuracy integer;
  v_passed boolean;
  v_xp integer := 0;
  v_awarded integer := 0;
  v_total_xp integer;
  v_duration integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_session
  from public.practice_sessions
  where id = p_session_id and user_id = v_user
  for update;

  if v_session.id is null then
    raise exception 'practice_not_found' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_session.id::text, 0));

  if v_session.status = 'completed' then
    select coalesce(sum(amount), 0)::integer into v_total_xp
    from public.user_xp_ledger where user_id = v_user;

    return jsonb_build_object(
      'alreadyCompleted', true,
      'sessionId', v_session.id,
      'mode', v_session.mode,
      'passed', v_session.accuracy >= 60,
      'correctCount', v_session.correct_count,
      'totalCount', v_session.question_count,
      'score', v_session.score,
      'maxScore', v_session.max_score,
      'accuracy', v_session.accuracy,
      'bestCombo', v_session.best_combo,
      'durationSeconds', greatest(0, extract(epoch from (v_session.completed_at - v_session.started_at))::integer),
      'xpAwarded', 0,
      'totalXp', v_total_xp
    );
  end if;

  select count(*)::integer into v_answered
  from public.practice_answers where session_id = p_session_id;

  if v_answered = 0 then
    raise exception 'practice_incomplete' using errcode = '22023';
  end if;

  v_accuracy := case
    when v_session.question_count > 0
      then round((v_session.correct_count::numeric / v_session.question_count) * 100)::integer
    else 0
  end;
  v_passed := v_accuracy >= 60;

  update public.practice_sessions
     set status = 'completed',
         completed_at = now(),
         accuracy = v_accuracy
   where id = p_session_id;

  if v_passed then
    v_xp := case
      when v_session.mode = 'legendary' then least(30, v_session.correct_count * 3)
      else least(20, v_session.correct_count * 2)
    end;
  end if;

  if v_xp > 0 then
    insert into public.user_xp_ledger (user_id, amount, source, practice_session_id)
    values (v_user, v_xp, 'practice', p_session_id)
    on conflict do nothing;

    get diagnostics v_awarded = row_count;
  end if;

  if v_awarded = 0 then
    v_xp := 0;
  end if;

  select coalesce(sum(amount), 0)::integer into v_total_xp
  from public.user_xp_ledger where user_id = v_user;

  v_duration := greatest(0, extract(epoch from (now() - v_session.started_at))::integer);

  return jsonb_build_object(
    'alreadyCompleted', false,
    'sessionId', v_session.id,
    'mode', v_session.mode,
    'passed', v_passed,
    'correctCount', v_session.correct_count,
    'totalCount', v_session.question_count,
    'answeredCount', v_answered,
    'score', v_session.score,
    'maxScore', v_session.max_score,
    'accuracy', v_accuracy,
    'bestCombo', v_session.best_combo,
    'durationSeconds', v_duration,
    'xpAwarded', v_xp,
    'totalXp', v_total_xp
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and privileges
-- ---------------------------------------------------------------------------
alter table public.practice_sessions enable row level security;
alter table public.practice_session_questions enable row level security;
alter table public.practice_answers enable row level security;

drop policy if exists "practice_sessions_select_own" on public.practice_sessions;
create policy "practice_sessions_select_own"
  on public.practice_sessions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "practice_answers_select_own" on public.practice_answers;
create policy "practice_answers_select_own"
  on public.practice_answers for select to authenticated
  using (user_id = auth.uid());

revoke all on public.practice_sessions from anon, authenticated;
revoke all on public.practice_session_questions from anon, authenticated;
revoke all on public.practice_answers from anon, authenticated;

grant select on public.practice_sessions to authenticated;
grant select on public.practice_answers to authenticated;

revoke all on function public.difficulty_rank(public.difficulty_band) from public, anon, authenticated;
revoke all on function public.course_question_ids(uuid) from public, anon, authenticated;
revoke all on function public.correct_answer_text(uuid) from public, anon, authenticated;

revoke all on function public.start_practice(public.practice_mode, uuid, uuid) from public, anon;
revoke all on function public.submit_practice_answer(uuid, uuid, jsonb, integer) from public, anon;
revoke all on function public.complete_practice_session(uuid) from public, anon;

grant execute on function public.start_practice(public.practice_mode, uuid, uuid) to authenticated;
grant execute on function public.submit_practice_answer(uuid, uuid, jsonb, integer) to authenticated;
grant execute on function public.complete_practice_session(uuid) to authenticated;
