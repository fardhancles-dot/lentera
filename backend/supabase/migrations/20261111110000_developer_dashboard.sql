-- Lentera · Tahap 8 — Developer Dashboard, audit log, dan Reward Center.
-- Additive: tidak mengubah data pemain. Semua aksi staff lewat RPC security
-- definer; audit log append-only dan hanya dapat dibaca staff.

-- ---------------------------------------------------------------------------
-- Audit log append-only
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role public.app_role not null default 'player',
  action text not null check (char_length(action) between 3 and 80),
  target_type text not null default 'system'
    check (char_length(target_type) between 2 and 40),
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc);

-- Internal helper. Tidak di-grant ke pemain; hanya dipanggil RPC definer.
create or replace function public.log_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_details jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.app_role := 'player';
  v_id uuid;
begin
  if v_actor is not null then
    select role into v_role
    from public.user_roles
    where user_id = v_actor;
    v_role := coalesce(v_role, 'player');
  end if;

  insert into public.audit_logs (
    actor_id, actor_role, action, target_type, target_id, details
  )
  values (
    v_actor, v_role, btrim(p_action), btrim(p_target_type),
    nullif(btrim(coalesce(p_target_id, '')), ''),
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ringkasan dashboard
-- ---------------------------------------------------------------------------
create or replace function public.get_developer_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generatedAt', now(),
    'players', jsonb_build_object(
      'total', (select count(*)::integer from public.profiles),
      'onboarded', (
        select count(*)::integer from public.profiles where onboarding_completed
      ),
      'staff', (
        select count(*)::integer from public.user_roles
        where role in ('admin', 'developer')
      ),
      'new7d', (
        select count(*)::integer from public.profiles
        where created_at >= now() - interval '7 days'
      )
    ),
    'activity', jsonb_build_object(
      'lessonsCompleted', (
        select count(*)::integer from public.lesson_attempts
        where status = 'completed'
      ),
      'practicesCompleted', (
        select count(*)::integer from public.practice_sessions
        where status = 'completed'
      ),
      'xpAwarded', (
        select coalesce(sum(amount), 0)::integer from public.user_xp_ledger
      ),
      'coinsCirculating', (
        select coalesce(sum(coins), 0)::integer from public.user_wallets
      ),
      'activeStreaks', (
        select count(*)::integer from public.user_streaks
        where current_streak > 0
      )
    ),
    'content', jsonb_build_object(
      'subjects', (
        select count(*)::integer from public.subjects where status = 'active'
      ),
      'lessons', (
        select count(*)::integer from public.lessons where is_published
      ),
      'questions', (
        select count(*)::integer from public.questions where is_active
      ),
      'nodes', (
        select count(*)::integer from public.learning_nodes where is_active
      )
    ),
    'auditEntries', (select count(*)::integer from public.audit_logs)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Pencarian pemain untuk staff
-- ---------------------------------------------------------------------------
create or replace function public.get_developer_users(p_query text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_result jsonb;
begin
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row order by row->>'joinedAt' desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'userId', p.id,
      'email', coalesce(u.email, ''),
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'role', coalesce(r.role, 'player'),
      'onboardingCompleted', p.onboarding_completed,
      'totalXp', (
        select coalesce(sum(amount), 0)::integer
        from public.user_xp_ledger where user_id = p.id
      ),
      'coins', (
        select coalesce(coins, 0)::integer
        from public.user_wallets where user_id = p.id
      ),
      'joinedAt', p.created_at
    ) as row
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.user_roles r on r.user_id = p.id
    where v_query = ''
      or position(lower(v_query) in lower(p.username::text)) > 0
      or position(lower(v_query) in lower(p.display_name)) > 0
      or position(lower(v_query) in lower(coalesce(u.email, ''))) > 0
    order by p.created_at desc
    limit 25
  ) users;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit log untuk dashboard
-- ---------------------------------------------------------------------------
create or replace function public.get_audit_logs(p_limit integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 30), 100));
  v_result jsonb;
begin
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(entry order by entry->>'createdAt' desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', a.id,
      'actorId', a.actor_id,
      'actorRole', a.actor_role,
      'actorName', coalesce(nullif(p.display_name, ''), p.username, 'Sistem'),
      'actorUsername', p.username,
      'action', a.action,
      'targetType', a.target_type,
      'targetId', a.target_id,
      'details', a.details,
      'createdAt', a.created_at
    ) as entry
    from public.audit_logs a
    left join public.profiles p on p.id = a.actor_id
    order by a.created_at desc
    limit v_limit
  ) entries;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reward Center: hadiah satu akun
-- ---------------------------------------------------------------------------
create or replace function public.grant_reward(
  p_user_id uuid,
  p_coins integer,
  p_xp integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_coins integer := coalesce(p_coins, 0);
  v_xp integer := coalesce(p_xp, 0);
  v_reason text := btrim(coalesce(p_reason, ''));
  v_username text;
  v_reference uuid := gen_random_uuid();
  v_total_coins integer;
  v_total_xp integer;
begin
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;
  if v_coins < 0 or v_coins > 10000 then
    raise exception 'reward_coins_invalid' using errcode = '22023';
  end if;
  if v_xp < 0 or v_xp > 100000 then
    raise exception 'reward_xp_invalid' using errcode = '22023';
  end if;
  if v_coins = 0 and v_xp = 0 then
    raise exception 'reward_empty' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reward_reason_invalid' using errcode = '22023';
  end if;

  select username into v_username
  from public.profiles
  where id = p_user_id;

  if v_username is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  if v_coins > 0 then
    insert into public.user_wallets (user_id, coins)
    values (p_user_id, v_coins)
    on conflict (user_id) do update set
      coins = public.user_wallets.coins + excluded.coins,
      updated_at = now();

    insert into public.coin_transactions (
      user_id, amount, source, reference_id
    )
    values (p_user_id, v_coins, 'developer_grant', v_reference::text);
  end if;

  if v_xp > 0 then
    insert into public.user_xp_ledger (
      user_id, amount, source, reference_id
    )
    values (p_user_id, v_xp, 'developer_grant', v_reference::text);
  end if;

  select coins into v_total_coins
  from public.user_wallets where user_id = p_user_id;
  select coalesce(sum(amount), 0)::integer into v_total_xp
  from public.user_xp_ledger where user_id = p_user_id;

  perform public.log_audit(
    'reward_grant',
    'player',
    p_user_id::text,
    jsonb_build_object(
      'username', v_username,
      'coins', v_coins,
      'xp', v_xp,
      'reason', v_reason,
      'reference', v_reference
    )
  );

  return jsonb_build_object(
    'userId', p_user_id,
    'coinsAwarded', v_coins,
    'xpAwarded', v_xp,
    'totalCoins', coalesce(v_total_coins, 0),
    'totalXp', v_total_xp,
    'reference', v_reference
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Broadcast notifikasi ke pemain onboarded (maksimal 500 per kirim)
-- ---------------------------------------------------------------------------
create or replace function public.broadcast_notification(
  p_title text,
  p_body text default '',
  p_link text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_link text := btrim(coalesce(p_link, ''));
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;
  if char_length(v_title) < 3 or char_length(v_title) > 80 then
    raise exception 'broadcast_title_invalid' using errcode = '22023';
  end if;
  if char_length(v_body) > 300 then
    raise exception 'broadcast_body_invalid' using errcode = '22023';
  end if;
  if v_link <> '' and (left(v_link, 1) <> '/' or left(v_link, 2) = '//') then
    raise exception 'broadcast_link_invalid' using errcode = '22023';
  end if;

  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, 'info', v_title, v_body, v_link
  from public.profiles p
  where p.onboarding_completed
  order by p.created_at
  limit 500;

  get diagnostics v_count = row_count;

  perform public.log_audit(
    'broadcast_notification',
    'broadcast',
    null,
    jsonb_build_object(
      'title', v_title,
      'recipients', v_count,
      'link', v_link
    )
  );

  return jsonb_build_object(
    'recipients', v_count,
    'title', v_title
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS dan grant
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_staff" on public.audit_logs;
create policy "audit_logs_select_staff"
  on public.audit_logs for select to authenticated
  using (public.is_staff());

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

revoke all on function public.log_audit(text, text, text, jsonb)
  from public, anon, authenticated;

revoke all on function public.get_developer_overview() from public, anon;
revoke all on function public.get_developer_users(text) from public, anon;
revoke all on function public.get_audit_logs(integer) from public, anon;
revoke all on function public.grant_reward(uuid, integer, integer, text) from public, anon;
revoke all on function public.broadcast_notification(text, text, text) from public, anon;

grant execute on function public.get_developer_overview() to authenticated;
grant execute on function public.get_developer_users(text) to authenticated;
grant execute on function public.get_audit_logs(integer) to authenticated;
grant execute on function public.grant_reward(uuid, integer, integer, text) to authenticated;
grant execute on function public.broadcast_notification(text, text, text) to authenticated;
