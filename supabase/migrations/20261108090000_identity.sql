-- Lentera · Identity foundation
-- Covers: player profiles, role assignment, player settings, onboarding.
-- Apply in order with the Supabase SQL Editor or `supabase db push`.

create schema if not exists extensions;
create extension if not exists citext with schema extensions;

do $$
begin
  create type public.app_role as enum ('player', 'admin', 'developer');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null default '',
  avatar_key text not null default 'sprout',
  bio text not null default '',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  constraint profiles_username_lowercase check (username::text = lower(username::text)),
  constraint profiles_avatar_key_check check (avatar_key in ('sprout', 'ember', 'wave', 'star', 'berry')),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 40),
  constraint profiles_bio_length check (char_length(bio) <= 280)
);

comment on table public.profiles is 'Public player identity. One row per auth.users row, created by trigger.';
comment on column public.profiles.username is 'Unique, lowercase handle. citext blocks case variants; lowercase check enforces normalized storage.';

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ---------------------------------------------------------------------------
-- Roles (authoritative, never user_metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'player',
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null
);

comment on table public.user_roles is 'Server-controlled roles. Players have no write access.';

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'id' check (locale in ('id', 'en')),
  timezone text not null default 'Asia/Jakarta',
  daily_goal_minutes smallint not null default 10
    check (daily_goal_minutes in (5, 10, 15, 20)),
  music_volume smallint not null default 60 check (music_volume between 0 and 100),
  sfx_volume smallint not null default 80 check (sfx_volume between 0 and 100),
  voice_volume smallint not null default 80 check (voice_volume between 0 and 100),
  reduced_motion boolean not null default false,
  email_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_role('admin') or public.has_role('developer');
$$;

-- ---------------------------------------------------------------------------
-- New auth user bootstrap
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  placeholder_username text;
  initial_name text;
begin
  placeholder_username := 'player_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  initial_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pemain'
    ),
    40
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, placeholder_username, initial_name)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'player')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Onboarding (atomic: profile + learning preferences)
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_username text,
  p_display_name text,
  p_avatar_key text,
  p_daily_goal integer,
  p_timezone text
)
returns public.profiles
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_daily_goal not in (5, 10, 15, 20) then
    raise exception 'invalid_daily_goal' using errcode = '22023';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;

  if p_avatar_key not in ('sprout', 'ember', 'wave', 'star', 'berry') then
    raise exception 'invalid_avatar' using errcode = '22023';
  end if;

  update public.profiles
     set username = lower(trim(p_username)),
         display_name = trim(p_display_name),
         avatar_key = p_avatar_key,
         onboarding_completed = true
   where id = auth.uid()
   returning * into result;

  if result.id is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  update public.user_settings
     set daily_goal_minutes = p_daily_goal,
         timezone = p_timezone
   where user_id = auth.uid();

  return result;
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, integer, text) from public;
grant execute on function public.complete_onboarding(text, text, text, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Developer bootstrap (run from the SQL Editor only)
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_developer(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_id uuid;
begin
  if exists (select 1 from public.user_roles where role = 'developer') then
    raise exception 'A developer account already exists. Use promote_developer() instead.';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;

  if target_id is null then
    raise exception 'No account exists for that email. Register first, verify the email, then run this again.';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_id, 'developer')
  on conflict (user_id) do update set role = 'developer', granted_at = now();

  return target_id;
end;
$$;

create or replace function public.promote_developer(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_id uuid;
begin
  select id into target_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;

  if target_id is null then
    raise exception 'No account exists for that email.';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_id, 'developer')
  on conflict (user_id) do update set role = 'developer', granted_at = now();

  return target_id;
end;
$$;

revoke all on function public.bootstrap_developer(text) from public;
revoke all on function public.promote_developer(text) from public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_roles_select_own_or_staff" on public.user_roles;
create policy "user_roles_select_own_or_staff"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Privileges: players may only touch their own allowed columns
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_key, bio, onboarding_completed)
  on public.profiles to authenticated;

revoke all on public.user_settings from anon;
revoke insert, update, delete on public.user_settings from authenticated;
grant select on public.user_settings to authenticated;
grant update (
  locale,
  timezone,
  daily_goal_minutes,
  music_volume,
  sfx_volume,
  voice_volume,
  reduced_motion,
  email_opt_in
) on public.user_settings to authenticated;

revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_staff() to authenticated;
