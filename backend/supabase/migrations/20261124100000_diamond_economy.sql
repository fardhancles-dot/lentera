-- Lentera · Diamond economy
-- Diamonds are earned from selected quests and can be exchanged for Coins.
-- Every balance change is written by a security-definer RPC, so the browser
-- only sends a rate key and never an amount that is trusted blindly.

-- ---------------------------------------------------------------------------
-- Balances and ledger
-- ---------------------------------------------------------------------------
alter table public.user_wallets
  add column if not exists diamonds integer not null default 0
  check (diamonds >= 0);

create table if not exists public.diamond_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount <> 0),
  source text not null default 'other',
  reference_id text,
  created_at timestamptz not null default now()
);

create index if not exists diamond_transactions_user_idx
  on public.diamond_transactions (user_id, created_at desc);

-- Mirrors the Coin ledger guard: one reference can only ever be paid once.
create unique index if not exists diamond_transactions_reference_idx
  on public.diamond_transactions (user_id, source, reference_id)
  where reference_id is not null;

-- ---------------------------------------------------------------------------
-- Exchange rates (admin editable)
-- ---------------------------------------------------------------------------
create table if not exists public.diamond_exchange_rates (
  diamonds integer primary key check (diamonds > 0),
  coins integer not null check (coins > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.diamond_exchange_rates (diamonds, coins, is_active, sort_order) values
  (10, 100, true, 1),
  (25, 250, true, 2),
  (50, 500, true, 3),
  (100, 1000, true, 4)
on conflict (diamonds) do nothing;

alter table public.diamond_exchange_rates enable row level security;
revoke all on table public.diamond_exchange_rates from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Quest Diamond rewards
-- ---------------------------------------------------------------------------
alter table public.quest_definitions
  add column if not exists reward_diamonds integer not null default 0
  check (reward_diamonds >= 0);

alter table public.user_quest_claims
  add column if not exists diamonds integer not null default 0
  check (diamonds >= 0);

-- Only a subset of quests pay Diamonds; the existing Coin rewards stay intact.
update public.quest_definitions
set reward_diamonds = case code
  when 'daily-lesson-1' then 2
  when 'daily-practice-1' then 2
  when 'weekly-xp-300' then 5
  when 'weekly-lesson-3' then 5
  when 'weekly-practice-3' then 5
  else reward_diamonds
end
where code in (
  'daily-lesson-1', 'daily-practice-1', 'weekly-xp-300',
  'weekly-lesson-3', 'weekly-practice-3'
);

-- ---------------------------------------------------------------------------
-- Player reads
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
  v_diamonds integer;
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

  select coalesce(coins, 0)::integer, coalesce(diamonds, 0)::integer
  into v_coins, v_diamonds
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
    'diamonds', coalesce(v_diamonds, 0),
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
  v_diamonds jsonb;
  v_xp jsonb;
  v_level_rewards jsonb;
  v_milestones jsonb;
  v_rates jsonb;
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
  into v_diamonds
  from (
    select id, amount, source, created_at
    from public.diamond_transactions
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'diamonds', r.diamonds,
    'coins', r.coins,
    'isActive', r.is_active,
    'sortOrder', r.sort_order
  ) order by r.sort_order, r.diamonds), '[]'::jsonb)
  into v_rates
  from public.diamond_exchange_rates r
  where r.is_active;

  return v_state || jsonb_build_object(
    'transactions', coalesce(v_coins, '[]'::jsonb),
    'diamondTransactions', coalesce(v_diamonds, '[]'::jsonb),
    'exchangeRates', coalesce(v_rates, '[]'::jsonb),
    'xpTransactions', coalesce(v_xp, '[]'::jsonb),
    'levelRewards', coalesce(v_level_rewards, '[]'::jsonb),
    'streakMilestones', coalesce(v_milestones, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Exchange Diamonds for Coins atomically
-- ---------------------------------------------------------------------------
create or replace function public.exchange_diamonds_to_coins(p_diamonds integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_rate public.diamond_exchange_rates;
  v_wallet public.user_wallets;
  v_reference text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_diamonds is null or p_diamonds < 1 then
    raise exception 'exchange_amount_invalid' using errcode = '22023';
  end if;

  select * into v_rate
  from public.diamond_exchange_rates
  where diamonds = p_diamonds and is_active;

  if v_rate.diamonds is null then
    raise exception 'exchange_rate_not_found' using errcode = 'P0002';
  end if;

  insert into public.user_wallets (user_id, coins, diamonds)
  values (v_user, 0, 0)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.user_wallets
  where user_id = v_user
  for update;

  if v_wallet.diamonds < p_diamonds then
    raise exception 'not_enough_diamonds' using errcode = '22023';
  end if;

  v_reference := 'exchange:' || gen_random_uuid();

  update public.user_wallets
  set diamonds = diamonds - p_diamonds,
      coins = coins + v_rate.coins,
      updated_at = now()
  where user_id = v_user
  returning * into v_wallet;

  insert into public.diamond_transactions (user_id, amount, source, reference_id)
  values (v_user, -p_diamonds, 'diamond_exchange', v_reference);

  insert into public.coin_transactions (user_id, amount, source, reference_id)
  values (v_user, v_rate.coins, 'diamond_exchange', v_reference)
  on conflict do nothing;

  return jsonb_build_object(
    'diamondsSpent', p_diamonds,
    'coinsAwarded', v_rate.coins,
    'diamondBalance', v_wallet.diamonds,
    'coinBalance', v_wallet.coins,
    'referenceId', v_reference
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Quest board includes Diamond rewards
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
    'rewardDiamonds', d.reward_diamonds,
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
  v_diamonds integer;
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

  insert into public.user_quest_claims (
    user_id, quest_id, period_start, coins, diamonds
  )
  values (
    v_user, v_definition.id, v_start, v_definition.reward_coins, v_definition.reward_diamonds
  )
  on conflict (user_id, quest_id, period_start) do nothing
  returning id into v_claim_id;

  select coalesce(coins, 0), coalesce(diamonds, 0)
  into v_coins, v_diamonds
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
      'diamondsAwarded', 0,
      'coinBalance', coalesce(v_coins, 0),
      'diamondBalance', coalesce(v_diamonds, 0),
      'claimedAt', v_claim.claimed_at
    );
  end if;

  insert into public.user_wallets (user_id, coins, diamonds)
  values (v_user, v_definition.reward_coins, v_definition.reward_diamonds)
  on conflict (user_id) do update
  set coins = public.user_wallets.coins + excluded.coins,
      diamonds = public.user_wallets.diamonds + excluded.diamonds,
      updated_at = now()
  returning coins, diamonds into v_coins, v_diamonds;

  insert into public.coin_transactions (user_id, amount, source, reference_id)
  values (v_user, v_definition.reward_coins, 'quest_reward', 'quest:' || v_claim_id)
  on conflict do nothing;

  if v_definition.reward_diamonds > 0 then
    insert into public.diamond_transactions (user_id, amount, source, reference_id)
    values (v_user, v_definition.reward_diamonds, 'quest_reward', 'quest:' || v_claim_id)
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'alreadyClaimed', false,
    'questId', v_definition.id,
    'coinsAwarded', v_definition.reward_coins,
    'diamondsAwarded', v_definition.reward_diamonds,
    'coinBalance', coalesce(v_coins, 0),
    'diamondBalance', coalesce(v_diamonds, 0),
    'claimedAt', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin reads
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
        'target', q.target, 'rewardCoins', q.reward_coins,
        'rewardDiamonds', q.reward_diamonds, 'title', q.title,
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
    'exchangeRates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'diamonds', r.diamonds, 'coins', r.coins,
        'isActive', r.is_active, 'sortOrder', r.sort_order
      ) order by r.sort_order, r.diamonds), '[]'::jsonb)
      from public.diamond_exchange_rates r
    ),
    'diamondStats', jsonb_build_object(
      'diamondsCirculating', (select coalesce(sum(diamonds), 0)::bigint from public.user_wallets),
      'coinsCirculating', (select coalesce(sum(coins), 0)::bigint from public.user_wallets),
      'diamondsEarned', (
        select coalesce(sum(amount), 0)::bigint
        from public.diamond_transactions where amount > 0
      ),
      'diamondsSpent', (
        select coalesce(abs(sum(amount)), 0)::bigint
        from public.diamond_transactions where amount < 0
      ),
      'transactionCount', (select count(*)::bigint from public.diamond_transactions)
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

create or replace function public.admin_get_diamond_overview(p_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit integer := least(200, greatest(1, coalesce(p_limit, 50)));
  v_transactions jsonb;
begin
  perform public.admin_require_permission('gamification.manage');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'userId', t.user_id,
    'username', p.username,
    'displayName', p.display_name,
    'amount', t.amount,
    'source', t.source,
    'createdAt', t.created_at
  ) order by t.created_at desc), '[]'::jsonb)
  into v_transactions
  from (
    select id, user_id, amount, source, created_at
    from public.diamond_transactions
    order by created_at desc
    limit v_limit
  ) t
  left join public.profiles p on p.id = t.user_id;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'diamondsCirculating', (select coalesce(sum(diamonds), 0)::bigint from public.user_wallets),
      'coinsCirculating', (select coalesce(sum(coins), 0)::bigint from public.user_wallets),
      'diamondsEarned', (
        select coalesce(sum(amount), 0)::bigint
        from public.diamond_transactions where amount > 0
      ),
      'diamondsSpent', (
        select coalesce(abs(sum(amount)), 0)::bigint
        from public.diamond_transactions where amount < 0
      ),
      'transactionCount', (select count(*)::bigint from public.diamond_transactions)
    ),
    'exchangeRates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'diamonds', r.diamonds, 'coins', r.coins,
        'isActive', r.is_active, 'sortOrder', r.sort_order
      ) order by r.sort_order, r.diamonds), '[]'::jsonb)
      from public.diamond_exchange_rates r
    ),
    'transactions', coalesce(v_transactions, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin writes
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_quest_diamonds(
  p_quest_id uuid,
  p_reward_diamonds integer,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('gamification.manage');

  if p_reward_diamonds is null or p_reward_diamonds < 0 or p_reward_diamonds > 10000 then
    raise exception 'diamond_reward_invalid' using errcode = '22023';
  end if;

  if v_reason = '' then
    v_reason := format('Ubah hadiah Diamond misi menjadi %s', p_reward_diamonds);
  end if;

  select to_jsonb(q) into v_before
  from public.quest_definitions q
  where q.id = p_quest_id;

  if v_before is null then
    raise exception 'quest_not_found' using errcode = 'P0002';
  end if;

  update public.quest_definitions
  set reward_diamonds = p_reward_diamonds
  where id = p_quest_id;

  select to_jsonb(q) into v_after
  from public.quest_definitions q
  where q.id = p_quest_id;

  perform public.admin_audit(
    'quest_diamond_reward_update', 'quest_definitions', p_quest_id::text,
    v_reason, v_before, v_after
  );

  return jsonb_build_object(
    'id', p_quest_id,
    'rewardDiamonds', p_reward_diamonds
  );
end;
$$;

create or replace function public.admin_save_diamond_exchange_rate(
  p_diamonds integer,
  p_coins integer,
  p_is_active boolean default true,
  p_sort_order integer default 0,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('gamification.manage');

  if p_diamonds is null or p_diamonds < 1 or p_diamonds > 1000000 then
    raise exception 'exchange_diamonds_invalid' using errcode = '22023';
  end if;

  if p_coins is null or p_coins < 1 or p_coins > 100000000 then
    raise exception 'exchange_coins_invalid' using errcode = '22023';
  end if;

  if v_reason = '' then
    v_reason := format('Atur nilai tukar %s Diamond menjadi %s Koin', p_diamonds, p_coins);
  end if;

  select to_jsonb(r) into v_before
  from public.diamond_exchange_rates r
  where r.diamonds = p_diamonds;

  insert into public.diamond_exchange_rates (diamonds, coins, is_active, sort_order)
  values (p_diamonds, p_coins, coalesce(p_is_active, true), coalesce(p_sort_order, 0))
  on conflict (diamonds) do update
  set coins = excluded.coins,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order,
      updated_at = now();

  select to_jsonb(r) into v_after
  from public.diamond_exchange_rates r
  where r.diamonds = p_diamonds;

  perform public.admin_audit(
    'diamond_exchange_rate_update', 'diamond_exchange_rates', p_diamonds::text,
    v_reason, coalesce(v_before, '{}'::jsonb), v_after
  );

  return v_after;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and privileges
-- ---------------------------------------------------------------------------
alter table public.diamond_transactions enable row level security;

drop policy if exists "diamond_transactions_select_own" on public.diamond_transactions;
create policy "diamond_transactions_select_own"
  on public.diamond_transactions for select to authenticated
  using (user_id = auth.uid());

revoke all on public.diamond_transactions from anon, authenticated;
grant select on public.diamond_transactions to authenticated;

revoke all on function public.get_player_state() from public, anon;
revoke all on function public.get_my_wallet() from public, anon;
revoke all on function public.exchange_diamonds_to_coins(integer) from public, anon;
revoke all on function public.get_my_quests() from public, anon;
revoke all on function public.claim_quest_reward(uuid) from public, anon;
revoke all on function public.admin_get_gamification() from public, anon;
revoke all on function public.admin_get_diamond_overview(integer) from public, anon;
revoke all on function public.admin_save_quest_diamonds(uuid, integer, text) from public, anon;
revoke all on function public.admin_save_diamond_exchange_rate(integer, integer, boolean, integer, text)
  from public, anon;

grant execute on function public.get_player_state() to authenticated;
grant execute on function public.get_my_wallet() to authenticated;
grant execute on function public.exchange_diamonds_to_coins(integer) to authenticated;
grant execute on function public.get_my_quests() to authenticated;
grant execute on function public.claim_quest_reward(uuid) to authenticated;
grant execute on function public.admin_get_gamification() to authenticated;
grant execute on function public.admin_get_diamond_overview(integer) to authenticated;
grant execute on function public.admin_save_quest_diamonds(uuid, integer, text) to authenticated;
grant execute on function public.admin_save_diamond_exchange_rate(integer, integer, boolean, integer, text)
  to authenticated;
