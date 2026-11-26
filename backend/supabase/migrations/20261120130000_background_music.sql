-- Lentera · Background music library
-- Admin-managed tracks live in the public content-media bucket under music/.
-- Metadata (and which track is the single global background) lives here. Players
-- read only the active primary track through get_background_music(); all writes
-- go through audited SECURITY DEFINER functions that require content.manage.

create table if not exists public.background_music (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  storage_path text not null unique check (storage_path ~ '^music/'),
  url text not null check (url ~ '^https://'),
  mime_type text not null check (
    mime_type in ('audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav')
  ),
  format text not null check (format in ('mp3', 'ogg', 'wav')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  is_active boolean not null default true,
  is_primary boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A primary track can never be inactive.
  check (not is_primary or is_active)
);

-- Exactly one primary track at a time.
create unique index if not exists background_music_single_primary_idx
  on public.background_music (is_primary) where is_primary;

create index if not exists background_music_created_idx
  on public.background_music (created_at desc);

create or replace function public.touch_background_music()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_background_music on public.background_music;
create trigger touch_background_music
  before update on public.background_music
  for each row execute function public.touch_background_music();

-- One JSON shape for every admin response so the dashboard can parse both
-- list and mutation results identically.
create or replace function public.background_music_admin_payload(m public.background_music)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', m.id,
    'title', m.title,
    'storagePath', m.storage_path,
    'url', m.url,
    'format', m.format,
    'mimeType', m.mime_type,
    'sizeBytes', m.size_bytes,
    'isActive', m.is_active,
    'isPrimary', m.is_primary,
    'createdAt', m.created_at,
    'updatedAt', m.updated_at
  );
$$;

-- ---------------------------------------------------------------------------
-- Player configuration
-- ---------------------------------------------------------------------------
create or replace function public.get_background_music()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', m.id,
    'title', m.title,
    'url', m.url,
    'format', m.format,
    'mimeType', m.mime_type,
    'sizeBytes', m.size_bytes,
    'updatedAt', m.updated_at
  )
  from public.background_music m
  where m.is_active
    and m.is_primary
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Admin management
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_background_music()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('content.manage');
  return coalesce((
    select jsonb_agg(public.background_music_admin_payload(m) order by m.created_at desc)
    from public.background_music m
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_register_background_music(
  p_title text,
  p_storage_path text,
  p_url text,
  p_mime_type text,
  p_size_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_path text := btrim(coalesce(p_storage_path, ''));
  v_url text := btrim(coalesce(p_url, ''));
  v_mime text := lower(btrim(coalesce(p_mime_type, '')));
  v_format text;
begin
  perform public.admin_require_permission('content.manage');

  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception 'music_title_invalid' using errcode = '22023';
  end if;
  if v_path !~ '^music/' then
    raise exception 'music_path_invalid' using errcode = '22023';
  end if;
  if v_url !~ '^https://' then
    raise exception 'music_url_invalid' using errcode = '22023';
  end if;
  v_format := case v_mime
    when 'audio/mpeg' then 'mp3'
    when 'audio/ogg' then 'ogg'
    when 'audio/wav' then 'wav'
    when 'audio/x-wav' then 'wav'
    else null
  end;
  if v_format is null then
    raise exception 'music_type_invalid' using errcode = '22023';
  end if;
  if p_size_bytes is null or p_size_bytes < 1 or p_size_bytes > 20971520 then
    raise exception 'music_size_invalid' using errcode = '22023';
  end if;

  insert into public.background_music (
    title, storage_path, url, mime_type, format, size_bytes, uploaded_by
  ) values (
    v_title, v_path, v_url, v_mime, v_format, p_size_bytes, auth.uid()
  )
  returning id into v_id;

  perform public.admin_audit(
    'background_music_register', 'background_music', v_id::text, '',
    '{}'::jsonb,
    jsonb_build_object('title', v_title, 'path', v_path, 'format', v_format)
  );

  return (select public.background_music_admin_payload(m) from public.background_music m where m.id = v_id);
end;
$$;

create or replace function public.admin_set_background_music_active(
  p_id uuid,
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
  perform public.admin_require_permission('content.manage');
  select to_jsonb(m) into v_before from public.background_music m where m.id = p_id;
  if v_before is null then
    raise exception 'music_not_found' using errcode = 'P0002';
  end if;

  update public.background_music
  set
    is_active = coalesce(p_active, is_active),
    -- Unpublishing the primary track also clears the primary flag, so players
    -- stop on their next configuration sync instead of streaming a hidden file.
    is_primary = case when coalesce(p_active, is_active) then is_primary else false end
  where id = p_id;

  perform public.admin_audit(
    'background_music_status', 'background_music', p_id::text, p_reason, v_before,
    (select to_jsonb(m) from public.background_music m where m.id = p_id)
  );
  return (select public.background_music_admin_payload(m) from public.background_music m where m.id = p_id);
end;
$$;

create or replace function public.admin_set_primary_background_music(
  p_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
  v_active boolean;
begin
  perform public.admin_require_permission('content.manage');
  select m.is_active into v_active from public.background_music m where m.id = p_id;
  if v_active is null then
    raise exception 'music_not_found' using errcode = 'P0002';
  end if;
  if not v_active then
    raise exception 'music_inactive' using errcode = '22023';
  end if;

  select to_jsonb(m) into v_before from public.background_music m where m.is_primary;

  update public.background_music set is_primary = false where is_primary and id <> p_id;
  update public.background_music set is_primary = true where id = p_id;

  perform public.admin_audit(
    'background_music_primary', 'background_music', p_id::text, p_reason, v_before,
    (select to_jsonb(m) from public.background_music m where m.id = p_id)
  );
  return (select public.background_music_admin_payload(m) from public.background_music m where m.id = p_id);
end;
$$;

create or replace function public.admin_delete_background_music(
  p_id uuid,
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
  perform public.admin_require_permission('content.manage');
  select to_jsonb(m) into v_before from public.background_music m where m.id = p_id;
  if v_before is null then
    raise exception 'music_not_found' using errcode = 'P0002';
  end if;

  delete from public.background_music where id = p_id;

  perform public.admin_audit(
    'background_music_delete', 'background_music', p_id::text, p_reason, v_before,
    jsonb_build_object('deleted', true)
  );

  -- The client removes this object from storage after the metadata is gone.
  return jsonb_build_object(
    'id', p_id,
    'storagePath', v_before->>'storage_path',
    'url', v_before->>'url'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS, grants, and storage policies
-- ---------------------------------------------------------------------------
alter table public.background_music enable row level security;
revoke all on public.background_music from anon, authenticated;

revoke all on function public.get_background_music() from public;
grant execute on function public.get_background_music() to anon, authenticated;

revoke all on function public.admin_list_background_music() from public, anon;
revoke all on function public.admin_register_background_music(text, text, text, text, bigint) from public, anon;
revoke all on function public.admin_set_background_music_active(uuid, boolean, text) from public, anon;
revoke all on function public.admin_set_primary_background_music(uuid, text) from public, anon;
revoke all on function public.admin_delete_background_music(uuid, text) from public, anon;

grant execute on function public.admin_list_background_music() to authenticated;
grant execute on function public.admin_register_background_music(text, text, text, text, bigint) to authenticated;
grant execute on function public.admin_set_background_music_active(uuid, boolean, text) to authenticated;
grant execute on function public.admin_set_primary_background_music(uuid, text) to authenticated;
grant execute on function public.admin_delete_background_music(uuid, text) to authenticated;

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('content-media', 'content-media', true)
    on conflict (id) do nothing;
  end if;

  if to_regclass('storage.objects') is not null then
    drop policy if exists music_media_insert on storage.objects;
    create policy music_media_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'content-media'
        and (storage.foldername(name))[1] = 'music'
        and public.admin_has_permission('content.manage')
      );

    drop policy if exists music_media_update on storage.objects;
    create policy music_media_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'content-media'
        and (storage.foldername(name))[1] = 'music'
        and public.admin_has_permission('content.manage')
      )
      with check (
        bucket_id = 'content-media'
        and (storage.foldername(name))[1] = 'music'
        and public.admin_has_permission('content.manage')
      );

    drop policy if exists music_media_delete on storage.objects;
    create policy music_media_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'content-media'
        and (storage.foldername(name))[1] = 'music'
        and public.admin_has_permission('content.manage')
      );
  end if;
end;
$$;
