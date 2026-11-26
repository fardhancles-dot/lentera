-- Lentera · Admin CMS curriculum and question bank
-- Staff-only RPCs. Draft rows are readable by admins through these functions,
-- while player-facing RLS stays unchanged. Question keys never leave these
-- staff RPCs and are never exposed by gameplay payloads.

-- ---------------------------------------------------------------------------
-- Read the whole curriculum tree, including drafts and archived rows
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_curriculum()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_result jsonb;
begin
  perform public.admin_require_permission('curriculum.read');

  select coalesce(jsonb_agg(subject_row order by subject_row->>'sortOrder'), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'name', s.name,
      'shortName', s.short_name,
      'description', s.description,
      'category', s.category,
      'iconKey', s.icon_key,
      'accentColor', s.accent_color,
      'status', s.status,
      'isPrimary', s.is_primary,
      'sortOrder', s.sort_order,
      'courses', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'title', c.title,
          'description', c.description,
          'category', c.category,
          'iconKey', c.icon_key,
          'sortOrder', c.sort_order,
          'isPublished', c.is_published,
          'levels', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'id', lv.id,
              'slug', lv.slug,
              'title', lv.title,
              'description', lv.description,
              'difficulty', lv.difficulty,
              'sortOrder', lv.sort_order,
              'isPublished', lv.is_published,
              'units', (
                select coalesce(jsonb_agg(jsonb_build_object(
                  'id', u.id,
                  'slug', u.slug,
                  'title', u.title,
                  'description', u.description,
                  'objectives', u.objectives,
                  'rewardCoins', u.reward_coins,
                  'sortOrder', u.sort_order,
                  'isPublished', u.is_published,
                  'lessons', (
                    select coalesce(jsonb_agg(jsonb_build_object(
                      'id', l.id,
                      'slug', l.slug,
                      'title', l.title,
                      'description', l.description,
                      'kind', l.kind,
                      'estimatedMinutes', l.estimated_minutes,
                      'xpReward', l.xp_reward,
                      'coinReward', l.coin_reward,
                      'heartsEnabled', l.hearts_enabled,
                      'sortOrder', l.sort_order,
                      'isPublished', l.is_published,
                      'questionCount', (
                        select count(*)::integer from public.questions q
                        where q.lesson_id = l.id and q.is_active
                      )
                    ) order by l.sort_order, l.id), '[]'::jsonb)
                    from public.lessons l
                    where l.unit_id = u.id
                  ),
                  'nodes', (
                    select coalesce(jsonb_agg(jsonb_build_object(
                      'id', n.id,
                      'slug', n.slug,
                      'title', n.title,
                      'description', n.description,
                      'nodeType', n.node_type,
                      'lessonId', n.lesson_id,
                      'lessonTitle', (
                        select l2.title from public.lessons l2 where l2.id = n.lesson_id
                      ),
                      'sortOrder', n.sort_order,
                      'isActive', n.is_active,
                      'rewardCoins', n.reward_coins,
                      'rewardXp', n.reward_xp
                    ) order by n.sort_order, n.id), '[]'::jsonb)
                    from public.learning_nodes n
                    where n.unit_id = u.id
                  )
                ) order by u.sort_order, u.id), '[]'::jsonb)
                from public.units u
                where u.course_level_id = lv.id
              )
            ) order by lv.sort_order, lv.id), '[]'::jsonb)
            from public.course_levels lv
            where lv.course_id = c.id
          )
        ) order by c.sort_order, c.id), '[]'::jsonb)
        from public.courses c
        where c.subject_id = s.id
      )
    ) as subject_row
    from public.subjects s
  ) subjects;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Curriculum writes
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_subject(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_slug text := lower(btrim(coalesce(p_payload->>'slug', '')));
  v_name text := btrim(coalesce(p_payload->>'name', ''));
  v_status public.subject_status := coalesce(nullif(p_payload->>'status', ''), 'active')::public.subject_status;
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_status = 'active' and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,60}$' then
    raise exception 'slug_invalid' using errcode = '22023';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'name_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(s) into v_before from public.subjects s where s.id = v_id;
    update public.subjects set
      slug = v_slug,
      name = v_name,
      short_name = nullif(btrim(coalesce(p_payload->>'shortName', '')), ''),
      description = coalesce(p_payload->>'description', ''),
      category = coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      icon_key = coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      accent_color = coalesce(nullif(btrim(p_payload->>'accentColor'), ''), '#58CC02'),
      status = v_status,
      is_primary = coalesce((p_payload->>'isPrimary')::boolean, false),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, 0)
    where id = v_id;
    if not found then
      raise exception 'subject_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.subjects (
      slug, name, short_name, description, category, icon_key, accent_color,
      status, is_primary, sort_order
    ) values (
      v_slug, v_name,
      nullif(btrim(coalesce(p_payload->>'shortName', '')), ''),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      coalesce(nullif(btrim(p_payload->>'accentColor'), ''), '#58CC02'),
      v_status,
      coalesce((p_payload->>'isPrimary')::boolean, false),
      coalesce((p_payload->>'sortOrder')::integer, 0)
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_subject_save', 'subject', v_id::text, p_reason, v_before,
    (select to_jsonb(s) from public.subjects s where s.id = v_id)
  );
  return (select to_jsonb(s) from public.subjects s where s.id = v_id);
end;
$$;

create or replace function public.admin_save_course(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_subject uuid := nullif(p_payload->>'subjectId', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_published boolean := coalesce((p_payload->>'isPublished')::boolean, false);
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_published and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.subjects where id = v_subject) then
    raise exception 'subject_not_found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(c) into v_before from public.courses c where c.id = v_id;
    update public.courses set
      subject_id = v_subject,
      slug = lower(btrim(coalesce(p_payload->>'slug', slug))),
      title = btrim(p_payload->>'title'),
      description = coalesce(p_payload->>'description', ''),
      category = coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      icon_key = coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_published = v_published
    where id = v_id;
    if not found then
      raise exception 'course_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.courses (
      subject_id, slug, title, description, category, icon_key, sort_order, is_published
    ) values (
      v_subject,
      lower(btrim(coalesce(p_payload->>'slug', ''))),
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      coalesce((p_payload->>'sortOrder')::integer, 0),
      v_published
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_course_save', 'course', v_id::text, p_reason, v_before,
    (select to_jsonb(c) from public.courses c where c.id = v_id)
  );
  return (select to_jsonb(c) from public.courses c where c.id = v_id);
end;
$$;

create or replace function public.admin_save_level(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_course uuid := nullif(p_payload->>'courseId', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_published boolean := coalesce((p_payload->>'isPublished')::boolean, false);
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_published and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.courses where id = v_course) then
    raise exception 'course_not_found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(lv) into v_before from public.course_levels lv where lv.id = v_id;
    update public.course_levels set
      course_id = v_course,
      slug = lower(btrim(coalesce(p_payload->>'slug', slug))),
      title = btrim(p_payload->>'title'),
      description = coalesce(p_payload->>'description', ''),
      difficulty = coalesce(nullif(p_payload->>'difficulty', ''), 'beginner')::public.difficulty_band,
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_published = v_published
    where id = v_id;
    if not found then
      raise exception 'level_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.course_levels (
      course_id, slug, title, description, difficulty, sort_order, is_published
    ) values (
      v_course,
      lower(btrim(coalesce(p_payload->>'slug', ''))),
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(p_payload->>'difficulty', ''), 'beginner')::public.difficulty_band,
      coalesce((p_payload->>'sortOrder')::integer, 0),
      v_published
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_level_save', 'level', v_id::text, p_reason, v_before,
    (select to_jsonb(lv) from public.course_levels lv where lv.id = v_id)
  );
  return (select to_jsonb(lv) from public.course_levels lv where lv.id = v_id);
end;
$$;

create or replace function public.admin_save_unit(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_level uuid := nullif(p_payload->>'levelId', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_published boolean := coalesce((p_payload->>'isPublished')::boolean, false);
  v_objectives text[];
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_published and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.course_levels where id = v_level) then
    raise exception 'level_not_found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;

  select coalesce(array_agg(left(btrim(value), 200)), '{}')
  into v_objectives
  from jsonb_array_elements_text(
    case when jsonb_typeof(coalesce(p_payload->'objectives', '[]'::jsonb)) = 'array'
      then coalesce(p_payload->'objectives', '[]'::jsonb) else '[]'::jsonb end
  ) value
  where btrim(value) <> '';

  if v_id is not null then
    select to_jsonb(u) into v_before from public.units u where u.id = v_id;
    update public.units set
      course_level_id = v_level,
      slug = lower(btrim(coalesce(p_payload->>'slug', slug))),
      title = btrim(p_payload->>'title'),
      description = coalesce(p_payload->>'description', ''),
      objectives = v_objectives,
      reward_coins = greatest(0, coalesce((p_payload->>'rewardCoins')::integer, reward_coins)),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_published = v_published
    where id = v_id;
    if not found then
      raise exception 'unit_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.units (
      course_level_id, slug, title, description, objectives, reward_coins, sort_order, is_published
    ) values (
      v_level,
      lower(btrim(coalesce(p_payload->>'slug', ''))),
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'description', ''),
      v_objectives,
      greatest(0, coalesce((p_payload->>'rewardCoins')::integer, 0)),
      coalesce((p_payload->>'sortOrder')::integer, 0),
      v_published
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_unit_save', 'unit', v_id::text, p_reason, v_before,
    (select to_jsonb(u) from public.units u where u.id = v_id)
  );
  return (select to_jsonb(u) from public.units u where u.id = v_id);
end;
$$;

create or replace function public.admin_save_lesson(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_unit uuid := nullif(p_payload->>'unitId', '')::uuid;
  v_before jsonb := '{}'::jsonb;
  v_published boolean := coalesce((p_payload->>'isPublished')::boolean, false);
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_published and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.units where id = v_unit) then
    raise exception 'unit_not_found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(l) into v_before from public.lessons l where l.id = v_id;
    update public.lessons set
      unit_id = v_unit,
      slug = lower(btrim(coalesce(p_payload->>'slug', slug))),
      title = btrim(p_payload->>'title'),
      description = coalesce(p_payload->>'description', ''),
      kind = coalesce(nullif(p_payload->>'kind', ''), 'lesson')::public.lesson_kind,
      estimated_minutes = greatest(1, coalesce((p_payload->>'estimatedMinutes')::integer, estimated_minutes)),
      xp_reward = greatest(0, coalesce((p_payload->>'xpReward')::integer, xp_reward)),
      coin_reward = greatest(0, coalesce((p_payload->>'coinReward')::integer, coin_reward)),
      hearts_enabled = coalesce((p_payload->>'heartsEnabled')::boolean, hearts_enabled),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_published = v_published
    where id = v_id;
    if not found then
      raise exception 'lesson_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.lessons (
      unit_id, slug, title, description, kind, estimated_minutes, xp_reward,
      coin_reward, hearts_enabled, sort_order, is_published
    ) values (
      v_unit,
      lower(btrim(coalesce(p_payload->>'slug', ''))),
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(p_payload->>'kind', ''), 'lesson')::public.lesson_kind,
      greatest(1, coalesce((p_payload->>'estimatedMinutes')::integer, 5)),
      greatest(0, coalesce((p_payload->>'xpReward')::integer, 10)),
      greatest(0, coalesce((p_payload->>'coinReward')::integer, 2)),
      coalesce((p_payload->>'heartsEnabled')::boolean, true),
      coalesce((p_payload->>'sortOrder')::integer, 0),
      v_published
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_lesson_save', 'lesson', v_id::text, p_reason, v_before,
    (select to_jsonb(l) from public.lessons l where l.id = v_id)
  );
  return (select to_jsonb(l) from public.lessons l where l.id = v_id);
end;
$$;

create or replace function public.admin_save_node(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_unit uuid := nullif(p_payload->>'unitId', '')::uuid;
  v_lesson uuid := nullif(p_payload->>'lessonId', '')::uuid;
  v_type public.node_kind := coalesce(nullif(p_payload->>'nodeType', ''), 'lesson')::public.node_kind;
  v_active boolean := coalesce((p_payload->>'isActive')::boolean, true);
  v_level uuid;
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('curriculum.edit');
  if v_active and not public.admin_has_permission('curriculum.publish') then
    raise exception 'admin_permission_denied' using errcode = '42501';
  end if;

  select u.course_level_id into v_level from public.units u where u.id = v_unit;
  if v_level is null then
    raise exception 'unit_not_found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;

  if v_type = 'reward' then
    v_lesson := null;
    if coalesce((p_payload->>'rewardCoins')::integer, 0) < 0
      or coalesce((p_payload->>'rewardXp')::integer, 0) < 0 then
      raise exception 'reward_invalid' using errcode = '22023';
    end if;
    if v_active and exists (
      select 1
      from public.learning_nodes n
      join public.units u on u.id = n.unit_id
      where u.course_level_id = v_level
        and n.node_type = 'reward'
        and n.is_active
        and (v_id is null or n.id <> v_id)
    ) then
      raise exception 'level_already_has_reward' using errcode = '22023';
    end if;
  else
    if v_lesson is null then
      raise exception 'node_lesson_required' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.lessons l where l.id = v_lesson and l.unit_id = v_unit
    ) then
      raise exception 'node_lesson_unit_mismatch' using errcode = '22023';
    end if;
  end if;

  if v_id is not null then
    select to_jsonb(n) into v_before from public.learning_nodes n where n.id = v_id;
    update public.learning_nodes set
      unit_id = v_unit,
      slug = lower(btrim(coalesce(p_payload->>'slug', slug))),
      title = btrim(p_payload->>'title'),
      description = coalesce(p_payload->>'description', ''),
      node_type = v_type,
      lesson_id = v_lesson,
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_active = v_active,
      reward_coins = case when v_type = 'reward' then coalesce((p_payload->>'rewardCoins')::integer, 0) else 0 end,
      reward_xp = case when v_type = 'reward' then coalesce((p_payload->>'rewardXp')::integer, 0) else 0 end
    where id = v_id;
    if not found then
      raise exception 'node_not_found' using errcode = 'P0002';
    end if;
  else
    insert into public.learning_nodes (
      unit_id, slug, title, description, node_type, lesson_id, sort_order,
      is_active, reward_coins, reward_xp
    ) values (
      v_unit,
      lower(btrim(coalesce(p_payload->>'slug', ''))),
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'description', ''),
      v_type,
      v_lesson,
      coalesce((p_payload->>'sortOrder')::integer, 0),
      v_active,
      case when v_type = 'reward' then coalesce((p_payload->>'rewardCoins')::integer, 0) else 0 end,
      case when v_type = 'reward' then coalesce((p_payload->>'rewardXp')::integer, 0) else 0 end
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'curriculum_node_save', 'node', v_id::text, p_reason, v_before,
    (select to_jsonb(n) from public.learning_nodes n where n.id = v_id)
  );
  return (select to_jsonb(n) from public.learning_nodes n where n.id = v_id);
end;
$$;

-- Reorder siblings. The UI always sends one parent's children in the new order.
create or replace function public.admin_reorder(
  p_entity text,
  p_ids uuid[],
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_entity text := lower(btrim(coalesce(p_entity, '')));
  v_count integer := coalesce(array_length(p_ids, 1), 0);
begin
  if v_entity in ('question') then
    perform public.admin_require_permission('questions.edit');
  else
    perform public.admin_require_permission('curriculum.edit');
  end if;
  if v_count = 0 then
    raise exception 'reorder_empty' using errcode = '22023';
  end if;
  if v_entity not in ('subject', 'course', 'level', 'unit', 'lesson', 'node', 'question') then
    raise exception 'entity_unknown' using errcode = '22023';
  end if;

  if v_entity = 'subject' then
    update public.subjects s set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where s.id = t.id;
  elsif v_entity = 'course' then
    update public.courses c set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where c.id = t.id;
  elsif v_entity = 'level' then
    update public.course_levels lv set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where lv.id = t.id;
  elsif v_entity = 'unit' then
    update public.units u set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where u.id = t.id;
  elsif v_entity = 'lesson' then
    update public.lessons l set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where l.id = t.id;
  elsif v_entity = 'node' then
    update public.learning_nodes n set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where n.id = t.id;
  else
    update public.questions q set sort_order = t.ord - 1
    from unnest(p_ids) with ordinality t(id, ord) where q.id = t.id;
  end if;

  perform public.admin_audit(
    'curriculum_reorder', v_entity, null, p_reason, '{}'::jsonb,
    jsonb_build_object('ids', to_jsonb(p_ids))
  );
  return jsonb_build_object('entity', v_entity, 'count', v_count);
end;
$$;

-- ---------------------------------------------------------------------------
-- Question bank reads
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_questions(
  p_lesson_id uuid default null,
  p_subject_id uuid default null,
  p_type text default '',
  p_search text default '',
  p_status text default '',
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
  v_type text := btrim(coalesce(p_type, ''));
  v_status text := btrim(coalesce(p_status, ''));
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_size integer := greatest(5, least(coalesce(p_page_size, 20), 100));
  v_offset integer := (v_page - 1) * v_size;
  v_total integer;
  v_items jsonb;
begin
  perform public.admin_require_permission('questions.read');

  with filtered as (
    select q.id, q.lesson_id, q.type, q.topic, q.difficulty, q.prompt,
           q.points, q.is_active, q.sort_order, q.created_at, q.updated_at,
           l.title as lesson_title, s.name as subject_name, s.id as subject_id
    from public.questions q
    join public.lessons l on l.id = q.lesson_id
    join public.units u on u.id = l.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    where (p_lesson_id is null or q.lesson_id = p_lesson_id)
      and (p_subject_id is null or s.id = p_subject_id)
      and (v_type = '' or q.type::text = v_type)
      and (
        v_status = ''
        or (v_status = 'active' and q.is_active)
        or (v_status = 'inactive' and not q.is_active)
      )
      and (
        v_search = ''
        or position(lower(v_search) in lower(q.prompt)) > 0
        or position(lower(v_search) in lower(q.topic)) > 0
        or position(lower(v_search) in lower(q.slug)) > 0
      )
  )
  select count(*)::integer into v_total from filtered;

  with filtered as (
    select q.id, q.lesson_id, q.type, q.topic, q.difficulty, q.prompt,
           q.points, q.is_active, q.sort_order, q.created_at, q.updated_at,
           l.title as lesson_title, s.name as subject_name, s.id as subject_id
    from public.questions q
    join public.lessons l on l.id = q.lesson_id
    join public.units u on u.id = l.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    where (p_lesson_id is null or q.lesson_id = p_lesson_id)
      and (p_subject_id is null or s.id = p_subject_id)
      and (v_type = '' or q.type::text = v_type)
      and (
        v_status = ''
        or (v_status = 'active' and q.is_active)
        or (v_status = 'inactive' and not q.is_active)
      )
      and (
        v_search = ''
        or position(lower(v_search) in lower(q.prompt)) > 0
        or position(lower(v_search) in lower(q.topic)) > 0
        or position(lower(v_search) in lower(q.slug)) > 0
      )
    order by q.updated_at desc
    limit v_size offset v_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'lessonId', f.lesson_id,
    'lessonTitle', f.lesson_title,
    'subjectId', f.subject_id,
    'subjectName', f.subject_name,
    'type', f.type,
    'topic', f.topic,
    'difficulty', f.difficulty,
    'prompt', f.prompt,
    'points', f.points,
    'isActive', f.is_active,
    'sortOrder', f.sort_order,
    'updatedAt', f.updated_at
  ) order by f.updated_at desc), '[]'::jsonb)
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

create or replace function public.admin_get_question(p_question_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_question public.questions;
  v_result jsonb;
begin
  perform public.admin_require_permission('questions.read');
  select * into v_question from public.questions where id = p_question_id;
  if v_question.id is null then
    raise exception 'question_not_found' using errcode = 'P0002';
  end if;

  select jsonb_build_object(
    'id', v_question.id,
    'lessonId', v_question.lesson_id,
    'slug', v_question.slug,
    'type', v_question.type,
    'topic', v_question.topic,
    'difficulty', v_question.difficulty,
    'instruction', v_question.instruction,
    'prompt', v_question.prompt,
    'explanation', v_question.explanation,
    'hint', v_question.hint,
    'points', v_question.points,
    'sortOrder', v_question.sort_order,
    'isActive', v_question.is_active,
    'scene', coalesce(v_question.scene, '{}'::jsonb),
    'options', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'label', o.label, 'isCorrect', o.is_correct,
        'sortOrder', o.sort_order
      ) order by o.sort_order), '[]'::jsonb)
      from public.question_options o where o.question_id = v_question.id
    ),
    'answers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'answer', a.answer, 'isCaseSensitive', a.is_case_sensitive
      ) order by a.answer), '[]'::jsonb)
      from public.question_answers a where a.question_id = v_question.id
    ),
    'pairs', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'leftId', p.left_id, 'left', p.left_label,
        'rightId', p.right_id, 'right', p.right_label,
        'sortOrder', p.sort_order
      ) order by p.sort_order), '[]'::jsonb)
      from public.question_pairs p where p.question_id = v_question.id
    ),
    'media', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'kind', m.media_kind, 'url', m.url,
        'alt', m.alt_text, 'sortOrder', m.sort_order
      ) order by m.sort_order), '[]'::jsonb)
      from public.question_media m where m.question_id = v_question.id
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Question validation and atomic save
-- ---------------------------------------------------------------------------
create or replace function public.admin_validate_question(
  p_type public.question_type,
  p_prompt text,
  p_options jsonb,
  p_answers jsonb,
  p_pairs jsonb,
  p_media jsonb,
  p_scene jsonb
)
returns void
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_options integer := coalesce(jsonb_array_length(p_options), 0);
  v_correct integer;
  v_answers integer := coalesce(jsonb_array_length(p_answers), 0);
  v_pairs integer := coalesce(jsonb_array_length(p_pairs), 0);
  v_media integer := coalesce(jsonb_array_length(p_media), 0);
  v_has_image boolean := false;
  v_has_audio boolean := false;
  v_screens integer := 0;
begin
  if btrim(coalesce(p_prompt, '')) = '' then
    raise exception 'question_prompt_required' using errcode = '22023';
  end if;
  if p_scene is not null and jsonb_typeof(p_scene) <> 'object' then
    raise exception 'question_scene_invalid' using errcode = '22023';
  end if;

  select
    coalesce(count(*) filter (
      where m->>'kind' = 'image' and btrim(coalesce(m->>'url', '')) <> ''
    ), 0) > 0,
    coalesce(count(*) filter (
      where m->>'kind' = 'audio' and btrim(coalesce(m->>'url', '')) <> ''
    ), 0) > 0
  into v_has_image, v_has_audio
  from jsonb_array_elements(case when jsonb_typeof(p_media) = 'array' then p_media else '[]'::jsonb end) m;

  if p_type in ('multiple_choice', 'picture_identification', 'conversation', 'story') then
    if v_options < 2 then
      raise exception 'question_options_required' using errcode = '22023';
    end if;
    select count(*)::integer into v_correct
    from jsonb_array_elements(p_options) o
    where coalesce((o->>'isCorrect')::boolean, false);
    if v_correct <> 1 then
      raise exception 'question_exactly_one_correct' using errcode = '22023';
    end if;
    if p_type = 'picture_identification' and not v_has_image then
      raise exception 'question_image_required' using errcode = '22023';
    end if;
    if p_type in ('conversation', 'story') then
      v_screens := case
        when jsonb_typeof(p_scene->'screens') = 'array' then jsonb_array_length(p_scene->'screens')
        else 0
      end;
      if v_screens < 1 then
        raise exception 'question_scene_screens_required' using errcode = '22023';
      end if;
    end if;
  elsif p_type = 'matching_pairs' then
    if v_pairs < 2 then
      raise exception 'question_pairs_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_pairs) p
      where btrim(coalesce(p->>'left', '')) = '' or btrim(coalesce(p->>'right', '')) = ''
    ) then
      raise exception 'question_pairs_invalid' using errcode = '22023';
    end if;
  else
    if v_answers < 1 then
      raise exception 'question_answers_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_answers) a
      where btrim(coalesce(a->>'answer', '')) = ''
    ) then
      raise exception 'question_answers_invalid' using errcode = '22023';
    end if;
    if p_type = 'fill_blank' and position('__' in p_prompt) = 0 then
      raise exception 'question_blank_required' using errcode = '22023';
    end if;
    if p_type = 'listening' then
      if not v_has_audio
        and btrim(coalesce(p_scene->>'speech', '')) = '' then
        raise exception 'question_audio_or_speech_required' using errcode = '22023';
      end if;
    end if;
  end if;

  if v_media > 20 then
    raise exception 'question_media_too_many' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.admin_save_question(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_lesson uuid := nullif(p_payload->>'lessonId', '')::uuid;
  v_type public.question_type := coalesce(nullif(p_payload->>'type', ''), 'multiple_choice')::public.question_type;
  v_slug text := lower(btrim(coalesce(p_payload->>'slug', '')));
  v_prompt text := btrim(coalesce(p_payload->>'prompt', ''));
  v_options jsonb := case when jsonb_typeof(coalesce(p_payload->'options', '[]'::jsonb)) = 'array'
    then coalesce(p_payload->'options', '[]'::jsonb) else '[]'::jsonb end;
  v_answers jsonb := case when jsonb_typeof(coalesce(p_payload->'answers', '[]'::jsonb)) = 'array'
    then coalesce(p_payload->'answers', '[]'::jsonb) else '[]'::jsonb end;
  v_pairs jsonb := case when jsonb_typeof(coalesce(p_payload->'pairs', '[]'::jsonb)) = 'array'
    then coalesce(p_payload->'pairs', '[]'::jsonb) else '[]'::jsonb end;
  v_media jsonb := case when jsonb_typeof(coalesce(p_payload->'media', '[]'::jsonb)) = 'array'
    then coalesce(p_payload->'media', '[]'::jsonb) else '[]'::jsonb end;
  v_scene jsonb := case when jsonb_typeof(coalesce(p_payload->'scene', '{}'::jsonb)) = 'object'
    then coalesce(p_payload->'scene', '{}'::jsonb) else '{}'::jsonb end;
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('questions.read');
  perform public.admin_require_permission('questions.edit');
  if v_lesson is null or not exists (select 1 from public.lessons where id = v_lesson) then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,94}$' then
    raise exception 'slug_invalid' using errcode = '22023';
  end if;
  if coalesce((p_payload->>'points')::integer, 10) < 1
    or coalesce((p_payload->>'points')::integer, 10) > 1000 then
    raise exception 'question_points_invalid' using errcode = '22023';
  end if;

  perform public.admin_validate_question(v_type, v_prompt, v_options, v_answers, v_pairs, v_media, v_scene);

  if v_id is not null then
    select to_jsonb(q) into v_before from public.questions q where q.id = v_id;
    if v_before = '{}'::jsonb then
      raise exception 'question_not_found' using errcode = 'P0002';
    end if;
    update public.questions set
      lesson_id = v_lesson,
      slug = v_slug,
      type = v_type,
      topic = coalesce(p_payload->>'topic', ''),
      difficulty = coalesce(nullif(p_payload->>'difficulty', ''), 'beginner')::public.difficulty_band,
      instruction = coalesce(p_payload->>'instruction', ''),
      prompt = v_prompt,
      explanation = coalesce(p_payload->>'explanation', ''),
      hint = nullif(btrim(coalesce(p_payload->>'hint', '')), ''),
      points = coalesce((p_payload->>'points')::integer, 10),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      is_active = coalesce((p_payload->>'isActive')::boolean, is_active),
      scene = v_scene
    where id = v_id;
  else
    insert into public.questions (
      lesson_id, slug, type, topic, difficulty, instruction, prompt,
      explanation, hint, points, sort_order, is_active, scene
    ) values (
      v_lesson, v_slug, v_type,
      coalesce(p_payload->>'topic', ''),
      coalesce(nullif(p_payload->>'difficulty', ''), 'beginner')::public.difficulty_band,
      coalesce(p_payload->>'instruction', ''),
      v_prompt,
      coalesce(p_payload->>'explanation', ''),
      nullif(btrim(coalesce(p_payload->>'hint', '')), ''),
      coalesce((p_payload->>'points')::integer, 10),
      coalesce((p_payload->>'sortOrder')::integer, 0),
      coalesce((p_payload->>'isActive')::boolean, true),
      v_scene
    ) returning id into v_id;
  end if;

  delete from public.question_options where question_id = v_id;
  delete from public.question_answers where question_id = v_id;
  delete from public.question_pairs where question_id = v_id;
  delete from public.question_media where question_id = v_id;

  insert into public.question_options (question_id, label, is_correct, sort_order)
  select v_id, btrim(o->>'label'), coalesce((o->>'isCorrect')::boolean, false),
         coalesce((o->>'sortOrder')::integer, ord - 1)
  from jsonb_array_elements(v_options) with ordinality t(o, ord)
  where btrim(coalesce(o->>'label', '')) <> '';

  insert into public.question_answers (question_id, answer, is_case_sensitive)
  select v_id, btrim(a->>'answer'), coalesce((a->>'isCaseSensitive')::boolean, false)
  from jsonb_array_elements(v_answers) a
  where btrim(coalesce(a->>'answer', '')) <> ''
  on conflict (question_id, answer) do nothing;

  insert into public.question_pairs (question_id, left_id, left_label, right_id, right_label, sort_order)
  select v_id, gen_random_uuid(), btrim(p->>'left'), gen_random_uuid(), btrim(p->>'right'),
         coalesce((p->>'sortOrder')::integer, ord - 1)
  from jsonb_array_elements(v_pairs) with ordinality t(p, ord);

  insert into public.question_media (question_id, media_kind, url, alt_text, sort_order)
  select v_id, m->>'kind', btrim(m->>'url'), coalesce(m->>'alt', ''),
         coalesce((m->>'sortOrder')::integer, ord - 1)
  from jsonb_array_elements(v_media) with ordinality t(m, ord)
  where m->>'kind' in ('image', 'audio', 'video')
    and btrim(coalesce(m->>'url', '')) <> '';

  perform public.admin_audit(
    'question_save', 'question', v_id::text, p_reason, v_before,
    public.admin_get_question(v_id)
  );

  return public.admin_get_question(v_id);
end;
$$;

create or replace function public.admin_set_question_active(
  p_question_id uuid,
  p_active boolean,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
begin
  perform public.admin_require_permission('questions.edit');
  select to_jsonb(q) into v_before from public.questions q where q.id = p_question_id;
  if v_before = '{}'::jsonb then
    raise exception 'question_not_found' using errcode = 'P0002';
  end if;
  update public.questions set is_active = coalesce(p_active, false), updated_at = now()
  where id = p_question_id;
  perform public.admin_audit(
    'question_status', 'question', p_question_id::text, p_reason, v_before,
    jsonb_build_object('isActive', coalesce(p_active, false))
  );
  return jsonb_build_object('id', p_question_id, 'isActive', coalesce(p_active, false));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.admin_list_curriculum() from public, anon;
revoke all on function public.admin_save_subject(jsonb, text) from public, anon;
revoke all on function public.admin_save_course(jsonb, text) from public, anon;
revoke all on function public.admin_save_level(jsonb, text) from public, anon;
revoke all on function public.admin_save_unit(jsonb, text) from public, anon;
revoke all on function public.admin_save_lesson(jsonb, text) from public, anon;
revoke all on function public.admin_save_node(jsonb, text) from public, anon;
revoke all on function public.admin_reorder(text, uuid[], text) from public, anon;
revoke all on function public.admin_list_questions(uuid, uuid, text, text, text, integer, integer)
  from public, anon;
revoke all on function public.admin_get_question(uuid) from public, anon;
revoke all on function public.admin_validate_question(
  public.question_type, text, jsonb, jsonb, jsonb, jsonb, jsonb
) from public, anon, authenticated;
revoke all on function public.admin_save_question(jsonb, text) from public, anon;
revoke all on function public.admin_set_question_active(uuid, boolean, text) from public, anon;

grant execute on function public.admin_list_curriculum() to authenticated;
grant execute on function public.admin_save_subject(jsonb, text) to authenticated;
grant execute on function public.admin_save_course(jsonb, text) to authenticated;
grant execute on function public.admin_save_level(jsonb, text) to authenticated;
grant execute on function public.admin_save_unit(jsonb, text) to authenticated;
grant execute on function public.admin_save_lesson(jsonb, text) to authenticated;
grant execute on function public.admin_save_node(jsonb, text) to authenticated;
grant execute on function public.admin_reorder(text, uuid[], text) to authenticated;
grant execute on function public.admin_list_questions(uuid, uuid, text, text, text, integer, integer)
  to authenticated;
grant execute on function public.admin_get_question(uuid) to authenticated;
grant execute on function public.admin_save_question(jsonb, text) to authenticated;
grant execute on function public.admin_set_question_active(uuid, boolean, text) to authenticated;
