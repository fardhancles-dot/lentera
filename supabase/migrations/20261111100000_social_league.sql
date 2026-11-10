-- Lentera · Tahap 7 — sosial, liga, leaderboard, event, dan notifikasi.
-- Additive: tidak mengubah tabel lama selain menambah kolom privasi dan grant
-- kolom tersebut. Semua penulisan state sosial/liga dilakukan RPC security definer;
-- pemain hanya mendapat SELECT sesuai RLS.

-- ---------------------------------------------------------------------------
-- Privasi profil
-- ---------------------------------------------------------------------------
alter table public.user_settings
  add column if not exists profile_visibility text not null default 'friends'
  check (profile_visibility in ('public', 'friends', 'private'));

grant update (profile_visibility) on public.user_settings to authenticated;

-- XP hadiah event butuh kunci idempoten seperti Koin.
alter table public.user_xp_ledger
  add column if not exists reference_id text;
create unique index if not exists user_xp_ledger_reference_idx
  on public.user_xp_ledger (user_id, source, reference_id)
  where reference_id is not null;

-- ---------------------------------------------------------------------------
-- Pertemanan dan notifikasi
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );
create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id, status);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text not null default '',
  link text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Liga mingguan
-- ---------------------------------------------------------------------------
create table if not exists public.league_tiers (
  tier integer primary key check (tier between 1 and 10),
  name text not null unique,
  accent text not null,
  sort_order integer not null
);

insert into public.league_tiers (tier, name, accent, sort_order) values
  (1, 'Benih', '#6BA84F', 1),
  (2, 'Tunas', '#58CC02', 2),
  (3, 'Daun', '#3AA6A0', 3),
  (4, 'Ranting', '#2F9BD6', 4),
  (5, 'Pohon', '#4C6FE8', 5),
  (6, 'Hutan', '#7A5CE0', 6),
  (7, 'Bukit', '#B455D6', 7),
  (8, 'Gunung', '#E05A9E', 8),
  (9, 'Bintang', '#F08A24', 9),
  (10, 'Lentera', '#F5B700', 10)
on conflict (tier) do update set
  name = excluded.name,
  accent = excluded.accent,
  sort_order = excluded.sort_order;

create table if not exists public.league_groups (
  id uuid primary key default gen_random_uuid(),
  tier integer not null references public.league_tiers (tier),
  week_start date not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index if not exists league_groups_week_idx
  on public.league_groups (tier, week_start, created_at);

create table if not exists public.league_members (
  group_id uuid not null references public.league_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  weekly_xp integer not null default 0 check (weekly_xp >= 0),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id),
  unique (user_id, week_start)
);

create index if not exists league_members_group_idx
  on public.league_members (group_id, weekly_xp desc);

create table if not exists public.league_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  tier integer not null references public.league_tiers (tier),
  rank integer not null check (rank > 0),
  member_count integer not null default 0 check (member_count >= 0),
  outcome text not null check (outcome in ('promoted', 'stayed', 'demoted')),
  next_tier integer not null references public.league_tiers (tier),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- ---------------------------------------------------------------------------
-- Event mingguan
-- ---------------------------------------------------------------------------
create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  title text not null,
  description text not null default '',
  target_xp integer not null check (target_xp between 20 and 10000),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_event_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.game_events (id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  xp integer not null default 0 check (xp >= 0),
  claimed_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ---------------------------------------------------------------------------
-- Helper internal
-- ---------------------------------------------------------------------------
create or replace function public.league_week_start(p_at timestamptz default now())
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (date_trunc('week', p_at at time zone 'UTC'))::date;
$$;

create or replace function public.weekly_xp_for(p_user uuid, p_week date)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(amount), 0)::integer
  from public.user_xp_ledger
  where user_id = p_user
    and source in ('lesson', 'practice')
    and created_at >= (p_week::timestamp at time zone 'UTC')
    and created_at < ((p_week + 7)::timestamp at time zone 'UTC');
$$;

create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = p_user_a and addressee_id = p_user_b)
        or (requester_id = p_user_b and addressee_id = p_user_a)
      )
  );
$$;

-- Hari berturut-turut (mulai hari ini, UTC) saat kedua pemain sama-sama
-- memperoleh XP lesson/latihan.
create or replace function public.friend_streak_days(p_user uuid, p_friend uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with active_days as (
    select (created_at at time zone 'UTC')::date as day
    from public.user_xp_ledger
    where user_id in (p_user, p_friend)
      and source in ('lesson', 'practice')
      and created_at >= now() - interval '60 days'
    group by 1
    having count(distinct user_id) = 2
  ), ranked as (
    select day, (row_number() over (order by day desc) - 1)::integer as day_offset
    from active_days
  )
  select count(*)::integer
  from ranked
  where day = (now() at time zone 'UTC')::date - day_offset;
$$;

create or replace function public.push_notification(
  p_user uuid,
  p_kind text,
  p_title text,
  p_body text default '',
  p_link text default ''
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, kind, title, body, link)
  values (p_user, p_kind, p_title, p_body, p_link);
end;
$$;

-- ---------------------------------------------------------------------------
-- Pencarian dan pertemanan
-- ---------------------------------------------------------------------------
create or replace function public.search_players(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_query text := btrim(coalesce(p_query, ''));
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(v_query) < 2 then
    raise exception 'search_query_too_short' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(row order by row->>'username'), '[]'::jsonb) into v_result
  from (
    select jsonb_build_object(
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'bio', left(coalesce(p.bio, ''), 120),
      'relation', case
        when f.status = 'accepted' then 'friend'
        when f.status = 'pending' and f.requester_id = v_user then 'outgoing'
        when f.status = 'pending' and f.addressee_id = v_user then 'incoming'
        else 'none'
      end,
      'requestId', case when f.status = 'pending' then f.id else null end
    ) as row
    from public.profiles p
    left join public.friendships f
      on least(f.requester_id, f.addressee_id) = least(v_user, p.id)
     and greatest(f.requester_id, f.addressee_id) = greatest(v_user, p.id)
    where p.id <> v_user
      and (
        position(lower(v_query) in lower(p.username)) > 0
        or position(lower(v_query) in lower(coalesce(p.display_name, ''))) > 0
      )
    order by p.username
    limit 10
  ) matches;

  return v_result;
end;
$$;

create or replace function public.send_friend_request(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_target public.profiles;
  v_friend public.friendships;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_target
  from public.profiles
  where username = btrim(coalesce(p_username, ''));

  if v_target.id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;
  if v_target.id = v_user then
    raise exception 'friend_self' using errcode = '22023';
  end if;

  select * into v_friend
  from public.friendships
  where least(requester_id, addressee_id) = least(v_user, v_target.id)
    and greatest(requester_id, addressee_id) = greatest(v_user, v_target.id)
  for update;

  if v_friend.status = 'accepted' then
    raise exception 'already_friends' using errcode = '22023';
  end if;
  if v_friend.status = 'pending' then
    if v_friend.requester_id = v_user then
      raise exception 'friend_request_pending' using errcode = '22023';
    end if;
    raise exception 'friend_request_incoming' using errcode = '22023';
  end if;

  if v_friend.id is not null then
    update public.friendships
       set requester_id = v_user,
           addressee_id = v_target.id,
           status = 'pending',
           created_at = now(),
           responded_at = null
     where id = v_friend.id
     returning id into v_id;
  else
    insert into public.friendships (requester_id, addressee_id)
    values (v_user, v_target.id)
    returning id into v_id;
  end if;

  perform public.push_notification(
    v_target.id,
    'friend_request',
    'Permintaan pertemanan baru',
    (select coalesce(nullif(p.display_name, ''), p.username) from public.profiles p where p.id = v_user)
      || ' ingin berteman denganmu.',
    '/friends'
  );

  return jsonb_build_object(
    'requestId', v_id,
    'status', 'pending',
    'userId', v_target.id,
    'username', v_target.username
  );
end;
$$;

create or replace function public.respond_friend_request(
  p_request_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_friend public.friendships;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_friend
  from public.friendships
  where id = p_request_id
  for update;

  if v_friend.id is null then
    raise exception 'friend_request_not_found' using errcode = 'P0002';
  end if;
  if v_friend.addressee_id <> v_user then
    raise exception 'friend_request_forbidden' using errcode = '42501';
  end if;
  if v_friend.status <> 'pending' then
    raise exception 'friend_request_closed' using errcode = '22023';
  end if;

  update public.friendships
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = p_request_id;

  if p_accept then
    perform public.push_notification(
      v_friend.requester_id,
      'friend_accepted',
      'Permintaan pertemanan diterima',
      (select coalesce(nullif(p.display_name, ''), p.username) from public.profiles p where p.id = v_user)
        || ' sekarang berteman denganmu.',
      '/friends'
    );
  end if;

  return jsonb_build_object(
    'requestId', p_request_id,
    'status', case when p_accept then 'accepted' else 'declined' end
  );
end;
$$;

create or replace function public.remove_friend(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_user_id = v_user then
    raise exception 'friend_self' using errcode = '22023';
  end if;

  delete from public.friendships
  where least(requester_id, addressee_id) = least(v_user, p_user_id)
    and greatest(requester_id, addressee_id) = greatest(v_user, p_user_id);

  get diagnostics v_count = row_count;
  return jsonb_build_object('removed', v_count > 0);
end;
$$;

create or replace function public.get_my_friends()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_week date := public.league_week_start(now());
  v_friends jsonb;
  v_incoming jsonb;
  v_outgoing jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(friend order by friend->>'weeklyXp' desc), '[]'::jsonb)
  into v_friends
  from (
    select jsonb_build_object(
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'bio', left(coalesce(p.bio, ''), 160),
      'weeklyXp', public.weekly_xp_for(p.id, v_week),
      'totalXp', (
        select coalesce(sum(amount), 0)::integer
        from public.user_xp_ledger where user_id = p.id
      ),
      'level', (
        public.player_level_for_xp((
          select coalesce(sum(amount), 0)::integer
          from public.user_xp_ledger where user_id = p.id
        ))
      )->>'level',
      'friendStreak', public.friend_streak_days(v_user, p.id),
      'since', f.responded_at
    ) as friend
    from public.friendships f
    join public.profiles p
      on p.id = case
        when f.requester_id = v_user then f.addressee_id
        else f.requester_id
      end
    where f.status = 'accepted'
      and (f.requester_id = v_user or f.addressee_id = v_user)
  ) accepted;

  select coalesce(jsonb_agg(request order by request->>'createdAt' desc), '[]'::jsonb)
  into v_incoming
  from (
    select jsonb_build_object(
      'requestId', f.id,
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'createdAt', f.created_at
    ) as request
    from public.friendships f
    join public.profiles p on p.id = f.requester_id
    where f.addressee_id = v_user and f.status = 'pending'
  ) incoming;

  select coalesce(jsonb_agg(request order by request->>'createdAt' desc), '[]'::jsonb)
  into v_outgoing
  from (
    select jsonb_build_object(
      'requestId', f.id,
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'createdAt', f.created_at
    ) as request
    from public.friendships f
    join public.profiles p on p.id = f.addressee_id
    where f.requester_id = v_user and f.status = 'pending'
  ) outgoing;

  return jsonb_build_object(
    'friends', v_friends,
    'incoming', v_incoming,
    'outgoing', v_outgoing
  );
end;
$$;

create or replace function public.get_friend_profile(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_visibility text;
  v_friend public.friendships;
  v_is_friend boolean := false;
  v_stats_visible boolean := false;
  v_week date := public.league_week_start(now());
  v_total_xp integer;
  v_streak public.user_streaks;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_profile
  from public.profiles
  where username = btrim(coalesce(p_username, ''));

  if v_profile.id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  v_is_friend := public.are_friends(v_user, v_profile.id);

  select coalesce(profile_visibility, 'friends') into v_visibility
  from public.user_settings where user_id = v_profile.id;

  v_stats_visible := v_user = v_profile.id
    or coalesce(v_visibility, 'friends') = 'public'
    or (coalesce(v_visibility, 'friends') = 'friends' and v_is_friend);

  select * into v_friend
  from public.friendships
  where least(requester_id, addressee_id) = least(v_user, v_profile.id)
    and greatest(requester_id, addressee_id) = greatest(v_user, v_profile.id);

  v_total_xp := (
    select coalesce(sum(amount), 0)::integer
    from public.user_xp_ledger where user_id = v_profile.id
  );
  select * into v_streak from public.user_streaks where user_id = v_profile.id;

  return jsonb_build_object(
    'userId', v_profile.id,
    'username', v_profile.username,
    'displayName', coalesce(nullif(v_profile.display_name, ''), v_profile.username),
    'avatarKey', v_profile.avatar_key,
    'bio', case when v_stats_visible then coalesce(v_profile.bio, '') else '' end,
    'isSelf', v_user = v_profile.id,
    'isFriend', v_is_friend,
    'statsVisible', v_stats_visible,
    'relation', case
      when v_is_friend then 'friend'
      when v_friend.status = 'pending' and v_friend.requester_id = v_user then 'outgoing'
      when v_friend.status = 'pending' and v_friend.addressee_id = v_user then 'incoming'
      else 'none'
    end,
    'requestId', case when v_friend.status = 'pending' then v_friend.id else null end,
    'totalXp', case when v_stats_visible then v_total_xp else null end,
    'weeklyXp', case when v_stats_visible then public.weekly_xp_for(v_profile.id, v_week) else null end,
    'level', case when v_stats_visible
      then (public.player_level_for_xp(v_total_xp))->>'level' else null end,
    'levelTitle', case when v_stats_visible
      then (public.player_level_for_xp(v_total_xp))->>'title' else null end,
    'currentStreak', case when v_stats_visible then coalesce(v_streak.current_streak, 0) else null end,
    'longestStreak', case when v_stats_visible then coalesce(v_streak.longest_streak, 0) else null end,
    'completedLessons', case when v_stats_visible then (
      select count(*)::integer from public.user_node_progress
      where user_id = v_profile.id and status = 'completed'
    ) else null end,
    'achievements', case when v_stats_visible then (
      select count(*)::integer from public.user_achievements where user_id = v_profile.id
    ) else null end,
    'visibility', v_visibility
  );
end;
$$;

create or replace function public.get_friend_activity(p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(50, greatest(1, coalesce(p_limit, 20)));
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(event order by event->>'createdAt' desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'kind', 'xp',
      'userId', l.user_id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'amount', l.amount,
      'label', case
        when l.source = 'lesson' then 'menyelesaikan lesson'
        else 'menyelesaikan latihan'
      end,
      'createdAt', l.created_at
    ) as event
    from public.user_xp_ledger l
    join public.profiles p on p.id = l.user_id
    left join public.user_settings s on s.user_id = l.user_id
    where l.source in ('lesson', 'practice')
      and l.created_at >= now() - interval '30 days'
      and (l.user_id = v_user or (
        public.are_friends(v_user, l.user_id)
        and coalesce(s.profile_visibility, 'friends') <> 'private'
      ))
    order by l.created_at desc
    limit v_limit
  ) xp_events;

  if v_result = '[]'::jsonb then
    select coalesce(jsonb_agg(event order by event->>'createdAt' desc), '[]'::jsonb)
    into v_result
    from (
      select jsonb_build_object(
        'kind', 'achievement',
        'userId', ua.user_id,
        'username', p.username,
        'displayName', coalesce(nullif(p.display_name, ''), p.username),
        'avatarKey', p.avatar_key,
        'amount', 0,
        'label', 'membuka pencapaian ' || ad.title,
        'createdAt', ua.awarded_at
      ) as event
      from public.user_achievements ua
      join public.achievement_definitions ad on ad.id = ua.achievement_id
      join public.profiles p on p.id = ua.user_id
      left join public.user_settings s on s.user_id = ua.user_id
      where ua.awarded_at >= now() - interval '30 days'
        and (ua.user_id = v_user or (
          public.are_friends(v_user, ua.user_id)
          and coalesce(s.profile_visibility, 'friends') <> 'private'
        ))
      order by ua.awarded_at desc
      limit v_limit
    ) achievement_events;
  end if;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboard
-- ---------------------------------------------------------------------------
create or replace function public.get_leaderboard(p_scope text default 'global')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_scope text := coalesce(p_scope, 'global');
  v_week date := public.league_week_start(now());
  v_entries jsonb;
  v_viewer jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if v_scope not in ('global', 'friends') then
    raise exception 'leaderboard_scope_invalid' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(entry order by (entry->>'rank')::integer), '[]'::jsonb)
  into v_entries
  from (
    select jsonb_build_object(
      'rank', row_number() over (
        order by coalesce(t.weekly_xp, 0) desc, p.username
      ),
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'weeklyXp', coalesce(t.weekly_xp, 0),
      'isViewer', p.id = v_user,
      'isFriend', p.id <> v_user and public.are_friends(v_user, p.id)
    ) as entry
    from public.profiles p
    left join (
      select user_id, sum(amount)::integer as weekly_xp
      from public.user_xp_ledger
      where source in ('lesson', 'practice')
        and created_at >= (v_week::timestamp at time zone 'UTC')
        and created_at < ((v_week + 7)::timestamp at time zone 'UTC')
      group by user_id
    ) t on t.user_id = p.id
    left join public.user_settings s on s.user_id = p.id
    where p.onboarding_completed
      and (
        (v_scope = 'global' and coalesce(s.profile_visibility, 'friends') <> 'private')
        or (v_scope = 'friends' and (p.id = v_user or public.are_friends(v_user, p.id)))
      )
    order by coalesce(t.weekly_xp, 0) desc, p.username
    limit 50
  ) ranking;

  select jsonb_build_object(
    'rank', (entry->>'rank')::integer,
    'weeklyXp', (entry->>'weeklyXp')::integer,
    'displayName', entry->>'displayName',
    'username', entry->>'username'
  ) into v_viewer
  from jsonb_array_elements(v_entries) entry
  where (entry->>'userId')::uuid = v_user;

  return jsonb_build_object(
    'scope', v_scope,
    'weekStart', v_week,
    'entries', v_entries,
    'viewer', v_viewer
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Liga: finalisasi, grup, dan klaim hadiah
-- ---------------------------------------------------------------------------
create or replace function public.finalize_league_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group public.league_groups;
  v_count integer;
begin
  select * into v_group
  from public.league_groups
  where id = p_group_id
  for update;

  if v_group.id is null or v_group.finalized_at is not null then
    return;
  end if;

  update public.league_members m
     set weekly_xp = public.weekly_xp_for(m.user_id, m.week_start)
   where m.group_id = p_group_id;

  select count(*)::integer into v_count
  from public.league_members where group_id = p_group_id;

  if v_count = 0 then
    update public.league_groups set finalized_at = now() where id = p_group_id;
    return;
  end if;

  insert into public.league_results (
    user_id, week_start, tier, rank, member_count, outcome, next_tier,
    reward_coins, reward_xp
  )
  select
    m.user_id,
    v_group.week_start,
    v_group.tier,
    r.rank,
    v_count,
    case
      when r.rank <= 5 and v_group.tier < 10 then 'promoted'
      when v_count >= 10 and r.rank > v_count - 5 and v_group.tier > 1 then 'demoted'
      else 'stayed'
    end,
    case
      when r.rank <= 5 and v_group.tier < 10 then least(10, v_group.tier + 1)
      when v_count >= 10 and r.rank > v_count - 5 and v_group.tier > 1
        then greatest(1, v_group.tier - 1)
      else v_group.tier
    end,
    10 + v_group.tier * 5,
    0
  from (
    select
      user_id,
      row_number() over (order by weekly_xp desc, joined_at, user_id)::integer as rank
    from public.league_members
    where group_id = p_group_id
  ) r
  join public.league_members m on m.user_id = r.user_id and m.group_id = p_group_id
  on conflict (user_id, week_start) do nothing;

  update public.league_groups set finalized_at = now() where id = p_group_id;

  insert into public.notifications (user_id, kind, title, body, link)
  select
    r.user_id,
    'league_result',
    'Liga mingguan selesai',
    'Kamu finis #' || r.rank || ' dari ' || v_count || ' pemain di liga '
      || t.name || '. Hadiah menantimu.',
    '/leaderboard'
  from public.league_results r
  join public.league_tiers t on t.tier = r.tier
  where r.week_start = v_group.week_start
    and r.user_id in (
      select user_id from public.league_members where group_id = p_group_id
    );
end;
$$;

create or replace function public.ensure_league_group(p_user uuid, p_week date)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tier integer;
  v_group uuid;
begin
  select next_tier into v_tier
  from public.league_results
  where user_id = p_user and week_start < p_week
  order by week_start desc
  limit 1;
  v_tier := coalesce(v_tier, 1);

  select group_id into v_group
  from public.league_members
  where user_id = p_user and week_start = p_week;
  if v_group is not null then
    return v_group;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('league:' || v_tier || ':' || p_week::text, 0)
  );

  select g.id into v_group
  from public.league_groups g
  where g.tier = v_tier
    and g.week_start = p_week
    and g.finalized_at is null
    and (
      select count(*) from public.league_members m where m.group_id = g.id
    ) < 30
  order by g.created_at
  limit 1;

  if v_group is null then
    insert into public.league_groups (tier, week_start)
    values (v_tier, p_week)
    returning id into v_group;
  end if;

  insert into public.league_members (group_id, user_id, week_start, weekly_xp)
  values (v_group, p_user, p_week, public.weekly_xp_for(p_user, p_week))
  on conflict (user_id, week_start) do nothing;

  return v_group;
end;
$$;

create or replace function public.get_my_league()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_week date := public.league_week_start(now());
  v_group_uuid uuid;
  v_group public.league_groups;
  v_tier public.league_tiers;
  v_members jsonb;
  v_count integer;
  v_rank integer;
  v_weekly_xp integer;
  v_previous jsonb;
  v_history jsonb;
  v_stale uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  for v_stale in
    select distinct m.group_id
    from public.league_members m
    join public.league_groups g on g.id = m.group_id
    where m.user_id = v_user
      and g.week_start < v_week
      and g.finalized_at is null
  loop
    perform public.finalize_league_group(v_stale);
  end loop;

  v_group_uuid := public.ensure_league_group(v_user, v_week);

  select * into v_group from public.league_groups where id = v_group_uuid;
  select * into v_tier from public.league_tiers where tier = v_group.tier;

  update public.league_members m
     set weekly_xp = public.weekly_xp_for(m.user_id, m.week_start)
   where m.group_id = v_group_uuid;

  select count(*)::integer into v_count
  from public.league_members where group_id = v_group_uuid;

  select weekly_xp into v_weekly_xp
  from public.league_members
  where group_id = v_group_uuid and user_id = v_user;

  select rank into v_rank
  from (
    select
      user_id,
      row_number() over (order by weekly_xp desc, joined_at, user_id)::integer as rank
    from public.league_members
    where group_id = v_group_uuid
  ) ranked
  where user_id = v_user;

  select coalesce(jsonb_agg(member order by (member->>'rank')::integer), '[]'::jsonb)
  into v_members
  from (
    select jsonb_build_object(
      'rank', row_number() over (order by m.weekly_xp desc, m.joined_at, m.user_id),
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'weeklyXp', m.weekly_xp,
      'isViewer', p.id = v_user
    ) as member
    from public.league_members m
    join public.profiles p on p.id = m.user_id
    where m.group_id = v_group_uuid
  ) ranked_members;

  select jsonb_build_object(
    'weekStart', r.week_start,
    'tier', r.tier,
    'rank', r.rank,
    'memberCount', r.member_count,
    'outcome', r.outcome,
    'nextTier', r.next_tier,
    'rewardCoins', r.reward_coins,
    'claimed', r.claimed_at is not null
  ) into v_previous
  from public.league_results r
  where r.user_id = v_user and r.week_start < v_week
  order by r.week_start desc
  limit 1;

  select coalesce(jsonb_agg(history order by history->>'weekStart' desc), '[]'::jsonb)
  into v_history
  from (
    select jsonb_build_object(
      'weekStart', r.week_start,
      'tier', r.tier,
      'tierName', t.name,
      'rank', r.rank,
      'memberCount', r.member_count,
      'outcome', r.outcome,
      'rewardCoins', r.reward_coins,
      'claimed', r.claimed_at is not null
    ) as history
    from public.league_results r
    join public.league_tiers t on t.tier = r.tier
    where r.user_id = v_user
    order by r.week_start desc
    limit 8
  ) histories;

  return jsonb_build_object(
    'weekStart', v_week,
    'endsAt', ((v_week + 7)::timestamp at time zone 'UTC'),
    'groupId', v_group_uuid,
    'tier', v_tier.tier,
    'tierName', v_tier.name,
    'accent', v_tier.accent,
    'rank', v_rank,
    'memberCount', v_count,
    'promotionCount', case when v_tier.tier < 10 then 5 else 0 end,
    'demotionCount', case when v_tier.tier > 1 then 5 else 0 end,
    'weeklyXp', coalesce(v_weekly_xp, 0),
    'canClaimReward', v_previous is not null
      and (v_previous->>'claimed')::boolean = false,
    'previousResult', v_previous,
    'members', v_members,
    'history', v_history
  );
end;
$$;

create or replace function public.claim_league_reward(p_week_start date)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_result public.league_results;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_result
  from public.league_results
  where user_id = v_user and week_start = p_week_start
  for update;

  if v_result.user_id is null then
    raise exception 'league_result_not_found' using errcode = 'P0002';
  end if;

  if v_result.claimed_at is not null then
    return jsonb_build_object(
      'alreadyClaimed', true,
      'coinsAwarded', 0,
      'weekStart', v_result.week_start
    );
  end if;

  if v_result.reward_coins > 0 then
    insert into public.user_wallets (user_id, coins)
    values (v_user, v_result.reward_coins)
    on conflict (user_id) do update set
      coins = public.user_wallets.coins + v_result.reward_coins,
      updated_at = now();

    insert into public.coin_transactions (
      user_id, amount, source, reference_id
    )
    values (
      v_user, v_result.reward_coins, 'league_reward', v_result.week_start::text
    )
    on conflict (user_id, source, reference_id) where reference_id is not null
    do nothing;
  end if;

  update public.league_results
     set claimed_at = now()
   where user_id = v_user and week_start = p_week_start;

  return jsonb_build_object(
    'alreadyClaimed', false,
    'coinsAwarded', v_result.reward_coins,
    'weekStart', v_result.week_start
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Event mingguan
-- ---------------------------------------------------------------------------
create or replace function public.ensure_week_event(p_week date)
returns public.game_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.game_events;
begin
  select * into v_event from public.game_events where week_start = p_week;
  if v_event.id is not null then
    return v_event;
  end if;

  insert into public.game_events (
    week_start, title, description, target_xp, reward_coins, reward_xp,
    starts_at, ends_at
  )
  values (
    p_week,
    'Festival Lentera',
    'Kumpulkan 100 XP dari lesson dan latihan sepanjang minggu ini.',
    100,
    25,
    0,
    (p_week::timestamp at time zone 'UTC'),
    ((p_week + 7)::timestamp at time zone 'UTC')
  )
  on conflict (week_start) do nothing;

  select * into v_event from public.game_events where week_start = p_week;
  return v_event;
end;
$$;

create or replace function public.get_active_event()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_week date := public.league_week_start(now());
  v_event public.game_events;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_event := public.ensure_week_event(v_week);

  return jsonb_build_object(
    'id', v_event.id,
    'title', v_event.title,
    'description', v_event.description,
    'targetXp', v_event.target_xp,
    'rewardCoins', v_event.reward_coins,
    'startsAt', v_event.starts_at,
    'endsAt', v_event.ends_at,
    'progress', least(v_event.target_xp, public.weekly_xp_for(v_user, v_week)),
    'weeklyXp', public.weekly_xp_for(v_user, v_week),
    'claimed', exists (
      select 1 from public.user_event_claims
      where user_id = v_user and event_id = v_event.id
    ),
    'canClaim', public.weekly_xp_for(v_user, v_week) >= v_event.target_xp
      and not exists (
        select 1 from public.user_event_claims
        where user_id = v_user and event_id = v_event.id
      )
  );
end;
$$;

create or replace function public.claim_event_reward()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_week date := public.league_week_start(now());
  v_event public.game_events;
  v_claimed boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_event := public.ensure_week_event(v_week);

  if public.weekly_xp_for(v_user, v_week) < v_event.target_xp then
    raise exception 'event_not_complete' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('event:' || v_user::text || ':' || v_event.id::text, 0)
  );

  select exists (
    select 1 from public.user_event_claims
    where user_id = v_user and event_id = v_event.id
  ) into v_claimed;

  if v_claimed then
    return jsonb_build_object(
      'alreadyClaimed', true,
      'coinsAwarded', 0
    );
  end if;

  insert into public.user_event_claims (user_id, event_id, coins, xp)
  values (v_user, v_event.id, v_event.reward_coins, v_event.reward_xp);

  if v_event.reward_coins > 0 then
    insert into public.user_wallets (user_id, coins)
    values (v_user, v_event.reward_coins)
    on conflict (user_id) do update set
      coins = public.user_wallets.coins + v_event.reward_coins,
      updated_at = now();

    insert into public.coin_transactions (
      user_id, amount, source, reference_id
    )
    values (v_user, v_event.reward_coins, 'event_reward', v_event.id::text)
    on conflict (user_id, source, reference_id) where reference_id is not null
    do nothing;
  end if;

  if v_event.reward_xp > 0 then
    insert into public.user_xp_ledger (
      user_id, amount, source, reference_id
    )
    values (v_user, v_event.reward_xp, 'event_reward', v_event.id::text)
    on conflict (user_id, source, reference_id) where reference_id is not null
    do nothing;
  end if;

  return jsonb_build_object(
    'alreadyClaimed', false,
    'coinsAwarded', v_event.reward_coins,
    'xpAwarded', v_event.reward_xp
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Notifikasi
-- ---------------------------------------------------------------------------
create or replace function public.get_my_notifications()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_items jsonb;
  v_unread integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select count(*)::integer into v_unread
  from public.notifications
  where user_id = v_user and read_at is null;

  select coalesce(jsonb_agg(item order by item->>'createdAt' desc), '[]'::jsonb)
  into v_items
  from (
    select jsonb_build_object(
      'id', n.id,
      'kind', n.kind,
      'title', n.title,
      'body', n.body,
      'link', n.link,
      'read', n.read_at is not null,
      'createdAt', n.created_at
    ) as item
    from public.notifications n
    where n.user_id = v_user
    order by n.created_at desc
    limit 30
  ) items;

  return jsonb_build_object('unreadCount', v_unread, 'items', v_items);
end;
$$;

create or replace function public.mark_notifications_read(p_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_updated integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  update public.notifications
     set read_at = now()
   where user_id = v_user
     and read_at is null
     and (p_id is null or id = p_id);

  get diagnostics v_updated = row_count;
  return jsonb_build_object('updated', v_updated);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS dan grant
-- ---------------------------------------------------------------------------
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.league_tiers enable row level security;
alter table public.league_groups enable row level security;
alter table public.league_members enable row level security;
alter table public.league_results enable row level security;
alter table public.game_events enable row level security;
alter table public.user_event_claims enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "league_tiers_select_all" on public.league_tiers;
create policy "league_tiers_select_all"
  on public.league_tiers for select to authenticated
  using (true);

drop policy if exists "league_results_select_own" on public.league_results;
create policy "league_results_select_own"
  on public.league_results for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "game_events_select_active" on public.game_events;
create policy "game_events_select_active"
  on public.game_events for select to authenticated
  using (is_active);

drop policy if exists "user_event_claims_select_own" on public.user_event_claims;
create policy "user_event_claims_select_own"
  on public.user_event_claims for select to authenticated
  using (user_id = auth.uid());

revoke all on public.friendships from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.league_tiers from anon, authenticated;
revoke all on public.league_groups from anon, authenticated;
revoke all on public.league_members from anon, authenticated;
revoke all on public.league_results from anon, authenticated;
revoke all on public.game_events from anon, authenticated;
revoke all on public.user_event_claims from anon, authenticated;

grant select on public.friendships to authenticated;
grant select on public.notifications to authenticated;
grant select on public.league_tiers to authenticated;
grant select on public.league_results to authenticated;
grant select on public.game_events to authenticated;
grant select on public.user_event_claims to authenticated;

-- Helper internal tidak boleh dipanggil pemain.
revoke all on function public.league_week_start(timestamptz) from public, anon, authenticated;
revoke all on function public.weekly_xp_for(uuid, date) from public, anon, authenticated;
revoke all on function public.are_friends(uuid, uuid) from public, anon, authenticated;
revoke all on function public.friend_streak_days(uuid, uuid) from public, anon, authenticated;
revoke all on function public.push_notification(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.finalize_league_group(uuid) from public, anon, authenticated;
revoke all on function public.ensure_league_group(uuid, date) from public, anon, authenticated;
revoke all on function public.ensure_week_event(date) from public, anon, authenticated;

revoke all on function public.search_players(text) from public, anon;
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.get_my_friends() from public, anon;
revoke all on function public.get_friend_profile(text) from public, anon;
revoke all on function public.get_friend_activity(integer) from public, anon;
revoke all on function public.get_leaderboard(text) from public, anon;
revoke all on function public.get_my_league() from public, anon;
revoke all on function public.claim_league_reward(date) from public, anon;
revoke all on function public.get_active_event() from public, anon;
revoke all on function public.claim_event_reward() from public, anon;
revoke all on function public.get_my_notifications() from public, anon;
revoke all on function public.mark_notifications_read(uuid) from public, anon;

grant execute on function public.search_players(text) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.get_my_friends() to authenticated;
grant execute on function public.get_friend_profile(text) to authenticated;
grant execute on function public.get_friend_activity(integer) to authenticated;
grant execute on function public.get_leaderboard(text) to authenticated;
grant execute on function public.get_my_league() to authenticated;
grant execute on function public.claim_league_reward(date) to authenticated;
grant execute on function public.get_active_event() to authenticated;
grant execute on function public.claim_event_reward() to authenticated;
grant execute on function public.get_my_notifications() to authenticated;
grant execute on function public.mark_notifications_read(uuid) to authenticated;
