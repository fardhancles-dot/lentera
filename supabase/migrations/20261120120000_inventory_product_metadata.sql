-- Lentera · Inventory product metadata
-- Tas reads the same shop_items row as Toko. Adding rarity and image_url to the
-- inventory payload (already stored on shop_items) keeps both cards consistent
-- without duplicating product data per page. Quantities and effects untouched.

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
    'icon', i.icon,
    'rarity', i.rarity,
    'imageUrl', i.image_url
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

revoke all on function public.get_my_inventory() from public, anon;
grant execute on function public.get_my_inventory() to authenticated;
