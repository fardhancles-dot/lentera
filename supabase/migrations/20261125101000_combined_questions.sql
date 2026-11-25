-- ---------------------------------------------------------------------------
-- Soal Kombinasi (combined questions)
--
-- One combined question renders several existing question mechanisms in a
-- single card (image hint, fill-in-the-blank sentence, word bank, choices,
-- audio, story, conversation, pairs) and is still graded as ONE question.
--
-- Answer keys never live in questions.scene: the browser already receives
-- scene, so keys stay in question_options.is_correct, question_answers, and
-- question_pairs like every other type. The scene only holds presentation
-- config plus the answer shape:
--
--   {
--     "kind": "combined",
--     "elements": [{ "kind": "text" | "story" | "conversation" | "hint"
--                             | "image" | "audio", ... }],
--     "mechanics": ["fill_blank", "word_bank", ...],
--     "answer": { "mode": "choice" | "text" | "order" | "match",
--                 "grading": "all" | "weighted",
--                 "partLabels": ["Rumpang 1", "Rumpang 2"] }
--   }
-- ---------------------------------------------------------------------------

-- Fractional grading: 0 = wrong, 1 = fully correct, 0..1 = how many answer
-- parts matched (used only by Soal Kombinasi with weighted grading). Every
-- other type keeps its previous boolean behaviour through grade_question().
create or replace function public.grade_question_fraction(p_question_id uuid, p_answer jsonb)
returns numeric
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_type public.question_type;
  v_scene jsonb;
  v_mode text;
  v_option uuid;
  v_text text;
  v_matches jsonb;
  v_pair_count integer;
  v_left_count integer;
  v_right_count integer;
  v_parts jsonb;
  v_expected integer;
  v_matched integer;
begin
  select type, coalesce(scene, '{}'::jsonb)
    into v_type, v_scene
  from public.questions
  where id = p_question_id;

  if v_type is null or p_answer is null then
    return 0;
  end if;

  if v_type = 'matching_pairs' then
    v_matches := p_answer -> 'matches';

    if v_matches is null or jsonb_typeof(v_matches) <> 'array' then
      return 0;
    end if;

    select count(*)::integer into v_pair_count
    from public.question_pairs
    where question_id = p_question_id;

    if v_pair_count = 0 or jsonb_array_length(v_matches) <> v_pair_count then
      return 0;
    end if;

    select
      count(distinct item ->> 'leftId')::integer,
      count(distinct item ->> 'rightId')::integer
    into v_left_count, v_right_count
    from jsonb_array_elements(v_matches) as t(item);

    if v_left_count <> v_pair_count or v_right_count <> v_pair_count then
      return 0;
    end if;

    return case when not exists (
      select 1
      from jsonb_array_elements(v_matches) as t(item)
      where not exists (
        select 1
        from public.question_pairs p
        where p.question_id = p_question_id
          and p.left_id::text = item ->> 'leftId'
          and p.right_id::text = item ->> 'rightId'
      )
    ) then 1 else 0 end;
  end if;

  if v_type = 'combined' then
    v_mode := coalesce(v_scene -> 'answer' ->> 'mode', 'choice');

    if v_mode = 'match' then
      v_matches := p_answer -> 'matches';

      if v_matches is null or jsonb_typeof(v_matches) <> 'array' then
        return 0;
      end if;

      select count(*)::integer into v_pair_count
      from public.question_pairs
      where question_id = p_question_id;

      if v_pair_count = 0 or jsonb_array_length(v_matches) <> v_pair_count then
        return 0;
      end if;

      select
        count(distinct item ->> 'leftId')::integer,
        count(distinct item ->> 'rightId')::integer
      into v_left_count, v_right_count
      from jsonb_array_elements(v_matches) as t(item);

      if v_left_count <> v_pair_count or v_right_count <> v_pair_count then
        return 0;
      end if;

      return case when not exists (
        select 1
        from jsonb_array_elements(v_matches) as t(item)
        where not exists (
          select 1
          from public.question_pairs p
          where p.question_id = p_question_id
            and p.left_id::text = item ->> 'leftId'
            and p.right_id::text = item ->> 'rightId'
        )
      ) then 1 else 0 end;
    end if;

    if v_mode = 'choice' then
      begin
        v_option := nullif(p_answer ->> 'optionId', '')::uuid;
      exception when others then
        return 0;
      end;

      if v_option is null then
        return 0;
      end if;

      return case when exists (
        select 1 from public.question_options
        where id = v_option and question_id = p_question_id and is_correct
      ) then 1 else 0 end;
    end if;

    if v_mode = 'order' then
      v_text := coalesce(p_answer ->> 'text', '');
      if btrim(v_text) = '' then
        return 0;
      end if;

      return case when exists (
        select 1
        from public.question_answers a
        where a.question_id = p_question_id
          and public.normalize_sentence_text(a.answer)
            = public.normalize_sentence_text(v_text)
      ) then 1 else 0 end;
    end if;

    -- Text mode: one blank is graded as a whole answer, several blanks are
    -- graded part by part so weighted scoring can award partial points.
    select count(*)::integer into v_expected
    from public.question_answers
    where question_id = p_question_id;

    if v_expected = 0 then
      return 0;
    end if;

    v_parts := p_answer -> 'parts';
    if v_parts is not null and jsonb_typeof(v_parts) = 'array' then
      select count(distinct a.id)::integer into v_matched
      from public.question_answers a
      where a.question_id = p_question_id
        and exists (
          select 1
          from jsonb_array_elements(v_parts) as part
          where jsonb_typeof(part) = 'string'
            and btrim(part #>> '{}') <> ''
            and case
              when a.is_case_sensitive then btrim(a.answer) = btrim(part #>> '{}')
              else public.normalize_answer_text(a.answer)
                = public.normalize_answer_text(part #>> '{}')
            end
        );

      return least(1::numeric, v_matched::numeric / v_expected);
    end if;

    v_text := coalesce(p_answer ->> 'text', '');
    if btrim(v_text) = '' then
      return 0;
    end if;

    v_matched := case when exists (
      select 1
      from public.question_answers a
      where a.question_id = p_question_id
        and case
          when a.is_case_sensitive then btrim(a.answer) = btrim(v_text)
          else public.normalize_answer_text(a.answer) = public.normalize_answer_text(v_text)
        end
    ) then 1 else 0 end;

    return least(1::numeric, v_matched::numeric / v_expected);
  end if;

  if p_answer ? 'optionId' then
    begin
      v_option := nullif(p_answer ->> 'optionId', '')::uuid;
    exception when others then
      return 0;
    end;

    if v_option is null then
      return 0;
    end if;

    return case when exists (
      select 1 from public.question_options
      where id = v_option and question_id = p_question_id and is_correct
    ) then 1 else 0 end;
  end if;

  v_text := coalesce(p_answer ->> 'text', '');
  if btrim(v_text) = '' then
    return 0;
  end if;

  if v_type in ('word_bank', 'sentence_builder') then
    return case when exists (
      select 1
      from public.question_answers a
      where a.question_id = p_question_id
        and public.normalize_sentence_text(a.answer) = public.normalize_sentence_text(v_text)
    ) then 1 else 0 end;
  end if;

  return case when exists (
    select 1
    from public.question_answers a
    where a.question_id = p_question_id
      and case
        when a.is_case_sensitive then btrim(a.answer) = btrim(v_text)
        else public.normalize_answer_text(a.answer) = public.normalize_answer_text(v_text)
      end
  ) then 1 else 0 end;
end;
$$;

revoke all on function public.grade_question_fraction(uuid, jsonb) from public, anon, authenticated;

-- Public wrapper keeps its boolean contract for every caller.
create or replace function public.grade_question(p_question_id uuid, p_answer jsonb)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select public.grade_question_fraction(p_question_id, p_answer) >= 1;
$$;

revoke all on function public.grade_question(uuid, jsonb) from public, anon, authenticated;

-- Feedback text for the new type. Choice answers live in options, pairs in
-- question_pairs, and every other mode in question_answers.
create or replace function public.correct_answer_text(p_question_id uuid)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_type public.question_type;
  v_mode text;
  v_text text;
begin
  select type into v_type from public.questions where id = p_question_id;

  if v_type = 'combined' then
    select coalesce(scene -> 'answer' ->> 'mode', 'choice')
      into v_mode
    from public.questions
    where id = p_question_id;

    if v_mode = 'choice' then
      select string_agg(label, ' / ' order by sort_order) into v_text
      from public.question_options
      where question_id = p_question_id and is_correct;
    elsif v_mode = 'match' then
      select string_agg(left_label || ' = ' || right_label, '; ' order by sort_order)
        into v_text
      from public.question_pairs
      where question_id = p_question_id;
    else
      select string_agg(answer, ' / ') into v_text
      from public.question_answers
      where question_id = p_question_id;
    end if;

    return coalesce(v_text, '');
  end if;

  if v_type in (
    'multiple_choice', 'picture_identification', 'listening', 'conversation', 'story'
  ) then
    select string_agg(label, ' / ' order by sort_order) into v_text
    from public.question_options
    where question_id = p_question_id and is_correct;
  elsif v_type = 'matching_pairs' then
    select string_agg(left_label || ' = ' || right_label, '; ' order by sort_order)
      into v_text
    from public.question_pairs
    where question_id = p_question_id;
  else
    select answer into v_text
    from public.question_answers
    where question_id = p_question_id
    order by id
    limit 1;
  end if;

  return coalesce(v_text, '');
end;
$$;

-- ---------------------------------------------------------------------------
-- Validation for the new type
-- ---------------------------------------------------------------------------
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
      if (
        select count(*)
        from jsonb_array_elements(p_options) o
        where btrim(coalesce(o->>'label', '')) <> ''
      ) < 2 then
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

-- ---------------------------------------------------------------------------
-- Lesson grading: combined questions can award partial points when the admin
-- chose weighted scoring. Everything is still one question and one attempt.
-- ---------------------------------------------------------------------------
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
  v_fraction numeric;
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
    v_fraction := public.grade_question_fraction(p_question_id, p_answer);
    v_correct := v_fraction >= 1;
    v_points := case
      when v_correct then v_question.points
      when v_question.type = 'combined'
        and coalesce(v_question.scene->'answer'->>'grading', 'all') = 'weighted'
        then round(v_question.points * v_fraction)::integer
      else 0
    end;

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

-- Practice engine shares the same scoring rule.
create or replace function public.submit_practice_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_answer jsonb,
  p_elapsed_ms integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_session public.practice_sessions;
  v_question public.questions;
  v_existing public.practice_answers;
  v_previous public.practice_answers;
  v_fraction numeric;
  v_correct boolean;
  v_combo integer := 1;
  v_points integer := 0;
  v_elapsed integer;
  v_answered integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_session
  from public.practice_sessions
  where id = p_session_id and user_id = v_user
  for update;

  if v_session.id is null then
    raise exception 'practice_not_found' using errcode = 'P0002';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'practice_not_active' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.practice_session_questions
    where session_id = p_session_id and question_id = p_question_id
  ) then
    raise exception 'question_not_in_practice' using errcode = '22023';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id and is_active;

  select * into v_existing
  from public.practice_answers
  where session_id = p_session_id and question_id = p_question_id;

  if v_existing.id is null then
    v_fraction := public.grade_question_fraction(p_question_id, p_answer);
    v_correct := v_fraction >= 1;

    select * into v_previous
    from public.practice_answers
    where session_id = p_session_id
    order by answered_at desc, id desc
    limit 1;

    if v_previous.id is not null and v_previous.is_correct then
      v_combo := v_previous.combo + 1;
    end if;

    v_elapsed := greatest(0, least(coalesce(p_elapsed_ms, 0), 600000));

    if v_correct then
      v_points := v_question.points;

      if v_session.mode in ('timed', 'ramp_up', 'match_madness') and v_elapsed between 1 and 6000 then
        v_points := v_points + 2;
      end if;

      v_points := v_points + least(5, greatest(0, v_combo - 1));
    elsif v_question.type = 'combined'
      and coalesce(v_question.scene->'answer'->>'grading', 'all') = 'weighted' then
      v_points := round(v_question.points * v_fraction)::integer;
    end if;

    insert into public.practice_answers (
      session_id, user_id, question_id, answer, is_correct,
      points_awarded, combo, elapsed_ms
    )
    values (
      p_session_id, v_user, p_question_id, coalesce(p_answer, '{}'::jsonb), v_correct,
      v_points, v_combo, v_elapsed
    )
    on conflict (session_id, question_id) do nothing;

    if found then
      update public.practice_sessions
         set correct_count = correct_count + case when v_correct then 1 else 0 end,
             score = score + v_points,
             best_combo = greatest(best_combo, v_combo)
       where id = p_session_id;
    else
      select * into v_existing
      from public.practice_answers
      where session_id = p_session_id and question_id = p_question_id;
      v_correct := v_existing.is_correct;
      v_points := v_existing.points_awarded;
      v_combo := v_existing.combo;
    end if;
  else
    v_correct := v_existing.is_correct;
    v_points := v_existing.points_awarded;
    v_combo := v_existing.combo;
  end if;

  select count(*)::integer into v_answered
  from public.practice_answers
  where session_id = p_session_id;

  return jsonb_build_object(
    'questionId', p_question_id,
    'isCorrect', v_correct,
    'pointsAwarded', v_points,
    'combo', v_combo,
    'explanation', coalesce(v_question.explanation, ''),
    'correctAnswer', public.correct_answer_text(p_question_id),
    'answeredCount', v_answered,
    'totalCount', v_session.question_count,
    'alreadyAnswered', v_existing.id is not null
  );
end;
$$;
