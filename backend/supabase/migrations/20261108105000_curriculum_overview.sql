-- Lentera · Subject catalog overview
-- Aggregates published curriculum content for the subject picker without
-- exposing questions, options, or answers to players.

create or replace view public.subject_overview
with (security_invoker = true) as
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
  count(distinct lv.id)::integer as level_count,
  count(distinct u.id)::integer as unit_count,
  count(distinct l.id)::integer as lesson_count,
  count(distinct q.id)::integer as question_count
from public.subjects s
left join public.courses c
  on c.subject_id = s.id and c.is_published
left join public.course_levels lv
  on lv.course_id = c.id and lv.is_published
left join public.units u
  on u.course_level_id = lv.id and u.is_published
left join public.lessons l
  on l.unit_id = u.id and l.is_published
left join public.questions q
  on q.lesson_id = l.id and q.is_active
where s.status <> 'inactive'
group by
  s.id, s.slug, s.name, s.short_name, s.description, s.category,
  s.icon_key, s.accent_color, s.status, s.is_primary, s.sort_order, c.id;

comment on view public.subject_overview is
  'Published curriculum counts per subject for the catalog. Questions and answer keys are not exposed.';

revoke all on public.subject_overview from anon, authenticated;
grant select on public.subject_overview to authenticated;
