-- Lentera · Admin CMS gamification and social operations
-- Catalogs are edited in place, so gameplay reads the new values immediately.
-- Historical ledgers and purchases are never rewritten.

-- ---------------------------------------------------------------------------
-- Read the editable game catalogs plus read-only heart constants
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
    'heartSettings', jsonb_build_object(
      'maxHearts', 5,
      'regenerationMinutes', 30,
      'heartsRestoredPerTick', 1,
      'refillCostCoins', 10,
      'wrongAnswerCost', 1,
      'editable', false,
      'note', 'Nilai Heart masih merupakan konstanta server. Dashboard hanya membaca nilai aktual agar tidak menampilkan pengaturan palsu.'
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Save one catalog row
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_game_catalog(
  p_kind text,
  p_payload jsonb,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_kind text := lower(btrim(coalesce(p_kind, '')));
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_after jsonb;
  v_prev_xp integer;
  v_next_xp integer;
  v_week date;
begin
  perform public.admin_require_permission('gamification.manage');

  if v_kind = 'quest' then
    if btrim(coalesce(p_payload->>'code', '')) !~ '^[a-z0-9][a-z0-9-]{2,60}$' then
      raise exception 'code_invalid' using errcode = '22023';
    end if;
    if coalesce(p_payload->>'cadence', '') not in ('daily', 'weekly') then
      raise exception 'cadence_invalid' using errcode = '22023';
    end if;
    if coalesce(p_payload->>'metric', '') not in ('xp', 'lesson', 'practice') then
      raise exception 'metric_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'target')::integer, 0) < 1
      or coalesce((p_payload->>'target')::integer, 0) > 100000 then
      raise exception 'target_invalid' using errcode = '22023';
    end if;
    if v_id is not null then
      select to_jsonb(q) into v_before from public.quest_definitions q where q.id = v_id;
      update public.quest_definitions set
        code = lower(btrim(p_payload->>'code')),
        cadence = p_payload->>'cadence',
        metric = p_payload->>'metric',
        target = (p_payload->>'target')::integer,
        reward_coins = greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
        title = btrim(p_payload->>'title'),
        description = coalesce(p_payload->>'description', ''),
        icon = coalesce(nullif(btrim(p_payload->>'icon'), ''), 'target'),
        sort_order = coalesce((p_payload->>'sortOrder')::integer, 0),
        is_active = coalesce((p_payload->>'isActive')::boolean, true)
      where id = v_id;
    else
      insert into public.quest_definitions (
        code, cadence, metric, target, reward_coins, title, description, icon,
        sort_order, is_active
      ) values (
        lower(btrim(p_payload->>'code')), p_payload->>'cadence', p_payload->>'metric',
        (p_payload->>'target')::integer,
        greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
        btrim(p_payload->>'title'), coalesce(p_payload->>'description', ''),
        coalesce(nullif(btrim(p_payload->>'icon'), ''), 'target'),
        coalesce((p_payload->>'sortOrder')::integer, 0),
        coalesce((p_payload->>'isActive')::boolean, true)
      ) returning id into v_id;
    end if;
    select to_jsonb(q) into v_after from public.quest_definitions q where q.id = v_id;

  elsif v_kind = 'achievement' then
    if btrim(coalesce(p_payload->>'code', '')) !~ '^[a-z0-9][a-z0-9-]{2,60}$' then
      raise exception 'code_invalid' using errcode = '22023';
    end if;
    if coalesce(p_payload->>'metric', '') not in ('xp', 'lesson', 'practice', 'streak', 'level') then
      raise exception 'metric_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'target')::integer, 0) < 1
      or coalesce((p_payload->>'target')::integer, 0) > 1000000 then
      raise exception 'target_invalid' using errcode = '22023';
    end if;
    if v_id is not null then
      select to_jsonb(a) into v_before from public.achievement_definitions a where a.id = v_id;
      update public.achievement_definitions set
        code = lower(btrim(p_payload->>'code')),
        title = btrim(p_payload->>'title'),
        description = coalesce(p_payload->>'description', ''),
        metric = p_payload->>'metric',
        target = (p_payload->>'target')::integer,
        icon = coalesce(nullif(btrim(p_payload->>'icon'), ''), 'trophy'),
        sort_order = coalesce((p_payload->>'sortOrder')::integer, 0),
        is_active = coalesce((p_payload->>'isActive')::boolean, true)
      where id = v_id;
    else
      insert into public.achievement_definitions (
        code, title, description, metric, target, icon, sort_order, is_active
      ) values (
        lower(btrim(p_payload->>'code')), btrim(p_payload->>'title'),
        coalesce(p_payload->>'description', ''), p_payload->>'metric',
        (p_payload->>'target')::integer,
        coalesce(nullif(btrim(p_payload->>'icon'), ''), 'trophy'),
        coalesce((p_payload->>'sortOrder')::integer, 0),
        coalesce((p_payload->>'isActive')::boolean, true)
      ) returning id into v_id;
    end if;
    select to_jsonb(a) into v_after from public.achievement_definitions a where a.id = v_id;

  elsif v_kind = 'shop_item' then
    if btrim(coalesce(p_payload->>'slug', '')) !~ '^[a-z0-9][a-z0-9-]{1,60}$' then
      raise exception 'slug_invalid' using errcode = '22023';
    end if;
    if coalesce(p_payload->>'kind', '') not in ('heart_potion', 'streak_freeze') then
      raise exception 'item_kind_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'priceCoins')::integer, -1) < 0 then
      raise exception 'price_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'maxStack')::integer, 1) < 1
      or coalesce((p_payload->>'maxStack')::integer, 1) > 20 then
      raise exception 'max_stack_invalid' using errcode = '22023';
    end if;
    if v_id is not null then
      select to_jsonb(s) into v_before from public.shop_items s where s.id = v_id;
      update public.shop_items set
        slug = lower(btrim(p_payload->>'slug')),
        name = btrim(p_payload->>'name'),
        description = coalesce(p_payload->>'description', ''),
        kind = p_payload->>'kind',
        price_coins = (p_payload->>'priceCoins')::integer,
        max_stack = (p_payload->>'maxStack')::integer,
        icon = coalesce(nullif(btrim(p_payload->>'icon'), ''), 'bag'),
        sort_order = coalesce((p_payload->>'sortOrder')::integer, 0),
        is_active = coalesce((p_payload->>'isActive')::boolean, true)
      where id = v_id;
    else
      insert into public.shop_items (
        slug, name, description, kind, price_coins, max_stack, icon, sort_order, is_active
      ) values (
        lower(btrim(p_payload->>'slug')), btrim(p_payload->>'name'),
        coalesce(p_payload->>'description', ''), p_payload->>'kind',
        (p_payload->>'priceCoins')::integer, (p_payload->>'maxStack')::integer,
        coalesce(nullif(btrim(p_payload->>'icon'), ''), 'bag'),
        coalesce((p_payload->>'sortOrder')::integer, 0),
        coalesce((p_payload->>'isActive')::boolean, true)
      ) returning id into v_id;
    end if;
    select to_jsonb(s) into v_after from public.shop_items s where s.id = v_id;

  elsif v_kind = 'player_level' then
    if coalesce((p_payload->>'level')::integer, 0) < 1
      or coalesce((p_payload->>'level')::integer, 0) > 30 then
      raise exception 'level_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'level')::integer, 0) = 1
      and coalesce((p_payload->>'xpRequired')::integer, 0) <> 0 then
      raise exception 'level_one_xp_invalid' using errcode = '22023';
    end if;
    select xp_required into v_prev_xp from public.player_levels
    where level = (p_payload->>'level')::integer - 1;
    select xp_required into v_next_xp from public.player_levels
    where level = (p_payload->>'level')::integer + 1;
    if v_prev_xp is not null and coalesce((p_payload->>'xpRequired')::integer, 0) <= v_prev_xp then
      raise exception 'xp_threshold_not_increasing' using errcode = '22023';
    end if;
    if v_next_xp is not null and coalesce((p_payload->>'xpRequired')::integer, 0) >= v_next_xp then
      raise exception 'xp_threshold_not_increasing' using errcode = '22023';
    end if;
    if v_id is not null or exists (
      select 1 from public.player_levels where level = (p_payload->>'level')::integer
    ) then
      select to_jsonb(l) into v_before from public.player_levels l
      where l.level = (p_payload->>'level')::integer;
    end if;
    insert into public.player_levels (level, title, xp_required, reward_coins, updated_at)
    values (
      (p_payload->>'level')::integer, btrim(p_payload->>'title'),
      coalesce((p_payload->>'xpRequired')::integer, 0),
      greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)), now()
    )
    on conflict (level) do update set
      title = excluded.title,
      xp_required = excluded.xp_required,
      reward_coins = excluded.reward_coins,
      updated_at = now();
    v_id := null;
    select to_jsonb(l) into v_after from public.player_levels l
    where l.level = (p_payload->>'level')::integer;

  elsif v_kind = 'streak_milestone' then
    if coalesce((p_payload->>'days')::integer, 0) < 1
      or coalesce((p_payload->>'days')::integer, 0) > 3650 then
      raise exception 'days_invalid' using errcode = '22023';
    end if;
    select to_jsonb(m) into v_before from public.streak_milestones m
    where m.days = (p_payload->>'days')::integer;
    insert into public.streak_milestones (days, title, reward_coins, icon, sort_order)
    values (
      (p_payload->>'days')::integer, btrim(p_payload->>'title'),
      greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
      coalesce(nullif(btrim(p_payload->>'icon'), ''), 'flame'),
      coalesce((p_payload->>'sortOrder')::integer, 0)
    )
    on conflict (days) do update set
      title = excluded.title,
      reward_coins = excluded.reward_coins,
      icon = excluded.icon,
      sort_order = excluded.sort_order;
    v_id := null;
    select to_jsonb(m) into v_after from public.streak_milestones m
    where m.days = (p_payload->>'days')::integer;

  elsif v_kind = 'league_tier' then
    if coalesce((p_payload->>'tier')::integer, 0) < 1
      or coalesce((p_payload->>'tier')::integer, 0) > 10 then
      raise exception 'tier_invalid' using errcode = '22023';
    end if;
    if coalesce(p_payload->>'accent', '') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'accent_invalid' using errcode = '22023';
    end if;
    select to_jsonb(t) into v_before from public.league_tiers t
    where t.tier = (p_payload->>'tier')::integer;
    insert into public.league_tiers (tier, name, accent, sort_order)
    values (
      (p_payload->>'tier')::integer, btrim(p_payload->>'name'),
      p_payload->>'accent', coalesce((p_payload->>'sortOrder')::integer, 0)
    )
    on conflict (tier) do update set
      name = excluded.name,
      accent = excluded.accent,
      sort_order = excluded.sort_order;
    v_id := null;
    select to_jsonb(t) into v_after from public.league_tiers t
    where t.tier = (p_payload->>'tier')::integer;

  elsif v_kind = 'event' then
    v_week := (p_payload->>'weekStart')::date;
    if v_week is null then
      raise exception 'week_start_required' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'targetXp')::integer, 0) < 20
      or coalesce((p_payload->>'targetXp')::integer, 0) > 10000 then
      raise exception 'target_invalid' using errcode = '22023';
    end if;
    if coalesce((p_payload->>'endsAt')::timestamptz, now()) <=
       coalesce((p_payload->>'startsAt')::timestamptz, now()) then
      raise exception 'event_dates_invalid' using errcode = '22023';
    end if;
    if v_id is not null then
      select to_jsonb(e) into v_before from public.game_events e where e.id = v_id;
      update public.game_events set
        week_start = v_week,
        title = btrim(p_payload->>'title'),
        description = coalesce(p_payload->>'description', ''),
        target_xp = (p_payload->>'targetXp')::integer,
        reward_coins = greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
        reward_xp = greatest(0, coalesce((p_payload->>'rewardXp')::integer, 0)),
        starts_at = (p_payload->>'startsAt')::timestamptz,
        ends_at = (p_payload->>'endsAt')::timestamptz,
        is_active = coalesce((p_payload->>'isActive')::boolean, true)
      where id = v_id;
    else
      insert into public.game_events (
        week_start, title, description, target_xp, reward_coins, reward_xp,
        starts_at, ends_at, is_active
      ) values (
        v_week, btrim(p_payload->>'title'), coalesce(p_payload->>'description', ''),
        (p_payload->>'targetXp')::integer,
        greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
        greatest(0, coalesce((p_payload->>'rewardXp')::integer, 0)),
        (p_payload->>'startsAt')::timestamptz,
        (p_payload->>'endsAt')::timestamptz,
        coalesce((p_payload->>'isActive')::boolean, true)
      ) returning id into v_id;
    end if;
    select to_jsonb(e) into v_after from public.game_events e where e.id = v_id;

  else
    raise exception 'catalog_kind_unknown' using errcode = '22023';
  end if;

  perform public.admin_audit(
    'gamification_save', v_kind, coalesce(v_id::text, p_payload->>'code'), p_reason,
    v_before, v_after
  );
  return v_after;
end;
$$;

-- ---------------------------------------------------------------------------
-- Social management
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_social(
  p_search text default '',
  p_status text default '',
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_search text := btrim(coalesce(p_search, ''));
  v_status text := btrim(coalesce(p_status, ''));
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_size integer := greatest(5, least(coalesce(p_page_size, 25), 100));
  v_offset integer := (v_page - 1) * v_size;
  v_total integer;
  v_items jsonb;
begin
  perform public.admin_require_permission('social.moderate');

  with filtered as (
    select f.*, rp.username as requester_username,
           coalesce(nullif(rp.display_name, ''), rp.username) as requester_name,
           ap.username as addressee_username,
           coalesce(nullif(ap.display_name, ''), ap.username) as addressee_name
    from public.friendships f
    join public.profiles rp on rp.id = f.requester_id
    join public.profiles ap on ap.id = f.addressee_id
    where (v_status = '' or f.status = v_status)
      and (
        v_search = ''
        or position(lower(v_search) in lower(rp.username::text)) > 0
        or position(lower(v_search) in lower(ap.username::text)) > 0
        or position(lower(v_search) in lower(rp.display_name)) > 0
        or position(lower(v_search) in lower(ap.display_name)) > 0
      )
  )
  select count(*)::integer into v_total from filtered;

  with filtered as (
    select f.*, rp.username as requester_username,
           coalesce(nullif(rp.display_name, ''), rp.username) as requester_name,
           ap.username as addressee_username,
           coalesce(nullif(ap.display_name, ''), ap.username) as addressee_name
    from public.friendships f
    join public.profiles rp on rp.id = f.requester_id
    join public.profiles ap on ap.id = f.addressee_id
    where (v_status = '' or f.status = v_status)
      and (
        v_search = ''
        or position(lower(v_search) in lower(rp.username::text)) > 0
        or position(lower(v_search) in lower(ap.username::text)) > 0
        or position(lower(v_search) in lower(rp.display_name)) > 0
        or position(lower(v_search) in lower(ap.display_name)) > 0
      )
    order by f.created_at desc
    limit v_size offset v_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'status', f.status,
    'requesterId', f.requester_id,
    'requesterUsername', f.requester_username,
    'requesterName', f.requester_name,
    'addresseeId', f.addressee_id,
    'addresseeUsername', f.addressee_username,
    'addresseeName', f.addressee_name,
    'createdAt', f.created_at,
    'respondedAt', f.responded_at
  ) order by f.created_at desc), '[]'::jsonb)
  into v_items
  from filtered f;

  return jsonb_build_object('total', v_total, 'page', v_page, 'pageSize', v_size, 'items', v_items);
end;
$$;

create or replace function public.admin_list_friend_quests(p_search text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_search text := btrim(coalesce(p_search, ''));
begin
  perform public.admin_require_permission('social.moderate');
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id,
      'code', q.code,
      'title', q.title,
      'status', q.status,
      'targetXp', q.target_xp,
      'rewardXp', q.reward_xp,
      'rewardCoins', q.reward_coins,
      'memberCount', (
        select count(*)::integer from public.friend_quest_members m where m.quest_id = q.id
      ),
      'totalXp', (
        select coalesce(sum(m.contribution_xp), 0)::integer
        from public.friend_quest_members m where m.quest_id = q.id
      ),
      'startsAt', q.starts_at,
      'endsAt', q.ends_at,
      'createdAt', q.created_at
    ) order by q.created_at desc), '[]'::jsonb)
    from public.friend_quests q
    where v_search = ''
      or position(lower(v_search) in lower(q.title)) > 0
      or position(lower(v_search) in lower(q.code)) > 0
  );
end;
$$;

create or replace function public.admin_remove_friendship(
  p_friendship_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('social.moderate');
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'id', f.id, 'status', f.status,
    'requesterId', f.requester_id, 'addresseeId', f.addressee_id
  ) into v_before
  from public.friendships f where f.id = p_friendship_id;

  if v_before is null then
    raise exception 'friendship_not_found' using errcode = 'P0002';
  end if;

  delete from public.friendships where id = p_friendship_id;

  perform public.admin_audit(
    'friendship_moderate_remove', 'friendship', p_friendship_id::text,
    v_reason, v_before, jsonb_build_object('removed', true)
  );
  return jsonb_build_object('id', p_friendship_id, 'removed', true);
end;
$$;

create or replace function public.admin_update_friend_quest(
  p_quest_id uuid,
  p_target_xp integer,
  p_reward_xp integer,
  p_reward_coins integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_status text;
  v_total integer;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('gamification.manage');
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;
  if p_target_xp is null or p_target_xp < 20 or p_target_xp > 10000 then
    raise exception 'target_invalid' using errcode = '22023';
  end if;
  if coalesce(p_reward_xp, 0) < 0 or coalesce(p_reward_xp, 0) > 1000
    or coalesce(p_reward_coins, 0) < 0 or coalesce(p_reward_coins, 0) > 1000 then
    raise exception 'reward_invalid' using errcode = '22023';
  end if;

  select to_jsonb(q), q.status into v_before, v_status
  from public.friend_quests q where q.id = p_quest_id;
  if v_before is null then
    raise exception 'friend_quest_not_found' using errcode = 'P0002';
  end if;
  if v_status <> 'active' then
    raise exception 'completed_quest_locked' using errcode = '22023';
  end if;

  update public.friend_quests set
    target_xp = p_target_xp,
    reward_xp = coalesce(p_reward_xp, 0),
    reward_coins = coalesce(p_reward_coins, 0)
  where id = p_quest_id;

  select coalesce(sum(contribution_xp), 0)::integer into v_total
  from public.friend_quest_members where quest_id = p_quest_id;

  if v_total >= p_target_xp then
    update public.friend_quests set status = 'completed' where id = p_quest_id;
  end if;

  perform public.admin_audit(
    'friend_quest_update', 'friend_quest', p_quest_id::text, v_reason, v_before,
    (select to_jsonb(q) from public.friend_quests q where q.id = p_quest_id)
  );
  return (select to_jsonb(q) from public.friend_quests q where q.id = p_quest_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Content health for the admin dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_content_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('dashboard.read');
  return jsonb_build_object(
    'publishedLessonsWithoutQuestions', (
      select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'title', l.title)
        order by l.title), '[]'::jsonb)
      from public.lessons l
      where l.is_published
        and not exists (
          select 1 from public.questions q where q.lesson_id = l.id and q.is_active
        )
    ),
    'nodesWithoutLesson', (
      select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'title', n.title)
        order by n.title), '[]'::jsonb)
      from public.learning_nodes n
      where n.is_active and n.node_type <> 'reward' and n.lesson_id is null
    ),
    'rewardNodesWithoutValue', (
      select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'title', n.title)
        order by n.title), '[]'::jsonb)
      from public.learning_nodes n
      where n.is_active and n.node_type = 'reward'
        and n.reward_coins = 0 and n.reward_xp = 0
    ),
    'levelsWithoutUnits', (
      select coalesce(jsonb_agg(jsonb_build_object('id', lv.id, 'title', lv.title)
        order by lv.title), '[]'::jsonb)
      from public.course_levels lv
      where lv.is_published
        and not exists (select 1 from public.units u where u.course_level_id = lv.id)
    ),
    'archivedQuestions', (
      select count(*)::integer from public.questions where not is_active
    ),
    'archivedMedia', (
      select count(*)::integer from public.media_assets where status = 'archived'
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.admin_get_gamification() from public, anon;
revoke all on function public.admin_save_game_catalog(text, jsonb, text) from public, anon;
revoke all on function public.admin_list_social(text, text, integer, integer) from public, anon;
revoke all on function public.admin_list_friend_quests(text) from public, anon;
revoke all on function public.admin_remove_friendship(uuid, text) from public, anon;
revoke all on function public.admin_update_friend_quest(uuid, integer, integer, integer, text)
  from public, anon;
revoke all on function public.admin_content_health() from public, anon;

grant execute on function public.admin_get_gamification() to authenticated;
grant execute on function public.admin_save_game_catalog(text, jsonb, text) to authenticated;
grant execute on function public.admin_list_social(text, text, integer, integer) to authenticated;
grant execute on function public.admin_list_friend_quests(text) to authenticated;
grant execute on function public.admin_remove_friendship(uuid, text) to authenticated;
grant execute on function public.admin_update_friend_quest(uuid, integer, integer, integer, text)
  to authenticated;
grant execute on function public.admin_content_health() to authenticated;
