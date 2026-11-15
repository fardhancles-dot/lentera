-- Lentera · Global red-dot notification indicators.
-- One server read supplies every badge. No new event store: the counts are
-- derived from quests, achievements, notifications, rewards, league, event,
-- friend quests, and learning reward nodes that already exist.

-- A newly unlocked achievement is a real server event. `seen_at` records that
-- the player has opened the Misi & Pencapaian page on any device.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_achievements'
      and column_name = 'seen_at'
  ) then
    alter table public.user_achievements
      add column seen_at timestamptz;

    -- Do not show a retroactive dot for achievements unlocked before this
    -- feature existed. New unlocks after this migration start unseen.
    update public.user_achievements
       set seen_at = awarded_at
     where seen_at is null;
  end if;
end $$;

create index if not exists user_achievements_unseen_idx
  on public.user_achievements (user_id)
  where seen_at is null;

create or replace function public.get_notification_indicators()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_tz text := 'Asia/Jakarta';
  v_today date;
  v_notifications integer := 0;
  v_inbox integer := 0;
  v_quests integer := 0;
  v_achievements integer := 0;
  v_learn_rewards integer := 0;
  v_league integer := 0;
  v_friends integer := 0;
  v_event public.game_events;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- XP can unlock an achievement between page loads. Evaluate here so a new
  -- unlock appears without visiting the achievement page first.
  perform public.evaluate_achievements(v_user);

  select coalesce(nullif(timezone, ''), 'Asia/Jakarta')
    into v_tz
  from public.user_settings
  where user_id = v_user;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'Asia/Jakarta'))::date;
  exception when others then
    v_tz := 'Asia/Jakarta';
    v_today := (now() at time zone 'Asia/Jakarta')::date;
  end;

  select count(*)::integer
    into v_notifications
  from public.notifications
  where user_id = v_user
    and read_at is null;

  -- New followers already create a notification with kind new_follower. Inbox
  -- reads use that same read_at state, so nothing is stored twice.
  select count(*)::integer
    into v_inbox
  from public.notifications
  where user_id = v_user
    and kind = 'new_follower'
    and read_at is null;

  select count(*)::integer
    into v_quests
  from public.quest_definitions d
  cross join lateral (
    select
      public.quest_period_start(d.cadence, v_today) as period_start,
      public.quest_period_start(d.cadence, v_today)
        + case when d.cadence = 'weekly' then 7 else 1 end as period_end
  ) p
  left join public.user_quest_claims c
    on c.quest_id = d.id
   and c.user_id = v_user
   and c.period_start = p.period_start
  where d.is_active
    and c.claimed_at is null
    and public.quest_metric_value(
      v_user, d.metric, p.period_start, p.period_end, v_tz
    ) >= d.target;

  select count(*)::integer
    into v_achievements
  from public.user_achievements ua
  join public.achievement_definitions d on d.id = ua.achievement_id
  where ua.user_id = v_user
    and ua.seen_at is null
    and d.is_active;

  -- A reward node is claimable under the same rules as claim_reward_node:
  -- every active lesson in its level is complete and it has not been claimed.
  select count(*)::integer
    into v_learn_rewards
  from public.learning_nodes n
  join public.units u on u.id = n.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where n.node_type = 'reward'
    and n.is_active
    and u.is_published
    and lv.is_published
    and c.is_published
    and s.status = 'active'
    and not exists (
      select 1 from public.user_reward_claims rc
      where rc.user_id = v_user and rc.node_id = n.id
    )
    and not exists (
      select 1
      from public.learning_nodes lesson
      join public.units lu on lu.id = lesson.unit_id
      where lu.course_level_id = lv.id
        and lesson.is_active
        and lesson.lesson_id is not null
        and not exists (
          select 1 from public.user_node_progress p
          where p.user_id = v_user
            and p.node_id = lesson.id
            and p.status = 'completed'
        )
    );

  -- The Liga page only exposes the latest previous result, so only that one
  -- can keep the badge alive.
  select count(*)::integer
    into v_league
  from public.league_results r
  where r.user_id = v_user
    and r.claimed_at is null
    and r.week_start = (
      select max(r2.week_start)
      from public.league_results r2
      where r2.user_id = v_user
    );

  v_event := public.ensure_week_event(public.league_week_start(now()));
  if public.weekly_xp_for(v_user, v_event.week_start) >= v_event.target_xp
     and not exists (
       select 1 from public.user_event_claims
       where user_id = v_user and event_id = v_event.id
     ) then
    v_league := v_league + 1;
  end if;

  select count(*)::integer
    into v_friends
  from public.friend_quests q
  join public.friend_quest_members m on m.quest_id = q.id
  where m.user_id = v_user
    and q.status = 'completed'
    and now() < q.ends_at
    and not exists (
      select 1 from public.friend_quest_claims c
      where c.quest_id = q.id and c.user_id = v_user
    );

  return jsonb_build_object(
    'notifications', v_notifications,
    'inbox', v_inbox,
    'quests', v_quests,
    'achievements', v_achievements,
    'learnRewards', v_learn_rewards,
    'league', v_league,
    'friends', v_friends
  );
end;
$$;

create or replace function public.mark_achievements_seen()
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

  update public.user_achievements
     set seen_at = now()
   where user_id = v_user
     and seen_at is null;

  get diagnostics v_updated = row_count;
  return jsonb_build_object('updated', v_updated);
end;
$$;

create or replace function public.mark_inbox_notifications_read()
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
     and kind = 'new_follower'
     and read_at is null;

  get diagnostics v_updated = row_count;
  return jsonb_build_object('updated', v_updated);
end;
$$;

revoke all on function public.get_notification_indicators() from public, anon;
revoke all on function public.mark_achievements_seen() from public, anon;
revoke all on function public.mark_inbox_notifications_read() from public, anon;

grant execute on function public.get_notification_indicators() to authenticated;
grant execute on function public.mark_achievements_seen() to authenticated;
grant execute on function public.mark_inbox_notifications_read() to authenticated;
