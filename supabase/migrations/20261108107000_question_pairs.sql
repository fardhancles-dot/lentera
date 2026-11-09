-- Lentera · Matching pair data
-- Each row stores one pair with independent left/right ids. The lesson payload
-- sends the two columns separately, so the browser cannot infer the pairing
-- from row ids or array order.

create table if not exists public.question_pairs (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  left_id uuid not null,
  right_id uuid not null,
  left_label text not null,
  right_label text not null,
  sort_order integer not null default 0,
  constraint question_pairs_distinct_sides check (left_id <> right_id),
  unique (question_id, left_id),
  unique (question_id, right_id),
  unique (question_id, sort_order)
);

create index if not exists question_pairs_question_idx
  on public.question_pairs (question_id, sort_order);

alter table public.question_pairs enable row level security;

-- Pair data is graded server-side only. No player-facing policy or grant.
revoke all on public.question_pairs from anon, authenticated;

comment on table public.question_pairs is
  'Left/right labels for matching_pairs questions. Never exposed as paired rows.';
