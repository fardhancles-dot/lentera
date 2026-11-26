-- Lentera · Global journey background settings
-- The learn map background is one global setting for every subject. Desktop
-- and mobile are separate columns so changing one never overwrites the other.
-- Additive only: existing site settings, maps, levels, and questions untouched.

alter table public.site_settings
  add column if not exists background_desktop_url text not null default '',
  add column if not exists background_mobile_url text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_background_desktop_url_check'
  ) then
    alter table public.site_settings
      add constraint site_settings_background_desktop_url_check
      check (
        background_desktop_url = ''
        or (
          char_length(background_desktop_url) <= 2048
          and background_desktop_url ~ '^https://'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_background_mobile_url_check'
  ) then
    alter table public.site_settings
      add constraint site_settings_background_mobile_url_check
      check (
        background_mobile_url = ''
        or (
          char_length(background_mobile_url) <= 2048
          and background_mobile_url ~ '^https://'
        )
      );
  end if;
end $$;

-- Only the fields present in the payload are written. The website identity form
-- never sends these keys, so it keeps both backgrounds exactly as they are.
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
  v_background_desktop text;
  v_background_mobile text;
begin
  perform public.admin_require_permission('content.manage');
  if btrim(coalesce(p_payload->>'siteName', '')) = '' then
    raise exception 'site_name_required' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'primaryColor', '') <> ''
    and (p_payload->>'primaryColor') !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'color_invalid' using errcode = '22023';
  end if;

  if p_payload ? 'backgroundDesktopUrl' then
    v_background_desktop := btrim(coalesce(p_payload->>'backgroundDesktopUrl', ''));
    if v_background_desktop <> '' and (
      char_length(v_background_desktop) > 2048
      or v_background_desktop !~ '^https://'
    ) then
      raise exception 'background_url_invalid' using errcode = '22023';
    end if;
  end if;

  if p_payload ? 'backgroundMobileUrl' then
    v_background_mobile := btrim(coalesce(p_payload->>'backgroundMobileUrl', ''));
    if v_background_mobile <> '' and (
      char_length(v_background_mobile) > 2048
      or v_background_mobile !~ '^https://'
    ) then
      raise exception 'background_url_invalid' using errcode = '22023';
    end if;
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
    background_desktop_url = case
      when p_payload ? 'backgroundDesktopUrl' then v_background_desktop
      else background_desktop_url
    end,
    background_mobile_url = case
      when p_payload ? 'backgroundMobileUrl' then v_background_mobile
      else background_mobile_url
    end,
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

-- Public reads now carry both global background URLs. This is the single source
-- used by every subject map, so a new subject needs no background configuration.
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
        'registrationEnabled', s.registration_enabled,
        'backgroundDesktopUrl', s.background_desktop_url,
        'backgroundMobileUrl', s.background_mobile_url
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

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('content-media', 'content-media', true)
    on conflict (id) do update set public = true;
  end if;

  if to_regclass('storage.objects') is not null then
    execute $policy$
      drop policy if exists journey_background_media_insert on storage.objects;
      create policy journey_background_media_insert on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'content-media'
          and name like 'background/%'
          and public.admin_has_permission('content.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists journey_background_media_update on storage.objects;
      create policy journey_background_media_update on storage.objects
        for update to authenticated
        using (
          bucket_id = 'content-media'
          and name like 'background/%'
          and public.admin_has_permission('content.manage')
        )
        with check (
          bucket_id = 'content-media'
          and name like 'background/%'
          and public.admin_has_permission('content.manage')
        );
    $policy$;

    execute $policy$
      drop policy if exists journey_background_media_delete on storage.objects;
      create policy journey_background_media_delete on storage.objects
        for delete to authenticated
        using (
          bucket_id = 'content-media'
          and name like 'background/%'
          and public.admin_has_permission('content.manage')
        );
    $policy$;
  end if;
end $$;

revoke all on function public.admin_save_site_settings(jsonb, text) from public, anon;
revoke all on function public.get_public_site_content() from public;

grant execute on function public.admin_save_site_settings(jsonb, text) to authenticated;
grant execute on function public.get_public_site_content() to anon, authenticated;
