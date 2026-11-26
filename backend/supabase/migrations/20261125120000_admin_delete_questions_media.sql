-- Admin hard delete for questions and media assets.
--
-- Questions are removed from the database (options, answers, pairs, media rows,
-- attempts, and practice/mastery links cascade). A level that only contains the
-- deleted question is removed with its dedicated lesson so the player map no
-- longer shows a level that cannot be played. Legacy lessons that still have
-- another question keep their level and fall back to that question.
--
-- Media metadata is deleted only when the asset is not referenced by a question,
-- page block, site setting, subject icon, shop product, profile avatar, or
-- background music row. The storage path is returned so the staff client can
-- remove the real file from the content-media bucket afterwards.

create or replace function public.admin_delete_questions(
  p_question_ids uuid[],
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_ids uuid[];
  v_requested integer;
  v_found integer;
  v_id uuid;
  v_lesson_id uuid;
  v_lesson_questions integer;
  v_lesson_nodes integer;
  v_node_id uuid;
  v_level_number integer;
  v_next_question uuid;
  v_deleted integer := 0;
  v_levels_removed integer := 0;
  v_deleted_items jsonb := '[]'::jsonb;
begin
  perform public.admin_require_permission('questions.edit');

  v_ids := array(
    select distinct id_value
    from unnest(coalesce(p_question_ids, '{}'::uuid[])) as id_value
  );
  v_requested := coalesce(array_length(v_ids, 1), 0);

  if v_requested = 0 then
    raise exception 'question_ids_required' using errcode = '22023';
  end if;
  if v_requested > 100 then
    raise exception 'question_ids_too_many' using errcode = '22023';
  end if;

  select count(*)::integer into v_found
  from public.questions q
  where q.id = any(v_ids);

  if v_found <> v_requested then
    raise exception 'question_not_found' using errcode = 'P0002';
  end if;

  foreach v_id in array v_ids loop
    select q.lesson_id into v_lesson_id
    from public.questions q
    where q.id = v_id;

    select count(*)::integer into v_lesson_questions
    from public.questions q
    where q.lesson_id = v_lesson_id;

    select n.id, n.level_number into v_node_id, v_level_number
    from public.learning_nodes n
    where n.question_id = v_id;

    -- Used when a legacy lesson keeps playing other questions.
    select q.id into v_next_question
    from public.questions q
    where q.lesson_id = v_lesson_id
      and q.id <> v_id
      and q.is_active
    order by q.sort_order, q.id
    limit 1;

    if v_node_id is not null then
      if v_lesson_questions <= 1 then
        delete from public.learning_nodes where id = v_node_id;
        v_levels_removed := v_levels_removed + 1;

        select count(*)::integer into v_lesson_nodes
        from public.learning_nodes n
        where n.lesson_id = v_lesson_id;

        -- The lesson was created together with this level and has no other
        -- node or question left, so remove the empty shell as well.
        if v_lesson_nodes = 0 then
          delete from public.lessons where id = v_lesson_id;
        end if;
      elsif v_next_question is not null then
        update public.learning_nodes
        set question_id = v_next_question
        where id = v_node_id;
      else
        -- No other active question exists for this lesson, so the level would
        -- be unplayable. Remove it instead of leaving a dead level on the map.
        delete from public.learning_nodes where id = v_node_id;
        v_levels_removed := v_levels_removed + 1;
      end if;
    end if;

    delete from public.questions where id = v_id;
    v_deleted := v_deleted + 1;
    v_deleted_items := v_deleted_items || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'lessonId', v_lesson_id,
      'levelNumber', v_level_number
    ));
  end loop;

  perform public.admin_audit(
    'question_delete', 'question', array_to_string(v_ids, ','), p_reason,
    jsonb_build_object('questions', v_deleted_items),
    jsonb_build_object('deleted', v_deleted, 'levelsRemoved', v_levels_removed)
  );

  return jsonb_build_object(
    'deleted', v_deleted,
    'levelsRemoved', v_levels_removed,
    'ids', to_jsonb(v_ids)
  );
end;
$$;

revoke all on function public.admin_delete_questions(uuid[], text) from public, anon;
grant execute on function public.admin_delete_questions(uuid[], text) to authenticated;

create or replace function public.admin_delete_media(
  p_media_ids uuid[],
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_ids uuid[];
  v_requested integer;
  v_found integer;
  v_id uuid;
  v_asset public.media_assets;
  v_in_use boolean;
  v_deleted integer := 0;
  v_paths jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_deleted_items jsonb := '[]'::jsonb;
begin
  perform public.admin_require_permission('media.manage');

  v_ids := array(
    select distinct id_value
    from unnest(coalesce(p_media_ids, '{}'::uuid[])) as id_value
  );
  v_requested := coalesce(array_length(v_ids, 1), 0);

  if v_requested = 0 then
    raise exception 'media_ids_required' using errcode = '22023';
  end if;
  if v_requested > 100 then
    raise exception 'media_ids_too_many' using errcode = '22023';
  end if;

  select count(*)::integer into v_found
  from public.media_assets m
  where m.id = any(v_ids);

  if v_found <> v_requested then
    raise exception 'media_not_found' using errcode = 'P0002';
  end if;

  foreach v_id in array v_ids loop
    select * into v_asset
    from public.media_assets m
    where m.id = v_id;

    select
      exists (
        select 1 from public.question_media qm where qm.url = v_asset.url
      )
      or exists (
        select 1 from public.questions q
        where position(v_asset.url in coalesce(q.scene::text, '')) > 0
      )
      or exists (
        select 1 from public.content_pages p
        where p.og_image_url = v_asset.url
          or position(v_asset.url in coalesce(p.blocks::text, '')) > 0
      )
      or exists (
        select 1 from public.site_settings s
        where v_asset.url in (
          s.favicon_url, s.logo_url, s.background_desktop_url, s.background_mobile_url
        )
      )
      or exists (
        select 1 from public.subjects s where s.icon_url = v_asset.url
      )
      or exists (
        select 1 from public.shop_items si
        where si.image_url = v_asset.url or si.image_path = v_asset.storage_path
      )
      or exists (
        select 1 from public.background_music bm
        where bm.storage_path = v_asset.storage_path or bm.url = v_asset.url
      )
      or exists (
        select 1 from public.profiles pr where pr.avatar_url = v_asset.url
      )
    into v_in_use;

    if v_in_use then
      v_skipped := v_skipped || jsonb_build_array(jsonb_build_object(
        'id', v_asset.id,
        'name', regexp_replace(v_asset.storage_path, '^.*/', ''),
        'altText', v_asset.alt_text,
        'reason', 'Masih dipakai oleh soal atau konten lain.'
      ));
    else
      delete from public.media_assets where id = v_id;
      v_deleted := v_deleted + 1;
      v_paths := v_paths || to_jsonb(v_asset.storage_path);
      v_deleted_items := v_deleted_items || jsonb_build_array(jsonb_build_object(
        'id', v_asset.id,
        'storagePath', v_asset.storage_path,
        'url', v_asset.url
      ));
    end if;
  end loop;

  perform public.admin_audit(
    'media_delete', 'media', array_to_string(v_ids, ','), p_reason,
    jsonb_build_object('assets', v_deleted_items),
    jsonb_build_object('deleted', v_deleted, 'skipped', v_skipped)
  );

  return jsonb_build_object(
    'deleted', v_deleted,
    'storagePaths', v_paths,
    'skipped', v_skipped
  );
end;
$$;

revoke all on function public.admin_delete_media(uuid[], text) from public, anon;
grant execute on function public.admin_delete_media(uuid[], text) to authenticated;
