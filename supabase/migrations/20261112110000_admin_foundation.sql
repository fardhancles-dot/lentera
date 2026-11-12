-- Lentera · Admin CMS foundation
-- Granular permissions, admin context, expanded audit helpers, overview,
-- user directory/detail/role management, and analytics.
-- Additive: existing player RPCs, RLS, and rewards stay untouched.

-- ---------------------------------------------------------------------------
-- Permission catalog
-- ---------------------------------------------------------------------------
create table if not exists public.admin_permissions (
  code text primary key check (code ~ '^[a-z]+(\.[a-z_]+)+$'),
  label text not null,
  group_name text not null,
  sort_order integer not null default 0
);

create table if not exists public.role_permissions (
  role public.app_role not null,
  permission text not null references public.admin_permissions (code) on delete cascade,
  primary key (role, permission)
);

insert into public.admin_permissions (code, label, group_name, sort_order) values
  ('dashboard.read', 'Lihat ringkasan', 'Dashboard', 1),
  ('curriculum.read', 'Lihat kurikulum', 'Pembelajaran', 10),
  ('curriculum.edit', 'Ubah kurikulum', 'Pembelajaran', 11),
  ('curriculum.publish', 'Terbitkan kurikulum', 'Pembelajaran', 12),
  ('questions.read', 'Lihat bank soal', 'Pembelajaran', 20),
  ('questions.edit', 'Ubah bank soal', 'Pembelajaran', 21),
  ('media.manage', 'Kelola media', 'Pembelajaran', 30),
  ('users.read', 'Lihat pengguna', 'Pengguna', 40),
  ('users.manage', 'Kelola pengguna', 'Pengguna', 41),
  ('users.suspend', 'Suspend pengguna', 'Pengguna', 42),
  ('roles.manage', 'Kelola role dan izin', 'Pengguna', 43),
  ('gamification.manage', 'Kelola gamifikasi', 'Gamifikasi', 50),
  ('social.moderate', 'Moderasi sosial', 'Sosial', 60),
  ('content.manage', 'Kelola konten website', 'Konten Website', 70),
  ('announcements.manage', 'Kelola pengumuman', 'Konten Website', 71),
  ('analytics.read', 'Lihat analytics', 'Analytics', 80),
  ('system.manage', 'Kelola sistem', 'Sistem', 90),
  ('audit.read', 'Lihat audit log', 'Sistem', 91)
on conflict (code) do update set
  label = excluded.label,
  group_name = excluded.group_name,
  sort_order = excluded.sort_order;

-- Developer implicitly holds every permission; the rows make the matrix
-- readable and keep permission checks uniform.
insert into public.role_permissions (role, permission)
select 'developer'::public.app_role, code from public.admin_permissions
on conflict do nothing;

insert into public.role_permissions (role, permission) values
  ('admin', 'dashboard.read'),
  ('admin', 'curriculum.read'),
  ('admin', 'curriculum.edit'),
  ('admin', 'curriculum.publish'),
  ('admin', 'questions.read'),
  ('admin', 'questions.edit'),
  ('admin', 'media.manage'),
  ('admin', 'users.read'),
  ('admin', 'users.manage'),
  ('admin', 'gamification.manage'),
  ('admin', 'social.moderate'),
  ('admin', 'content.manage'),
  ('admin', 'announcements.manage'),
  ('admin', 'analytics.read'),
  ('admin', 'audit.read')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------
create or replace function public.admin_has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.is_staff()
    and coalesce(p_permission, '') <> ''
    and (
      public.current_user_role() = 'developer'
      or exists (
        select 1
        from public.role_permissions rp
        where rp.role = public.current_user_role()
          and rp.permission = p_permission
      )
    );
$$;

create or replace function public.admin_require_permission(p_permission text)
returns void
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.admin_has_permission(p_permission) then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_is_developer()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_user_role() = 'developer';
$$;

-- Internal audit helper with before/after snapshots and a reason.
create or replace function public.admin_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_reason text,
  p_before jsonb,
  p_after jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return public.log_audit(
    p_action,
    p_target_type,
    p_target_id,
    jsonb_build_object(
      'reason', nullif(btrim(coalesce(p_reason, '')), ''),
      'before', coalesce(p_before, '{}'::jsonb),
      'after', coalesce(p_after, '{}'::jsonb)
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin context
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_role public.app_role := 'player';
  v_permissions jsonb;
  v_catalog jsonb;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not public.is_staff() then
    raise exception 'staff_required' using errcode = '42501';
  end if;

  v_role := public.current_user_role();

  select coalesce(jsonb_agg(rp.permission order by p.sort_order), '[]'::jsonb)
  into v_permissions
  from public.role_permissions rp
  join public.admin_permissions p on p.code = rp.permission
  where v_role = 'developer'
     or rp.role = v_role;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', p.code,
    'label', p.label,
    'group', p.group_name,
    'sortOrder', p.sort_order
  ) order by p.sort_order), '[]'::jsonb)
  into v_catalog
  from public.admin_permissions p;

  return jsonb_build_object(
    'role', v_role,
    'isDeveloper', v_role = 'developer',
    'permissions', v_permissions,
    'catalog', v_catalog
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Overview
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_base jsonb;
  v_daily jsonb;
  v_warnings jsonb;
begin
  perform public.admin_require_permission('dashboard.read');
  v_base := public.get_developer_overview();

  select coalesce(jsonb_agg(jsonb_build_object(
    'date', d::date,
    'users', (
      select count(*)::integer from public.profiles p
      where p.created_at >= d and p.created_at < d + interval '1 day'
    ),
    'lessons', (
      select count(*)::integer from public.lesson_attempts a
      where a.completed_at >= d and a.completed_at < d + interval '1 day'
    ),
    'practices', (
      select count(*)::integer from public.practice_sessions s
      where s.completed_at >= d and s.completed_at < d + interval '1 day'
    ),
    'xp', (
      select coalesce(sum(x.amount), 0)::integer from public.user_xp_ledger x
      where x.created_at >= d and x.created_at < d + interval '1 day'
    )
  ) order by d), '[]'::jsonb)
  into v_daily
  from generate_series(current_date - 13, current_date, interval '1 day') d;

  select jsonb_build_array(
    jsonb_build_object(
      'code', 'lessons_without_questions',
      'label', 'Lesson terbit tanpa soal aktif',
      'count', (
        select count(*)::integer
        from public.lessons l
        where l.is_published
          and not exists (
            select 1 from public.questions q
            where q.lesson_id = l.id and q.is_active
          )
      )
    ),
    jsonb_build_object(
      'code', 'nodes_without_lesson',
      'label', 'Node non-reward tanpa lesson',
      'count', (
        select count(*)::integer
        from public.learning_nodes n
        where n.is_active
          and n.node_type <> 'reward'
          and n.lesson_id is null
      )
    ),
    jsonb_build_object(
      'code', 'empty_levels',
      'label', 'Level terbit tanpa unit',
      'count', (
        select count(*)::integer
        from public.course_levels lv
        where lv.is_published
          and not exists (
            select 1 from public.units u where u.course_level_id = lv.id
          )
      )
    ),
    jsonb_build_object(
      'code', 'subjects_without_course',
      'label', 'Mapel aktif tanpa kursus',
      'count', (
        select count(*)::integer
        from public.subjects s
        where s.status = 'active'
          and not exists (
            select 1 from public.courses c where c.subject_id = s.id
          )
      )
    )
  ) into v_warnings;

  return v_base || jsonb_build_object(
    'daily', v_daily,
    'warnings', v_warnings,
    'drafts', jsonb_build_object(
      'subjects', (
        select count(*)::integer from public.subjects where status = 'development'
      ),
      'courses', (
        select count(*)::integer from public.courses where not is_published
      ),
      'levels', (
        select count(*)::integer from public.course_levels where not is_published
      ),
      'units', (
        select count(*)::integer from public.units where not is_published
      ),
      'lessons', (
        select count(*)::integer from public.lessons where not is_published
      ),
      'questions', (
        select count(*)::integer from public.questions where not is_active
      )
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- User directory, detail, and role management
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users(
  p_search text default '',
  p_role text default '',
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_search text := btrim(coalesce(p_search, ''));
  v_role text := btrim(coalesce(p_role, ''));
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_size integer := greatest(5, least(coalesce(p_page_size, 20), 100));
  v_offset integer := (v_page - 1) * v_size;
  v_total integer;
  v_items jsonb;
begin
  perform public.admin_require_permission('users.read');

  with filtered as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_key,
      p.onboarding_completed,
      p.created_at,
      u.email,
      coalesce(r.role, 'player') as role
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.user_roles r on r.user_id = p.id
    where (
      v_search = ''
      or position(lower(v_search) in lower(p.username::text)) > 0
      or position(lower(v_search) in lower(p.display_name)) > 0
      or position(lower(v_search) in lower(coalesce(u.email, ''))) > 0
    )
      and (v_role = '' or coalesce(r.role, 'player')::text = v_role)
  )
  select count(*)::integer into v_total from filtered;

  with filtered as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_key,
      p.onboarding_completed,
      p.created_at,
      u.email,
      coalesce(r.role, 'player') as role
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.user_roles r on r.user_id = p.id
    where (
      v_search = ''
      or position(lower(v_search) in lower(p.username::text)) > 0
      or position(lower(v_search) in lower(p.display_name)) > 0
      or position(lower(v_search) in lower(coalesce(u.email, ''))) > 0
    )
      and (v_role = '' or coalesce(r.role, 'player')::text = v_role)
    order by p.created_at desc
    limit v_size offset v_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'userId', f.id,
    'email', coalesce(f.email, ''),
    'username', f.username,
    'displayName', coalesce(nullif(f.display_name, ''), f.username),
    'avatarKey', f.avatar_key,
    'role', f.role,
    'onboardingCompleted', f.onboarding_completed,
    'joinedAt', f.created_at,
    'totalXp', (
      select coalesce(sum(x.amount), 0)::integer
      from public.user_xp_ledger x where x.user_id = f.id
    ),
    'coins', (
      select coalesce(w.coins, 0)::integer
      from public.user_wallets w where w.user_id = f.id
    ),
    'hearts', (
      select h.current_hearts from public.user_hearts h where h.user_id = f.id
    ),
    'lastActiveAt', greatest(
      (select max(x.created_at) from public.user_xp_ledger x where x.user_id = f.id),
      (select max(a.started_at) from public.lesson_attempts a where a.user_id = f.id),
      (select max(s.started_at) from public.practice_sessions s where s.user_id = f.id)
    )
  ) order by f.created_at desc), '[]'::jsonb)
  into v_items
  from filtered f;

  return jsonb_build_object(
    'total', v_total,
    'page', v_page,
    'pageSize', v_size,
    'items', v_items
  );
end;
$$;

create or replace function public.admin_get_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile public.profiles;
  v_email text;
  v_role public.app_role := 'player';
  v_result jsonb;
begin
  perform public.admin_require_permission('users.read');
  if p_user_id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = p_user_id;
  if v_profile.id is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  select email into v_email from auth.users where id = p_user_id;
  select role into v_role from public.user_roles where user_id = p_user_id;

  select jsonb_build_object(
    'user', jsonb_build_object(
      'userId', v_profile.id,
      'email', coalesce(v_email, ''),
      'username', v_profile.username,
      'displayName', coalesce(nullif(v_profile.display_name, ''), v_profile.username),
      'avatarKey', v_profile.avatar_key,
      'bio', v_profile.bio,
      'role', coalesce(v_role, 'player'),
      'onboardingCompleted', v_profile.onboarding_completed,
      'joinedAt', v_profile.created_at,
      'totalXp', (
        select coalesce(sum(amount), 0)::integer
        from public.user_xp_ledger where user_id = p_user_id
      ),
      'coins', (
        select coalesce(coins, 0)::integer
        from public.user_wallets where user_id = p_user_id
      ),
      'hearts', (
        select current_hearts from public.user_hearts where user_id = p_user_id
      ),
      'maxHearts', (
        select max_hearts from public.user_hearts where user_id = p_user_id
      ),
      'streak', (
        select current_streak from public.user_streaks where user_id = p_user_id
      ),
      'longestStreak', (
        select longest_streak from public.user_streaks where user_id = p_user_id
      )
    ),
    'settings', (
      select jsonb_build_object(
        'locale', s.locale,
        'timezone', s.timezone,
        'dailyGoalMinutes', s.daily_goal_minutes,
        'emailOptIn', s.email_opt_in
      )
      from public.user_settings s where s.user_id = p_user_id
    ),
    'counts', jsonb_build_object(
      'lessonAttempts', (
        select count(*)::integer from public.lesson_attempts where user_id = p_user_id
      ),
      'lessonsCompleted', (
        select count(*)::integer from public.lesson_attempts
        where user_id = p_user_id and status = 'completed' and accuracy >= 60
      ),
      'questionsAnswered', (
        select count(*)::integer from public.answer_attempts where user_id = p_user_id
      ) + (
        select count(*)::integer from public.practice_answers where user_id = p_user_id
      ),
      'practices', (
        select count(*)::integer from public.practice_sessions
        where user_id = p_user_id and status = 'completed'
      ),
      'nodesCompleted', (
        select count(*)::integer from public.user_node_progress
        where user_id = p_user_id and status = 'completed'
      ),
      'rewardsClaimed', (
        select count(*)::integer from public.user_reward_claims where user_id = p_user_id
      ),
      'friendQuests', (
        select count(*)::integer from public.friend_quest_members where user_id = p_user_id
      )
    ),
    'recentAttempts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'lessonTitle', l.title,
        'status', a.status,
        'accuracy', a.accuracy,
        'correctCount', a.correct_count,
        'totalCount', a.total_count,
        'startedAt', a.started_at,
        'completedAt', a.completed_at
      ) order by a.started_at desc), '[]'::jsonb)
      from (
        select * from public.lesson_attempts
        where user_id = p_user_id
        order by started_at desc limit 10
      ) a
      join public.lessons l on l.id = a.lesson_id
    ),
    'xpHistory', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'amount', x.amount,
        'source', x.source,
        'createdAt', x.created_at
      ) order by x.created_at desc), '[]'::jsonb)
      from (
        select * from public.user_xp_ledger
        where user_id = p_user_id
        order by created_at desc limit 10
      ) x
    ),
    'coinHistory', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'amount', c.amount,
        'source', c.source,
        'createdAt', c.created_at
      ) order by c.created_at desc), '[]'::jsonb)
      from (
        select * from public.coin_transactions
        where user_id = p_user_id
        order by created_at desc limit 10
      ) c
    ),
    'inventory', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', i.name,
        'quantity', inv.quantity
      ) order by i.sort_order), '[]'::jsonb)
      from public.user_inventory inv
      join public.shop_items i on i.id = inv.item_id
      where inv.user_id = p_user_id
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role public.app_role;
  v_old_role public.app_role := 'player';
  v_reason text := btrim(coalesce(p_reason, ''));
  v_developer_count integer;
  v_username text;
begin
  perform public.admin_require_permission('roles.manage');

  if p_user_id is null or p_role is null then
    raise exception 'user_role_invalid' using errcode = '22023';
  end if;
  if p_user_id = v_actor then
    raise exception 'cannot_change_own_role' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;

  v_actor_role := public.current_user_role();
  select role into v_old_role from public.user_roles where user_id = p_user_id;
  v_old_role := coalesce(v_old_role, 'player');

  -- Only a developer may create another developer or change a developer.
  if (p_role = 'developer' or v_old_role = 'developer') and v_actor_role <> 'developer' then
    raise exception 'developer_required' using errcode = '42501';
  end if;

  select username into v_username from public.profiles where id = p_user_id;
  if v_username is null then
    raise exception 'player_not_found' using errcode = 'P0002';
  end if;

  if v_old_role = 'developer' and p_role <> 'developer' then
    select count(*)::integer into v_developer_count
    from public.user_roles where role = 'developer';
    if v_developer_count <= 1 then
      raise exception 'last_developer' using errcode = '22023';
    end if;
  end if;

  insert into public.user_roles (user_id, role, granted_at, granted_by)
  values (p_user_id, p_role, now(), v_actor)
  on conflict (user_id) do update set
    role = excluded.role,
    granted_at = now(),
    granted_by = excluded.granted_by;

  perform public.admin_audit(
    'user_role_change',
    'player',
    p_user_id::text,
    v_reason,
    jsonb_build_object('username', v_username, 'role', v_old_role),
    jsonb_build_object('username', v_username, 'role', p_role)
  );

  return jsonb_build_object(
    'userId', p_user_id,
    'username', v_username,
    'previousRole', v_old_role,
    'role', p_role
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_analytics(p_days integer default 14)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 14), 90));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_daily jsonb;
  v_top_lessons jsonb;
begin
  perform public.admin_require_permission('analytics.read');

  select coalesce(jsonb_agg(jsonb_build_object(
    'date', d::date,
    'registrations', (
      select count(*)::integer from public.profiles p
      where p.created_at >= d and p.created_at < d + interval '1 day'
    ),
    'activeUsers', (
      select count(distinct x.user_id)::integer from public.user_xp_ledger x
      where x.created_at >= d and x.created_at < d + interval '1 day'
    ),
    'lessonsCompleted', (
      select count(*)::integer from public.lesson_attempts a
      where a.completed_at >= d and a.completed_at < d + interval '1 day'
        and a.accuracy >= 60
    ),
    'practicesCompleted', (
      select count(*)::integer from public.practice_sessions s
      where s.completed_at >= d and s.completed_at < d + interval '1 day'
        and s.status = 'completed'
    ),
    'questionsAnswered', (
      select count(*)::integer from public.answer_attempts aa
      where aa.answered_at >= d and aa.answered_at < d + interval '1 day'
    ) + (
      select count(*)::integer from public.practice_answers pa
      where pa.answered_at >= d and pa.answered_at < d + interval '1 day'
    ),
    'xp', (
      select coalesce(sum(x.amount), 0)::integer from public.user_xp_ledger x
      where x.created_at >= d and x.created_at < d + interval '1 day'
    ),
    'coins', (
      select coalesce(sum(c.amount), 0)::integer from public.coin_transactions c
      where c.created_at >= d and c.created_at < d + interval '1 day'
        and c.amount > 0
    )
  ) order by d), '[]'::jsonb)
  into v_daily
  from generate_series(
    (current_date - (v_days - 1))::timestamp,
    current_date::timestamp,
    interval '1 day'
  ) d;

  select coalesce(jsonb_agg(jsonb_build_object(
    'lessonId', t.lesson_id,
    'title', t.title,
    'attempts', t.attempts,
    'passed', t.passed,
    'accuracy', t.accuracy
  ) order by t.attempts desc), '[]'::jsonb)
  into v_top_lessons
  from (
    select
      l.id as lesson_id,
      l.title,
      count(a.id)::integer as attempts,
      count(*) filter (where a.accuracy >= 60)::integer as passed,
      case
        when count(a.id) > 0 then round(avg(a.accuracy))::integer
        else 0
      end as accuracy
    from public.lesson_attempts a
    join public.lessons l on l.id = a.lesson_id
    where a.started_at >= v_since
    group by l.id, l.title
    order by count(a.id) desc
    limit 8
  ) t;

  return jsonb_build_object(
    'days', v_days,
    'since', v_since,
    'totals', jsonb_build_object(
      'users', (select count(*)::integer from public.profiles),
      'newUsers', (
        select count(*)::integer from public.profiles where created_at >= v_since
      ),
      'activeUsers', (
        select count(distinct user_id)::integer
        from public.user_xp_ledger where created_at >= v_since
      ),
      'lessonAttempts', (
        select count(*)::integer from public.lesson_attempts where started_at >= v_since
      ),
      'lessonsCompleted', (
        select count(*)::integer from public.lesson_attempts
        where completed_at >= v_since and accuracy >= 60
      ),
      'practicesCompleted', (
        select count(*)::integer from public.practice_sessions
        where completed_at >= v_since and status = 'completed'
      ),
      'questionsAnswered', (
        select count(*)::integer from public.answer_attempts where answered_at >= v_since
      ) + (
        select count(*)::integer from public.practice_answers where answered_at >= v_since
      ),
      'correctAnswers', (
        select count(*)::integer from public.answer_attempts
        where answered_at >= v_since and is_correct
      ) + (
        select count(*)::integer from public.practice_answers
        where answered_at >= v_since and is_correct
      ),
      'xpAwarded', (
        select coalesce(sum(amount), 0)::integer from public.user_xp_ledger
        where created_at >= v_since
      ),
      'coinsEarned', (
        select coalesce(sum(amount), 0)::integer from public.coin_transactions
        where created_at >= v_since and amount > 0
      ),
      'coinsSpent', (
        select coalesce(sum(-amount), 0)::integer from public.coin_transactions
        where created_at >= v_since and amount < 0
      ),
      'friendQuests', (
        select count(*)::integer from public.friend_quests where created_at >= v_since
      ),
      'shopPurchases', (
        select count(*)::integer from public.shop_purchases where created_at >= v_since
      ),
      'questClaims', (
        select count(*)::integer from public.user_quest_claims where claimed_at >= v_since
      ),
      'achievementsUnlocked', (
        select count(*)::integer from public.user_achievements where awarded_at >= v_since
      )
    ),
    'daily', v_daily,
    'topLessons', v_top_lessons
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permission matrix mutation (developer only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_role_permission(
  p_role public.app_role,
  p_permission text,
  p_allowed boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.admin_require_permission('roles.manage');
  if not public.admin_is_developer() then
    raise exception 'developer_required' using errcode = '42501';
  end if;
  if p_role = 'developer' then
    raise exception 'developer_permissions_implicit' using errcode = '22023';
  end if;
  if not exists (select 1 from public.admin_permissions where code = p_permission) then
    raise exception 'permission_unknown' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 160 then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;

  if coalesce(p_allowed, false) then
    insert into public.role_permissions (role, permission)
    values (p_role, p_permission)
    on conflict do nothing;
  else
    delete from public.role_permissions
    where role = p_role and permission = p_permission;
  end if;

  perform public.admin_audit(
    'role_permission_change',
    'role',
    p_role::text,
    v_reason,
    '{}'::jsonb,
    jsonb_build_object('permission', p_permission, 'allowed', coalesce(p_allowed, false))
  );

  return jsonb_build_object(
    'role', p_role,
    'permission', p_permission,
    'allowed', coalesce(p_allowed, false)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
alter table public.admin_permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists admin_permissions_select_staff on public.admin_permissions;
create policy admin_permissions_select_staff
  on public.admin_permissions for select to authenticated
  using (public.is_staff());

drop policy if exists role_permissions_select_staff on public.role_permissions;
create policy role_permissions_select_staff
  on public.role_permissions for select to authenticated
  using (public.is_staff());

revoke all on public.admin_permissions from anon, authenticated;
revoke all on public.role_permissions from anon, authenticated;
grant select on public.admin_permissions to authenticated;
grant select on public.role_permissions to authenticated;

revoke all on function public.admin_has_permission(text) from public, anon;
revoke all on function public.admin_require_permission(text) from public, anon;
revoke all on function public.admin_is_developer() from public, anon;
revoke all on function public.admin_audit(text, text, text, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_get_context() from public, anon;
revoke all on function public.admin_get_overview() from public, anon;
revoke all on function public.admin_list_users(text, text, integer, integer) from public, anon;
revoke all on function public.admin_get_user_detail(uuid) from public, anon;
revoke all on function public.admin_set_user_role(uuid, public.app_role, text) from public, anon;
revoke all on function public.admin_get_analytics(integer) from public, anon;
revoke all on function public.admin_set_role_permission(public.app_role, text, boolean, text)
  from public, anon;

grant execute on function public.admin_has_permission(text) to authenticated;
grant execute on function public.admin_get_context() to authenticated;
grant execute on function public.admin_get_overview() to authenticated;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;
grant execute on function public.admin_get_user_detail(uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.app_role, text) to authenticated;
grant execute on function public.admin_get_analytics(integer) to authenticated;
grant execute on function public.admin_set_role_permission(public.app_role, text, boolean, text)
  to authenticated;
