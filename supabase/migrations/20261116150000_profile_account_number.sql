-- Display-only numeric account ID.
--
-- `profiles.id` is a UUID primary key referenced by every player table, so it
-- must never be replaced. This column only gives the UI a stable nine-digit
-- number. The affine sequence mapping is a bijection over the 900,000,000
-- possible values, which keeps every generated number unique without retries.
create sequence if not exists public.profile_account_number_seq
  as bigint
  start with 1
  increment by 1;

create or replace function public.next_profile_account_number()
returns bigint
language sql
volatile
set search_path = public, pg_temp
as $$
  select 100000000::bigint + (
    (
      (nextval('public.profile_account_number_seq') % 900000000::bigint)
      * 982451653::bigint
    ) % 900000000::bigint
  );
$$;

comment on function public.next_profile_account_number()
  is 'Generates a stable nine-digit display ID. The UUID remains the real key.';

alter table public.profiles
  add column if not exists account_number bigint
  not null default public.next_profile_account_number();

comment on column public.profiles.account_number
  is 'Nine-digit display ID. Never used as a primary or foreign key.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_account_number_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_number_key unique (account_number);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_account_number_range'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_number_range
      check (account_number between 100000000 and 999999999);
  end if;
end $$;
