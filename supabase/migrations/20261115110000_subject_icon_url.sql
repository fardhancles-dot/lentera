-- Additive only: subjects may point at an uploaded icon image. When icon_url is
-- empty the existing icon_key fallback keeps rendering, so every legacy subject
-- and every level, question, and progress row stays exactly as it is.
alter table public.subjects
  add column if not exists icon_url text;

-- New columns on a replaced view must be appended, otherwise PostgreSQL refuses
-- the replacement. Everything before icon_url is byte-for-byte the current view.
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
  )::integer as question_count,
  s.learn_category,
  s.icon_url
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
  s.icon_key, s.accent_color, s.status, s.is_primary, s.sort_order, c.id,
  s.learn_category, s.icon_url;

comment on view public.subject_overview is
  'Published curriculum counts per subject for the catalog. Levels and questions count playable linked levels only; answer keys are never exposed.';

-- Keep the same access surface as before.
revoke all on public.subject_overview from anon, authenticated;
grant select on public.subject_overview to authenticated;

-- iconUrl is optional. Omitting it on an edit (for example when the admin does
-- not replace the image) preserves the stored URL, so old uploads never vanish.
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
  v_category text := nullif(btrim(coalesce(p_payload->>'learnCategory', '')), '');
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
  if v_category is not null and v_category not in ('umum', 'bahasa-daerah', 'bahasa-asing') then
    raise exception 'subject_category_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(s) into v_before from public.subjects s where s.id = v_id;
    update public.subjects set
      slug = v_slug,
      name = v_name,
      short_name = nullif(btrim(coalesce(p_payload->>'shortName', '')), ''),
      description = coalesce(p_payload->>'description', ''),
      category = coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      -- Omitted categories keep the current one instead of resetting to Umum.
      learn_category = coalesce(v_category, learn_category),
      icon_key = coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      icon_url = coalesce(nullif(btrim(coalesce(p_payload->>'iconUrl', '')), ''), icon_url),
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
      slug, name, short_name, description, category, learn_category, icon_key,
      icon_url, accent_color, status, is_primary, sort_order
    ) values (
      v_slug, v_name,
      nullif(btrim(coalesce(p_payload->>'shortName', '')), ''),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      coalesce(v_category, 'umum'),
      coalesce(nullif(btrim(p_payload->>'iconKey'), ''), 'book'),
      nullif(btrim(coalesce(p_payload->>'iconUrl', '')), ''),
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

revoke all on function public.admin_save_subject(jsonb, text) from public, anon;
grant execute on function public.admin_save_subject(jsonb, text) to authenticated;

-- Admin editor reads the same field so the current image can be previewed.
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
      'iconUrl', s.icon_url,
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

revoke all on function public.admin_list_curriculum() from public, anon;
grant execute on function public.admin_list_curriculum() to authenticated;

notify pgrst, 'reload schema';
