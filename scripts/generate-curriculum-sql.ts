import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { curriculumStats, curriculumSubjects, validateCurriculum } from './content';
import type { SeedSubject } from './content/types';

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../supabase/migrations/20261108110000_curriculum_seed.sql',
);

/** Stable UUID derived from a semantic key, so re-running the generator is idempotent. */
function uuid(key: string): string {
  const hash = createHash('md5').update(`lentera:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function text(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function textArray(values: string[]): string {
  return `array[${values.map(text).join(', ')}]::text[]`;
}

function nullable(value: string | undefined): string {
  return value ? text(value) : 'null';
}

function json(value: unknown): string {
  return `${text(JSON.stringify(value))}::jsonb`;
}

function id(parts: string[]): string {
  return text(uuid(parts.join(':')));
}

interface GeneratedStatement {
  table: string;
  key: string;
  sql: string;
}

function buildStatements(subjects: SeedSubject[]): GeneratedStatement[] {
  const statements: GeneratedStatement[] = [];

  for (const subject of subjects) {
    const subjectKey = ['subject', subject.slug];
    statements.push({
      table: 'subjects',
      key: subject.slug,
      sql: `insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values (${id(subjectKey)}, ${text(subject.slug)}, ${text(subject.name)}, ${text(
        subject.shortName,
      )}, ${text(subject.description)}, ${text(subject.category)}, ${text(
        subject.iconKey,
      )}, ${text(subject.accentColor)}, ${text(subject.status)}::public.subject_status, ${
        subject.isPrimary
      }, ${subject.sortOrder})
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;`,
    });

    if (subject.levels.length === 0) {
      continue;
    }

    const courseKey = ['course', subject.slug];
    statements.push({
      table: 'courses',
      key: subject.slug,
      sql: `insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values (${id(courseKey)}, ${id(subjectKey)}, ${text(subject.slug)}, ${text(
        subject.name,
      )}, ${text(subject.description)}, ${text(subject.category)}, ${text(
        subject.iconKey,
      )}, ${subject.sortOrder}, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;`,
    });

    subject.levels.forEach((level, levelIndex) => {
      const levelKey = ['level', subject.slug, level.slug];
      statements.push({
        table: 'course_levels',
        key: `${subject.slug}/${level.slug}`,
        sql: `insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values (${id(levelKey)}, ${id(courseKey)}, ${text(level.slug)}, ${text(level.title)}, ${text(
          level.description,
        )}, ${text(level.difficulty)}::public.difficulty_band, ${levelIndex}, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;`,
      });

      level.units.forEach((unit, unitIndex) => {
        const unitKey = ['unit', subject.slug, unit.slug];
        statements.push({
          table: 'units',
          key: `${subject.slug}/${unit.slug}`,
          sql: `insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values (${id(unitKey)}, ${id(levelKey)}, ${text(unit.slug)}, ${text(unit.title)}, ${text(
            unit.description,
          )}, ${textArray(unit.objectives)}, ${unitIndex}, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;`,
        });

        unit.lessons.forEach((lessonItem, lessonIndex) => {
          const lessonKey = ['lesson', subject.slug, unit.slug, lessonItem.slug];
          statements.push({
            table: 'lessons',
            key: `${subject.slug}/${lessonItem.slug}`,
            sql: `insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values (${id(lessonKey)}, ${id(unitKey)}, ${text(lessonItem.slug)}, ${text(
              lessonItem.title,
            )            }, ${text(lessonItem.description)}, ${text(lessonItem.kind)}::public.lesson_kind, ${
              lessonItem.estimatedMinutes
            }, 10, 2, ${lessonIndex}, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;`,
          });

          const nodeKey = ['node', subject.slug, unit.slug, lessonItem.slug];
          statements.push({
            table: 'learning_nodes',
            key: `${subject.slug}/${lessonItem.slug}`,
            sql: `insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values (${id(nodeKey)}, ${id(unitKey)}, ${text(`lesson-${lessonItem.slug}`)}, ${text(
              lessonItem.title,
            )            }, ${text(lessonItem.description)}, ${text(
              lessonItem.nodeType ?? lessonItem.kind,
            )}::public.node_kind, ${id(lessonKey)}, ${lessonIndex * 10}, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;`,
          });

          lessonItem.questions.forEach((question, questionIndex) => {
            const questionKey = [
              'question',
              subject.slug,
              unit.slug,
              lessonItem.slug,
              question.slug,
            ];
            statements.push({
              table: 'questions',
              key: `${subject.slug}/${lessonItem.slug}/${question.slug}`,
              sql: `insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values (${id(questionKey)}, ${id(lessonKey)}, ${text(question.slug)}, ${text(
                question.type,
              )}::public.question_type, ${text(question.topic)}, ${text(
                level.difficulty,
              )}::public.difficulty_band, ${text(question.instruction)}, ${text(
                question.prompt,
              )}, ${text(question.explanation)}, ${nullable(question.hint)}, ${
                question.points
              }, ${json(question.scene ?? {})}, ${questionIndex}, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;`,
            });

            question.options?.forEach((option, optionIndex) => {
              const optionKey = [...questionKey, 'option', String(optionIndex)];
              statements.push({
                table: 'question_options',
                key: `${subject.slug}/${lessonItem.slug}/${question.slug}/${optionIndex}`,
                sql: `insert into public.question_options (id, question_id, label, is_correct, sort_order)
values (${id(optionKey)}, ${id(questionKey)}, ${text(option.text)}, ${
                  option.correct
                }, ${optionIndex})
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;`,
              });
            });

            question.answers?.forEach((answer, answerIndex) => {
              const answerKey = [...questionKey, 'answer', String(answerIndex)];
              statements.push({
                table: 'question_answers',
                key: `${subject.slug}/${lessonItem.slug}/${question.slug}/${answerIndex}`,
                sql: `insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values (${id(answerKey)}, ${id(questionKey)}, ${text(answer)}, false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;`,
              });
            });

            question.pairs?.forEach((pair, pairIndex) => {
              const pairKey = [...questionKey, 'pair', String(pairIndex)];
              const leftKey = [...pairKey, 'left'];
              const rightKey = [...pairKey, 'right'];
              statements.push({
                table: 'question_pairs',
                key: `${subject.slug}/${lessonItem.slug}/${question.slug}/pair-${pairIndex}`,
                sql: `insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values (${id(pairKey)}, ${id(questionKey)}, ${id(leftKey)}, ${id(rightKey)}, ${text(
                  pair.left,
                )}, ${text(pair.right)}, ${pairIndex})
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;`,
              });
            });

            question.media?.forEach((media, mediaIndex) => {
              const mediaKey = [...questionKey, 'media', String(mediaIndex)];
              statements.push({
                table: 'question_media',
                key: `${subject.slug}/${lessonItem.slug}/${question.slug}/media-${mediaIndex}`,
                sql: `insert into public.question_media (id, question_id, media_kind, url, alt_text, sort_order)
values (${id(mediaKey)}, ${id(questionKey)}, ${text(media.kind)}, ${text(
                  media.url,
                )}, ${text(media.alt)}, ${mediaIndex})
on conflict (id) do update set
  question_id = excluded.question_id,
  media_kind = excluded.media_kind,
  url = excluded.url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;`,
              });
            });
          });
        });
      });
    });
  }

  return statements;
}

async function main(): Promise<void> {
  const issues = validateCurriculum();
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');

  for (const warning of warnings) {
    console.warn(`[konten] peringatan: ${warning.message}`);
  }
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[konten] error: ${error.message}`);
    }
    throw new Error(`Validasi konten gagal dengan ${errors.length} error.`);
  }

  const statements = buildStatements(curriculumSubjects);
  const stats = curriculumStats();
  const lines: string[] = [
    '-- Lentera · Curriculum seed (generated)',
    '-- Jangan mengedit file ini secara manual. Sumber: scripts/content/**/*.ts',
    `-- Jalankan ulang: npm run seed:build`,
    `-- Ringkasan: ${stats.subjects} mata pelajaran, ${stats.levels} level, ${stats.units} unit, ${stats.lessons} lesson, ${stats.questions} soal.`,
    '',
    'begin;',
    '',
  ];

  for (const statement of statements) {
    lines.push(`-- ${statement.table}: ${statement.key}`);
    lines.push(statement.sql);
    lines.push('');
  }

  lines.push('commit;');
  lines.push('');

  await writeFile(OUTPUT, lines.join('\n'), 'utf8');

  console.log(`Seed ditulis ke ${OUTPUT}`);
  console.log(
    `Statistik: ${stats.activeSubjects} mapel aktif, ${stats.levels} level, ${stats.units} unit, ${stats.lessons} lesson, ${stats.questions} soal.`,
  );
  for (const item of stats.bySubject) {
    console.log(`  - ${item.slug}: ${item.lessons} lesson, ${item.questions} soal`);
  }
  console.log(`Total statement: ${statements.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
