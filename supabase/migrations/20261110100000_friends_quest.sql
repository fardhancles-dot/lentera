-- Lentera · Friends Quest
-- A small co-op layer for the twentieth mini-game. It intentionally does not
-- implement the full Tahap 7 friendship graph: players share an invite code,
-- every contribution is counted from server-written XP, and rewards are claimed
-- once per member. The tables are reusable by the later social system.

create table if not exists public.friend_quests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text not null default '',
  target_xp integer not null check (target_xp between 20 and 10000),
  reward_xp integer not null check (reward_xp between 0 and 1000),
  reward_coins integer not null check (reward_coins between 0 and 1000),
  max_members integer not null default 8 check (max_members between 2 and 20),
  created_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_quest_members (
  quest_id uuid not null references public.friend_quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  contribution_xp integer not null default 0 check (contribution_xp >= 0),
  joined_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);

create table if not exists public.friend_quest_claims (
  quest_id uuid not null references public.friend_quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  claimed_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);

create index if not exists friend_quest_members_user_idx
  on public.friend_quest_members (user_id, joined_at desc);

alter table public.user_xp_ledger
  add column if not exists friend_quest_id uuid
  references public.friend_quests (id) on delete set null;

alter table public.coin_transactions
  add column if not exists friend_quest_id uuid
  references public.friend_quests (id) on delete set null;

create unique index if not exists user_xp_ledger_friend_quest_idx
  on public.user_xp_ledger (friend_quest_id, user_id)
  where friend_quest_id is not null;

create unique index if not exists coin_transactions_friend_quest_idx
  on public.coin_transactions (friend_quest_id, user_id)
  where friend_quest_id is not null;

-- Membership checks are used by RLS. Security definer avoids recursive RLS
-- evaluation on friend_quest_members.
create or replace function public.is_friend_quest_member(
  p_quest_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.friend_quest_members
    where quest_id = p_quest_id and user_id = p_user_id
  );
$$;

-- RLS-safe variant: the only member it can test is the caller.
create or replace function public.is_my_friend_quest_member(p_quest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.is_friend_quest_member(p_quest_id, auth.uid());
$$;

-- Every normal XP award from a lesson or practice session counts toward every
-- active quest the player belongs to. Quest reward XP is excluded so claiming
-- cannot inflate the next quest.
create or replace function public.track_friend_quest_progress()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quest_id uuid;
begin
  if new.amount <= 0 or new.source not in ('lesson', 'practice') then
    return new;
  end if;

  for v_quest_id in
    select m.quest_id
    from public.friend_quest_members m
    join public.friend_quests q on q.id = m.quest_id
    where m.user_id = new.user_id
      and q.status = 'active'
      and now() < q.ends_at
  loop
    update public.friend_quest_members
       set contribution_xp = contribution_xp + new.amount
     where quest_id = v_quest_id and user_id = new.user_id;

    update public.friend_quests q
       set status = 'completed'
     where q.id = v_quest_id
       and q.status = 'active'
       and (
         select coalesce(sum(contribution_xp), 0)
         from public.friend_quest_members
         where quest_id = v_quest_id
       ) >= q.target_xp;
  end loop;

  return new;
end;
$$;

drop trigger if exists user_xp_ledger_friend_quest on public.user_xp_ledger;
create trigger user_xp_ledger_friend_quest
after insert on public.user_xp_ledger
for each row execute function public.track_friend_quest_progress();

create or replace function public.friend_quest_payload(
  p_quest_id uuid,
  p_viewer uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_quest public.friend_quests;
  v_total integer;
  v_members jsonb;
  v_claimed boolean;
  v_status text;
  v_viewer_contribution integer;
begin
  select * into v_quest from public.friend_quests where id = p_quest_id;
  if v_quest.id is null then
    return null;
  end if;

  select coalesce(sum(contribution_xp), 0)::integer into v_total
  from public.friend_quest_members where quest_id = p_quest_id;

  select coalesce(contribution_xp, 0) into v_viewer_contribution
  from public.friend_quest_members
  where quest_id = p_quest_id and user_id = p_viewer;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'userId', m.user_id,
      'username', coalesce(p.username, 'pemain'),
      'displayName', coalesce(nullif(p.display_name, ''), p.username, 'Pemain'),
      'avatarKey', coalesce(p.avatar_key, 'tunas'),
      'contributionXp', m.contribution_xp,
      'isCreator', m.user_id = v_quest.created_by
    ) order by m.joined_at
  ), '[]'::jsonb) into v_members
  from public.friend_quest_members m
  left join public.profiles p on p.id = m.user_id
  where m.quest_id = p_quest_id;

  v_claimed := exists (
    select 1 from public.friend_quest_claims
    where quest_id = p_quest_id and user_id = p_viewer
  );
  v_status := case
    when v_quest.status = 'active' and now() >= v_quest.ends_at then 'expired'
    else v_quest.status
  end;

  return jsonb_build_object(
    'id', v_quest.id,
    'code', v_quest.code,
    'title', v_quest.title,
    'description', v_quest.description,
    'targetXp', v_quest.target_xp,
    'rewardXp', v_quest.reward_xp,
    'rewardCoins', v_quest.reward_coins,
    'status', v_status,
    'maxMembers', v_quest.max_members,
    'memberCount', jsonb_array_length(v_members),
    'totalXp', v_total,
    'progressPercent', least(100, round((v_total::numeric / v_quest.target_xp) * 100)::integer),
    'viewerContribution', coalesce(v_viewer_contribution, 0),
    'viewerClaimed', v_claimed,
    'canClaim', v_status = 'completed'
      and now() < v_quest.ends_at
      and not v_claimed,
    'isCreator', v_quest.created_by = p_viewer,
    'startsAt', v_quest.starts_at,
    'endsAt', v_quest.ends_at,
    'members', v_members
  );
end;
$$;

create or replace function public.create_friend_quest(
  p_title text,
  p_target_xp integer,
  p_reward_xp integer default 20,
  p_reward_coins integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_quest public.friend_quests;
  v_attempt integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if btrim(coalesce(p_title, '')) = '' or char_length(btrim(p_title)) < 3 then
    raise exception 'friend_quest_invalid_title' using errcode = '22023';
  end if;

  if p_target_xp is null or p_target_xp < 20 or p_target_xp > 10000 then
    raise exception 'friend_quest_invalid_target' using errcode = '22023';
  end if;

  if coalesce(p_reward_xp, 0) < 0 or coalesce(p_reward_xp, 0) > 1000
     or coalesce(p_reward_coins, 0) < 0 or coalesce(p_reward_coins, 0) > 1000 then
    raise exception 'friend_quest_invalid_reward' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.friend_quest_members m
    join public.friend_quests q on q.id = m.quest_id
    where m.user_id = v_user
      and q.status = 'active'
      and now() < q.ends_at
  ) >= 3 then
    raise exception 'friend_quest_limit' using errcode = '22023';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.friend_quests (
        code, title, target_xp, reward_xp, reward_coins, created_by
      )
      values (
        v_code, btrim(p_title), p_target_xp, coalesce(p_reward_xp, 0),
        coalesce(p_reward_coins, 0), v_user
      )
      returning * into v_quest;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.friend_quest_members (quest_id, user_id)
  values (v_quest.id, v_user)
  on conflict do nothing;

  return public.friend_quest_payload(v_quest.id, v_user);
end;
$$;

create or replace function public.join_friend_quest(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_quest public.friend_quests;
  v_members integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_quest
  from public.friend_quests
  where code = upper(btrim(coalesce(p_code, '')))
  for update;

  if v_quest.id is null then
    raise exception 'friend_quest_not_found' using errcode = 'P0002';
  end if;

  if v_quest.status <> 'active' or now() >= v_quest.ends_at then
    raise exception 'friend_quest_closed' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.friend_quest_members
    where quest_id = v_quest.id and user_id = v_user
  ) then
    return public.friend_quest_payload(v_quest.id, v_user);
  end if;

  select count(*)::integer into v_members
  from public.friend_quest_members where quest_id = v_quest.id;

  if v_members >= v_quest.max_members then
    raise exception 'friend_quest_full' using errcode = '22023';
  end if;

  insert into public.friend_quest_members (quest_id, user_id)
  values (v_quest.id, v_user);

  return public.friend_quest_payload(v_quest.id, v_user);
end;
$$;

create or replace function public.get_my_friend_quests()
returns jsonb
language plpgsql
stable
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

  select coalesce(jsonb_agg(
    public.friend_quest_payload(q.id, v_user) order by q.created_at desc
  ), '[]'::jsonb) into v_result
  from public.friend_quests q
  join public.friend_quest_members m on m.quest_id = q.id
  where m.user_id = v_user;

  return v_result;
end;
$$;

create or replace function public.claim_friend_quest_reward(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_quest public.friend_quests;
  v_claim public.friend_quest_claims;
  v_payload jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_quest
  from public.friend_quests
  where id = p_quest_id
  for update;

  if v_quest.id is null then
    raise exception 'friend_quest_not_found' using errcode = 'P0002';
  end if;

  if not public.is_friend_quest_member(p_quest_id, v_user) then
    raise exception 'friend_quest_not_member' using errcode = '42501';
  end if;

  if v_quest.status <> 'completed' then
    raise exception 'friend_quest_not_complete' using errcode = '22023';
  end if;

  if now() >= v_quest.ends_at then
    raise exception 'friend_quest_expired' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_quest_id::text || ':' || v_user::text, 0));

  select * into v_claim
  from public.friend_quest_claims
  where quest_id = p_quest_id and user_id = v_user;

  v_payload := public.friend_quest_payload(p_quest_id, v_user);

  if v_claim.quest_id is not null then
    return v_payload || jsonb_build_object(
      'alreadyClaimed', true,
      'xpAwarded', 0,
      'coinsAwarded', 0
    );
  end if;

  insert into public.friend_quest_claims (
    quest_id, user_id, reward_xp, reward_coins
  )
  values (
    p_quest_id, v_user, v_quest.reward_xp, v_quest.reward_coins
  );

  if v_quest.reward_xp > 0 then
    insert into public.user_xp_ledger (
      user_id, amount, source, friend_quest_id
    )
    values (
      v_user, v_quest.reward_xp, 'friend_quest_reward', p_quest_id
    )
    on conflict do nothing;
  end if;

  if v_quest.reward_coins > 0 then
    insert into public.coin_transactions (
      user_id, amount, source, friend_quest_id
    )
    values (
      v_user, v_quest.reward_coins, 'friend_quest_reward', p_quest_id
    )
    on conflict do nothing;

    insert into public.user_wallets (user_id, coins)
    values (v_user, v_quest.reward_coins)
    on conflict (user_id) do update set
      coins = public.user_wallets.coins + v_quest.reward_coins,
      updated_at = now();
  end if;

  return public.friend_quest_payload(p_quest_id, v_user)
    || jsonb_build_object(
      'alreadyClaimed', false,
      'xpAwarded', v_quest.reward_xp,
      'coinsAwarded', v_quest.reward_coins
    );
end;
$$;

alter table public.friend_quests enable row level security;
alter table public.friend_quest_members enable row level security;
alter table public.friend_quest_claims enable row level security;

drop policy if exists "friend_quests_select_member" on public.friend_quests;
create policy "friend_quests_select_member"
  on public.friend_quests for select to authenticated
  using (public.is_my_friend_quest_member(id));

drop policy if exists "friend_quest_members_select_member" on public.friend_quest_members;
create policy "friend_quest_members_select_member"
  on public.friend_quest_members for select to authenticated
  using (public.is_my_friend_quest_member(quest_id));

drop policy if exists "friend_quest_claims_select_own" on public.friend_quest_claims;
create policy "friend_quest_claims_select_own"
  on public.friend_quest_claims for select to authenticated
  using (user_id = auth.uid());

revoke all on public.friend_quests from anon, authenticated;
revoke all on public.friend_quest_members from anon, authenticated;
revoke all on public.friend_quest_claims from anon, authenticated;

grant select on public.friend_quests to authenticated;
grant select on public.friend_quest_members to authenticated;
grant select on public.friend_quest_claims to authenticated;

revoke all on function public.is_friend_quest_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_my_friend_quest_member(uuid) from public, anon;
grant execute on function public.is_my_friend_quest_member(uuid) to authenticated;
revoke all on function public.friend_quest_payload(uuid, uuid) from public, anon, authenticated;
revoke all on function public.track_friend_quest_progress() from public, anon, authenticated;
revoke all on function public.create_friend_quest(text, integer, integer, integer) from public, anon;
revoke all on function public.join_friend_quest(text) from public, anon;
revoke all on function public.get_my_friend_quests() from public, anon;
revoke all on function public.claim_friend_quest_reward(uuid) from public, anon;

grant execute on function public.create_friend_quest(text, integer, integer, integer) to authenticated;
grant execute on function public.join_friend_quest(text) to authenticated;
grant execute on function public.get_my_friend_quests() to authenticated;
grant execute on function public.claim_friend_quest_reward(uuid) to authenticated;
