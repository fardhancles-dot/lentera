-- Lentera · Question scenes
-- Dialogue, narration, and speech transcripts for listening, conversation,
-- speaking, and story questions. Scenes never contain a graded answer: grading
-- always reads question_options or question_answers.

alter table public.questions
  add column if not exists scene jsonb not null default '{}'::jsonb;

comment on column public.questions.scene is
  'Dialogue/narration/speech transcript for presentation only. No answer keys.';
