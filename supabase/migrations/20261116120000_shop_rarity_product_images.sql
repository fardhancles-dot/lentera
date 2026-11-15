-- Lentera · Shop item rarity and product photos.
-- Additive only: old items keep working with COMMON and their built-in icon.

alter table public.shop_items
  add column if not exists rarity text not null default 'common',
  add column if not exists image_url text,
  add column if not exists image_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shop_items_rarity_check'
  ) then
    alter table public.shop_items
      add constraint shop_items_rarity_check
      check (rarity in ('common', 'rare', 'legendary'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'shop_items_image_url_check'
  ) then
    alter table public.shop_items
      add constraint shop_items_image_url_check
      check (
        image_url is null
        or (char_length(image_url) between 1 and 2048 and image_url ~ '^https://')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'shop_items_image_path_check'
  ) then
    alter table public.shop_items
      add constraint shop_items_image_path_check
      check (
        image_path is null
        or image_path ~ '^shop/[A-Za-z0-9][A-Za-z0-9._/-]{0,180}$'
      );
  end if;
end $$;

update public.shop_items
set rarity = 'common'
where rarity is null;

-- Player-facing catalog now carries the visual fields. Purchase mechanics,
-- inventory, prices, and effects are untouched.
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
    'icon', i.icon,
    'rarity', i.rarity,
    'imageUrl', i.image_url
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

-- Admin catalog read includes the photo path so edit can replace/clear it.
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

-- Dedicated shop save keeps the existing gameplay catalog RPC untouched.
create or replace function public.admin_save_shop_item(
  p_payload jsonb,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_after jsonb;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_rarity text := lower(btrim(coalesce(p_payload->>'rarity', 'common')));
  v_image_url text := nullif(btrim(coalesce(p_payload->>'imageUrl', '')), '');
  v_image_path text := nullif(btrim(coalesce(p_payload->>'imagePath', '')), '');
begin
  perform public.admin_require_permission('gamification.manage');

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
  if v_rarity not in ('common', 'rare', 'legendary') then
    raise exception 'rarity_invalid' using errcode = '22023';
  end if;
  if v_image_url is not null and (
    char_length(v_image_url) > 2048 or v_image_url !~ '^https://'
  ) then
    raise exception 'image_url_invalid' using errcode = '22023';
  end if;
  if v_image_path is not null and (
    char_length(v_image_path) > 190
    or v_image_path !~ '^shop/[A-Za-z0-9][A-Za-z0-9._/-]*$'
  ) then
    raise exception 'image_path_invalid' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
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
      is_active = coalesce((p_payload->>'isActive')::boolean, true),
      rarity = case when p_payload ? 'rarity' then v_rarity else rarity end,
      image_url = case when p_payload ? 'imageUrl' then v_image_url else image_url end,
      image_path = case when p_payload ? 'imagePath' then v_image_path else image_path end
    where id = v_id;
  else
    insert into public.shop_items (
      slug, name, description, kind, price_coins, max_stack, icon, sort_order,
      is_active, rarity, image_url, image_path
    ) values (
      lower(btrim(p_payload->>'slug')), btrim(p_payload->>'name'),
      coalesce(p_payload->>'description', ''), p_payload->>'kind',
      (p_payload->>'priceCoins')::integer, (p_payload->>'maxStack')::integer,
      coalesce(nullif(btrim(p_payload->>'icon'), ''), 'bag'),
      coalesce((p_payload->>'sortOrder')::integer, 0),
      coalesce((p_payload->>'isActive')::boolean, true),
      v_rarity, v_image_url, v_image_path
    ) returning id into v_id;
  end if;

  select to_jsonb(s) into v_after from public.shop_items s where s.id = v_id;

  perform public.admin_audit(
    'gamification_save', 'shop_item', coalesce(v_id::text, p_payload->>'slug'), v_reason,
    v_before, v_after
  );
  return v_after;
end;
$$;

-- Product photos live in the existing public content-media bucket under shop/.
-- Only staff with gamification.manage may write/delete that folder.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('content-media', 'content-media', true)
    on conflict (id) do update set public = true;
  end if;

  if to_regclass('storage.objects') is not null then
    execute $policy$
      drop policy if exists product_media_insert on storage.objects;
      create policy product_media_insert on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'content-media'
          and name like 'shop/%'
          and public.admin_has_permission('gamification.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists product_media_update on storage.objects;
      create policy product_media_update on storage.objects
        for update to authenticated
        using (
          bucket_id = 'content-media'
          and name like 'shop/%'
          and public.admin_has_permission('gamification.manage')
        )
        with check (
          bucket_id = 'content-media'
          and name like 'shop/%'
          and public.admin_has_permission('gamification.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists product_media_delete on storage.objects;
      create policy product_media_delete on storage.objects
        for delete to authenticated
        using (
          bucket_id = 'content-media'
          and name like 'shop/%'
          and public.admin_has_permission('gamification.manage')
        );
    $policy$;
  end if;
end $$;

revoke all on function public.admin_save_shop_item(jsonb, text) from public, anon;
grant execute on function public.admin_save_shop_item(jsonb, text) to authenticated;
