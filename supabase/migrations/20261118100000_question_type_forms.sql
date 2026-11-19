-- ---------------------------------------------------------------------------
-- Question type forms
-- Fixes Word Bank / Susun Kalimat persistence and grading, and adds a
-- punctuation-tolerant comparison for word-ordering answers. Existing rows are
-- untouched: only validation and grading behaviour changes.
-- ---------------------------------------------------------------------------

-- Case and punctuation are ignored, word order is preserved. The admin form
-- mirrors this in normalizeSentenceAnswer().
create or replace function public.normalize_sentence_text(value text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(value, '')), '[^[:alnum:]]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$$;

revoke all on function public.normalize_sentence_text(text) from public, anon, authenticated;

-- Option answers are graded by option id for every type that stores options.
-- Text answers stay normalized; word-ordering answers also ignore punctuation
-- so "Saya makan nasi." and the joined tokens "Saya makan nasi" agree.
create or replace function public.grade_question(p_question_id uuid, p_answer jsonb)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_type public.question_type;
  v_option uuid;
  v_text text;
  v_matches jsonb;
  v_pair_count integer;
  v_left_count integer;
  v_right_count integer;
begin
  select type into v_type from public.questions where id = p_question_id;
  if v_type is null or p_answer is null then
    return false;
  end if;

  if v_type = 'matching_pairs' then
    v_matches := p_answer -> 'matches';

    if v_matches is null or jsonb_typeof(v_matches) <> 'array' then
      return false;
    end if;

    select count(*)::integer into v_pair_count
    from public.question_pairs
    where question_id = p_question_id;

    if v_pair_count = 0 or jsonb_array_length(v_matches) <> v_pair_count then
      return false;
    end if;

    select
      count(distinct item ->> 'leftId')::integer,
      count(distinct item ->> 'rightId')::integer
    into v_left_count, v_right_count
    from jsonb_array_elements(v_matches) as t(item);

    if v_left_count <> v_pair_count or v_right_count <> v_pair_count then
      return false;
    end if;

    return not exists (
      select 1
      from jsonb_array_elements(v_matches) as t(item)
      where not exists (
        select 1
        from public.question_pairs p
        where p.question_id = p_question_id
          and p.left_id::text = item ->> 'leftId'
          and p.right_id::text = item ->> 'rightId'
      )
    );
  end if;

  if p_answer ? 'optionId' then
    begin
      v_option := nullif(p_answer ->> 'optionId', '')::uuid;
    exception when others then
      return false;
    end;

    if v_option is null then
      return false;
    end if;

    return exists (
      select 1 from public.question_options
      where id = v_option and question_id = p_question_id and is_correct
    );
  end if;

  v_text := coalesce(p_answer ->> 'text', '');
  if btrim(v_text) = '' then
    return false;
  end if;

  if v_type in ('word_bank', 'sentence_builder') then
    return exists (
      select 1
      from public.question_answers a
      where a.question_id = p_question_id
        and public.normalize_sentence_text(a.answer) = public.normalize_sentence_text(v_text)
    );
  end if;

  return exists (
    select 1
    from public.question_answers a
    where a.question_id = p_question_id
      and case
        when a.is_case_sensitive then btrim(a.answer) = btrim(v_text)
        else public.normalize_answer_text(a.answer) = public.normalize_answer_text(v_text)
      end
  );
end;
$$;

-- Returns the human-readable key for chat/story/listening questions too, so
-- feedback after a wrong answer never comes back empty.
create or replace function public.submit_attempt_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.lesson_attempts;
  v_question public.questions;
  v_existing public.answer_attempts;
  v_correct boolean;
  v_points integer := 0;
  v_explanation text;
  v_correct_answer text;
  v_answered integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_attempt
  from public.lesson_attempts
  where id = p_attempt_id and user_id = v_user
  for update;

  if v_attempt.id is null then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_not_active' using errcode = '22023';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id and lesson_id = v_attempt.lesson_id and is_active;

  if v_question.id is null then
    raise exception 'question_not_in_lesson' using errcode = '22023';
  end if;

  select * into v_existing
  from public.answer_attempts
  where attempt_id = p_attempt_id and question_id = p_question_id;

  if v_existing.id is null then
    v_correct := public.grade_question(p_question_id, p_answer);
    v_points := case when v_correct then v_question.points else 0 end;

    insert into public.answer_attempts (
      attempt_id, user_id, question_id, answer, is_correct, points_awarded
    )
    values (
      p_attempt_id, v_user, p_question_id, coalesce(p_answer, '{}'::jsonb), v_correct, v_points
    )
    on conflict (attempt_id, question_id) do nothing;

    if found then
      update public.lesson_attempts
         set correct_count = correct_count + case when v_correct then 1 else 0 end,
             score = score + v_points
       where id = p_attempt_id;
    else
      select * into v_existing
      from public.answer_attempts
      where attempt_id = p_attempt_id and question_id = p_question_id;
      v_correct := v_existing.is_correct;
      v_points := v_existing.points_awarded;
    end if;
  else
    v_correct := v_existing.is_correct;
    v_points := v_existing.points_awarded;
  end if;

  select explanation into v_explanation
  from public.questions where id = p_question_id;

  v_correct_answer := public.correct_answer_text(p_question_id);

  select count(*)::integer into v_answered
  from public.answer_attempts
  where attempt_id = p_attempt_id;

  return jsonb_build_object(
    'questionId', p_question_id,
    'isCorrect', v_correct,
    'pointsAwarded', v_points,
    'explanation', coalesce(v_explanation, ''),
    'correctAnswer', coalesce(v_correct_answer, ''),
    'hint', v_question.hint,
    'answeredCount', v_answered,
    'totalCount', v_attempt.total_count,
    'alreadyAnswered', v_existing.id is not null
  );
end;
$$;

-- Word Bank and Susun Kalimat need the available tokens in question_options;
-- without them the player sees an empty bank. Text answers remain required for
-- grading. Everything else is unchanged.
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
    if (
      select count(*)
      from jsonb_array_elements(p_options) o
      where btrim(coalesce(o->>'label', '')) <> ''
    ) < 2 then
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
