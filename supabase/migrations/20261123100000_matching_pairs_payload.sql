-- ---------------------------------------------------------------------------
-- Matching Pairs: include the correct pair mapping in player payloads
-- The game needs the mapping to give immediate correct/wrong feedback. The
-- data already lives in question_pairs; this only exposes it to the player's
-- current lesson/practice payload. No table, grading, or answer-key rule changes.
-- ---------------------------------------------------------------------------

create or replace function public.enrich_question_pairs(p_questions jsonb)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      case
        when q->>'type' = 'matching_pairs' then
          q || jsonb_build_object(
            'pairs',
            coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object('leftId', p.left_id, 'rightId', p.right_id)
                  order by p.sort_order
                )
                from public.question_pairs p
                where p.question_id = (q->>'id')::uuid
              ),
              '[]'::jsonb
            )
          )
        else q
      end
      order by ord
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
    with ordinality as t(q, ord);
$$;

revoke all on function public.enrich_question_pairs(jsonb) from public, anon, authenticated, service_role;

-- Preserve the existing player RPCs but wrap them so every question payload
-- gets the matching map. Renaming is guarded for a safe re-run.
do $$
begin
  if to_regprocedure('public.start_lesson_base(uuid)') is null then
    alter function public.start_lesson(uuid) rename to start_lesson_base;
  end if;
  if to_regprocedure('public.start_practice_base(public.practice_mode,uuid,uuid)') is null then
    alter function public.start_practice(public.practice_mode, uuid, uuid)
      rename to start_practice_base;
  end if;
  if to_regprocedure('public.start_scheduled_review_base(uuid)') is null then
    alter function public.start_scheduled_review(uuid) rename to start_scheduled_review_base;
  end if;
end;
$$;

revoke all on function public.start_lesson_base(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.start_practice_base(public.practice_mode, uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.start_scheduled_review_base(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.start_lesson(p_node_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payload jsonb;
begin
  v_payload := public.start_lesson_base(p_node_id);
  return jsonb_set(
    v_payload,
    '{questions}',
    public.enrich_question_pairs(v_payload->'questions'),
    true
  );
end;
$$;

create or replace function public.start_practice(
  p_mode public.practice_mode,
  p_course_id uuid,
  p_unit_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payload jsonb;
begin
  v_payload := public.start_practice_base(p_mode, p_course_id, p_unit_id);
  return jsonb_set(
    v_payload,
    '{questions}',
    public.enrich_question_pairs(v_payload->'questions'),
    true
  );
end;
$$;

create or replace function public.start_scheduled_review(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_payload jsonb;
begin
  v_payload := public.start_scheduled_review_base(p_course_id);
  return jsonb_set(
    v_payload,
    '{questions}',
    public.enrich_question_pairs(v_payload->'questions'),
    true
  );
end;
$$;

revoke all on function public.start_lesson(uuid) from public, anon;
revoke all on function public.start_practice(public.practice_mode, uuid, uuid) from public, anon;
revoke all on function public.start_scheduled_review(uuid) from public, anon;

grant execute on function public.start_lesson(uuid) to authenticated;
grant execute on function public.start_practice(public.practice_mode, uuid, uuid) to authenticated;
grant execute on function public.start_scheduled_review(uuid) to authenticated;
