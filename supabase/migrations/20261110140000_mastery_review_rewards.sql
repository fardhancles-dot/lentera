-- Lentera · Mastery, scheduled review, and level reward nodes
-- Mastery is calculated from answer rows written by the server. Review sessions
-- select only questions whose next review is due, and reward nodes are claimed
-- once after every playable lesson in the level is completed.

do $$
begin
  alter type public.practice_mode add value if not exists 'scheduled_review';
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Mastery and scheduled review
-- ---------------------------------------------------------------------------
create table if not exists public.user_question_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  mastery_level integer not null default 0 check (mastery_level between 0 and 5),
  interval_days integer not null default 0 check (interval_days >= 0),
  last_answered_at timestamptz not null default now(),
  next_review_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists user_question_mastery_due_idx
  on public.user_question_mastery (user_id, next_review_at);

create or replace function public.record_question_mastery(
  p_user uuid,
  p_question_id uuid,
  p_correct boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous public.user_question_mastery;
  v_level integer;
  v_streak integer;
  v_interval integer;
  v_next_review timestamptz;
begin
  if p_user is null or p_question_id is null then
    return;
  end if;

  select * into v_previous
  from public.user_question_mastery
  where user_id = p_user and question_id = p_question_id
  for update;

  if p_correct then
    v_level := least(5, coalesce(v_previous.mastery_level, 0) + 1);
    v_streak := coalesce(v_previous.correct_streak, 0) + 1;
    v_interval := case v_level
      when 1 then 1
      when 2 then 3
      when 3 then 7
      when 4 then 14
      else 30
    end;
    v_next_review := now() + make_interval(days => v_interval);
  else
    v_level := greatest(0, coalesce(v_previous.mastery_level, 0) - 2);
    v_streak := 0;
    v_interval := 0;
    -- A missed question returns quickly instead of waiting for the next day.
    v_next_review := now() + interval '10 minutes';
  end if;

  insert into public.user_question_mastery (
    user_id, question_id, attempts, correct_count, correct_streak,
    mastery_level, interval_days, last_answered_at, next_review_at, updated_at
  )
  values (
    p_user, p_question_id, 1, case when p_correct then 1 else 0 end, v_streak,
    v_level, v_interval, now(), v_next_review, now()
  )
  on conflict (user_id, question_id) do update set
    attempts = public.user_question_mastery.attempts + 1,
    correct_count = public.user_question_mastery.correct_count
      + case when p_correct then 1 else 0 end,
    correct_streak = excluded.correct_streak,
    mastery_level = excluded.mastery_level,
    interval_days = excluded.interval_days,
    last_answered_at = excluded.last_answered_at,
    next_review_at = excluded.next_review_at,
    updated_at = now();
end;
$$;

create or replace function public.track_lesson_mastery()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_question_mastery(new.user_id, new.question_id, new.is_correct);
  return new;
end;
$$;

create or replace function public.track_practice_mastery()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_question_mastery(new.user_id, new.question_id, new.is_correct);
  return new;
end;
$$;

drop trigger if exists answer_attempts_record_mastery on public.answer_attempts;
create trigger answer_attempts_record_mastery
  after insert on public.answer_attempts
  for each row execute function public.track_lesson_mastery();

drop trigger if exists practice_answers_record_mastery on public.practice_answers;
create trigger practice_answers_record_mastery
  after insert on public.practice_answers
  for each row execute function public.track_practice_mastery();

-- Backfill mastery from answer history so existing players get a useful
-- starting schedule instead of an empty page.
with all_answers as (
  select user_id, question_id, is_correct, answered_at from public.answer_attempts
  union all
  select user_id, question_id, is_correct, answered_at from public.practice_answers
), aggregated as (
  select
    user_id,
    question_id,
    count(*)::integer as attempts,
    count(*) filter (where is_correct)::integer as correct_count,
    count(*) filter (where not is_correct)::integer as wrong_count,
    max(answered_at) as last_answered_at
  from all_answers
  group by user_id, question_id
), prepared as (
  select
    user_id,
    question_id,
    attempts,
    correct_count,
    case when wrong_count = 0 then correct_count else 0 end as correct_streak,
    case
      when wrong_count = 0 then least(5, correct_count)
      else greatest(0, correct_count - wrong_count)
    end as mastery_level,
    case
      when wrong_count > 0 then 0
      when least(5, correct_count) >= 5 then 30
      when least(5, correct_count) = 4 then 14
      when least(5, correct_count) = 3 then 7
      when least(5, correct_count) = 2 then 3
      else 1
    end as interval_days,
    last_answered_at
  from aggregated
)
insert into public.user_question_mastery (
  user_id, question_id, attempts, correct_count, correct_streak,
  mastery_level, interval_days, last_answered_at, next_review_at, updated_at
)
select
  user_id,
  question_id,
  attempts,
  correct_count,
  correct_streak,
  mastery_level,
  interval_days,
  last_answered_at,
  case
    when interval_days = 0 then last_answered_at + interval '10 minutes'
    else last_answered_at + make_interval(days => interval_days)
  end,
  now()
from prepared
on conflict (user_id, question_id) do nothing;

create or replace function public.get_my_mastery()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  with course_questions as (
    select
      c.id as course_id,
      s.slug as subject_slug,
      s.name as subject_name,
      s.sort_order,
      cq.question_id
    from public.courses c
    join public.subjects s on s.id = c.subject_id
    cross join lateral public.course_question_ids(c.id) cq
    where c.is_published and s.status = 'active'
  ), aggregated as (
    select
      cq.course_id,
      count(*)::integer as total_questions,
      count(m.question_id)::integer as tracked,
      count(*) filter (where m.mastery_level >= 5)::integer as mastered,
      count(*) filter (where m.next_review_at <= now())::integer as due,
      coalesce(sum(m.correct_count), 0)::integer as correct_answers,
      coalesce(sum(m.attempts), 0)::integer as total_answers
    from course_questions cq
    left join public.user_question_mastery m
      on m.user_id = v_user and m.question_id = cq.question_id
    group by cq.course_id
  ), joined as (
    select
      a.*,
      s.slug as subject_slug,
      s.name as subject_name,
      s.sort_order
    from aggregated a
    join public.courses c on c.id = a.course_id
    join public.subjects s on s.id = c.subject_id
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'totalQuestions', (select coalesce(sum(total_questions), 0)::integer from aggregated),
      'tracked', (select coalesce(sum(tracked), 0)::integer from aggregated),
      'mastered', (select coalesce(sum(mastered), 0)::integer from aggregated),
      'due', (select coalesce(sum(due), 0)::integer from aggregated),
      'accuracy', case
        when (select coalesce(sum(total_answers), 0) from aggregated) > 0
          then (
            select round(sum(correct_answers)::numeric * 100 / sum(total_answers))::integer
            from aggregated
          )
        else 0
      end
    ),
    'courses', coalesce(jsonb_agg(jsonb_build_object(
      'courseId', j.course_id,
      'subjectSlug', j.subject_slug,
      'subjectName', j.subject_name,
      'totalQuestions', j.total_questions,
      'tracked', j.tracked,
      'mastered', j.mastered,
      'due', j.due,
      'accuracy', case
        when j.total_answers > 0 then round(j.correct_answers::numeric * 100 / j.total_answers)::integer
        else 0
      end,
      'masteryPercent', case
        when j.total_questions > 0 then round(j.mastered::numeric * 100 / j.total_questions)::integer
        else 0
      end
    ) order by j.sort_order), '[]'::jsonb)
  )
  into v_result
  from joined j;

  return v_result;
end;
$$;

-- Reusable internal builder for a practice session from explicit question ids.
create or replace function public.create_practice_session_from_ids(
  p_user uuid,
  p_course_id uuid,
  p_unit_id uuid,
  p_mode public.practice_mode,
  p_ids uuid[],
  p_time_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_count integer := coalesce(array_length(p_ids, 1), 0);
  v_max_score integer;
  v_session_id uuid;
  v_questions jsonb;
begin
  if v_count = 0 then
    raise exception 'practice_not_enough_questions' using errcode = '22023';
  end if;

  select coalesce(sum(points), 0)::integer into v_max_score
  from public.questions where id = any (p_ids);

  insert into public.practice_sessions (
    user_id, course_id, unit_id, mode, question_count, max_score, time_limit_seconds
  )
  values (
    p_user, p_course_id, p_unit_id, p_mode, v_count, v_max_score, greatest(0, coalesce(p_time_limit, 0))
  )
  returning id into v_session_id;

  insert into public.practice_session_questions (session_id, question_id, sort_order)
  select v_session_id, t.question_id, t.ord - 1
  from unnest(p_ids) with ordinality as t(question_id, ord);

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
  from unnest(p_ids) with ordinality as t(question_id, ord)
  join public.questions q on q.id = t.question_id;

  return jsonb_build_object(
    'sessionId', v_session_id,
    'mode', p_mode,
    'courseId', p_course_id,
    'timeLimitSeconds', greatest(0, coalesce(p_time_limit, 0)),
    'questionCount', v_count,
    'maxScore', v_max_score,
    'questions', v_questions
  );
end;
$$;

create or replace function public.start_scheduled_review(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[];
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

  select array_agg(id) into v_ids
  from (
    select cq.question_id as id
    from public.course_question_ids(p_course_id) cq
    join public.user_question_mastery m
      on m.user_id = v_user and m.question_id = cq.question_id
    where m.next_review_at <= now()
    order by m.next_review_at, m.mastery_level, random()
    limit 10
  ) due;

  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'practice_no_due_reviews' using errcode = '22023';
  end if;

  return public.create_practice_session_from_ids(
    v_user, p_course_id, null, 'scheduled_review'::public.practice_mode, v_ids, 0
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Claimable reward at the end of every course level
-- ---------------------------------------------------------------------------
alter table public.learning_nodes
  add column if not exists reward_coins integer not null default 0
  check (reward_coins >= 0);

alter table public.learning_nodes
  add column if not exists reward_xp integer not null default 0
  check (reward_xp >= 0);

create table if not exists public.user_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  node_id uuid not null references public.learning_nodes (id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  xp integer not null default 0 check (xp >= 0),
  claimed_at timestamptz not null default now(),
  unique (user_id, node_id)
);

create index if not exists user_reward_claims_user_idx
  on public.user_reward_claims (user_id, claimed_at desc);

alter table public.user_xp_ledger
  add column if not exists reward_claim_id uuid
  references public.user_reward_claims (id) on delete set null;

create unique index if not exists user_xp_ledger_reward_claim_idx
  on public.user_xp_ledger (reward_claim_id)
  where reward_claim_id is not null;

alter table public.coin_transactions
  add column if not exists reward_claim_id uuid
  references public.user_reward_claims (id) on delete set null;

create unique index if not exists coin_transactions_reward_claim_idx
  on public.coin_transactions (reward_claim_id)
  where reward_claim_id is not null;

with level_units as (
  select
    lv.id as level_id,
    lv.slug as level_slug,
    lv.title as level_title,
    lv.difficulty,
    u.id as unit_id,
    row_number() over (partition by lv.id order by u.sort_order desc, u.id desc) as rn
  from public.course_levels lv
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  join public.units u on u.course_level_id = lv.id
  where lv.is_published and u.is_published and c.is_published and s.status = 'active'
)
insert into public.learning_nodes (
  id, unit_id, slug, title, description, node_type, lesson_id,
  sort_order, is_active, reward_coins, reward_xp
)
select
  gen_random_uuid(),
  lu.unit_id,
  'reward-' || lu.level_slug,
  'Hadiah ' || lu.level_title,
  'Selesaikan semua lesson di level ini untuk membuka hadiah.',
  'reward'::public.node_kind,
  null,
  coalesce((
    select max(n.sort_order)
    from public.learning_nodes n
    where n.unit_id = lu.unit_id
  ), 0) + 10,
  true,
  case lu.difficulty
    when 'beginner' then 20
    when 'elementary' then 30
    when 'intermediate' then 40
    when 'upper_intermediate' then 50
    when 'advanced' then 60
    else 75
  end,
  case lu.difficulty
    when 'beginner' then 10
    when 'elementary' then 10
    when 'intermediate' then 15
    when 'upper_intermediate' then 20
    when 'advanced' then 20
    else 25
  end
from level_units lu
where lu.rn = 1
on conflict (unit_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  reward_coins = excluded.reward_coins,
  reward_xp = excluded.reward_xp;

create or replace function public.claim_reward_node(p_node_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_node public.learning_nodes;
  v_level_id uuid;
  v_locked boolean := false;
  v_claim public.user_reward_claims;
  v_coins integer := 0;
  v_xp integer := 0;
  v_coin_balance integer;
  v_total_xp integer;
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
    and n.node_type = 'reward'
    and n.is_active
    and u.is_published
    and lv.is_published
    and c.is_published
    and s.status = 'active';

  if v_node.id is null then
    raise exception 'reward_not_found' using errcode = 'P0002';
  end if;

  select u.course_level_id into v_level_id
  from public.units u where u.id = v_node.unit_id;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user::text || ':reward:' || p_node_id::text, 0)
  );

  select * into v_claim
  from public.user_reward_claims
  where user_id = v_user and node_id = p_node_id;

  if v_claim.id is null then
    select exists (
      select 1
      from public.learning_nodes n
      join public.units u on u.id = n.unit_id
      where u.course_level_id = v_level_id
        and n.is_active
        and n.lesson_id is not null
        and not exists (
          select 1 from public.user_node_progress p
          where p.user_id = v_user
            and p.node_id = n.id
            and p.status = 'completed'
        )
    ) into v_locked;

    if v_locked then
      raise exception 'reward_locked' using errcode = '42501';
    end if;

    insert into public.user_reward_claims (user_id, node_id, coins, xp)
    values (v_user, p_node_id, v_node.reward_coins, v_node.reward_xp)
    on conflict (user_id, node_id) do nothing
    returning * into v_claim;

    if v_claim.id is null then
      select * into v_claim
      from public.user_reward_claims
      where user_id = v_user and node_id = p_node_id;
    else
      v_coins := v_node.reward_coins;
      v_xp := v_node.reward_xp;

      if v_xp > 0 then
        insert into public.user_xp_ledger (
          user_id, amount, source, reward_claim_id
        )
        values (v_user, v_xp, 'reward_node', v_claim.id);
      end if;

      if v_coins > 0 then
        insert into public.coin_transactions (
          user_id, amount, source, reference_id, reward_claim_id
        )
        values (
          v_user, v_coins, 'reward_node',
          'reward:' || p_node_id::text, v_claim.id
        )
        on conflict (user_id, source, reference_id) where reference_id is not null do nothing;

        insert into public.user_wallets (user_id, coins)
        values (v_user, v_coins)
        on conflict (user_id) do update set
          coins = public.user_wallets.coins + v_coins,
          updated_at = now();
      end if;
    end if;
  end if;

  select coalesce(coins, 0)::integer into v_coin_balance
  from public.user_wallets where user_id = v_user;

  select coalesce(sum(amount), 0)::integer into v_total_xp
  from public.user_xp_ledger where user_id = v_user;

  return jsonb_build_object(
    'nodeId', p_node_id,
    'alreadyClaimed', v_coins = 0 and v_xp = 0 and v_claim.id is not null,
    'coinsAwarded', v_coins,
    'xpAwarded', v_xp,
    'coinBalance', coalesce(v_coin_balance, 0),
    'totalXp', coalesce(v_total_xp, 0),
    'claimedAt', v_claim.claimed_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and privileges
-- ---------------------------------------------------------------------------
alter table public.user_question_mastery enable row level security;
alter table public.user_reward_claims enable row level security;

drop policy if exists user_question_mastery_select_own on public.user_question_mastery;
create policy user_question_mastery_select_own
  on public.user_question_mastery for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_reward_claims_select_own on public.user_reward_claims;
create policy user_reward_claims_select_own
  on public.user_reward_claims for select to authenticated
  using (user_id = auth.uid());

revoke all on public.user_question_mastery from anon, authenticated;
revoke all on public.user_reward_claims from anon, authenticated;
grant select on public.user_question_mastery to authenticated;
grant select on public.user_reward_claims to authenticated;

revoke all on function public.record_question_mastery(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.track_lesson_mastery() from public, anon, authenticated;
revoke all on function public.track_practice_mastery() from public, anon, authenticated;
revoke all on function public.create_practice_session_from_ids(uuid, uuid, uuid, public.practice_mode, uuid[], integer) from public, anon, authenticated;
revoke all on function public.get_my_mastery() from public, anon;
revoke all on function public.start_scheduled_review(uuid) from public, anon;
revoke all on function public.claim_reward_node(uuid) from public, anon;

grant execute on function public.get_my_mastery() to authenticated;
grant execute on function public.start_scheduled_review(uuid) to authenticated;
grant execute on function public.claim_reward_node(uuid) to authenticated;
