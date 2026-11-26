-- Lentera · Pemisah materi pada peta level
-- Additive only: level numbering, question links, unlock order, rewards, and
-- player progress are untouched. A section is a label over a level range and
-- never creates a level or a question.

create table if not exists public.learning_sections (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  description text not null default '',
  start_level integer not null,
  end_level integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_sections_range_valid
    check (start_level >= 1 and end_level >= start_level)
);

create index if not exists learning_sections_subject_idx
  on public.learning_sections (subject_id, start_level);

-- Two active dividers may not start on the same level of the same subject.
create unique index if not exists learning_sections_active_start_unique
  on public.learning_sections (subject_id, start_level)
  where is_active;

alter table public.learning_sections enable row level security;

-- Players only ever read active sections; writes go through staff RPCs.
drop policy if exists "learning_sections_select_active" on public.learning_sections;
create policy "learning_sections_select_active"
  on public.learning_sections for select to authenticated
  using (is_active);

revoke all on public.learning_sections from anon, authenticated;
grant select on public.learning_sections to authenticated;

-- ---------------------------------------------------------------------------
-- Staff reads: every section, including inactive drafts
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_learning_sections(p_subject_id uuid default null)
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
    'subjectId', s.subject_id,
    'title', s.title,
    'description', s.description,
    'startLevel', s.start_level,
    'endLevel', s.end_level,
    'isActive', s.is_active,
    'updatedAt', s.updated_at
  ) order by s.start_level, s.id), '[]'::jsonb)
  into v_result
  from public.learning_sections s
  where p_subject_id is null or s.subject_id = p_subject_id;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff writes
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_learning_section(
  p_payload jsonb,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_subject uuid := nullif(p_payload->>'subjectId', '')::uuid;
  v_title text := btrim(coalesce(p_payload->>'title', ''));
  v_description text := btrim(coalesce(p_payload->>'description', ''));
  v_start integer := coalesce((p_payload->>'startLevel')::integer, 0);
  v_end integer := coalesce((p_payload->>'endLevel')::integer, 0);
  v_active boolean := coalesce((p_payload->>'isActive')::boolean, true);
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('curriculum.edit');

  if v_subject is null or not exists (select 1 from public.subjects where id = v_subject) then
    raise exception 'subject_not_found' using errcode = 'P0002';
  end if;
  if char_length(v_title) < 1 or char_length(v_title) > 80 then
    raise exception 'section_title_invalid' using errcode = '22023';
  end if;
  if char_length(v_description) > 280 then
    raise exception 'section_description_invalid' using errcode = '22023';
  end if;
  if v_start < 1 or v_end < v_start then
    raise exception 'section_range_invalid' using errcode = '22023';
  end if;

  -- Active ranges may not overlap. Inactive sections are ignored so an admin
  -- can keep an old divider unpublished while a new range replaces it.
  if v_active and exists (
    select 1 from public.learning_sections s
    where s.subject_id = v_subject
      and s.is_active
      and (v_id is null or s.id <> v_id)
      and s.start_level <= v_end
      and s.end_level >= v_start
  ) then
    raise exception 'section_range_overlap' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(s) into v_before from public.learning_sections s where s.id = v_id;
    if v_before = '{}'::jsonb then
      raise exception 'section_not_found' using errcode = 'P0002';
    end if;

    update public.learning_sections set
      subject_id = v_subject,
      title = v_title,
      description = v_description,
      start_level = v_start,
      end_level = v_end,
      is_active = v_active,
      updated_at = now()
    where id = v_id;
  else
    insert into public.learning_sections (
      subject_id, title, description, start_level, end_level, is_active
    ) values (
      v_subject, v_title, v_description, v_start, v_end, v_active
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'learning_section_save', 'learning_section', v_id::text, p_reason, v_before,
    (select to_jsonb(s) from public.learning_sections s where s.id = v_id)
  );

  return (select to_jsonb(s) from public.learning_sections s where s.id = v_id);
end;
$$;

create or replace function public.admin_delete_learning_section(
  p_section_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('curriculum.edit');

  select to_jsonb(s) into v_before from public.learning_sections s where s.id = p_section_id;
  if v_before = '{}'::jsonb then
    raise exception 'section_not_found' using errcode = 'P0002';
  end if;

  -- Only the divider row is removed. Levels, questions, and player progress
  -- live in other tables and are never cascaded from here.
  delete from public.learning_sections where id = p_section_id;

  perform public.admin_audit(
    'learning_section_delete', 'learning_section', p_section_id::text, p_reason,
    v_before, '{}'::jsonb
  );

  return jsonb_build_object('id', p_section_id, 'deleted', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.admin_list_learning_sections(uuid) from public, anon;
revoke all on function public.admin_save_learning_section(jsonb, text) from public, anon;
revoke all on function public.admin_delete_learning_section(uuid, text) from public, anon;

grant execute on function public.admin_list_learning_sections(uuid) to authenticated;
grant execute on function public.admin_save_learning_section(jsonb, text) to authenticated;
grant execute on function public.admin_delete_learning_section(uuid, text) to authenticated;
