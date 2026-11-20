-- Lentera · Faster subject catalog
-- The previous view joined subjects → courses → levels → units → lessons →
-- learning_nodes and then grouped the result. With 1,100+ lessons and 1,100+
-- nodes that produced ~492,000 intermediate rows and a multi-second disk sort.
-- These correlated aggregates return the same 13 rows and the same counts
-- without changing any table, column, grant, or API response shape.

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
  (
    select count(distinct n.id)::integer
    from public.course_levels lv
    join public.units u
      on u.course_level_id = lv.id and u.is_published
    join public.learning_nodes n
      on n.unit_id = u.id
     and n.is_active
     and n.question_id is not null
    where lv.course_id = c.id
      and lv.is_published
  ) as level_count,
  (
    select count(distinct u.id)::integer
    from public.course_levels lv
    join public.units u
      on u.course_level_id = lv.id and u.is_published
    where lv.course_id = c.id
      and lv.is_published
  ) as unit_count,
  (
    select count(distinct l.id)::integer
    from public.course_levels lv
    join public.units u
      on u.course_level_id = lv.id and u.is_published
    join public.lessons l
      on l.unit_id = u.id and l.is_published
    where lv.course_id = c.id
      and lv.is_published
  ) as lesson_count,
  (
    select count(distinct n.id)::integer
    from public.course_levels lv
    join public.units u
      on u.course_level_id = lv.id and u.is_published
    join public.learning_nodes n
      on n.unit_id = u.id
     and n.is_active
     and n.question_id is not null
    where lv.course_id = c.id
      and lv.is_published
  ) as question_count,
  s.learn_category,
  s.icon_url
from public.subjects s
left join public.courses c
  on c.subject_id = s.id and c.is_published
where s.status <> 'inactive';

comment on view public.subject_overview is
  'Published curriculum counts per subject for the catalog. Levels and questions count playable linked levels only; answer keys are never exposed.';

revoke all on public.subject_overview from anon, authenticated;
grant select on public.subject_overview to authenticated;

notify pgrst, 'reload schema';
