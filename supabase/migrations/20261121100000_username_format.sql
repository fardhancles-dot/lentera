-- Lentera · Username format
-- Allows mixed case, spaces, and common username symbols while keeping the
-- existing 3–20 character limit. Emoji and other pictographic characters are
-- rejected because they are not part of the allowlist. Existing usernames
-- already satisfy the new rule, so no profile data is rewritten.

alter table public.profiles
  drop constraint if exists profiles_username_lowercase;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format check (
    username ~ '^[A-Za-z0-9 @_.!$%&+-]{3,20}$'
    and username::text = btrim(username::text)
  );

comment on column public.profiles.username is 'Unique handle (citext). 3–20 characters: letters, digits, spaces, and @ _ . ! $ % & + -. Emoji are not allowed.';

-- Keep the entered case instead of forcing lowercase. Uniqueness remains
-- case-insensitive because the column is citext.
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
     set username = btrim(p_username),
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
