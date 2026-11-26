-- Lentera · Social follow system, following privacy, avatars, and inbox.
-- Additive and backwards compatible:
--   * accepted friendships are preserved and backfilled as mutual follows,
--   * pending requests become a one-way follow,
--   * friendships stays as a synchronized cache so Liga, Friends Quest admin,
--     leaderboard, and existing RPCs keep working without being rewritten.
-- The source of truth for "friend" is now two active rows in public.follows.

-- ---------------------------------------------------------------------------
-- Profile photo and following privacy
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_avatar_url_check'
  ) then
    alter table public.profiles
      add constraint profiles_avatar_url_check
      check (
        avatar_url is null
        or (char_length(avatar_url) between 1 and 2048 and avatar_url ~ '^https://')
      );
  end if;
end $$;

grant update (avatar_url) on public.profiles to authenticated;

alter table public.user_settings
  add column if not exists following_privacy text not null default 'public';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_settings_following_privacy_check'
  ) then
    alter table public.user_settings
      add constraint user_settings_following_privacy_check
      check (following_privacy in ('public', 'private'));
  end if;
end $$;

grant update (following_privacy) on public.user_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Avatar storage: public read, each player writes only their own folder
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'avatars',
      'avatars',
      true,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;

  if to_regclass('storage.objects') is not null then
    drop policy if exists avatars_read on storage.objects;
    create policy avatars_read on storage.objects
      for select
      using (bucket_id = 'avatars');

    drop policy if exists avatars_insert on storage.objects;
    create policy avatars_insert on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists avatars_update on storage.objects;
    create policy avatars_update on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists avatars_delete on storage.objects;
    create policy avatars_delete on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Follow graph
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id, created_at desc);
create index if not exists follows_follower_idx
  on public.follows (follower_id, created_at desc);

alter table public.follows enable row level security;

create or replace function public.following_is_public(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select s.following_privacy = 'public'
      from public.user_settings s
      where s.user_id = p_user
    ),
    true
  );
$$;

drop policy if exists "follows_select_visible" on public.follows;
create policy "follows_select_visible"
  on public.follows for select
  to authenticated
  using (
    follower_id = auth.uid()
    or following_id = auth.uid()
    or public.following_is_public(follower_id)
  );

-- Writes go through security-definer RPCs. The policies below are a second
-- layer in case table grants are widened by a future migration.
drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

revoke all on public.follows from anon, authenticated;
grant select on public.follows to authenticated;

-- ---------------------------------------------------------------------------
-- One-time data migration (no rows are deleted)
-- ---------------------------------------------------------------------------
-- Existing accepted friends become mutual follows, preserving their history.
insert into public.follows (follower_id, following_id, created_at)
select
  f.requester_id,
  f.addressee_id,
  coalesce(f.responded_at, f.created_at, now())
from public.friendships f
where f.status = 'accepted'
on conflict (follower_id, following_id) do nothing;

insert into public.follows (follower_id, following_id, created_at)
select
  f.addressee_id,
  f.requester_id,
  coalesce(f.responded_at, f.created_at, now())
from public.friendships f
where f.status = 'accepted'
on conflict (follower_id, following_id) do nothing;

-- A pending request is equivalent to "this player already follows you".
insert into public.follows (follower_id, following_id, created_at)
select f.requester_id, f.addressee_id, f.created_at
from public.friendships f
where f.status = 'pending'
on conflict (follower_id, following_id) do nothing;

-- ---------------------------------------------------------------------------
-- Friendship cache synchronization
-- ---------------------------------------------------------------------------
create or replace function public.sync_follow_friendship(p_user_a uuid, p_user_b uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_a uuid := least(p_user_a, p_user_b);
  v_b uuid := greatest(p_user_a, p_user_b);
  v_mutual boolean;
  v_row public.friendships;
begin
  if p_user_a is null or p_user_b is null or p_user_a = p_user_b then
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_a::text || ':' || v_b::text, 0)
  );

  select
    exists (
      select 1 from public.follows
      where follower_id = v_a and following_id = v_b
    )
    and exists (
      select 1 from public.follows
      where follower_id = v_b and following_id = v_a
    )
  into v_mutual;

  select *
  into v_row
  from public.friendships
  where least(requester_id, addressee_id) = v_a
    and greatest(requester_id, addressee_id) = v_b
  for update;

  if v_mutual then
    if v_row.id is null then
      insert into public.friendships (
        requester_id, addressee_id, status, created_at, responded_at
      )
      values (v_a, v_b, 'accepted', now(), now());
    elsif v_row.status <> 'accepted' then
      update public.friendships
         set status = 'accepted',
             responded_at = now()
       where id = v_row.id;
    end if;
  elsif v_row.id is not null and v_row.status = 'accepted' then
    -- The follow graph is authoritative; a broken mutual relation can never
    -- leave an accepted friendship row behind.
    delete from public.friendships where id = v_row.id;
  end if;
end;
$$;

create or replace function public.sync_follow_friendship_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_follow_friendship(old.follower_id, old.following_id);
    return old;
  end if;
  perform public.sync_follow_friendship(new.follower_id, new.following_id);
  return new;
end;
$$;

drop trigger if exists follows_sync_friendship on public.follows;
create trigger follows_sync_friendship
  after insert or delete on public.follows
  for each row execute function public.sync_follow_friendship_trigger();

-- ---------------------------------------------------------------------------
-- Friend status now means "both directions are active"
-- ---------------------------------------------------------------------------
create or replace function public.are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1 from public.follows
      where follower_id = p_user_a and following_id = p_user_b
    )
    and exists (
      select 1 from public.follows
      where follower_id = p_user_b and following_id = p_user_a
    );
$$;

-- ---------------------------------------------------------------------------
-- Follow actions
-- ---------------------------------------------------------------------------
create or replace function public.follow_player(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_target public.profiles;
  v_inserted integer := 0;
  v_name text;
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
    raise exception 'follow_self' using errcode = '22023';
  end if;

  insert into public.follows (follower_id, following_id)
  values (v_user, v_target.id)
  on conflict (follower_id, following_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    select coalesce(nullif(p.display_name, ''), p.username)
    into v_name
    from public.profiles p where p.id = v_user;

    perform public.push_notification(
      v_target.id,
      'new_follower',
      'Pengikut baru',
      coalesce(v_name, 'Seorang pemain') || ' mulai mengikuti kamu.',
      '/inbox'
    );
  end if;

  return jsonb_build_object(
    'userId', v_target.id,
    'username', v_target.username,
    'isFollowing', true,
    'isFriend', public.are_friends(v_user, v_target.id),
    'followersCount', (
      select count(*)::integer from public.follows where following_id = v_target.id
    ),
    'followingCount', (
      select count(*)::integer from public.follows where follower_id = v_target.id
    )
  );
end;
$$;

create or replace function public.unfollow_player(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_target public.profiles;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_user_id = v_user then
    raise exception 'follow_self' using errcode = '22023';
  end if;

  select * into v_target from public.profiles where id = p_user_id;
  if v_target.id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  delete from public.follows
  where follower_id = v_user and following_id = v_target.id;

  return jsonb_build_object(
    'userId', v_target.id,
    'username', v_target.username,
    'isFollowing', false,
    'isFriend', false,
    'followersCount', (
      select count(*)::integer from public.follows where following_id = v_target.id
    ),
    'followingCount', (
      select count(*)::integer from public.follows where follower_id = v_target.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Inbox: suggestions and newest followers
-- ---------------------------------------------------------------------------
create or replace function public.get_follow_suggestions(p_limit integer default 12)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(30, greatest(1, coalesce(p_limit, 12)));
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(suggestion order by suggestion->>'username'), '[]'::jsonb)
    from (
      select jsonb_build_object(
        'userId', p.id,
        'username', p.username,
        'displayName', coalesce(nullif(p.display_name, ''), p.username),
        'avatarKey', p.avatar_key,
        'avatarUrl', p.avatar_url,
        'bio', left(coalesce(p.bio, ''), 120)
      ) as suggestion
      from public.profiles p
      where p.id <> v_user
        and p.onboarding_completed
        and not exists (
          select 1 from public.follows f
          where f.follower_id = v_user and f.following_id = p.id
        )
      order by random()
      limit v_limit
    ) rows
  );
end;
$$;

create or replace function public.get_new_followers(p_limit integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(50, greatest(1, coalesce(p_limit, 30)));
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(follower order by follower->>'followedAt' desc), '[]'::jsonb)
    from (
      select jsonb_build_object(
        'userId', p.id,
        'username', p.username,
        'displayName', coalesce(nullif(p.display_name, ''), p.username),
        'avatarKey', p.avatar_key,
        'avatarUrl', p.avatar_url,
        'followedAt', f.created_at,
        'isFollowing', exists (
          select 1 from public.follows o
          where o.follower_id = v_user and o.following_id = p.id
        ),
        'isFriend', public.are_friends(v_user, p.id)
      ) as follower
      from public.follows f
      join public.profiles p on p.id = f.follower_id
      where f.following_id = v_user
      order by f.created_at desc
      limit v_limit
    ) rows
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Audience lists with server-side following privacy
-- ---------------------------------------------------------------------------
create or replace function public.get_followers(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_items jsonb;
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

  select coalesce(jsonb_agg(item order by item->>'followedAt' desc), '[]'::jsonb)
  into v_items
  from (
    select jsonb_build_object(
      'userId', p.id,
      'username', p.username,
      'displayName', coalesce(nullif(p.display_name, ''), p.username),
      'avatarKey', p.avatar_key,
      'avatarUrl', p.avatar_url,
      'followedAt', f.created_at,
      'isFollowing', exists (
        select 1 from public.follows o
        where o.follower_id = v_user and o.following_id = p.id
      ),
      'isFriend', public.are_friends(v_user, p.id)
    ) as item
    from public.follows f
    join public.profiles p on p.id = f.follower_id
    where f.following_id = v_profile.id
  ) rows;

  return jsonb_build_object(
    'private', false,
    'items', v_items,
    'followersCount', (
      select count(*)::integer from public.follows where following_id = v_profile.id
    ),
    'followingCount', (
      select count(*)::integer from public.follows where follower_id = v_profile.id
    )
  );
end;
$$;

create or replace function public.get_following(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_private boolean := false;
  v_items jsonb := '[]'::jsonb;
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

  v_private := v_profile.id <> v_user and not public.following_is_public(v_profile.id);

  if not v_private then
    select coalesce(jsonb_agg(item order by item->>'followedAt' desc), '[]'::jsonb)
    into v_items
    from (
      select jsonb_build_object(
        'userId', p.id,
        'username', p.username,
        'displayName', coalesce(nullif(p.display_name, ''), p.username),
        'avatarKey', p.avatar_key,
        'avatarUrl', p.avatar_url,
        'followedAt', f.created_at,
        'isFollowing', exists (
          select 1 from public.follows o
          where o.follower_id = v_user and o.following_id = p.id
        ),
        'isFriend', public.are_friends(v_user, p.id)
      ) as item
      from public.follows f
      join public.profiles p on p.id = f.following_id
      where f.follower_id = v_profile.id
    ) rows;
  end if;

  return jsonb_build_object(
    'private', v_private,
    'items', v_items,
    'followersCount', (
      select count(*)::integer from public.follows where following_id = v_profile.id
    ),
    'followingCount', (
      select count(*)::integer from public.follows where follower_id = v_profile.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Existing APIs, now backed by follows
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
      'avatarUrl', p.avatar_url,
      'bio', left(coalesce(p.bio, ''), 120),
      'relation', case
        when out_f.following_id is not null and in_f.follower_id is not null then 'friend'
        when out_f.following_id is not null then 'outgoing'
        when in_f.follower_id is not null then 'incoming'
        else 'none'
      end,
      'isFollowing', out_f.following_id is not null,
      'isFriend', out_f.following_id is not null and in_f.follower_id is not null,
      'requestId', null
    ) as row
    from public.profiles p
    left join public.follows out_f
      on out_f.follower_id = v_user and out_f.following_id = p.id
    left join public.follows in_f
      on in_f.follower_id = p.id and in_f.following_id = v_user
    where p.id <> v_user
      and (
        position(lower(v_query) in lower(p.username::text)) > 0
        or position(lower(v_query) in lower(coalesce(p.display_name, ''))) > 0
      )
    order by p.username
    limit 10
  ) matches;

  return v_result;
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
      'avatarUrl', p.avatar_url,
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
      'since', greatest(out_f.created_at, in_f.created_at)
    ) as friend
    from public.follows out_f
    join public.follows in_f
      on in_f.follower_id = out_f.following_id
     and in_f.following_id = out_f.follower_id
    join public.profiles p on p.id = out_f.following_id
    where out_f.follower_id = v_user
  ) accepted;

  return jsonb_build_object(
    'friends', v_friends,
    'incoming', '[]'::jsonb,
    'outgoing', '[]'::jsonb
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
  v_following_privacy text;
  v_is_friend boolean := false;
  v_is_following boolean := false;
  v_follows_you boolean := false;
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
  v_is_following := exists (
    select 1 from public.follows
    where follower_id = v_user and following_id = v_profile.id
  );
  v_follows_you := exists (
    select 1 from public.follows
    where follower_id = v_profile.id and following_id = v_user
  );

  select
    coalesce(profile_visibility, 'friends'),
    coalesce(following_privacy, 'public')
  into v_visibility, v_following_privacy
  from public.user_settings where user_id = v_profile.id;

  v_visibility := coalesce(v_visibility, 'friends');
  v_following_privacy := coalesce(v_following_privacy, 'public');

  v_stats_visible := v_user = v_profile.id
    or v_visibility = 'public'
    or (v_visibility = 'friends' and v_is_friend);

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
    'avatarUrl', v_profile.avatar_url,
    'bio', case when v_stats_visible then coalesce(v_profile.bio, '') else '' end,
    'isSelf', v_user = v_profile.id,
    'isFriend', v_is_friend,
    'isFollowing', v_is_following,
    'followsYou', v_follows_you,
    'followersCount', (
      select count(*)::integer from public.follows where following_id = v_profile.id
    ),
    'followingCount', (
      select count(*)::integer from public.follows where follower_id = v_profile.id
    ),
    'followingPrivate', v_following_privacy = 'private',
    'statsVisible', v_stats_visible,
    'relation', case
      when v_is_friend then 'friend'
      when v_is_following then 'outgoing'
      when v_follows_you then 'incoming'
      else 'none'
    end,
    'requestId', null,
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

-- Legacy request API: a request is now just a follow. Keeping the functions
-- prevents old cached clients from bypassing the follow graph.
create or replace function public.send_friend_request(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_result := public.follow_player(p_username);

  return v_result || jsonb_build_object(
    'requestId', null,
    'status', 'following'
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

  if p_accept then
    insert into public.follows (follower_id, following_id)
    values (v_user, v_friend.requester_id)
    on conflict (follower_id, following_id) do nothing;
  else
    update public.friendships
       set status = 'declined',
           responded_at = now()
     where id = p_request_id;
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

  -- "Hapus teman" breaks the friendship completely. Unfollow (one direction)
  -- remains available through unfollow_player.
  delete from public.follows
  where (follower_id = v_user and following_id = p_user_id)
     or (follower_id = p_user_id and following_id = v_user);

  get diagnostics v_count = row_count;

  delete from public.friendships
  where least(requester_id, addressee_id) = least(v_user, p_user_id)
    and greatest(requester_id, addressee_id) = greatest(v_user, p_user_id);

  return jsonb_build_object('removed', v_count > 0);
end;
$$;

-- Admin moderation must break the follow graph too, otherwise the cached
-- friendship would simply be considered active by are_friends().
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
  v_requester uuid;
  v_addressee uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('social.moderate');
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;

  select
    jsonb_build_object(
      'id', f.id, 'status', f.status,
      'requesterId', f.requester_id, 'addresseeId', f.addressee_id
    ),
    f.requester_id,
    f.addressee_id
  into v_before, v_requester, v_addressee
  from public.friendships f where f.id = p_friendship_id;

  if v_before is null then
    raise exception 'friendship_not_found' using errcode = 'P0002';
  end if;

  delete from public.follows
  where (follower_id = v_requester and following_id = v_addressee)
     or (follower_id = v_addressee and following_id = v_requester);

  delete from public.friendships where id = p_friendship_id;

  perform public.admin_audit(
    'friendship_moderate_remove', 'friendship', p_friendship_id::text,
    v_reason, v_before, jsonb_build_object('removed', true)
  );
  return jsonb_build_object('id', p_friendship_id, 'removed', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
revoke all on function public.following_is_public(uuid) from public, anon;
revoke all on function public.sync_follow_friendship(uuid, uuid) from public, anon, authenticated;
revoke all on function public.sync_follow_friendship_trigger() from public, anon, authenticated;

revoke all on function public.follow_player(text) from public, anon;
revoke all on function public.unfollow_player(uuid) from public, anon;
revoke all on function public.get_follow_suggestions(integer) from public, anon;
revoke all on function public.get_new_followers(integer) from public, anon;
revoke all on function public.get_followers(text) from public, anon;
revoke all on function public.get_following(text) from public, anon;

grant execute on function public.following_is_public(uuid) to authenticated;
grant execute on function public.follow_player(text) to authenticated;
grant execute on function public.unfollow_player(uuid) to authenticated;
grant execute on function public.get_follow_suggestions(integer) to authenticated;
grant execute on function public.get_new_followers(integer) to authenticated;
grant execute on function public.get_followers(text) to authenticated;
grant execute on function public.get_following(text) to authenticated;
