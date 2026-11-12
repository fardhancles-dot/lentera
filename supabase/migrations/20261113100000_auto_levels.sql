-- Lentera · Satu mapel, satu soal per level, level otomatis
-- Additive: existing lessons, question banks, player progress, XP, and rewards
-- stay in place. A learning node now points at the exact question it plays and
-- keeps a stable level number inside its subject.

alter table public.learning_nodes
  add column if not exists question_id uuid references public.questions (id) on delete set null;
alter table public.learning_nodes
  add column if not exists level_number integer;

-- Keep the question relation one-to-one. A question can only drive one level.
create unique index if not exists learning_nodes_question_unique
  on public.learning_nodes (question_id)
  where question_id is not null;
create index if not exists learning_nodes_level_number_idx
  on public.learning_nodes (level_number);

-- Existing levels already play the first active question of their lesson.
-- Link that exact question so editing the level never depends on question order.
update public.learning_nodes n
set question_id = (
  select q.id
  from public.questions q
  where q.lesson_id = n.lesson_id
    and q.is_active
  order by q.sort_order, q.id
  limit 1
)
where n.question_id is null
  and n.lesson_id is not null;

-- Stable level numbers per subject, following the order players already see.
with ordered as (
  select
    n.id,
    row_number() over (
      partition by c.subject_id
      order by lv.sort_order, u.sort_order, n.sort_order, n.id
    ) as rn
  from public.learning_nodes n
  join public.units u on u.id = n.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  where n.lesson_id is not null
)
update public.learning_nodes n
set level_number = ordered.rn
from ordered
where n.id = ordered.id
  and n.level_number is null;

-- ---------------------------------------------------------------------------
-- Player start: use the question linked to the level when present.
-- ---------------------------------------------------------------------------
create or replace function public.start_lesson(p_node_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_node public.learning_nodes;
  v_lesson public.lessons;
  v_course_id uuid;
  v_subject_slug text;
  v_question public.questions;
  v_attempt_id uuid;
  v_questions jsonb;
  v_locked boolean := false;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select n.* into v_node
  from public.learning_nodes n
  join public.units u on u.id = n.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where n.id = p_node_id
    and n.is_active
    and u.is_published
    and lv.is_published
    and c.is_published
    and s.status = 'active';

  if v_node.id is null then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  select lv.course_id, s.slug into v_course_id, v_subject_slug
  from public.units u
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  where u.id = v_node.unit_id;

  if v_node.lesson_id is null then
    raise exception 'node_not_playable' using errcode = '22023';
  end if;

  select * into v_lesson
  from public.lessons
  where id = v_node.lesson_id and is_published;

  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  if v_node.question_id is not null then
    select q.* into v_question
    from public.questions q
    where q.id = v_node.question_id
      and q.lesson_id = v_lesson.id
      and q.is_active;
  else
    -- Legacy fallback for a node created before question links existed.
    select q.* into v_question
    from public.questions q
    where q.lesson_id = v_lesson.id and q.is_active
    order by q.sort_order, q.id
    limit 1;
  end if;

  if v_question.id is null then
    raise exception 'lesson_has_no_questions' using errcode = '22023';
  end if;

  if not public.is_staff() then
    with ordered as (
      select
        n.id,
        row_number() over (order by lv.sort_order, u.sort_order, n.sort_order, n.id) as rn
      from public.learning_nodes n
      join public.units u on u.id = n.unit_id
      join public.course_levels lv on lv.id = u.course_level_id
      where lv.course_id = v_course_id
        and n.is_active
        and n.lesson_id is not null
    ), target as (
      select rn from ordered where id = p_node_id
    )
    select exists (
      select 1
      from ordered o
      cross join target t
      where o.rn < t.rn
        and not exists (
          select 1 from public.user_node_progress p
          where p.user_id = v_user
            and p.node_id = o.id
            and p.status = 'completed'
        )
    ) into v_locked;

    if v_locked then
      raise exception 'lesson_locked' using errcode = '42501';
    end if;
  end if;

  update public.lesson_attempts
     set status = 'abandoned'
   where user_id = v_user
     and lesson_id = v_lesson.id
     and status = 'in_progress';

  insert into public.lesson_attempts (
    user_id, lesson_id, node_id, total_count, max_score
  )
  values (
    v_user, v_lesson.id, p_node_id, 1, coalesce(v_question.points, 0)
  )
  returning id into v_attempt_id;

  select jsonb_build_array(jsonb_build_object(
    'id', q.id,
    'type', q.type,
    'topic', q.topic,
    'difficulty', q.difficulty,
    'instruction', q.instruction,
    'prompt', q.prompt,
    'hint', q.hint,
    'points', q.points,
    'options', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label) order by o.sort_order)
      from public.question_options o
      where o.question_id = q.id
    ), '[]'::jsonb),
    'leftItems', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', p.left_id, 'label', p.left_label) order by p.sort_order
      )
      from public.question_pairs p
      where p.question_id = q.id
    ), '[]'::jsonb),
    'rightItems', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', p.right_id, 'label', p.right_label)
        order by md5(p.right_id::text)
      )
      from public.question_pairs p
      where p.question_id = q.id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', m.media_kind, 'url', m.url, 'alt', m.alt_text
      ) order by m.sort_order)
      from public.question_media m
      where m.question_id = q.id
    ), '[]'::jsonb),
    'scene', coalesce(q.scene, '{}'::jsonb)
  )) into v_questions
  from public.questions q
  where q.id = v_question.id;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'lesson', jsonb_build_object(
      'id', v_lesson.id,
      'slug', v_lesson.slug,
      'title', v_lesson.title,
      'description', v_lesson.description,
      'kind', v_lesson.kind,
      'subjectSlug', v_subject_slug,
      'xpReward', v_lesson.xp_reward,
      'coinReward', v_lesson.coin_reward,
      'heartsEnabled', v_lesson.hearts_enabled
    ),
    'questions', v_questions
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin reads: expose the level link without leaking answer keys.
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
           l.title as lesson_title, s.name as subject_name, s.id as subject_id,
           n.id as node_id, n.level_number, n.is_active as level_active
    from public.questions q
    join public.lessons l on l.id = q.lesson_id
    join public.units u on u.id = l.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    left join public.learning_nodes n on n.question_id = q.id
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
           l.title as lesson_title, s.name as subject_name, s.id as subject_id,
           n.id as node_id, n.level_number, n.is_active as level_active
    from public.questions q
    join public.lessons l on l.id = q.lesson_id
    join public.units u on u.id = l.unit_id
    join public.course_levels lv on lv.id = u.course_level_id
    join public.courses c on c.id = lv.course_id
    join public.subjects s on s.id = c.subject_id
    left join public.learning_nodes n on n.question_id = q.id
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
    order by coalesce(n.level_number, 1000000), q.updated_at desc
    limit v_size offset v_offset
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'lessonId', f.lesson_id,
    'lessonTitle', f.lesson_title,
    'subjectId', f.subject_id,
    'subjectName', f.subject_name,
    'nodeId', f.node_id,
    'levelNumber', f.level_number,
    'levelActive', f.level_active,
    'type', f.type,
    'topic', f.topic,
    'difficulty', f.difficulty,
    'prompt', f.prompt,
    'points', f.points,
    'isActive', f.is_active,
    'sortOrder', f.sort_order,
    'updatedAt', f.updated_at
  ) order by coalesce(f.level_number, 1000000), f.updated_at desc), '[]'::jsonb)
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
  v_subject_id uuid;
  v_subject_name text;
  v_node_id uuid;
  v_level_number integer;
  v_level_active boolean;
  v_result jsonb;
begin
  perform public.admin_require_permission('questions.read');
  select * into v_question from public.questions where id = p_question_id;
  if v_question.id is null then
    raise exception 'question_not_found' using errcode = 'P0002';
  end if;

  select s.id, s.name, n.id, n.level_number, n.is_active
  into v_subject_id, v_subject_name, v_node_id, v_level_number, v_level_active
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  join public.subjects s on s.id = c.subject_id
  left join public.learning_nodes n on n.question_id = v_question.id
  where l.id = v_question.lesson_id;

  select jsonb_build_object(
    'id', v_question.id,
    'lessonId', v_question.lesson_id,
    'subjectId', v_subject_id,
    'subjectName', v_subject_name,
    'nodeId', v_node_id,
    'levelNumber', v_level_number,
    'levelActive', v_level_active,
    'attemptCount', (
      select count(*)::integer from public.answer_attempts a
      where a.question_id = v_question.id
    ),
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
-- Automatic level creation: question + level node in one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_question_level(
  p_payload jsonb,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_subject uuid := nullif(p_payload->>'subjectId', '')::uuid;
  v_subject_slug text;
  v_subject_name text;
  v_subject_category text;
  v_subject_icon text;
  v_course uuid;
  v_level uuid;
  v_unit uuid;
  v_lesson uuid;
  v_level_number integer;
  v_slug text;
  v_question uuid;
  v_topic text;
  v_prompt text;
  v_node_slug text;
  v_node_id uuid;
begin
  perform public.admin_require_permission('questions.read');
  perform public.admin_require_permission('questions.edit');

  select s.slug, s.name, s.category, s.icon_key
  into v_subject_slug, v_subject_name, v_subject_category, v_subject_icon
  from public.subjects s
  where s.id = v_subject and s.status <> 'inactive';
  if v_subject_slug is null then
    raise exception 'subject_not_found' using errcode = 'P0002';
  end if;

  -- Serialize level numbers for this subject so two admins never get the same
  -- next level.
  perform pg_advisory_xact_lock(hashtext('lentera-level:' || v_subject::text)::bigint);

  select c.id into v_course
  from public.courses c
  where c.subject_id = v_subject
  order by c.sort_order, c.id
  limit 1;
  if v_course is null then
    insert into public.courses (
      subject_id, slug, title, description, category, icon_key, sort_order, is_published
    ) values (
      v_subject, v_subject_slug || '-course', v_subject_name, '', v_subject_category,
      coalesce(nullif(v_subject_icon, ''), 'book'), 0, true
    ) returning id into v_course;
  end if;

  -- Append to the last chapter/unit the player already sees, so a new level
  -- never jumps into the middle of the existing journey.
  select lv.id into v_level
  from public.course_levels lv
  where lv.course_id = v_course
  order by lv.sort_order desc, lv.id desc
  limit 1;
  if v_level is null then
    insert into public.course_levels (
      course_id, slug, title, description, difficulty, sort_order, is_published
    ) values (
      v_course, 'level-1', 'Level 1', '', 'beginner', 0, true
    ) returning id into v_level;
  end if;

  select u.id into v_unit
  from public.units u
  where u.course_level_id = v_level
  order by u.sort_order desc, u.id desc
  limit 1;
  if v_unit is null then
    insert into public.units (
      course_level_id, slug, title, description, objectives, reward_coins, sort_order, is_published
    ) values (
      v_level, 'level-1', 'Level 1', '', '{}', 0, 0, true
    ) returning id into v_unit;
  end if;

  select coalesce(max(n.level_number), 0) + 1 into v_level_number
  from public.learning_nodes n
  join public.units u on u.id = n.unit_id
  join public.course_levels lv on lv.id = u.course_level_id
  join public.courses c on c.id = lv.course_id
  where c.subject_id = v_subject
    and n.level_number is not null;

  v_prompt := btrim(coalesce(p_payload->>'prompt', ''));
  v_topic := btrim(coalesce(p_payload->>'topic', ''));

  -- One lesson per automatic level keeps every level URL unique while leaving
  -- the existing multi-question lessons and their practice banks untouched.
  v_node_slug := 'level-' || v_level_number;
  while exists (select 1 from public.lessons l where l.unit_id = v_unit and l.slug = v_node_slug) loop
    v_node_slug := 'level-' || v_level_number || '-' || floor(random() * 900 + 100)::integer;
  end loop;
  insert into public.lessons (
    unit_id, slug, title, description, kind, estimated_minutes, xp_reward,
    coin_reward, hearts_enabled, sort_order, is_published
  ) values (
    v_unit, v_node_slug, coalesce(nullif(v_topic, ''), 'Level ' || v_level_number),
    left(v_prompt, 160), 'lesson', 5, 10, 2, true, 1000 + v_level_number, true
  ) returning id into v_lesson;

  v_slug := lower(btrim(coalesce(p_payload->>'slug', '')));
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,94}$' then
    v_slug := 'level-' || v_level_number;
  end if;
  while exists (select 1 from public.questions q where q.lesson_id = v_lesson and q.slug = v_slug) loop
    v_slug := left(v_slug, 85) || '-' || v_level_number || '-' || floor(random() * 900 + 100)::integer;
  end loop;

  v_question := (public.admin_save_question(
    (p_payload - 'id') || jsonb_build_object(
      'lessonId', v_lesson,
      'slug', v_slug,
      'sortOrder', v_level_number,
      'isActive', true
    ),
    coalesce(nullif(btrim(p_reason), ''), 'Tambah soal dan level otomatis')
  )->>'id')::uuid;

  insert into public.learning_nodes (
    unit_id, slug, title, description, node_type, lesson_id, sort_order,
    is_active, reward_coins, reward_xp, question_id, level_number
  ) values (
    v_unit,
    v_node_slug,
    coalesce(nullif(v_topic, ''), left(v_prompt, 60)),
    left(v_prompt, 160),
    'lesson',
    v_lesson,
    1000 + v_level_number,
    true,
    0,
    0,
    v_question,
    v_level_number
  ) returning id into v_node_id;

  perform public.admin_audit(
    'level_auto_create', 'node', v_node_id::text, p_reason,
    '{}'::jsonb,
    jsonb_build_object(
      'subjectId', v_subject,
      'questionId', v_question,
      'levelNumber', v_level_number
    )
  );

  return public.admin_get_question(v_question);
end;
$$;

-- Archiving a question pauses its level without deleting it or shifting any
-- other level. Reactivating restores the same level number.
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
  v_node_id uuid;
  v_level_number integer;
begin
  perform public.admin_require_permission('questions.edit');
  select to_jsonb(q) into v_before from public.questions q where q.id = p_question_id;
  if v_before = '{}'::jsonb then
    raise exception 'question_not_found' using errcode = 'P0002';
  end if;

  update public.questions set is_active = coalesce(p_active, false), updated_at = now()
  where id = p_question_id;

  update public.learning_nodes
  set is_active = coalesce(p_active, false)
  where question_id = p_question_id
  returning id, level_number into v_node_id, v_level_number;

  perform public.admin_audit(
    'question_status', 'question', p_question_id::text, p_reason, v_before,
    jsonb_build_object(
      'isActive', coalesce(p_active, false),
      'nodeId', v_node_id,
      'levelNumber', v_level_number
    )
  );
  return jsonb_build_object(
    'id', p_question_id,
    'isActive', coalesce(p_active, false),
    'nodeId', v_node_id,
    'levelNumber', v_level_number
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Curriculum read: include the level link used by Map Editor.
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
                      'questionId', n.question_id,
                      'levelNumber', n.level_number,
                      'questionPrompt', (
                        select q.prompt from public.questions q where q.id = n.question_id
                      ),
                      'questionActive', (
                        select q.is_active from public.questions q where q.id = n.question_id
                      ),
                      'sortOrder', n.sort_order,
                      'isActive', n.is_active,
                      'rewardCoins', n.reward_coins,
                      'rewardXp', n.reward_xp
                    ) order by coalesce(n.level_number, 1000000), n.sort_order, n.id), '[]'::jsonb)
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

-- Public catalog counts now describe playable levels, not every legacy question
-- or chapter row. One playable level = one linked question.
create or replace view public.subject_overview
with (security_invoker = false) as
select
  s.id,
  s.slug,
  s.name,
  s.short_name,
  s.description,
  s.category,
  s.icon_key,
  s.accent_color,
  s.status,
  s.is_primary,
  s.sort_order,
  c.id as course_id,
  count(distinct n.id) filter (
    where n.is_active and n.question_id is not null
  )::integer as level_count,
  count(distinct u.id)::integer as unit_count,
  count(distinct l.id)::integer as lesson_count,
  count(distinct n.id) filter (
    where n.is_active and n.question_id is not null
  )::integer as question_count
from public.subjects s
left join public.courses c
  on c.subject_id = s.id and c.is_published
left join public.course_levels lv
  on lv.course_id = c.id and lv.is_published
left join public.units u
  on u.course_level_id = lv.id and u.is_published
left join public.lessons l
  on l.unit_id = u.id and l.is_published
left join public.learning_nodes n
  on n.unit_id = u.id
where s.status <> 'inactive'
group by
  s.id, s.slug, s.name, s.short_name, s.description, s.category,
  s.icon_key, s.accent_color, s.status, s.is_primary, s.sort_order, c.id;

comment on view public.subject_overview is
  'Published curriculum counts per subject for the catalog. Levels and questions count playable linked levels only; answer keys are never exposed.';

revoke all on public.subject_overview from anon, authenticated;
grant select on public.subject_overview to authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.admin_create_question_level(jsonb, text) from public, anon;
grant execute on function public.admin_create_question_level(jsonb, text) to authenticated;
