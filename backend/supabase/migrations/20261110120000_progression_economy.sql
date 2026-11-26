-- Lentera · Tahap 5: progression & economy
-- Server-authoritative Hearts, Streaks, account levels, and wallet reads.
-- This migration only adds tables/functions/triggers; lesson and practice
-- reward logic from earlier migrations stays untouched.

-- ---------------------------------------------------------------------------
-- Account levels (XP thresholds are data, not client-editable state)
-- ---------------------------------------------------------------------------
create table if not exists public.player_levels (
  level integer primary key check (level between 1 and 30),
  title text not null,
  xp_required integer not null check (xp_required >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.player_levels (level, title, xp_required) values
  (1, 'Pemula', 0),
  (2, 'Penjelajah', 100),
  (3, 'Pelajar', 250),
  (4, 'Pencari Ilmu', 450),
  (5, 'Cendekia', 700),
  (6, 'Ahli Muda', 1000),
  (7, 'Ahli', 1350),
  (8, 'Mahir', 1700),
  (9, 'Terampil', 2050),
  (10, 'Andal', 2400),
  (11, 'Tangguh', 2750),
  (12, 'Cemerlang', 3100),
  (13, 'Istimewa', 3450),
  (14, 'Unggul', 3800),
  (15, 'Prima', 4150),
  (16, 'Juara', 4500),
  (17, 'Bintang', 4850),
  (18, 'Legenda Muda', 5200),
  (19, 'Legenda', 5550),
  (20, 'Maestro', 5900),
  (21, 'Visioner', 6250),
  (22, 'Penakluk', 6600),
  (23, 'Inspirator', 6950),
  (24, 'Teladan', 7300),
  (25, 'Arsitek Ilmu', 7650),
  (26, 'Penjaga Lentera', 8000),
  (27, 'Cahaya Muda', 8350),
  (28, 'Cahaya Agung', 8700),
  (29, 'Lentera Emas', 9050),
  (30, 'Lentera Abadi', 9400)
on conflict (level) do update
set title = excluded.title,
    xp_required = excluded.xp_required,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Hearts: max 5, one regenerates every 30 minutes
-- ---------------------------------------------------------------------------
create table if not exists public.user_hearts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_hearts smallint not null default 5
    check (current_hearts between 0 and 5),
  max_hearts smallint not null default 5
    check (max_hearts between 0 and 10),
  last_refill_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Streaks: one activity day is any server-written lesson/practice XP
-- ---------------------------------------------------------------------------
create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Backfill streak history from XP already written by the server. Use the
-- default timezone for this one-time migration; future days use each player's
-- saved timezone in the trigger below.
insert into public.user_streaks (
  user_id, current_streak, longest_streak, last_activity_date, last_activity_at
)
select
  l.user_id,
  1,
  1,
  max((l.created_at at time zone 'Asia/Jakarta')::date),
  max(l.created_at)
from public.user_xp_ledger l
where l.source in ('lesson', 'practice')
group by l.user_id
on conflict (user_id) do nothing;

insert into public.user_hearts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.user_streaks (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------
create or replace function public.ensure_player_progress(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user is null then
    return;
  end if;

  insert into public.user_hearts (user_id)
  values (p_user)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (p_user)
  on conflict (user_id) do nothing;
end;
$$;

-- Apply elapsed regeneration and return the fresh Hearts snapshot.
create or replace function public.refresh_hearts(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hearts public.user_hearts;
  v_gained integer;
  v_next integer;
begin
  if p_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(p_user);

  select * into v_hearts
  from public.user_hearts
  where user_id = p_user
  for update;

  if v_hearts.current_hearts < v_hearts.max_hearts then
    v_gained := floor(
      greatest(0, extract(epoch from (now() - v_hearts.last_refill_at))) / 1800
    )::integer;

    if v_gained > 0 then
      update public.user_hearts
      set current_hearts = least(max_hearts, current_hearts + v_gained),
          last_refill_at = case
            when least(max_hearts, current_hearts + v_gained) >= max_hearts then now()
            else last_refill_at + (v_gained * interval '30 minutes')
          end,
          updated_at = now()
      where user_id = p_user
      returning * into v_hearts;
    end if;
  else
    -- Keep a full wallet anchored to now so the next lost Heart starts a
    -- clean regeneration window.
    update public.user_hearts
    set last_refill_at = now(),
        updated_at = now()
    where user_id = p_user
    returning * into v_hearts;
  end if;

  v_next := case
    when v_hearts.current_hearts >= v_hearts.max_hearts then 0
    else greatest(0, ceil(
      extract(epoch from (v_hearts.last_refill_at + interval '30 minutes' - now()))
    )::integer)
  end;

  return jsonb_build_object(
    'current', v_hearts.current_hearts,
    'max', v_hearts.max_hearts,
    'nextRefillSeconds', v_next,
    'regenMinutes', 30,
    'refillCostCoins', (v_hearts.max_hearts - v_hearts.current_hearts) * 10
  );
end;
$$;

-- Grade result -> Heart loss happens only for a real INSERT of a wrong answer.
create or replace function public.spend_heart_for_wrong_answer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enabled boolean;
begin
  if new.is_correct then
    return new;
  end if;

  select l.hearts_enabled into v_enabled
  from public.lesson_attempts a
  join public.lessons l on l.id = a.lesson_id
  where a.id = new.attempt_id;

  if not coalesce(v_enabled, false) then
    return new;
  end if;

  perform public.ensure_player_progress(new.user_id);
  perform public.refresh_hearts(new.user_id);

  update public.user_hearts
  set current_hearts = greatest(0, current_hearts - 1),
      -- If this was a full wallet, this wrong answer starts the timer.
      last_refill_at = case
        when current_hearts >= max_hearts then now()
        else last_refill_at
      end,
      updated_at = now()
  where user_id = new.user_id
    and current_hearts > 0;

  return new;
end;
$$;

-- Gate new lesson attempts. An attempt already in progress can still be
-- answered and completed even after the wallet reaches zero.
create or replace function public.enforce_hearts_before_lesson()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_enabled boolean;
  v_current integer;
begin
  if public.is_staff() then
    return new;
  end if;

  select hearts_enabled into v_enabled
  from public.lessons
  where id = new.lesson_id;

  if not coalesce(v_enabled, false) then
    return new;
  end if;

  perform public.ensure_player_progress(new.user_id);
  perform public.refresh_hearts(new.user_id);

  select current_hearts into v_current
  from public.user_hearts
  where user_id = new.user_id;

  if coalesce(v_current, 0) <= 0 then
    raise exception 'hearts_empty' using errcode = '22023';
  end if;

  return new;
end;
$$;

-- The ledger is the source of truth for activity days. Quest XP is excluded.
create or replace function public.track_user_streak()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_streak public.user_streaks;
  v_next_streak integer;
begin
  if new.amount <= 0 or new.source not in ('lesson', 'practice') then
    return new;
  end if;

  select coalesce(nullif(timezone, ''), 'Asia/Jakarta') into v_tz
  from public.user_settings
  where user_id = new.user_id;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone 'Asia/Jakarta')::date;
  end;

  perform public.ensure_player_progress(new.user_id);

  select * into v_streak
  from public.user_streaks
  where user_id = new.user_id
  for update;

  if v_streak.last_activity_date is null then
    v_next_streak := 1;
  elsif v_streak.last_activity_date = v_today then
    update public.user_streaks
    set last_activity_at = now(),
        updated_at = now()
    where user_id = new.user_id;
    return new;
  elsif v_streak.last_activity_date = v_today - 1 then
    v_next_streak := v_streak.current_streak + 1;
  else
    v_next_streak := 1;
  end if;

  update public.user_streaks
  set current_streak = v_next_streak,
      longest_streak = greatest(longest_streak, v_next_streak),
      last_activity_date = v_today,
      last_activity_at = now(),
      updated_at = now()
  where user_id = new.user_id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------
create or replace function public.player_level_for_xp(p_xp integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_xp integer := greatest(0, coalesce(p_xp, 0));
  v_level integer;
  v_title text;
  v_required integer;
  v_next_xp integer;
  v_progress integer;
begin
  select level, title, xp_required
  into v_level, v_title, v_required
  from public.player_levels
  where xp_required <= v_xp
  order by level desc
  limit 1;

  if v_level is null then
    select level, title, xp_required
    into v_level, v_title, v_required
    from public.player_levels
    order by level asc
    limit 1;
  end if;

  select xp_required into v_next_xp
  from public.player_levels
  where xp_required > v_xp
  order by level asc
  limit 1;

  if v_next_xp is null then
    v_progress := 100;
  else
    v_progress := round(
      ((v_xp - v_required)::numeric / nullif(v_next_xp - v_required, 0)) * 100
    )::integer;
  end if;

  return jsonb_build_object(
    'level', v_level,
    'title', v_title,
    'xpRequired', v_required,
    'nextLevelXp', v_next_xp,
    'xpToNext', case when v_next_xp is null then 0 else greatest(0, v_next_xp - v_xp) end,
    'progressPercent', greatest(0, least(100, coalesce(v_progress, 0)))
  );
end;
$$;

create or replace function public.get_player_state()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_total_xp integer;
  v_today_xp integer;
  v_coins integer;
  v_hearts public.user_hearts;
  v_streak public.user_streaks;
  v_level jsonb;
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_current_streak integer;
  v_activity_days jsonb;
  v_next_refill integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(v_user);
  perform public.refresh_hearts(v_user);

  select coalesce(sum(amount), 0)::integer into v_total_xp
  from public.user_xp_ledger
  where user_id = v_user;

  select coalesce(coins, 0)::integer into v_coins
  from public.user_wallets
  where user_id = v_user;

  select * into v_hearts
  from public.user_hearts
  where user_id = v_user;

  select * into v_streak
  from public.user_streaks
  where user_id = v_user;

  select coalesce(nullif(timezone, ''), 'Asia/Jakarta') into v_tz
  from public.user_settings
  where user_id = v_user;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone 'Asia/Jakarta')::date;
  end;

  v_current_streak := case
    when v_streak.last_activity_date is null
      or v_streak.last_activity_date < v_today - 1 then 0
    else v_streak.current_streak
  end;

  v_next_refill := case
    when v_hearts.current_hearts >= v_hearts.max_hearts then 0
    else greatest(0, ceil(
      extract(epoch from (v_hearts.last_refill_at + interval '30 minutes' - now()))
    )::integer)
  end;

  select coalesce(jsonb_agg(day order by day desc), '[]'::jsonb)
  into v_activity_days
  from (
    select distinct (l.created_at at time zone v_tz)::date as day
    from public.user_xp_ledger l
    where l.user_id = v_user
      and l.source in ('lesson', 'practice')
      and l.created_at >= now() - interval '14 days'
  ) d;

  select coalesce(sum(l.amount), 0)::integer into v_today_xp
  from public.user_xp_ledger l
  where l.user_id = v_user
    and l.source in ('lesson', 'practice')
    and (l.created_at at time zone v_tz)::date = v_today;

  v_level := public.player_level_for_xp(v_total_xp);

  return jsonb_build_object(
    'totalXp', v_total_xp,
    'todayXp', v_today_xp,
    'coins', coalesce(v_coins, 0),
    'hearts', jsonb_build_object(
      'current', v_hearts.current_hearts,
      'max', v_hearts.max_hearts,
      'nextRefillSeconds', v_next_refill,
      'regenMinutes', 30,
      'refillCostCoins', (v_hearts.max_hearts - v_hearts.current_hearts) * 10
    ),
    'streak', jsonb_build_object(
      'current', v_current_streak,
      'longest', v_streak.longest_streak,
      'lastActivityDate', v_streak.last_activity_date,
      'todayDate', v_today,
      'activityDays', coalesce(v_activity_days, '[]'::jsonb)
    ),
    'level', v_level
  );
end;
$$;

create or replace function public.get_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_state jsonb;
  v_coins jsonb;
  v_xp jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_state := public.get_player_state();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'amount', t.amount,
    'source', t.source,
    'createdAt', t.created_at
  ) order by t.created_at desc), '[]'::jsonb)
  into v_coins
  from (
    select id, amount, source, created_at
    from public.coin_transactions
    where user_id = v_user
    order by created_at desc
    limit 30
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'amount', t.amount,
    'source', t.source,
    'createdAt', t.created_at
  ) order by t.created_at desc), '[]'::jsonb)
  into v_xp
  from (
    select id, amount, source, created_at
    from public.user_xp_ledger
    where user_id = v_user
    order by created_at desc
    limit 30
  ) t;

  return v_state || jsonb_build_object(
    'transactions', coalesce(v_coins, '[]'::jsonb),
    'xpTransactions', coalesce(v_xp, '[]'::jsonb)
  );
end;
$$;

-- Refill costs 10 Coins for each missing Heart. Cost is computed server-side.
create or replace function public.refill_hearts()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_hearts public.user_hearts;
  v_missing integer;
  v_cost integer;
  v_coins integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(v_user);
  perform public.refresh_hearts(v_user);

  select * into v_hearts
  from public.user_hearts
  where user_id = v_user
  for update;

  if v_hearts.current_hearts >= v_hearts.max_hearts then
    return public.get_player_state() || jsonb_build_object(
      'alreadyFull', true,
      'coinsSpent', 0,
      'heartsRestored', 0
    );
  end if;

  v_missing := v_hearts.max_hearts - v_hearts.current_hearts;
  v_cost := v_missing * 10;
  v_coins := 0;

  insert into public.user_wallets (user_id, coins)
  values (v_user, 0)
  on conflict (user_id) do nothing;

  select coins into v_coins
  from public.user_wallets
  where user_id = v_user
  for update;

  if coalesce(v_coins, 0) < v_cost then
    raise exception 'not_enough_coins' using errcode = '22023';
  end if;

  update public.user_wallets
  set coins = coins - v_cost,
      updated_at = now()
  where user_id = v_user;

  insert into public.coin_transactions (user_id, amount, source)
  values (v_user, -v_cost, 'heart_refill');

  update public.user_hearts
  set current_hearts = max_hearts,
      last_refill_at = now(),
      updated_at = now()
  where user_id = v_user;

  return public.get_player_state() || jsonb_build_object(
    'alreadyFull', false,
    'coinsSpent', v_cost,
    'heartsRestored', v_missing
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists lesson_attempts_require_hearts on public.lesson_attempts;
create trigger lesson_attempts_require_hearts
  before insert on public.lesson_attempts
  for each row execute function public.enforce_hearts_before_lesson();

drop trigger if exists answer_attempts_spend_heart on public.answer_attempts;
create trigger answer_attempts_spend_heart
  after insert on public.answer_attempts
  for each row execute function public.spend_heart_for_wrong_answer();

drop trigger if exists user_xp_ledger_track_streak on public.user_xp_ledger;
create trigger user_xp_ledger_track_streak
  after insert on public.user_xp_ledger
  for each row execute function public.track_user_streak();

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
alter table public.player_levels enable row level security;
alter table public.user_hearts enable row level security;
alter table public.user_streaks enable row level security;

drop policy if exists player_levels_select_authenticated on public.player_levels;
create policy player_levels_select_authenticated
  on public.player_levels for select
  to authenticated
  using (true);

drop policy if exists user_hearts_select_own on public.user_hearts;
create policy user_hearts_select_own
  on public.user_hearts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_streaks_select_own on public.user_streaks;
create policy user_streaks_select_own
  on public.user_streaks for select
  to authenticated
  using (user_id = auth.uid());

revoke all on public.player_levels from anon, authenticated;
revoke all on public.user_hearts from anon, authenticated;
revoke all on public.user_streaks from anon, authenticated;
grant select on public.player_levels to authenticated;
grant select on public.user_hearts to authenticated;
grant select on public.user_streaks to authenticated;

revoke all on function public.ensure_player_progress(uuid) from public, anon, authenticated;
revoke all on function public.refresh_hearts(uuid) from public, anon, authenticated;
revoke all on function public.spend_heart_for_wrong_answer() from public, anon, authenticated;
revoke all on function public.enforce_hearts_before_lesson() from public, anon, authenticated;
revoke all on function public.track_user_streak() from public, anon, authenticated;
revoke all on function public.player_level_for_xp(integer) from public, anon, authenticated;
revoke all on function public.get_player_state() from public, anon;
revoke all on function public.get_my_wallet() from public, anon;
revoke all on function public.refill_hearts() from public, anon;

grant execute on function public.get_player_state() to authenticated;
grant execute on function public.get_my_wallet() to authenticated;
grant execute on function public.refill_hearts() to authenticated;
