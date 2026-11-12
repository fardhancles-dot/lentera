-- Maintenance mode enforcement.
--
-- `site_settings.maintenance_mode` is written by the admin dashboard. This
-- migration makes the flag real on the server: while it is on, every write
-- statement against a player-state table is rejected for non-staff users.
-- Reads stay available so the app can load and explain the situation.
--
-- Writes with no end-user identity (migrations, seeds, service-role jobs) are
-- allowed on purpose. Staff writes are allowed so administrators can still
-- moderate, grant rewards, and turn maintenance off again.

create or replace function public.site_maintenance_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select s.maintenance_mode from public.site_settings s where s.id),
    false
  );
$$;

revoke all on function public.site_maintenance_active() from public, anon;
grant execute on function public.site_maintenance_active() to authenticated;

create or replace function public.enforce_maintenance_mode()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  -- Service-role jobs, migrations, and the signup trigger run without an
  -- end-user JWT. They must never be blocked by maintenance mode.
  if auth.uid() is null then
    return null;
  end if;

  if public.site_maintenance_active() and not public.is_staff() then
    raise exception 'Lentera sedang dalam mode pemeliharaan. Aksi tulis dinonaktifkan sementara.'
      using errcode = 'P0001';
  end if;

  return null;
end;
$$;

-- Statement-level triggers: one check per statement, not per row. Add new
-- player-write tables to this list when a feature starts writing them.
do $$
declare
  v_table text;
  v_tables text[] := array[
    'profiles',
    'user_settings',
    'lesson_attempts',
    'answer_attempts',
    'practice_sessions',
    'practice_answers',
    'practice_session_questions',
    'user_question_mastery',
    'user_hearts',
    'user_streaks',
    'user_streak_milestones',
    'user_wallets',
    'user_xp_ledger',
    'coin_transactions',
    'user_quest_claims',
    'user_achievements',
    'user_course_progress',
    'user_level_rewards',
    'user_node_progress',
    'user_reward_claims',
    'user_event_claims',
    'shop_purchases',
    'user_inventory',
    'friendships',
    'friend_quests',
    'friend_quest_members',
    'friend_quest_claims',
    'notifications',
    'league_members',
    'league_results'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;
    execute format(
      'drop trigger if exists maintenance_guard on public.%I',
      v_table
    );
    execute format(
      'create trigger maintenance_guard before insert or update or delete on public.%I
       for each statement execute function public.enforce_maintenance_mode()',
      v_table
    );
  end loop;
end;
$$;
