-- Susun Kata accepts a single word. A one-word answer is stored as its letters,
-- one option per letter, so it only produces one token for a one-letter word.
-- Word Bank keeps its two-word minimum because its tokens are whole words.
-- Soal Kombinasi follows the same rule, but only in its "order" answer mode.
create or replace function public.admin_validate_question(
  p_type public.question_type,
  p_prompt text,
  p_options jsonb,
  p_answers jsonb,
  p_pairs jsonb,
  p_media jsonb,
  p_scene jsonb
)
returns void
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_options integer := coalesce(jsonb_array_length(p_options), 0);
  v_correct integer;
  v_answers integer := coalesce(jsonb_array_length(p_answers), 0);
  v_pairs integer := coalesce(jsonb_array_length(p_pairs), 0);
  v_media integer := coalesce(jsonb_array_length(p_media), 0);
  v_has_image boolean := false;
  v_has_audio boolean := false;
  v_screens integer := 0;
  v_mode text;
begin
  if btrim(coalesce(p_prompt, '')) = '' then
    raise exception 'question_prompt_required' using errcode = '22023';
  end if;
  if p_scene is not null and jsonb_typeof(p_scene) <> 'object' then
    raise exception 'question_scene_invalid' using errcode = '22023';
  end if;

  select
    coalesce(count(*) filter (
      where m->>'kind' = 'image' and btrim(coalesce(m->>'url', '')) <> ''
    ), 0) > 0,
    coalesce(count(*) filter (
      where m->>'kind' = 'audio' and btrim(coalesce(m->>'url', '')) <> ''
    ), 0) > 0
  into v_has_image, v_has_audio
  from jsonb_array_elements(case when jsonb_typeof(p_media) = 'array' then p_media else '[]'::jsonb end) m;

  if p_type in ('multiple_choice', 'picture_identification', 'conversation', 'story') then
    if v_options < 2 then
      raise exception 'question_options_required' using errcode = '22023';
    end if;
    select count(*)::integer into v_correct
    from jsonb_array_elements(p_options) o
    where coalesce((o->>'isCorrect')::boolean, false);
    if v_correct <> 1 then
      raise exception 'question_exactly_one_correct' using errcode = '22023';
    end if;
    if p_type = 'picture_identification' and not v_has_image then
      raise exception 'question_image_required' using errcode = '22023';
    end if;
    if p_type in ('conversation', 'story') then
      v_screens := case
        when jsonb_typeof(p_scene->'screens') = 'array' then jsonb_array_length(p_scene->'screens')
        else 0
      end;
      if v_screens < 1 then
        raise exception 'question_scene_screens_required' using errcode = '22023';
      end if;
    end if;
  elsif p_type = 'combined' then
    if jsonb_typeof(coalesce(p_scene->'elements', 'null'::jsonb)) <> 'array'
      or jsonb_array_length(coalesce(p_scene->'elements', '[]'::jsonb)) < 1 then
      raise exception 'question_combined_elements_required' using errcode = '22023';
    end if;

    v_mode := coalesce(p_scene->'answer'->>'mode', 'choice');
    if v_mode not in ('choice', 'text', 'order', 'match', 'speak', 'translate') then
      raise exception 'question_combined_mode_invalid' using errcode = '22023';
    end if;

    if v_mode = 'choice' then
      if v_options < 2 then
        raise exception 'question_options_required' using errcode = '22023';
      end if;
      select count(*)::integer into v_correct
      from jsonb_array_elements(p_options) o
      where coalesce((o->>'isCorrect')::boolean, false);
      if v_correct <> 1 then
        raise exception 'question_exactly_one_correct' using errcode = '22023';
      end if;
    elsif v_mode in ('text', 'speak', 'translate') then
      if v_answers < 1 then
        raise exception 'question_answers_required' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(p_answers) a
        where btrim(coalesce(a->>'answer', '')) = ''
      ) then
        raise exception 'question_answers_invalid' using errcode = '22023';
      end if;
    elsif v_mode = 'order' then
      -- One token covers the one-letter word case; longer single words are
      -- stored as one option per letter.
      if (
        select count(*)
        from jsonb_array_elements(p_options) o
        where btrim(coalesce(o->>'label', '')) <> ''
      ) < 1 then
        raise exception 'question_tokens_required' using errcode = '22023';
      end if;
      if v_answers < 1 or btrim(coalesce(p_answers->0->>'answer', '')) = '' then
        raise exception 'question_answers_required' using errcode = '22023';
      end if;
    elsif v_mode = 'match' then
      if v_pairs < 2 then
        raise exception 'question_pairs_required' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(p_pairs) p
        where btrim(coalesce(p->>'left', '')) = '' or btrim(coalesce(p->>'right', '')) = ''
      ) then
        raise exception 'question_pairs_invalid' using errcode = '22023';
      end if;
    end if;

    -- An image/audio element is a real mechanism, so its media must exist.
    if exists (
      select 1 from jsonb_array_elements(coalesce(p_scene->'elements', '[]'::jsonb)) e
      where e->>'kind' = 'image'
    ) and not v_has_image then
      raise exception 'question_image_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(coalesce(p_scene->'elements', '[]'::jsonb)) e
      where e->>'kind' = 'audio'
    ) and not v_has_audio then
      raise exception 'question_audio_or_speech_required' using errcode = '22023';
    end if;
  elsif p_type = 'listening' then
    if not v_has_audio
      and btrim(coalesce(p_scene->>'speech', '')) = '' then
      raise exception 'question_audio_or_speech_required' using errcode = '22023';
    end if;
    -- New listening questions are multiple choice over the audio. Older rows
    -- may still store a typed transcript answer, so both shapes are accepted.
    if v_options >= 2 then
      select count(*)::integer into v_correct
      from jsonb_array_elements(p_options) o
      where coalesce((o->>'isCorrect')::boolean, false);
      if v_correct <> 1 then
        raise exception 'question_exactly_one_correct' using errcode = '22023';
      end if;
    else
      if v_answers < 1 then
        raise exception 'question_answers_required' using errcode = '22023';
      end if;
      if exists (
        select 1 from jsonb_array_elements(p_answers) a
        where btrim(coalesce(a->>'answer', '')) = ''
      ) then
        raise exception 'question_answers_invalid' using errcode = '22023';
      end if;
    end if;
  elsif p_type = 'matching_pairs' then
    if v_pairs < 2 then
      raise exception 'question_pairs_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_pairs) p
      where btrim(coalesce(p->>'left', '')) = '' or btrim(coalesce(p->>'right', '')) = ''
    ) then
      raise exception 'question_pairs_invalid' using errcode = '22023';
    end if;
  elsif p_type in ('word_bank', 'sentence_builder') then
    -- Word Bank needs at least two words; Susun Kata may be a single word.
    if (
      select count(*)
      from jsonb_array_elements(p_options) o
      where btrim(coalesce(o->>'label', '')) <> ''
    ) < (case when p_type = 'sentence_builder' then 1 else 2 end) then
      raise exception 'question_tokens_required' using errcode = '22023';
    end if;
    if v_answers < 1 then
      raise exception 'question_answers_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_answers) a
      where btrim(coalesce(a->>'answer', '')) = ''
    ) then
      raise exception 'question_answers_invalid' using errcode = '22023';
    end if;
  else
    if v_answers < 1 then
      raise exception 'question_answers_required' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_answers) a
      where btrim(coalesce(a->>'answer', '')) = ''
    ) then
      raise exception 'question_answers_invalid' using errcode = '22023';
    end if;
    if p_type = 'fill_blank' and position('__' in p_prompt) = 0 then
      raise exception 'question_blank_required' using errcode = '22023';
    end if;
    if p_type = 'listening' then
      if not v_has_audio
        and btrim(coalesce(p_scene->>'speech', '')) = '' then
        raise exception 'question_audio_or_speech_required' using errcode = '22023';
      end if;
    end if;
  end if;

  if v_media > 20 then
    raise exception 'question_media_too_many' using errcode = '22023';
  end if;
end;
$$;
