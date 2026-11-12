-- Lentera · One question per level
-- A level (learning node) now plays exactly one question from its lesson bank.
-- The bank itself is kept intact: practice, mastery, and review still read it.
-- The question is chosen deterministically (first active question by sort order)
-- so replaying the same level always presents the same question and rewards
-- stay idempotent per attempt.

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
  v_question_count integer;
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

  select count(*)::integer into v_question_count
  from public.questions
  where lesson_id = v_lesson.id and is_active;

  if v_question_count = 0 then
    raise exception 'lesson_has_no_questions' using errcode = '22023';
  end if;

  -- Exactly one question per level. The rest of the lesson bank is left in
  -- place for practice modes, mistakes review, and mastery tracking.
  select q.* into v_question
  from public.questions q
  where q.lesson_id = v_lesson.id and q.is_active
  order by q.sort_order, q.id
  limit 1;

  -- Only developer/admin preview may open a lesson outside its sequence.
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

  -- A new attempt supersedes unfinished attempts for the same lesson.
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

  select coalesce(jsonb_agg(
    jsonb_build_object(
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
    )
  ), '[]'::jsonb) into v_questions
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
