-- Lentera · Admin CMS website content, announcements, and media metadata
-- Structured content blocks only; no free-form HTML. Media uploads use a
-- dedicated public bucket, while file metadata and usage live in Postgres.

-- ---------------------------------------------------------------------------
-- Site settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'Lentera',
  tagline text not null default 'Petualangan belajar yang seru',
  description text not null default '',
  copyright text not null default '',
  support_url text not null default '',
  primary_color text not null default '#58CC02',
  favicon_url text not null default '',
  logo_url text not null default '',
  hero_title text not null default '',
  hero_description text not null default '',
  hero_cta_label text not null default 'Mulai belajar',
  hero_cta_href text not null default '/register',
  footer_text text not null default '',
  maintenance_mode boolean not null default false,
  registration_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

-- Registration can be disabled from the CMS and is enforced by the database,
-- not only hidden in the frontend.
create or replace function public.enforce_registration_enabled()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if exists (
    select 1 from public.site_settings
    where id and not registration_enabled
  ) then
    raise exception 'registration_disabled' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_registration_enabled on auth.users;
create trigger enforce_registration_enabled
  before insert on auth.users
  for each row execute function public.enforce_registration_enabled();

-- ---------------------------------------------------------------------------
-- Information pages
-- ---------------------------------------------------------------------------
create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  title text not null,
  summary text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  meta_title text not null default '',
  meta_description text not null default '',
  og_image_url text not null default '',
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Website announcements (banner + optional inbox notification)
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  link text not null default '',
  audience text not null default 'all' check (audience in ('all', 'onboarded', 'staff')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists announcements_active_idx
  on public.announcements (is_active, starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Media library metadata
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  url text not null,
  kind text not null check (kind in ('image', 'audio', 'video')),
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  width integer,
  height integer,
  alt_text text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_kind_idx on public.media_assets (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Block validation
-- ---------------------------------------------------------------------------
create or replace function public.admin_validate_blocks(p_blocks jsonb)
returns void
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
begin
  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'blocks_invalid' using errcode = '22023';
  end if;
  if jsonb_array_length(p_blocks) > 100 then
    raise exception 'blocks_too_many' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_blocks) loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'blocks_invalid' using errcode = '22023';
    end if;
    if (v_item->>'type') not in ('heading', 'paragraph', 'list', 'image', 'callout', 'faq') then
      raise exception 'block_type_invalid' using errcode = '22023';
    end if;
    if (v_item->>'type') = 'list' then
      if jsonb_typeof(coalesce(v_item->'items', '[]'::jsonb)) <> 'array'
        or jsonb_array_length(coalesce(v_item->'items', '[]'::jsonb)) > 50 then
        raise exception 'block_list_invalid' using errcode = '22023';
      end if;
    elsif (v_item->>'type') = 'image' then
      if btrim(coalesce(v_item->>'url', '')) = '' or btrim(coalesce(v_item->>'alt', '')) = '' then
        raise exception 'block_image_invalid' using errcode = '22023';
      end if;
    elsif (v_item->>'type') = 'faq' then
      if btrim(coalesce(v_item->>'question', '')) = ''
        or btrim(coalesce(v_item->>'answer', '')) = '' then
        raise exception 'block_faq_invalid' using errcode = '22023';
      end if;
    else
      if btrim(coalesce(v_item->>'text', '')) = '' then
        raise exception 'block_text_required' using errcode = '22023';
      end if;
    end if;
    if char_length(coalesce(v_item->>'text', '')) > 5000
      or char_length(coalesce(v_item->>'answer', '')) > 5000 then
      raise exception 'block_text_too_long' using errcode = '22023';
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin site settings and pages
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_site_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('content.manage');
  return (select to_jsonb(s) from public.site_settings s where s.id);
end;
$$;

create or replace function public.admin_save_site_settings(
  p_payload jsonb,
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
  if btrim(coalesce(p_payload->>'siteName', '')) = '' then
    raise exception 'site_name_required' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'primaryColor', '') <> ''
    and (p_payload->>'primaryColor') !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'color_invalid' using errcode = '22023';
  end if;

  select to_jsonb(s) into v_before from public.site_settings s where s.id;

  update public.site_settings set
    site_name = btrim(p_payload->>'siteName'),
    tagline = coalesce(p_payload->>'tagline', tagline),
    description = coalesce(p_payload->>'description', description),
    copyright = coalesce(p_payload->>'copyright', copyright),
    support_url = coalesce(p_payload->>'supportUrl', support_url),
    primary_color = coalesce(nullif(btrim(p_payload->>'primaryColor'), ''), primary_color),
    favicon_url = coalesce(p_payload->>'faviconUrl', favicon_url),
    logo_url = coalesce(p_payload->>'logoUrl', logo_url),
    hero_title = coalesce(p_payload->>'heroTitle', hero_title),
    hero_description = coalesce(p_payload->>'heroDescription', hero_description),
    hero_cta_label = coalesce(p_payload->>'heroCtaLabel', hero_cta_label),
    hero_cta_href = coalesce(p_payload->>'heroCtaHref', hero_cta_href),
    footer_text = coalesce(p_payload->>'footerText', footer_text),
    maintenance_mode = coalesce((p_payload->>'maintenanceMode')::boolean, maintenance_mode),
    registration_enabled = coalesce((p_payload->>'registrationEnabled')::boolean, registration_enabled),
    updated_at = now(),
    updated_by = auth.uid()
  where id;

  perform public.admin_audit(
    'site_settings_save', 'site_settings', 'singleton', p_reason, v_before,
    (select to_jsonb(s) from public.site_settings s where s.id)
  );
  return (select to_jsonb(s) from public.site_settings s where s.id);
end;
$$;

create or replace function public.admin_list_pages()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('content.manage');
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'title', p.title,
      'summary', p.summary,
      'status', p.status,
      'sortOrder', p.sort_order,
      'updatedAt', p.updated_at
    ) order by p.sort_order, p.title), '[]'::jsonb)
    from public.content_pages p
  );
end;
$$;

create or replace function public.admin_get_page(p_page_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('content.manage');
  return (select to_jsonb(p) from public.content_pages p where p.id = p_page_id);
end;
$$;

create or replace function public.admin_save_page(p_payload jsonb, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid := nullif(p_payload->>'id', '')::uuid;
  v_slug text := lower(btrim(coalesce(p_payload->>'slug', '')));
  v_status text := coalesce(nullif(p_payload->>'status', ''), 'draft');
  v_blocks jsonb := coalesce(p_payload->'blocks', '[]'::jsonb);
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('content.manage');
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,80}$' then
    raise exception 'slug_invalid' using errcode = '22023';
  end if;
  if v_status not in ('draft', 'published', 'archived') then
    raise exception 'page_status_invalid' using errcode = '22023';
  end if;
  if btrim(coalesce(p_payload->>'title', '')) = '' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  perform public.admin_validate_blocks(v_blocks);

  if v_id is not null then
    select to_jsonb(p) into v_before from public.content_pages p where p.id = v_id;
    if v_before = '{}'::jsonb then
      raise exception 'page_not_found' using errcode = 'P0002';
    end if;
    update public.content_pages set
      slug = v_slug,
      title = btrim(p_payload->>'title'),
      summary = coalesce(p_payload->>'summary', ''),
      blocks = v_blocks,
      status = v_status,
      meta_title = coalesce(p_payload->>'metaTitle', ''),
      meta_description = coalesce(p_payload->>'metaDescription', ''),
      og_image_url = coalesce(p_payload->>'ogImageUrl', ''),
      sort_order = coalesce((p_payload->>'sortOrder')::integer, sort_order),
      updated_by = auth.uid(),
      updated_at = now()
    where id = v_id;
  else
    insert into public.content_pages (
      slug, title, summary, blocks, status, meta_title, meta_description,
      og_image_url, sort_order, created_by, updated_by
    ) values (
      v_slug, btrim(p_payload->>'title'), coalesce(p_payload->>'summary', ''),
      v_blocks, v_status, coalesce(p_payload->>'metaTitle', ''),
      coalesce(p_payload->>'metaDescription', ''),
      coalesce(p_payload->>'ogImageUrl', ''),
      coalesce((p_payload->>'sortOrder')::integer, 0), auth.uid(), auth.uid()
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'content_page_save', 'content_page', v_id::text, p_reason, v_before,
    (select to_jsonb(p) from public.content_pages p where p.id = v_id)
  );
  return (select to_jsonb(p) from public.content_pages p where p.id = v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin announcements and notification delivery
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_announcements()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.admin_require_permission('announcements.manage');
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'body', a.body,
      'link', a.link,
      'audience', a.audience,
      'startsAt', a.starts_at,
      'endsAt', a.ends_at,
      'isActive', a.is_active,
      'createdAt', a.created_at,
      'updatedAt', a.updated_at
    ) order by a.created_at desc), '[]'::jsonb)
    from public.announcements a
  );
end;
$$;

create or replace function public.admin_save_announcement(
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
  v_audience text := coalesce(nullif(p_payload->>'audience', ''), 'all');
  v_link text := btrim(coalesce(p_payload->>'link', ''));
  v_before jsonb := '{}'::jsonb;
begin
  perform public.admin_require_permission('announcements.manage');
  if char_length(btrim(coalesce(p_payload->>'title', ''))) < 3
    or char_length(btrim(coalesce(p_payload->>'title', ''))) > 120 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if char_length(coalesce(p_payload->>'body', '')) > 1000 then
    raise exception 'body_invalid' using errcode = '22023';
  end if;
  if v_audience not in ('all', 'onboarded', 'staff') then
    raise exception 'audience_invalid' using errcode = '22023';
  end if;
  if v_link <> '' and (left(v_link, 1) <> '/' or left(v_link, 2) = '//') then
    raise exception 'link_invalid' using errcode = '22023';
  end if;

  if v_id is not null then
    select to_jsonb(a) into v_before from public.announcements a where a.id = v_id;
    if v_before = '{}'::jsonb then
      raise exception 'announcement_not_found' using errcode = 'P0002';
    end if;
    update public.announcements set
      title = btrim(p_payload->>'title'),
      body = coalesce(p_payload->>'body', ''),
      link = v_link,
      audience = v_audience,
      starts_at = coalesce((p_payload->>'startsAt')::timestamptz, starts_at),
      ends_at = nullif(p_payload->>'endsAt', '')::timestamptz,
      is_active = coalesce((p_payload->>'isActive')::boolean, is_active),
      updated_by = auth.uid(),
      updated_at = now()
    where id = v_id;
  else
    insert into public.announcements (
      title, body, link, audience, starts_at, ends_at, is_active,
      created_by, updated_by
    ) values (
      btrim(p_payload->>'title'),
      coalesce(p_payload->>'body', ''),
      v_link,
      v_audience,
      coalesce((p_payload->>'startsAt')::timestamptz, now()),
      nullif(p_payload->>'endsAt', '')::timestamptz,
      coalesce((p_payload->>'isActive')::boolean, true),
      auth.uid(), auth.uid()
    ) returning id into v_id;
  end if;

  perform public.admin_audit(
    'announcement_save', 'announcement', v_id::text, p_reason, v_before,
    (select to_jsonb(a) from public.announcements a where a.id = v_id)
  );
  return (select to_jsonb(a) from public.announcements a where a.id = v_id);
end;
$$;

create or replace function public.admin_estimate_audience(p_audience text default 'onboarded')
returns integer
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_count integer;
begin
  perform public.admin_require_permission('announcements.manage');
  select count(*)::integer into v_count
  from public.profiles p
  where case
    when p_audience = 'staff' then exists (
      select 1 from public.user_roles r
      where r.user_id = p.id and r.role in ('admin', 'developer')
    )
    when p_audience = 'onboarded' then p.onboarding_completed
    else true
  end;
  return v_count;
end;
$$;

create or replace function public.admin_send_notification(
  p_title text,
  p_body text default '',
  p_link text default '',
  p_audience text default 'onboarded',
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_link text := btrim(coalesce(p_link, ''));
  v_audience text := coalesce(nullif(p_audience, ''), 'onboarded');
  v_count integer;
begin
  perform public.admin_require_permission('announcements.manage');
  if char_length(v_title) < 3 or char_length(v_title) > 80 then
    raise exception 'broadcast_title_invalid' using errcode = '22023';
  end if;
  if char_length(v_body) > 300 then
    raise exception 'broadcast_body_invalid' using errcode = '22023';
  end if;
  if v_link <> '' and (left(v_link, 1) <> '/' or left(v_link, 2) = '//') then
    raise exception 'broadcast_link_invalid' using errcode = '22023';
  end if;
  if v_audience not in ('all', 'onboarded', 'staff') then
    raise exception 'audience_invalid' using errcode = '22023';
  end if;

  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, 'info', v_title, v_body, v_link
  from public.profiles p
  where case
    when v_audience = 'staff' then exists (
      select 1 from public.user_roles r
      where r.user_id = p.id and r.role in ('admin', 'developer')
    )
    when v_audience = 'onboarded' then p.onboarding_completed
    else true
  end
  order by p.created_at
  limit 500;

  get diagnostics v_count = row_count;

  perform public.admin_audit(
    'notification_broadcast', 'broadcast', null, p_reason,
    '{}'::jsonb,
    jsonb_build_object(
      'title', v_title, 'audience', v_audience, 'recipients', v_count, 'link', v_link
    )
  );
  return jsonb_build_object('recipients', v_count, 'audience', v_audience);
end;
$$;

-- ---------------------------------------------------------------------------
-- Media library (upload itself uses Supabase Storage from the staff client)
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_media(
  p_search text default '',
  p_kind text default '',
  p_page integer default 1,
  p_page_size integer default 24
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_search text := btrim(coalesce(p_search, ''));
  v_kind text := btrim(coalesce(p_kind, ''));
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_size integer := greatest(5, least(coalesce(p_page_size, 24), 100));
  v_offset integer := (v_page - 1) * v_size;
  v_total integer;
  v_items jsonb;
begin
  perform public.admin_require_permission('media.manage');

  select count(*)::integer into v_total
  from public.media_assets m
  where m.status = 'active'
    and (v_kind = '' or m.kind = v_kind)
    and (
      v_search = ''
      or position(lower(v_search) in lower(m.alt_text)) > 0
      or position(lower(v_search) in lower(m.storage_path)) > 0
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'storagePath', m.storage_path,
    'url', m.url,
    'kind', m.kind,
    'mimeType', m.mime_type,
    'sizeBytes', m.size_bytes,
    'width', m.width,
    'height', m.height,
    'altText', m.alt_text,
    'status', m.status,
    'createdAt', m.created_at
  ) order by m.created_at desc), '[]'::jsonb)
  into v_items
  from (
    select * from public.media_assets m
    where m.status = 'active'
      and (v_kind = '' or m.kind = v_kind)
      and (
        v_search = ''
        or position(lower(v_search) in lower(m.alt_text)) > 0
        or position(lower(v_search) in lower(m.storage_path)) > 0
      )
    order by m.created_at desc
    limit v_size offset v_offset
  ) m;

  return jsonb_build_object('total', v_total, 'page', v_page, 'pageSize', v_size, 'items', v_items);
end;
$$;

create or replace function public.admin_register_media(
  p_storage_path text,
  p_url text,
  p_kind text,
  p_mime_type text,
  p_size_bytes bigint,
  p_alt_text text,
  p_width integer default null,
  p_height integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
  v_path text := btrim(coalesce(p_storage_path, ''));
  v_mime text := lower(btrim(coalesce(p_mime_type, '')));
  v_alt text := btrim(coalesce(p_alt_text, ''));
begin
  perform public.admin_require_permission('media.manage');
  if v_path = '' or p_url is null or btrim(p_url) = '' then
    raise exception 'media_path_required' using errcode = '22023';
  end if;
  if p_kind not in ('image', 'audio', 'video') then
    raise exception 'media_kind_invalid' using errcode = '22023';
  end if;
  if v_mime = 'image/svg+xml' or v_mime = 'text/html' or v_mime like '%javascript%' then
    raise exception 'media_type_forbidden' using errcode = '22023';
  end if;
  if p_kind = 'image' and v_mime not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') then
    raise exception 'media_type_invalid' using errcode = '22023';
  end if;
  if p_kind = 'audio' and v_mime not in ('audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm') then
    raise exception 'media_type_invalid' using errcode = '22023';
  end if;
  if p_kind = 'video' and v_mime not in ('video/mp4', 'video/webm') then
    raise exception 'media_type_invalid' using errcode = '22023';
  end if;
  if coalesce(p_size_bytes, 0) < 0 or coalesce(p_size_bytes, 0) > 20971520 then
    raise exception 'media_size_invalid' using errcode = '22023';
  end if;
  if p_kind = 'image' and v_alt = '' then
    raise exception 'media_alt_required' using errcode = '22023';
  end if;

  insert into public.media_assets (
    storage_path, url, kind, mime_type, size_bytes, width, height, alt_text, uploaded_by
  ) values (
    v_path, btrim(p_url), p_kind, v_mime, coalesce(p_size_bytes, 0),
    p_width, p_height, v_alt, auth.uid()
  )
  on conflict (storage_path) do update set
    url = excluded.url,
    kind = excluded.kind,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    width = excluded.width,
    height = excluded.height,
    alt_text = excluded.alt_text,
    status = 'active'
  returning id into v_id;

  perform public.admin_audit(
    'media_register', 'media', v_id::text, '',
    '{}'::jsonb,
    jsonb_build_object('path', v_path, 'kind', p_kind, 'mime', v_mime, 'size', p_size_bytes)
  );
  return (select to_jsonb(m) from public.media_assets m where m.id = v_id);
end;
$$;

create or replace function public.admin_archive_media(p_media_id uuid, p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_before jsonb;
begin
  perform public.admin_require_permission('media.manage');
  select to_jsonb(m) into v_before from public.media_assets m where m.id = p_media_id;
  if v_before = '{}'::jsonb then
    raise exception 'media_not_found' using errcode = 'P0002';
  end if;
  update public.media_assets set status = 'archived' where id = p_media_id;
  perform public.admin_audit(
    'media_archive', 'media', p_media_id::text, p_reason, v_before,
    jsonb_build_object('status', 'archived')
  );
  return jsonb_build_object('id', p_media_id, 'status', 'archived');
end;
$$;

-- ---------------------------------------------------------------------------
-- Public reads (safe content only)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_site_content()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return jsonb_build_object(
    'settings', (
      select jsonb_build_object(
        'siteName', s.site_name,
        'tagline', s.tagline,
        'description', s.description,
        'copyright', s.copyright,
        'supportUrl', s.support_url,
        'primaryColor', s.primary_color,
        'faviconUrl', s.favicon_url,
        'logoUrl', s.logo_url,
        'heroTitle', s.hero_title,
        'heroDescription', s.hero_description,
        'heroCtaLabel', s.hero_cta_label,
        'heroCtaHref', s.hero_cta_href,
        'footerText', s.footer_text,
        'maintenanceMode', s.maintenance_mode,
        'registrationEnabled', s.registration_enabled
      )
      from public.site_settings s where s.id
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', p.slug, 'title', p.title, 'sortOrder', p.sort_order
      ) order by p.sort_order, p.title), '[]'::jsonb)
      from public.content_pages p where p.status = 'published'
    )
  );
end;
$$;

create or replace function public.get_public_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_page public.content_pages;
begin
  select * into v_page
  from public.content_pages
  where slug = lower(btrim(coalesce(p_slug, ''))) and status = 'published';
  if v_page.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'slug', v_page.slug,
    'title', v_page.title,
    'summary', v_page.summary,
    'blocks', v_page.blocks,
    'metaTitle', v_page.meta_title,
    'metaDescription', v_page.meta_description,
    'ogImageUrl', v_page.og_image_url,
    'updatedAt', v_page.updated_at
  );
end;
$$;

create or replace function public.get_active_announcements()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_role public.app_role := 'player';
  v_onboarded boolean := false;
begin
  if v_user is not null then
    select role into v_role from public.user_roles where user_id = v_user;
    select onboarding_completed into v_onboarded
    from public.profiles where id = v_user;
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'body', a.body,
      'link', a.link
    ) order by a.starts_at desc), '[]'::jsonb)
    from public.announcements a
    where a.is_active
      and a.starts_at <= now()
      and (a.ends_at is null or a.ends_at > now())
      and (
        a.audience = 'all'
        or (a.audience = 'onboarded' and coalesce(v_onboarded, false))
        or (a.audience = 'staff' and coalesce(v_role, 'player') in ('admin', 'developer'))
      )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage bucket and policies (skipped when storage schema is unavailable)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('content-media', 'content-media', true)
    on conflict (id) do update set public = true;
  end if;

  if to_regclass('storage.objects') is not null then
    execute $policy$
      drop policy if exists content_media_read on storage.objects;
      create policy content_media_read on storage.objects
        for select to authenticated
        using (bucket_id = 'content-media');
    $policy$;

    execute $policy$
      drop policy if exists content_media_insert on storage.objects;
      create policy content_media_insert on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'content-media'
          and public.admin_has_permission('media.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists content_media_update on storage.objects;
      create policy content_media_update on storage.objects
        for update to authenticated
        using (
          bucket_id = 'content-media'
          and public.admin_has_permission('media.manage')
        )
        with check (
          bucket_id = 'content-media'
          and public.admin_has_permission('media.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists content_media_delete on storage.objects;
      create policy content_media_delete on storage.objects
        for delete to authenticated
        using (
          bucket_id = 'content-media'
          and public.admin_has_permission('media.manage')
        );
    $policy$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.content_pages enable row level security;
alter table public.announcements enable row level security;
alter table public.media_assets enable row level security;

revoke all on public.site_settings from anon, authenticated;
revoke all on public.content_pages from anon, authenticated;
revoke all on public.announcements from anon, authenticated;
revoke all on public.media_assets from anon, authenticated;

revoke all on function public.admin_validate_blocks(jsonb) from public, anon, authenticated;
revoke all on function public.admin_get_site_settings() from public, anon;
revoke all on function public.admin_save_site_settings(jsonb, text) from public, anon;
revoke all on function public.admin_list_pages() from public, anon;
revoke all on function public.admin_get_page(uuid) from public, anon;
revoke all on function public.admin_save_page(jsonb, text) from public, anon;
revoke all on function public.admin_list_announcements() from public, anon;
revoke all on function public.admin_save_announcement(jsonb, text) from public, anon;
revoke all on function public.admin_estimate_audience(text) from public, anon;
revoke all on function public.admin_send_notification(text, text, text, text, text)
  from public, anon;
revoke all on function public.admin_list_media(text, text, integer, integer) from public, anon;
revoke all on function public.admin_register_media(
  text, text, text, text, bigint, text, integer, integer
) from public, anon;
revoke all on function public.admin_archive_media(uuid, text) from public, anon;
revoke all on function public.get_public_site_content() from public;
revoke all on function public.get_public_page(text) from public;
revoke all on function public.get_active_announcements() from public;

grant execute on function public.admin_get_site_settings() to authenticated;
grant execute on function public.admin_save_site_settings(jsonb, text) to authenticated;
grant execute on function public.admin_list_pages() to authenticated;
grant execute on function public.admin_get_page(uuid) to authenticated;
grant execute on function public.admin_save_page(jsonb, text) to authenticated;
grant execute on function public.admin_list_announcements() to authenticated;
grant execute on function public.admin_save_announcement(jsonb, text) to authenticated;
grant execute on function public.admin_estimate_audience(text) to authenticated;
grant execute on function public.admin_send_notification(text, text, text, text, text)
  to authenticated;
grant execute on function public.admin_list_media(text, text, integer, integer) to authenticated;
grant execute on function public.admin_register_media(
  text, text, text, text, bigint, text, integer, integer
) to authenticated;
grant execute on function public.admin_archive_media(uuid, text) to authenticated;
grant execute on function public.get_public_site_content() to anon, authenticated;
grant execute on function public.get_public_page(text) to anon, authenticated;
grant execute on function public.get_active_announcements() to anon, authenticated;
