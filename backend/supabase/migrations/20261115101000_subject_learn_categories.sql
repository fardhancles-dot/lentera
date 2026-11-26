-- Lentera · Kategori mata pelajaran pada halaman Belajar
-- Additive only: existing subjects, courses, levels, questions, progress, XP,
-- coins, hearts, and rewards are untouched. Every subject gets exactly one of
-- three fixed categories, and new subjects default to Mapel Umum.

alter table public.subjects
  add column if not exists learn_category text not null default 'umum';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subjects'::regclass
      and conname = 'subjects_learn_category_valid'
  ) then
    alter table public.subjects
      add constraint subjects_learn_category_valid
      check (learn_category in ('umum', 'bahasa-daerah', 'bahasa-asing'));
  end if;
end $$;

comment on column public.subjects.learn_category is
  'Kategori navigasi halaman Belajar: umum, bahasa-daerah, atau bahasa-asing.';

-- ---------------------------------------------------------------------------
-- Staff reads and writes
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_subject_categories()
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'slug', s.slug,
    'name', s.name,
    'status', s.status,
    'learnCategory', s.learn_category
  ) order by s.sort_order, s.name), '[]'::jsonb)
  into v_result
  from public.subjects s;

  return v_result;
end;
$$;

-- Only the category column is written, so name, slug, sort order, status, and
-- every question/level relation stay exactly as they are.
create or replace function public.admin_set_subject_category(
  p_subject_id uuid,
  p_category text,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_category text := lower(btrim(coalesce(p_category, '')));
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('curriculum.edit');

  if v_category not in ('umum', 'bahasa-daerah', 'bahasa-asing') then
    raise exception 'subject_category_invalid' using errcode = '22023';
  end if;

  select to_jsonb(s) into v_before from public.subjects s where s.id = p_subject_id;
  if v_before = '{}'::jsonb then
    raise exception 'subject_not_found' using errcode = 'P0002';
  end if;

  update public.subjects
  set learn_category = v_category, updated_at = now()
  where id = p_subject_id;

  perform public.admin_audit(
    'subject_category_set', 'subject', p_subject_id::text, p_reason, v_before,
    jsonb_build_object('learnCategory', v_category)
  );

  return jsonb_build_object('id', p_subject_id, 'learnCategory', v_category);
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog view: expose the category without leaking anything new
-- ---------------------------------------------------------------------------
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
  s.learn_category
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
  s.learn_category;

comment on view public.subject_overview is
  'Published curriculum counts per subject for the catalog. Levels and questions count playable linked levels only; answer keys are never exposed.';

revoke all on public.subject_overview from anon, authenticated;
grant select on public.subject_overview to authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.admin_list_subject_categories() from public, anon;
revoke all on function public.admin_set_subject_category(uuid, text, text) from public, anon;

grant execute on function public.admin_list_subject_categories() to authenticated;
grant execute on function public.admin_set_subject_category(uuid, text, text) to authenticated;
