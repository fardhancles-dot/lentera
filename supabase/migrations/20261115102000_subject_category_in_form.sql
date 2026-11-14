-- Lentera · Kategori mapel pada form Tambah/Edit mapel
-- Small, additive change: admin_save_subject now accepts the same three fixed
-- categories that the Learn page uses. Everything else in the payload and all
-- curriculum relations stay untouched.

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
      accent_color, status, is_primary, sort_order
    ) values (
      v_slug, v_name,
      nullif(btrim(coalesce(p_payload->>'shortName', '')), ''),
      coalesce(p_payload->>'description', ''),
      coalesce(nullif(btrim(p_payload->>'category'), ''), 'umum'),
      coalesce(v_category, 'umum'),
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

revoke all on function public.admin_save_subject(jsonb, text) from public, anon;
grant execute on function public.admin_save_subject(jsonb, text) to authenticated;
