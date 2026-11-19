-- Lentera · Admin-configurable Heart regeneration
-- The regeneration duration is stored once and read by every server-side
-- Hearts calculation. Existing Hearts rows and their timestamps are untouched
-- when the setting changes, so an in-progress refill keeps its anchor.

create table if not exists public.heart_settings (
  id smallint primary key default 1 check (id = 1),
  regen_minutes integer not null default 30
    check (regen_minutes between 1 and 1440),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.heart_settings enable row level security;
revoke all on table public.heart_settings from public, anon, authenticated;

insert into public.heart_settings (id, regen_minutes)
values (1, 30)
on conflict (id) do nothing;

-- Internal read helper. The singleton row is guaranteed by the migration.
create or replace function public.heart_regen_minutes()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select regen_minutes from public.heart_settings where id = 1;
$$;

revoke all on function public.heart_regen_minutes() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Regeneration reads the current database setting on every call.
-- The row lock serializes concurrent tabs/requests, so only the first request
-- can consume a refill window.
-- ---------------------------------------------------------------------------
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
  v_regen integer;
begin
  if p_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  perform public.ensure_player_progress(p_user);

  select * into v_hearts
  from public.user_hearts
  where user_id = p_user
  for update;

  v_regen := public.heart_regen_minutes();

  if v_hearts.current_hearts < v_hearts.max_hearts then
    v_gained := floor(
      greatest(0, extract(epoch from (now() - v_hearts.last_refill_at))) / (v_regen * 60)
    )::integer;

    if v_gained > 0 then
      update public.user_hearts
      set current_hearts = least(max_hearts, current_hearts + v_gained),
          last_refill_at = case
            when least(max_hearts, current_hearts + v_gained) >= max_hearts then now()
            else last_refill_at + make_interval(mins => v_gained * v_regen)
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
      extract(epoch from (v_hearts.last_refill_at + make_interval(mins => v_regen) - now()))
    )::integer)
  end;

  return jsonb_build_object(
    'current', v_hearts.current_hearts,
    'max', v_hearts.max_hearts,
    'nextRefillSeconds', v_next,
    'regenMinutes', v_regen,
    'refillCostCoins', (v_hearts.max_hearts - v_hearts.current_hearts) * 10
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- The player state exposes the same configured duration and countdown.
-- ---------------------------------------------------------------------------
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
  v_regen integer;
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

  v_regen := public.heart_regen_minutes();

  v_next_refill := case
    when v_hearts.current_hearts >= v_hearts.max_hearts then 0
    else greatest(0, ceil(
      extract(epoch from (v_hearts.last_refill_at + make_interval(mins => v_regen) - now()))
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
      'regenMinutes', v_regen,
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
-- Admin catalog read now reports the live Heart configuration.
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_gamification()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('gamification.manage');

  return jsonb_build_object(
    'quests', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'code', q.code, 'cadence', q.cadence, 'metric', q.metric,
        'target', q.target, 'rewardCoins', q.reward_coins, 'title', q.title,
        'description', q.description, 'icon', q.icon, 'sortOrder', q.sort_order,
        'isActive', q.is_active,
        'claims', (select count(*)::integer from public.user_quest_claims c where c.quest_id = q.id)
      ) order by q.cadence, q.sort_order, q.title), '[]'::jsonb)
      from public.quest_definitions q
    ),
    'achievements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'code', a.code, 'title', a.title, 'description', a.description,
        'metric', a.metric, 'target', a.target, 'icon', a.icon,
        'sortOrder', a.sort_order, 'isActive', a.is_active,
        'unlocked', (select count(*)::integer from public.user_achievements ua where ua.achievement_id = a.id)
      ) order by a.sort_order, a.title), '[]'::jsonb)
      from public.achievement_definitions a
    ),
    'shopItems', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'slug', s.slug, 'name', s.name, 'description', s.description,
        'kind', s.kind, 'priceCoins', s.price_coins, 'maxStack', s.max_stack,
        'icon', s.icon, 'sortOrder', s.sort_order, 'isActive', s.is_active,
        'rarity', s.rarity, 'imageUrl', s.image_url, 'imagePath', s.image_path,
        'purchases', (select count(*)::integer from public.shop_purchases p where p.item_id = s.id)
      ) order by s.sort_order, s.name), '[]'::jsonb)
      from public.shop_items s
    ),
    'playerLevels', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'level', l.level, 'title', l.title, 'xpRequired', l.xp_required,
        'rewardCoins', l.reward_coins
      ) order by l.level), '[]'::jsonb)
      from public.player_levels l
    ),
    'streakMilestones', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'days', m.days, 'title', m.title, 'rewardCoins', m.reward_coins,
        'icon', m.icon, 'sortOrder', m.sort_order
      ) order by m.days), '[]'::jsonb)
      from public.streak_milestones m
    ),
    'leagueTiers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'tier', t.tier, 'name', t.name, 'accent', t.accent, 'sortOrder', t.sort_order
      ) order by t.tier), '[]'::jsonb)
      from public.league_tiers t
    ),
    'events', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'weekStart', e.week_start, 'title', e.title,
        'description', e.description, 'targetXp', e.target_xp,
        'rewardCoins', e.reward_coins, 'rewardXp', e.reward_xp,
        'startsAt', e.starts_at, 'endsAt', e.ends_at, 'isActive', e.is_active,
        'claims', (select count(*)::integer from public.user_event_claims c where c.event_id = e.id)
      ) order by e.week_start desc), '[]'::jsonb)
      from public.game_events e
    ),
    'heartSettings', (
      select jsonb_build_object(
        'maxHearts', coalesce(max(h.max_hearts), 5),
        'regenerationMinutes', public.heart_regen_minutes(),
        'heartsRestoredPerTick', 1,
        'refillCostCoins', 10,
        'wrongAnswerCost', 1,
        'editable', true,
        'updatedAt', (select s.updated_at from public.heart_settings s where s.id = 1),
        'status', 'active',
        'note', 'Pemulihan otomatis aktif. Perubahan durasi langsung dipakai server tanpa mengubah Hearts atau timestamp yang sedang berjalan.'
      )
      from public.user_hearts h
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Save the single regeneration duration. A missing duration or a value
-- outside 1–1440 minutes is rejected before any row is touched.
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_heart_settings(p_regen_minutes integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_reason text;
begin
  perform public.admin_require_permission('gamification.manage');

  if p_regen_minutes is null or p_regen_minutes < 1 or p_regen_minutes > 1440 then
    raise exception 'regen_minutes_invalid' using errcode = '22023';
  end if;

  select to_jsonb(s) into v_before
  from public.heart_settings s
  where s.id = 1;

  insert into public.heart_settings (id, regen_minutes, updated_at, updated_by)
  values (1, p_regen_minutes, now(), auth.uid())
  on conflict (id) do update
  set regen_minutes = excluded.regen_minutes,
      updated_at = now(),
      updated_by = excluded.updated_by;

  select to_jsonb(s) into v_after
  from public.heart_settings s
  where s.id = 1;

  v_reason := format('Ubah waktu pemulihan Hearts menjadi %s menit', p_regen_minutes);
  perform public.admin_audit(
    'heart_settings_update', 'heart_settings', 'singleton', v_reason,
    coalesce(v_before, '{}'::jsonb), v_after
  );

  return jsonb_build_object(
    'maxHearts', (select coalesce(max(max_hearts), 5) from public.user_hearts),
    'regenerationMinutes', p_regen_minutes,
    'editable', true,
    'updatedAt', v_after->>'updated_at',
    'status', 'active'
  );
end;
$$;

revoke all on function public.admin_get_gamification() from public, anon;
revoke all on function public.admin_save_heart_settings(integer) from public, anon;
grant execute on function public.admin_get_gamification() to authenticated;
grant execute on function public.admin_save_heart_settings(integer) to authenticated;
