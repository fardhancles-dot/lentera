-- Lentera · Daily goal study sessions
-- A lesson attempt now also records real study time, so the daily target on the
-- home page is backed by database rows instead of a static frontend placeholder.
-- Additive only: existing attempts, questions, progress, XP, and rewards stay as
-- they are. Each attempt can produce at most one session (attempt_id unique), so
-- finishing a lesson can never count the same study time twice.

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null unique references public.lesson_attempts (id) on delete cascade,
  node_id uuid references public.learning_nodes (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  local_date date not null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0
    check (duration_seconds between 0 and 86400),
  created_at timestamptz not null default now()
);

comment on table public.study_sessions is
  'One study session per lesson attempt. duration_seconds only grows from server-side activity, and local_date uses the player timezone at session start.';

create index if not exists study_sessions_user_day_idx
  on public.study_sessions (user_id, local_date);

alter table public.study_sessions enable row level security;
revoke all on public.study_sessions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Session lifecycle
-- ---------------------------------------------------------------------------
create or replace function public.begin_study_session()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_tz text := 'Asia/Jakarta';
  v_subject_id uuid;
  v_today date;
begin
  select coalesce(nullif(us.timezone, ''), 'Asia/Jakarta')
  into v_tz
  from public.user_settings us
  where us.user_id = new.user_id;

  select c.subject_id
  into v_subject_id
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  where l.id = new.lesson_id;

  begin
    v_today := (new.started_at at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (new.started_at at time zone v_tz)::date;
  end;

  insert into public.study_sessions (
    user_id, attempt_id, node_id, lesson_id, subject_id,
    local_date, started_at, last_active_at
  )
  values (
    new.user_id, new.id, new.node_id, new.lesson_id, v_subject_id,
    v_today, new.started_at, new.started_at
  )
  on conflict (attempt_id) do nothing;

  return new;
end;
$$;

drop trigger if exists lesson_attempts_begin_study_session on public.lesson_attempts;
create trigger lesson_attempts_begin_study_session
  after insert on public.lesson_attempts
  for each row execute function public.begin_study_session();

-- Answering a question is proof of activity. Time since the last recorded
-- activity is credited, capped so an idle tab cannot inflate the total.
create or replace function public.credit_study_session_answer()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  update public.study_sessions s
  set duration_seconds = least(
        s.duration_seconds
          + least(60, greatest(0, floor(extract(epoch from (now() - s.last_active_at)))::integer)),
        86400
      ),
      last_active_at = now()
  where s.attempt_id = new.attempt_id
    and s.user_id = new.user_id
    and s.ended_at is null;

  return new;
end;
$$;

drop trigger if exists answer_attempts_credit_study_session on public.answer_attempts;
create trigger answer_attempts_credit_study_session
  after insert on public.answer_attempts
  for each row execute function public.credit_study_session_answer();

-- Closing an attempt freezes its session. Only the status transition that ends
-- an attempt can finalize it, so a repeated completion writes nothing new.
create or replace function public.finish_study_session()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.status <> old.status and new.status in ('completed', 'abandoned') then
    update public.study_sessions s
    set duration_seconds = least(
          s.duration_seconds
            + least(60, greatest(0, floor(extract(epoch from (now() - s.last_active_at)))::integer)),
          86400
        ),
        last_active_at = now(),
        ended_at = coalesce(s.ended_at, now())
    where s.attempt_id = new.id
      and s.user_id = new.user_id
      and s.ended_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_attempts_finish_study_session on public.lesson_attempts;
create trigger lesson_attempts_finish_study_session
  after update of status on public.lesson_attempts
  for each row execute function public.finish_study_session();

-- Best-effort heartbeat while the player is actively on the lesson screen.
-- The browser never sends a duration; the server measures elapsed time itself,
-- so a forged client cannot add arbitrary minutes.
create or replace function public.ping_study_session(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_duration integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  update public.study_sessions s
  set duration_seconds = least(
        s.duration_seconds
          + least(30, greatest(0, floor(extract(epoch from (now() - s.last_active_at)))::integer)),
        86400
      ),
      last_active_at = now()
  where s.attempt_id = p_attempt_id
    and s.user_id = v_user
    and s.ended_at is null
  returning s.duration_seconds into v_duration;

  return jsonb_build_object(
    'recorded', v_duration is not null,
    'durationSeconds', coalesce(v_duration, 0)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Daily goal read: today is always resolved in the player's saved timezone.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_daily_goal()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_goal integer := 10;
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_seconds integer := 0;
  v_sessions integer := 0;
  v_target integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select us.daily_goal_minutes, coalesce(nullif(us.timezone, ''), 'Asia/Jakarta')
  into v_goal, v_tz
  from public.user_settings us
  where us.user_id = v_user;

  if v_goal is null then
    v_goal := 10;
    v_tz := 'Asia/Jakarta';
  end if;

  begin
    v_today := (now() at time zone v_tz)::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone v_tz)::date;
  end;

  v_target := greatest(1, v_goal * 60);

  select
    coalesce(sum(s.duration_seconds), 0)::integer,
    count(*) filter (where s.duration_seconds > 0)::integer
  into v_seconds, v_sessions
  from public.study_sessions s
  where s.user_id = v_user
    and s.local_date = v_today;

  return jsonb_build_object(
    'goalMinutes', v_goal,
    'targetSeconds', v_target,
    'studiedSeconds', v_seconds,
    'percent', least(100, round((v_seconds::numeric / v_target) * 100)::integer),
    'sessionCount', v_sessions,
    'remainingSeconds', greatest(0, v_target - v_seconds),
    'date', v_today,
    'timezone', v_tz
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill completed attempts so today's target is not reset by the migration.
-- The cap keeps historically abandoned tabs from inflating the numbers.
-- ---------------------------------------------------------------------------
insert into public.study_sessions (
  user_id, attempt_id, node_id, lesson_id, subject_id, local_date,
  started_at, last_active_at, ended_at, duration_seconds
)
select
  a.user_id,
  a.id,
  a.node_id,
  a.lesson_id,
  c.subject_id,
  (a.started_at at time zone coalesce(nullif(us.timezone, ''), 'Asia/Jakarta'))::date,
  a.started_at,
  coalesce(a.completed_at, a.started_at),
  a.completed_at,
  least(
    3600,
    greatest(0, extract(epoch from (coalesce(a.completed_at, a.started_at) - a.started_at))::integer)
  )
from public.lesson_attempts a
join public.lessons l on l.id = a.lesson_id
join public.units u on u.id = l.unit_id
join public.course_levels lv on lv.id = u.course_level_id
join public.courses c on c.id = lv.course_id
left join public.user_settings us on us.user_id = a.user_id
where a.status = 'completed'
on conflict (attempt_id) do nothing;

revoke all on function public.begin_study_session() from public, anon, authenticated;
revoke all on function public.credit_study_session_answer() from public, anon, authenticated;
revoke all on function public.finish_study_session() from public, anon, authenticated;
revoke all on function public.ping_study_session(uuid) from public, anon;
revoke all on function public.get_my_daily_goal() from public, anon;

grant execute on function public.ping_study_session(uuid) to authenticated;
grant execute on function public.get_my_daily_goal() to authenticated;
