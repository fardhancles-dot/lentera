-- Lentera · Tahap 5: rewards, quests, achievements, shop, inventory
-- Every reward is derived from server-written state. The browser only reads
-- RPC payloads and requests claim/purchase/use actions; it never sends amounts.

-- ---------------------------------------------------------------------------
-- Level rewards
-- ---------------------------------------------------------------------------
alter table public.player_levels
  add column if not exists reward_coins integer not null default 0
  check (reward_coins >= 0);

update public.player_levels
set reward_coins = case
  when level = 1 then 0
  else 25 + ((level - 2) * 5)
end,
updated_at = now();

create table if not exists public.user_level_rewards (
  user_id uuid not null references auth.users (id) on delete cascade,
  level integer not null references public.player_levels (level) on delete cascade,
  coins integer not null check (coins >= 0),
  awarded_at timestamptz not null default now(),
  primary key (user_id, level)
);

-- ---------------------------------------------------------------------------
-- Streak milestones and shields
-- ---------------------------------------------------------------------------
create table if not exists public.streak_milestones (
  days integer primary key check (days between 1 and 3650),
  title text not null,
  reward_coins integer not null default 0 check (reward_coins >= 0),
  icon text not null default 'flame',
  sort_order integer not null default 0
);

insert into public.streak_milestones (days, title, reward_coins, icon, sort_order) values
  (3, 'Tiga Hari Konsisten', 20, 'flame', 1),
  (7, 'Seminggu Penuh', 50, 'flame', 2),
  (14, 'Dua Minggu Bersama', 100, 'trophy', 3),
  (30, 'Sebulan Konsisten', 200, 'trophy', 4),
  (60, 'Dua Bulan Hebat', 400, 'star', 5),
  (100, 'Seratus Hari', 800, 'star', 6)
on conflict (days) do update
set title = excluded.title,
    reward_coins = excluded.reward_coins,
    icon = excluded.icon,
    sort_order = excluded.sort_order;

create table if not exists public.user_streak_milestones (
  user_id uuid not null references auth.users (id) on delete cascade,
  days integer not null references public.streak_milestones (days) on delete cascade,
  coins integer not null check (coins >= 0),
  awarded_at timestamptz not null default now(),
  primary key (user_id, days)
);

alter table public.user_streaks
  add column if not exists freezes smallint not null default 0
  check (freezes between 0 and 2);

-- ---------------------------------------------------------------------------
-- Daily and weekly quests
-- ---------------------------------------------------------------------------
create table if not exists public.quest_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  cadence text not null check (cadence in ('daily', 'weekly')),
  metric text not null check (metric in ('xp', 'lesson', 'practice')),
  target integer not null check (target between 1 and 100000),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  title text not null,
  description text not null default '',
  icon text not null default 'target',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.quest_definitions (
  code, cadence, metric, target, reward_coins, title, description, icon, sort_order
) values
  ('daily-xp-50', 'daily', 'xp', 50, 20, 'Hangatkan Lentera', 'Dapatkan 50 XP dari lesson atau latihan hari ini.', 'sparkles', 1),
  ('daily-lesson-1', 'daily', 'lesson', 1, 15, 'Satu Langkah Baru', 'Selesaikan satu lesson hari ini.', 'book', 2),
  ('daily-practice-1', 'daily', 'practice', 1, 15, 'Latihan Singkat', 'Selesaikan satu sesi latihan hari ini.', 'target', 3),
  ('weekly-xp-300', 'weekly', 'xp', 300, 80, 'Tujuh Hari Bercahaya', 'Kumpulkan 300 XP dari lesson atau latihan minggu ini.', 'sparkles', 1),
  ('weekly-lesson-3', 'weekly', 'lesson', 3, 60, 'Jalur Mingguan', 'Selesaikan tiga lesson minggu ini.', 'book', 2),
  ('weekly-practice-3', 'weekly', 'practice', 3, 60, 'Tiga Sesi Latihan', 'Selesaikan tiga sesi latihan minggu ini.', 'target', 3)
on conflict (code) do update
set cadence = excluded.cadence,
    metric = excluded.metric,
    target = excluded.target,
    reward_coins = excluded.reward_coins,
    title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.user_quest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_id uuid not null references public.quest_definitions (id) on delete cascade,
  period_start date not null,
  coins integer not null check (coins >= 0),
  claimed_at timestamptz not null default now(),
  unique (user_id, quest_id, period_start)
);

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create table if not exists public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  metric text not null check (metric in ('xp', 'lesson', 'practice', 'streak', 'level')),
  target integer not null check (target between 1 and 1000000),
  icon text not null default 'trophy',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.achievement_definitions (
  code, title, description, metric, target, icon, sort_order
) values
  ('first-lesson', 'Langkah Pertama', 'Selesaikan lesson pertamamu.', 'lesson', 1, 'flag', 1),
  ('five-lessons', 'Rajin Belajar', 'Selesaikan lima lesson.', 'lesson', 5, 'book', 2),
  ('first-practice', 'Mulai Berlatih', 'Selesaikan sesi latihan pertamamu.', 'practice', 1, 'target', 3),
  ('ten-practices', 'Latihan Sepuluh', 'Selesaikan sepuluh sesi latihan.', 'practice', 10, 'target', 4),
  ('xp-500', 'Lima Ratus XP', 'Kumpulkan total 500 XP.', 'xp', 500, 'sparkles', 5),
  ('streak-7', 'Seminggu Penuh', 'Capai Streak tujuh hari.', 'streak', 7, 'flame', 6),
  ('streak-30', 'Sebulan Konsisten', 'Capai Streak tiga puluh hari.', 'streak', 30, 'flame', 7),
  ('level-5', 'Cendekia', 'Capai level akun 5.', 'level', 5, 'star', 8)
on conflict (code) do update
set title = excluded.title,
    description = excluded.description,
    metric = excluded.metric,
    target = excluded.target,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievement_definitions (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- Shop and inventory
-- ---------------------------------------------------------------------------
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  kind text not null check (kind in ('heart_potion', 'streak_freeze')),
  price_coins integer not null check (price_coins >= 0),
  max_stack integer not null default 1 check (max_stack between 1 and 20),
  icon text not null default 'bag',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.shop_items (
  slug, name, description, kind, price_coins, max_stack, icon, sort_order
) values
  (
    'heart-potion',
    'Ramuan Hati',
    'Memulihkan 3 Hearts. Tidak bisa dipakai saat Hearts penuh.',
    'heart_potion',
    80,
    5,
    'heart',
    1
  ),
  (
    'streak-freeze',
    'Perisai Streak',
    'Menyimpan satu hari yang terlewat agar Streak tidak putus. Maksimal dua perisai.',
    'streak_freeze',
    120,
    2,
    'shield',
    2
  )
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    kind = excluded.kind,
    price_coins = excluded.price_coins,
    max_stack = excluded.max_stack,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.user_inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.shop_items (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.shop_items (id) on delete restrict,
  price_coins integer not null check (price_coins >= 0),
  created_at timestamptz not null default now()
);

-- Generic idempotency key for rewards that are not tied to lesson/quest IDs.
alter table public.coin_transactions
  add column if not exists reference_id text;

create unique index if not exists coin_transactions_reference_idx
  on public.coin_transactions (user_id, source, reference_id)
  where reference_id is not null;

-- ---------------------------------------------------------------------------
-- Internal reward helpers
-- ---------------------------------------------------------------------------
create or replace function public.grant_level_rewards(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total integer;
  v_level integer;
  v_reward record;
begin
  if p_user is null then
    return;
  end if;

  select coalesce(sum(amount), 0)::integer into v_total
  from public.user_xp_ledger
  where user_id = p_user;

  v_level := coalesce((public.player_level_for_xp(v_total) ->> 'level')::integer, 1);

  for v_reward in
    select l.level, l.reward_coins
    from public.player_levels l
    where l.level <= v_level
      and l.reward_coins > 0
      and not exists (
        select 1 from public.user_level_rewards r
        where r.user_id = p_user and r.level = l.level
      )
    order by l.level
  loop
    insert into public.user_level_rewards (user_id, level, coins)
    values (p_user, v_reward.level, v_reward.reward_coins)
    on conflict (user_id, level) do nothing;

    if found then
      insert into public.user_wallets (user_id, coins)
      values (p_user, v_reward.reward_coins)
      on conflict (user_id) do update
      set coins = public.user_wallets.coins + excluded.coins,
          updated_at = now();

      insert into public.coin_transactions (user_id, amount, source, reference_id)
      values (p_user, v_reward.reward_coins, 'level_reward', 'level:' || v_reward.level)
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.grant_streak_milestones(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_longest integer;
  v_milestone record;
begin
  if p_user is null then
    return;
  end if;

  select longest_streak into v_longest
  from public.user_streaks
  where user_id = p_user;

  if coalesce(v_longest, 0) <= 0 then
    return;
  end if;

  for v_milestone in
    select m.days, m.reward_coins
    from public.streak_milestones m
    where m.days <= v_longest
      and not exists (
        select 1 from public.user_streak_milestones s
        where s.user_id = p_user and s.days = m.days
      )
    order by m.days
  loop
    insert into public.user_streak_milestones (user_id, days, coins)
    values (p_user, v_milestone.days, v_milestone.reward_coins)
    on conflict (user_id, days) do nothing;

    if found and v_milestone.reward_coins > 0 then
      insert into public.user_wallets (user_id, coins)
      values (p_user, v_milestone.reward_coins)
      on conflict (user_id) do update
      set coins = public.user_wallets.coins + excluded.coins,
          updated_at = now();

      insert into public.coin_transactions (user_id, amount, source, reference_id)
      values (
        p_user,
        v_milestone.reward_coins,
        'streak_milestone',
        'streak:' || v_milestone.days
      )
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.achievement_metric_value(
  p_user uuid,
  p_metric text
)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_value integer := 0;
  v_total integer;
begin
  if p_user is null then
    return 0;
  end if;

  if p_metric = 'xp' then
    select coalesce(sum(amount), 0)::integer into v_value
    from public.user_xp_ledger
    where user_id = p_user;
  elsif p_metric = 'lesson' then
    select count(*)::integer into v_value
    from public.user_xp_ledger
    where user_id = p_user and source = 'lesson';
  elsif p_metric = 'practice' then
    select count(*)::integer into v_value
    from public.user_xp_ledger
    where user_id = p_user and source = 'practice';
  elsif p_metric = 'streak' then
    select coalesce(longest_streak, 0)::integer into v_value
    from public.user_streaks
    where user_id = p_user;
  elsif p_metric = 'level' then
    select coalesce(sum(amount), 0)::integer into v_total
    from public.user_xp_ledger
    where user_id = p_user;
    v_value := coalesce((public.player_level_for_xp(v_total) ->> 'level')::integer, 1);
  end if;

  return coalesce(v_value, 0);
end;
$$;

create or replace function public.evaluate_achievements(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_definition record;
  v_value integer;
begin
  if p_user is null then
    return;
  end if;

  for v_definition in
    select id, metric, target
    from public.achievement_definitions
    where is_active
    order by sort_order
  loop
    v_value := public.achievement_metric_value(p_user, v_definition.metric);

    if v_value >= v_definition.target then
      insert into public.user_achievements (user_id, achievement_id)
      values (p_user, v_definition.id)
      on conflict (user_id, achievement_id) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.quest_period_start(
  p_cadence text,
  p_today date
)
returns date
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_cadence = 'weekly' then date_trunc('week', p_today::timestamp)::date
    else p_today
  end;
$$;

create or replace function public.quest_metric_value(
  p_user uuid,
  p_metric text,
  p_start date,
  p_end date,
  p_timezone text
)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_value integer := 0;
begin
  if p_user is null then
    return 0;
  end if;

  select case p_metric
    when 'xp' then coalesce(sum(amount), 0)::integer
    when 'lesson' then count(*) filter (where source = 'lesson')::integer
    when 'practice' then count(*) filter (where source = 'practice')::integer
    else 0
  end
  into v_value
  from public.user_xp_ledger
  where user_id = p_user
    and source in ('lesson', 'practice')
    and (created_at at time zone coalesce(nullif(p_timezone, ''), 'Asia/Jakarta'))::date >= p_start
    and (created_at at time zone coalesce(nullif(p_timezone, ''), 'Asia/Jakarta'))::date < p_end;

  return coalesce(v_value, 0);
end;
$$;

create or replace function public.sync_player_rewards()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.amount > 0 then
    perform public.grant_level_rewards(new.user_id);
    perform public.grant_streak_milestones(new.user_id);
    perform public.evaluate_achievements(new.user_id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Streak trigger with shield consumption
-- ---------------------------------------------------------------------------
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
  v_used_freeze boolean := false;
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
  elsif v_streak.last_activity_date = v_today - 2 and v_streak.freezes > 0 then
    v_next_streak := v_streak.current_streak + 1;
    v_used_freeze := true;
  else
    v_next_streak := 1;
  end if;

  update public.user_streaks
  set current_streak = v_next_streak,
      longest_streak = greatest(longest_streak, v_next_streak),
      freezes = case when v_used_freeze then freezes - 1 else freezes end,
      last_activity_date = v_today,
      last_activity_at = now(),
      updated_at = now()
  where user_id = new.user_id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Level/streak UI reads
-- ---------------------------------------------------------------------------
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
  v_level_rewards jsonb;
  v_milestones jsonb;
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'level', l.level,
    'title', l.title,
    'xpRequired', l.xp_required,
    'rewardCoins', l.reward_coins,
    'awardedAt', r.awarded_at
  ) order by l.level), '[]'::jsonb)
  into v_level_rewards
  from public.player_levels l
  left join public.user_level_rewards r
    on r.level = l.level and r.user_id = v_user;

  select coalesce(jsonb_agg(jsonb_build_object(
    'days', m.days,
    'title', m.title,
    'rewardCoins', m.reward_coins,
    'icon', m.icon,
    'awardedAt', s.awarded_at
  ) order by m.days), '[]'::jsonb)
  into v_milestones
  from public.streak_milestones m
  left join public.user_streak_milestones s
    on s.days = m.days and s.user_id = v_user;

  return v_state || jsonb_build_object(
    'transactions', coalesce(v_coins, '[]'::jsonb),
    'xpTransactions', coalesce(v_xp, '[]'::jsonb),
    'levelRewards', coalesce(v_level_rewards, '[]'::jsonb),
    'streakMilestones', coalesce(v_milestones, '[]'::jsonb)
  );
end;
$$;

-- Include ready-to-consume shields in the streak state.
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
    when v_streak.last_activity_date is null then 0
    when v_streak.last_activity_date >= v_today - 1 then v_streak.current_streak
    when v_streak.last_activity_date = v_today - 2 and v_streak.freezes > 0 then
      v_streak.current_streak
    else 0
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
      'freezes', v_streak.freezes,
      'lastActivityDate', v_streak.last_activity_date,
      'todayDate', v_today,
      'activityDays', coalesce(v_activity_days, '[]'::jsonb)
    ),
    'level', v_level
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Quest RPCs
-- ---------------------------------------------------------------------------
create or replace function public.get_my_quests()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_quests jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(timezone, ''), 'Asia/Jakarta') into v_tz
  from public.user_settings
  where user_id = v_user;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone 'Asia/Jakarta')::date;
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'code', d.code,
    'cadence', d.cadence,
    'metric', d.metric,
    'target', d.target,
    'rewardCoins', d.reward_coins,
    'title', d.title,
    'description', d.description,
    'icon', d.icon,
    'periodStart', p.period_start,
    'periodEnd', p.period_end,
    'progress', public.quest_metric_value(v_user, d.metric, p.period_start, p.period_end, v_tz),
    'claimedAt', c.claimed_at,
    'canClaim', c.claimed_at is null
      and public.quest_metric_value(v_user, d.metric, p.period_start, p.period_end, v_tz) >= d.target
  ) order by case d.cadence when 'daily' then 0 else 1 end, d.sort_order), '[]'::jsonb)
  into v_quests
  from public.quest_definitions d
  cross join lateral (
    select
      public.quest_period_start(d.cadence, v_today) as period_start,
      public.quest_period_start(d.cadence, v_today)
        + case when d.cadence = 'weekly' then 7 else 1 end as period_end
  ) p
  left join public.user_quest_claims c
    on c.quest_id = d.id
    and c.user_id = v_user
    and c.period_start = p.period_start
  where d.is_active;

  return jsonb_build_object(
    'today', v_today,
    'timezone', v_tz,
    'quests', coalesce(v_quests, '[]'::jsonb)
  );
end;
$$;

create or replace function public.claim_quest_reward(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_definition public.quest_definitions;
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_start date;
  v_end date;
  v_progress integer;
  v_claim_id uuid;
  v_claim public.user_quest_claims;
  v_coins integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_definition
  from public.quest_definitions
  where id = p_quest_id and is_active;

  if v_definition.id is null then
    raise exception 'quest_not_found' using errcode = 'P0002';
  end if;

  select coalesce(nullif(timezone, ''), 'Asia/Jakarta') into v_tz
  from public.user_settings
  where user_id = v_user;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone 'Asia/Jakarta')::date;
  end;

  v_start := public.quest_period_start(v_definition.cadence, v_today);
  v_end := v_start + case when v_definition.cadence = 'weekly' then 7 else 1 end;
  v_progress := public.quest_metric_value(v_user, v_definition.metric, v_start, v_end, v_tz);

  if v_progress < v_definition.target then
    raise exception 'quest_not_complete' using errcode = '22023';
  end if;

  insert into public.user_quest_claims (user_id, quest_id, period_start, coins)
  values (v_user, v_definition.id, v_start, v_definition.reward_coins)
  on conflict (user_id, quest_id, period_start) do nothing
  returning id into v_claim_id;

  select coins into v_coins
  from public.user_wallets
  where user_id = v_user;

  if v_claim_id is null then
    select * into v_claim
    from public.user_quest_claims
    where user_id = v_user
      and quest_id = v_definition.id
      and period_start = v_start;

    return jsonb_build_object(
      'alreadyClaimed', true,
      'questId', v_definition.id,
      'coinsAwarded', 0,
      'coinBalance', coalesce(v_coins, 0),
      'claimedAt', v_claim.claimed_at
    );
  end if;

  insert into public.user_wallets (user_id, coins)
  values (v_user, v_definition.reward_coins)
  on conflict (user_id) do update
  set coins = public.user_wallets.coins + excluded.coins,
      updated_at = now()
  returning coins into v_coins;

  insert into public.coin_transactions (user_id, amount, source, reference_id)
  values (v_user, v_definition.reward_coins, 'quest_reward', 'quest:' || v_claim_id)
  on conflict do nothing;

  return jsonb_build_object(
    'alreadyClaimed', false,
    'questId', v_definition.id,
    'coinsAwarded', v_definition.reward_coins,
    'coinBalance', coalesce(v_coins, 0),
    'claimedAt', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Achievement RPC
-- ---------------------------------------------------------------------------
create or replace function public.get_my_achievements()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_achievements jsonb;
  v_unlocked integer;
  v_total integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.evaluate_achievements(v_user);

  select count(*)::integer into v_total
  from public.achievement_definitions
  where is_active;

  select count(*)::integer into v_unlocked
  from public.user_achievements ua
  join public.achievement_definitions d on d.id = ua.achievement_id
  where ua.user_id = v_user and d.is_active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'code', d.code,
    'title', d.title,
    'description', d.description,
    'metric', d.metric,
    'target', d.target,
    'progress', least(d.target, public.achievement_metric_value(v_user, d.metric)),
    'icon', d.icon,
    'unlockedAt', ua.awarded_at
  ) order by d.sort_order), '[]'::jsonb)
  into v_achievements
  from public.achievement_definitions d
  left join public.user_achievements ua
    on ua.achievement_id = d.id and ua.user_id = v_user
  where d.is_active;

  return jsonb_build_object(
    'unlockedCount', v_unlocked,
    'total', v_total,
    'achievements', coalesce(v_achievements, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Shop and inventory RPCs
-- ---------------------------------------------------------------------------
create or replace function public.get_shop_catalog()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_coins integer;
  v_items jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(v_user);
  select coins into v_coins from public.user_wallets where user_id = v_user;
  v_coins := coalesce(v_coins, 0);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'slug', i.slug,
    'name', i.name,
    'description', i.description,
    'kind', i.kind,
    'priceCoins', i.price_coins,
    'maxStack', i.max_stack,
    'owned', coalesce(inv.quantity, 0),
    'canBuy', v_coins >= i.price_coins and coalesce(inv.quantity, 0) < i.max_stack,
    'icon', i.icon
  ) order by i.sort_order), '[]'::jsonb)
  into v_items
  from public.shop_items i
  left join public.user_inventory inv
    on inv.item_id = i.id and inv.user_id = v_user
  where i.is_active;

  return jsonb_build_object(
    'coins', v_coins,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

create or replace function public.purchase_shop_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_item public.shop_items;
  v_coins integer;
  v_owned integer;
  v_purchase_id uuid;
  v_quantity integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_item
  from public.shop_items
  where id = p_item_id and is_active;

  if v_item.id is null then
    raise exception 'shop_item_not_found' using errcode = 'P0002';
  end if;

  insert into public.user_wallets (user_id, coins)
  values (v_user, 0)
  on conflict (user_id) do nothing;

  select coins into v_coins
  from public.user_wallets
  where user_id = v_user
  for update;

  select quantity into v_owned
  from public.user_inventory
  where user_id = v_user and item_id = p_item_id
  for update;

  v_owned := coalesce(v_owned, 0);

  if v_owned >= v_item.max_stack then
    raise exception 'inventory_full' using errcode = '22023';
  end if;

  if coalesce(v_coins, 0) < v_item.price_coins then
    raise exception 'not_enough_coins' using errcode = '22023';
  end if;

  insert into public.shop_purchases (user_id, item_id, price_coins)
  values (v_user, p_item_id, v_item.price_coins)
  returning id into v_purchase_id;

  update public.user_wallets
  set coins = coins - v_item.price_coins,
      updated_at = now()
  where user_id = v_user
  returning coins into v_coins;

  insert into public.coin_transactions (user_id, amount, source, reference_id)
  values (
    v_user,
    -v_item.price_coins,
    'shop_purchase',
    'shop:' || v_purchase_id
  )
  on conflict do nothing;

  insert into public.user_inventory (user_id, item_id, quantity)
  values (v_user, p_item_id, 1)
  on conflict (user_id, item_id) do update
  set quantity = public.user_inventory.quantity + 1,
      updated_at = now()
  returning quantity into v_quantity;

  return jsonb_build_object(
    'itemId', p_item_id,
    'slug', v_item.slug,
    'quantity', v_quantity,
    'priceCoins', v_item.price_coins,
    'coinBalance', v_coins
  );
end;
$$;

create or replace function public.get_my_inventory()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_coins integer;
  v_freezes integer;
  v_items jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(v_user);

  select coins into v_coins from public.user_wallets where user_id = v_user;
  select freezes into v_freezes from public.user_streaks where user_id = v_user;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'slug', i.slug,
    'name', i.name,
    'description', i.description,
    'kind', i.kind,
    'quantity', inv.quantity,
    'maxStack', i.max_stack,
    'icon', i.icon
  ) order by i.sort_order), '[]'::jsonb)
  into v_items
  from public.user_inventory inv
  join public.shop_items i on i.id = inv.item_id
  where inv.user_id = v_user and inv.quantity > 0;

  return jsonb_build_object(
    'coins', coalesce(v_coins, 0),
    'streakFreezes', coalesce(v_freezes, 0),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

create or replace function public.use_inventory_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_item public.shop_items;
  v_quantity integer;
  v_hearts public.user_hearts;
  v_streak public.user_streaks;
  v_restored integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_item from public.shop_items where id = p_item_id;

  select quantity into v_quantity
  from public.user_inventory
  where user_id = v_user and item_id = p_item_id
  for update;

  if v_item.id is null or coalesce(v_quantity, 0) <= 0 then
    raise exception 'inventory_item_not_owned' using errcode = '22023';
  end if;

  if v_item.kind = 'heart_potion' then
    perform public.refresh_hearts(v_user);

    select * into v_hearts
    from public.user_hearts
    where user_id = v_user
    for update;

    if v_hearts.current_hearts >= v_hearts.max_hearts then
      raise exception 'hearts_full' using errcode = '22023';
    end if;

    v_restored := least(3, v_hearts.max_hearts - v_hearts.current_hearts);

    update public.user_hearts
    set current_hearts = current_hearts + v_restored,
        updated_at = now()
    where user_id = v_user;

    update public.user_inventory
    set quantity = quantity - 1,
        updated_at = now()
    where user_id = v_user and item_id = p_item_id
    returning quantity into v_quantity;

    return jsonb_build_object(
      'kind', v_item.kind,
      'effect', 'hearts',
      'restored', v_restored,
      'quantity', v_quantity,
      'hearts', jsonb_build_object(
        'current', v_hearts.current_hearts + v_restored,
        'max', v_hearts.max_hearts
      )
    );
  end if;

  if v_item.kind = 'streak_freeze' then
    perform public.ensure_player_progress(v_user);

    select * into v_streak
    from public.user_streaks
    where user_id = v_user
    for update;

    if v_streak.freezes >= 2 then
      raise exception 'freeze_limit' using errcode = '22023';
    end if;

    update public.user_streaks
    set freezes = freezes + 1,
        updated_at = now()
    where user_id = v_user
    returning freezes into v_streak.freezes;

    update public.user_inventory
    set quantity = quantity - 1,
        updated_at = now()
    where user_id = v_user and item_id = p_item_id
    returning quantity into v_quantity;

    return jsonb_build_object(
      'kind', v_item.kind,
      'effect', 'freeze',
      'quantity', v_quantity,
      'freezes', v_streak.freezes
    );
  end if;

  raise exception 'inventory_item_unsupported' using errcode = '22023';
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers and backfill
-- ---------------------------------------------------------------------------
drop trigger if exists zz_user_xp_ledger_rewards on public.user_xp_ledger;
create trigger zz_user_xp_ledger_rewards
  after insert on public.user_xp_ledger
  for each row execute function public.sync_player_rewards();

do $$
declare
  v_user uuid;
begin
  for v_user in select id from auth.users loop
    perform public.grant_level_rewards(v_user);
    perform public.grant_streak_milestones(v_user);
    perform public.evaluate_achievements(v_user);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
alter table public.user_level_rewards enable row level security;
alter table public.user_streak_milestones enable row level security;
alter table public.quest_definitions enable row level security;
alter table public.user_quest_claims enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.shop_items enable row level security;
alter table public.user_inventory enable row level security;
alter table public.shop_purchases enable row level security;

drop policy if exists user_level_rewards_select_own on public.user_level_rewards;
create policy user_level_rewards_select_own
  on public.user_level_rewards for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_streak_milestones_select_own on public.user_streak_milestones;
create policy user_streak_milestones_select_own
  on public.user_streak_milestones for select to authenticated
  using (user_id = auth.uid());

drop policy if exists quest_definitions_select_authenticated on public.quest_definitions;
create policy quest_definitions_select_authenticated
  on public.quest_definitions for select to authenticated
  using (true);

drop policy if exists user_quest_claims_select_own on public.user_quest_claims;
create policy user_quest_claims_select_own
  on public.user_quest_claims for select to authenticated
  using (user_id = auth.uid());

drop policy if exists achievement_definitions_select_authenticated on public.achievement_definitions;
create policy achievement_definitions_select_authenticated
  on public.achievement_definitions for select to authenticated
  using (true);

drop policy if exists user_achievements_select_own on public.user_achievements;
create policy user_achievements_select_own
  on public.user_achievements for select to authenticated
  using (user_id = auth.uid());

drop policy if exists shop_items_select_authenticated on public.shop_items;
create policy shop_items_select_authenticated
  on public.shop_items for select to authenticated
  using (true);

drop policy if exists user_inventory_select_own on public.user_inventory;
create policy user_inventory_select_own
  on public.user_inventory for select to authenticated
  using (user_id = auth.uid());

drop policy if exists shop_purchases_select_own on public.shop_purchases;
create policy shop_purchases_select_own
  on public.shop_purchases for select to authenticated
  using (user_id = auth.uid());

revoke all on public.user_level_rewards from anon, authenticated;
revoke all on public.user_streak_milestones from anon, authenticated;
revoke all on public.quest_definitions from anon, authenticated;
revoke all on public.user_quest_claims from anon, authenticated;
revoke all on public.achievement_definitions from anon, authenticated;
revoke all on public.user_achievements from anon, authenticated;
revoke all on public.shop_items from anon, authenticated;
revoke all on public.user_inventory from anon, authenticated;
revoke all on public.shop_purchases from anon, authenticated;

grant select on public.user_level_rewards to authenticated;
grant select on public.user_streak_milestones to authenticated;
grant select on public.quest_definitions to authenticated;
grant select on public.user_quest_claims to authenticated;
grant select on public.achievement_definitions to authenticated;
grant select on public.user_achievements to authenticated;
grant select on public.shop_items to authenticated;
grant select on public.user_inventory to authenticated;
grant select on public.shop_purchases to authenticated;

revoke all on function public.grant_level_rewards(uuid) from public, anon, authenticated;
revoke all on function public.grant_streak_milestones(uuid) from public, anon, authenticated;
revoke all on function public.achievement_metric_value(uuid, text) from public, anon, authenticated;
revoke all on function public.evaluate_achievements(uuid) from public, anon, authenticated;
revoke all on function public.quest_period_start(text, date) from public, anon, authenticated;
revoke all on function public.quest_metric_value(uuid, text, date, date, text) from public, anon, authenticated;
revoke all on function public.sync_player_rewards() from public, anon, authenticated;
revoke all on function public.get_my_quests() from public, anon;
revoke all on function public.claim_quest_reward(uuid) from public, anon;
revoke all on function public.get_my_achievements() from public, anon;
revoke all on function public.get_shop_catalog() from public, anon;
revoke all on function public.purchase_shop_item(uuid) from public, anon;
revoke all on function public.get_my_inventory() from public, anon;
revoke all on function public.use_inventory_item(uuid) from public, anon;

grant execute on function public.get_my_quests() to authenticated;
grant execute on function public.claim_quest_reward(uuid) to authenticated;
grant execute on function public.get_my_achievements() to authenticated;
grant execute on function public.get_shop_catalog() to authenticated;
grant execute on function public.purchase_shop_item(uuid) to authenticated;
grant execute on function public.get_my_inventory() to authenticated;
grant execute on function public.use_inventory_item(uuid) to authenticated;
