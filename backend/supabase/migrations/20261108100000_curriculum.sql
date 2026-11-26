-- Lentera · Curriculum foundation
-- Subjects → courses → levels → units → lessons/nodes → questions.
-- Progress is read-only for players until the gameplay RPC is introduced.

do $$
begin
  create type public.subject_status as enum ('active', 'development', 'inactive');
exception when duplicate_object then null; end $$;

do $$
begin
  create type public.difficulty_band as enum (
    'beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'expert'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type public.lesson_kind as enum ('lesson', 'practice', 'review', 'challenge', 'legendary');
exception when duplicate_object then null; end $$;

do $$
begin
  create type public.node_kind as enum (
    'lesson', 'review', 'practice', 'challenge', 'checkpoint', 'legendary', 'reward'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type public.question_type as enum (
    'multiple_choice', 'word_bank', 'sentence_builder', 'listening', 'speaking',
    'typing', 'matching_pairs', 'picture_identification', 'fill_blank',
    'translation', 'conversation', 'story'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type public.node_progress_status as enum ('available', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Curriculum structure
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  description text not null default '',
  category text not null,
  icon_key text not null default 'book',
  accent_color text not null default '#58CC02',
  status public.subject_status not null default 'active',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null,
  icon_key text not null default 'book',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create table if not exists public.course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  difficulty public.difficulty_band not null default 'beginner',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  course_level_id uuid not null references public.course_levels (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  objectives text[] not null default '{}',
  reward_coins integer not null default 0 check (reward_coins >= 0),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_level_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  kind public.lesson_kind not null default 'lesson',
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  xp_reward integer not null default 10 check (xp_reward >= 0),
  coin_reward integer not null default 2 check (coin_reward >= 0),
  hearts_enabled boolean not null default true,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create table if not exists public.learning_nodes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  node_type public.node_kind not null default 'lesson',
  lesson_id uuid references public.lessons (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (unit_id, slug)
);

-- ---------------------------------------------------------------------------
-- Question bank
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  slug text not null,
  type public.question_type not null,
  topic text not null default '',
  difficulty public.difficulty_band not null default 'beginner',
  instruction text not null default '',
  prompt text not null,
  explanation text not null default '',
  hint text,
  points integer not null default 10 check (points > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, slug)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  unique (question_id, sort_order)
);

create table if not exists public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  answer text not null,
  is_case_sensitive boolean not null default false,
  unique (question_id, answer)
);

create table if not exists public.question_media (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  media_kind text not null check (media_kind in ('image', 'audio', 'video')),
  url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Progress (read-only for players until gameplay writes via RPC)
-- ---------------------------------------------------------------------------
create table if not exists public.user_course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  completed_lessons integer not null default 0 check (completed_lessons >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.user_node_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  node_id uuid not null references public.learning_nodes (id) on delete cascade,
  status public.node_progress_status not null default 'available',
  best_score integer not null default 0 check (best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists courses_subject_idx on public.courses (subject_id, sort_order);
create index if not exists course_levels_course_idx on public.course_levels (course_id, sort_order);
create index if not exists units_level_idx on public.units (course_level_id, sort_order);
create index if not exists lessons_unit_idx on public.lessons (unit_id, sort_order);
create index if not exists learning_nodes_unit_idx on public.learning_nodes (unit_id, sort_order);
create index if not exists questions_lesson_idx on public.questions (lesson_id, sort_order);
create index if not exists question_options_question_idx on public.question_options (question_id, sort_order);
create index if not exists user_node_progress_node_idx on public.user_node_progress (node_id);
create index if not exists user_course_progress_course_idx on public.user_course_progress (course_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists course_levels_set_updated_at on public.course_levels;
create trigger course_levels_set_updated_at before update on public.course_levels
  for each row execute function public.set_updated_at();

drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at before update on public.units
  for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Safe question statistics (no answer keys exposed to players)
-- ---------------------------------------------------------------------------
create or replace view public.lesson_question_stats as
select
  lesson_id,
  count(*)::integer as question_count,
  array_agg(distinct topic order by topic) as topics,
  array_agg(distinct type::text order by type::text) as question_types
from public.questions
where is_active = true
group by lesson_id;

comment on view public.lesson_question_stats is
  'Aggregate question metadata for players. Correct answers stay in protected tables.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subjects enable row level security;
alter table public.courses enable row level security;
alter table public.course_levels enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.learning_nodes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_media enable row level security;
alter table public.user_course_progress enable row level security;
alter table public.user_node_progress enable row level security;

drop policy if exists "subjects_select_visible" on public.subjects;
create policy "subjects_select_visible"
  on public.subjects for select to authenticated
  using (status <> 'inactive');

drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published"
  on public.courses for select to authenticated
  using (is_published);

drop policy if exists "course_levels_select_published" on public.course_levels;
create policy "course_levels_select_published"
  on public.course_levels for select to authenticated
  using (is_published);

drop policy if exists "units_select_published" on public.units;
create policy "units_select_published"
  on public.units for select to authenticated
  using (is_published);

drop policy if exists "lessons_select_published" on public.lessons;
create policy "lessons_select_published"
  on public.lessons for select to authenticated
  using (is_published);

drop policy if exists "learning_nodes_select_active" on public.learning_nodes;
create policy "learning_nodes_select_active"
  on public.learning_nodes for select to authenticated
  using (is_active);

drop policy if exists "user_course_progress_select_own" on public.user_course_progress;
create policy "user_course_progress_select_own"
  on public.user_course_progress for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_node_progress_select_own" on public.user_node_progress;
create policy "user_node_progress_select_own"
  on public.user_node_progress for select to authenticated
  using (user_id = auth.uid());

-- No player-facing policies for questions/options/answers/media. They are read
-- by server-side validation and the future admin dashboard only.

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on public.subjects from anon;
revoke all on public.courses from anon;
revoke all on public.course_levels from anon;
revoke all on public.units from anon;
revoke all on public.lessons from anon;
revoke all on public.learning_nodes from anon;
revoke all on public.questions from anon, authenticated;
revoke all on public.question_options from anon, authenticated;
revoke all on public.question_answers from anon, authenticated;
revoke all on public.question_media from anon, authenticated;
revoke all on public.user_course_progress from anon;
revoke all on public.user_node_progress from anon;

revoke insert, update, delete on public.subjects from authenticated;
revoke insert, update, delete on public.courses from authenticated;
revoke insert, update, delete on public.course_levels from authenticated;
revoke insert, update, delete on public.units from authenticated;
revoke insert, update, delete on public.lessons from authenticated;
revoke insert, update, delete on public.learning_nodes from authenticated;
revoke insert, update, delete on public.user_course_progress from authenticated;
revoke insert, update, delete on public.user_node_progress from authenticated;

grant select on public.subjects to authenticated;
grant select on public.courses to authenticated;
grant select on public.course_levels to authenticated;
grant select on public.units to authenticated;
grant select on public.lessons to authenticated;
grant select on public.learning_nodes to authenticated;
grant select on public.user_course_progress to authenticated;
grant select on public.user_node_progress to authenticated;

revoke all on public.lesson_question_stats from anon, authenticated;
grant select on public.lesson_question_stats to authenticated;
