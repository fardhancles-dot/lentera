-- Soal Kombinasi is a new question type that sits beside the existing twelve
-- types. It must be added in its own migration: PostgreSQL cannot use a new
-- enum value in the same transaction that adds it.
alter type public.question_type add value if not exists 'combined';
