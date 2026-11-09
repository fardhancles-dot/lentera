import { applyStageThreeNodes } from './extensions';
import { allowedQuestionTypes } from './mapping';
import { applyMiniGameQuestions } from './minigames';
import { applyReviewLessons } from './reviews';
import { applyStageFourQuestions } from './stage4';
import { languageSubjects } from './subjects/bahasa';
import { regionalSubjects } from './subjects/daerah';
import { scienceSubjects } from './subjects/sains';
import { socialSubjects } from './subjects/sosial';
import { technologySubjects } from './subjects/teknologi';
import type { SeedQuestion, SeedSubject } from './types';

export const curriculumSubjects: SeedSubject[] = [
  ...technologySubjects,
  ...languageSubjects,
  ...socialSubjects,
  ...scienceSubjects,
  ...regionalSubjects,
];

applyReviewLessons(curriculumSubjects);
applyStageThreeNodes(curriculumSubjects);
applyMiniGameQuestions(curriculumSubjects);
applyStageFourQuestions(curriculumSubjects);

export interface CurriculumIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface CurriculumStats {
  subjects: number;
  activeSubjects: number;
  developmentSubjects: number;
  levels: number;
  units: number;
  lessons: number;
  questions: number;
  byType: Record<string, number>;
  bySubject: Array<{ slug: string; lessons: number; questions: number }>;
}

export function validateCurriculum(subjects: SeedSubject[] = curriculumSubjects): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const subjectSlugs = new Set<string>();
  const sortOrders = new Set<number>();

  for (const subject of subjects) {
    if (subjectSlugs.has(subject.slug)) {
      issues.push({ level: 'error', message: `Slug mata pelajaran duplikat: ${subject.slug}` });
    }
    subjectSlugs.add(subject.slug);

    if (sortOrders.has(subject.sortOrder)) {
      issues.push({
        level: 'error',
        message: `sortOrder duplikat: ${subject.sortOrder} (${subject.slug})`,
      });
    }
    sortOrders.add(subject.sortOrder);

    if (!subject.name.trim() || !subject.description.trim()) {
      issues.push({ level: 'error', message: `Nama/deskripsi kosong pada ${subject.slug}` });
    }

    if (subject.status === 'development') {
      if (subject.levels.length > 0) {
        issues.push({
          level: 'error',
          message: `Mata pelajaran development tidak boleh punya level: ${subject.slug}`,
        });
      }
      continue;
    }

    if (subject.levels.length === 0) {
      issues.push({
        level: 'error',
        message: `Mata pelajaran aktif wajib punya minimal satu level: ${subject.slug}`,
      });
    }

    const levelSlugs = new Set<string>();
    const nodeTypes = new Set<string>();
    const subjectQuestionTypes = new Set<string>();
    const allowedTypes = allowedQuestionTypes(subject);
    for (const level of subject.levels) {
      if (levelSlugs.has(level.slug)) {
        issues.push({
          level: 'error',
          message: `Slug level duplikat di ${subject.slug}: ${level.slug}`,
        });
      }
      levelSlugs.add(level.slug);

      if (level.units.length === 0) {
        issues.push({
          level: 'error',
          message: `Level tanpa unit: ${subject.slug}/${level.slug}`,
        });
      }

      const unitSlugs = new Set<string>();
      for (const unit of level.units) {
        if (unitSlugs.has(unit.slug)) {
          issues.push({
            level: 'error',
            message: `Slug unit duplikat di ${subject.slug}/${level.slug}: ${unit.slug}`,
          });
        }
        unitSlugs.add(unit.slug);

        if (unit.objectives.length === 0) {
          issues.push({
            level: 'warning',
            message: `Unit tanpa tujuan pembelajaran: ${subject.slug}/${unit.slug}`,
          });
        }

        const lessonSlugs = new Set<string>();
        for (const lessonItem of unit.lessons) {
          if (lessonSlugs.has(lessonItem.slug)) {
            issues.push({
              level: 'error',
              message: `Slug lesson duplikat di ${subject.slug}/${unit.slug}: ${lessonItem.slug}`,
            });
          }
          lessonSlugs.add(lessonItem.slug);
          nodeTypes.add(lessonItem.nodeType ?? lessonItem.kind);

          if (lessonItem.questions.length === 0) {
            issues.push({
              level: 'warning',
              message: `Lesson belum punya soal: ${subject.slug}/${lessonItem.slug}`,
            });
          }

          const questionSlugs = new Set<string>();
          for (const question of lessonItem.questions) {
            const location = `${subject.slug}/${lessonItem.slug}/${question.slug}`;
            if (questionSlugs.has(question.slug)) {
              issues.push({ level: 'error', message: `Slug soal duplikat: ${location}` });
            }
            questionSlugs.add(question.slug);
            subjectQuestionTypes.add(question.type);
            if (!allowedTypes.has(question.type)) {
              issues.push({
                level: 'error',
                message: `Tipe ${question.type} tidak dipetakan untuk kategori ${subject.category}: ${location}`,
              });
            }
            validateQuestion(question, location, issues);
          }
        }
      }
    }

    if (subject.isPrimary && subjectQuestionTypes.size < 3) {
      issues.push({
        level: 'warning',
        message: `Mapel inti sebaiknya memakai minimal 3 tipe soal: ${subject.slug} (${subjectQuestionTypes.size})`,
      });
    }

    if (subject.isPrimary) {
      for (const required of ['practice', 'checkpoint', 'legendary'] as const) {
        if (!nodeTypes.has(required)) {
          issues.push({
            level: 'error',
            message: `Mata pelajaran inti wajib punya node ${required}: ${subject.slug}`,
          });
        }
      }
    }
  }

  return issues;
}

function validateQuestion(
  question: SeedQuestion,
  location: string,
  issues: CurriculumIssue[],
): void {
  if (!question.prompt.trim() || !question.explanation.trim() || !question.topic.trim()) {
    issues.push({ level: 'error', message: `Soal tanpa prompt/penjelasan/topik: ${location}` });
  }

  const choiceTypes = [
    'multiple_choice',
    'picture_identification',
    'listening',
    'conversation',
    'story',
  ];

  if (choiceTypes.includes(question.type)) {
    const options = question.options ?? [];
    if (options.length < 2) {
      issues.push({ level: 'error', message: `Soal pilihan butuh minimal 2 opsi: ${location}` });
    }
    const correct = options.filter((option) => option.correct).length;
    if (correct !== 1) {
      issues.push({
        level: 'error',
        message: `Soal pilihan harus punya tepat 1 jawaban benar (ada ${correct}): ${location}`,
      });
    }
    if (options.some((option) => !option.text.trim())) {
      issues.push({ level: 'error', message: `Ada opsi kosong: ${location}` });
    }
    if (
      question.type === 'picture_identification' &&
      !question.media?.some((media) => media.kind === 'image')
    ) {
      issues.push({
        level: 'error',
        message: `Identifikasi gambar wajib punya media gambar: ${location}`,
      });
    }
    if (question.type === 'listening' && !question.scene?.speech?.trim()) {
      issues.push({
        level: 'error',
        message: `Listening wajib punya teks audio (scene.speech): ${location}`,
      });
    }
    if (question.type === 'conversation') {
      if (!question.scene?.npc?.name?.trim() || !(question.scene.screens?.length ?? 0)) {
        issues.push({
          level: 'error',
          message: `Conversation wajib punya NPC dan minimal satu baris dialog: ${location}`,
        });
      }
      if (
        question.scene?.responses &&
        question.scene.responses.length !== options.length
      ) {
        issues.push({
          level: 'error',
          message: `Conversation harus punya satu respons NPC per opsi: ${location}`,
        });
      }
    }
    if (question.type === 'story') {
      if (!(question.scene?.screens?.length ?? 0)) {
        issues.push({
          level: 'error',
          message: `Story wajib punya minimal satu layar cerita: ${location}`,
        });
      }
      for (const [index, screen] of (question.scene?.screens ?? []).entries()) {
        if (screen.choices?.some((choice) => !choice.label.trim() || !choice.reply.trim())) {
          issues.push({
            level: 'error',
            message: `Pilihan cerita bagian ${index + 1} punya label/reply kosong: ${location}`,
          });
        }
      }
    }
    return;
  }

  if (question.type === 'matching_pairs') {
    const pairs = question.pairs ?? [];
    if (pairs.length < 2) {
      issues.push({
        level: 'error',
        message: `Matching pairs butuh minimal 2 pasangan: ${location}`,
      });
    }
    if (pairs.some((pair) => !pair.left.trim() || !pair.right.trim())) {
      issues.push({ level: 'error', message: `Ada pasangan kosong: ${location}` });
    }
    if ((question.options?.length ?? 0) > 0 || (question.answers?.length ?? 0) > 0) {
      issues.push({
        level: 'error',
        message: `Matching pairs tidak boleh punya opsi/jawaban teks: ${location}`,
      });
    }
    return;
  }

  const answers = question.answers ?? [];
  if (answers.length === 0 || answers.some((answer) => !answer.trim())) {
    issues.push({ level: 'error', message: `Soal isian tanpa jawaban: ${location}` });
  }

  if (question.type === 'fill_blank') {
    const blanks = (question.prompt.match(/_{2,}/g) ?? []).length;
    if (blanks === 0) {
      issues.push({
        level: 'error',
        message: `Fill in the Blank butuh penanda rumpang __: ${location}`,
      });
    } else if (
      blanks > 1 &&
      !answers.some((answer) => answer.trim().split(/\s+/).length === blanks)
    ) {
      issues.push({
        level: 'error',
        message: `Fill in the Blank dengan ${blanks} rumpang butuh jawaban ${blanks} kata: ${location}`,
      });
    }
  }

  if (question.type === 'word_bank' || question.type === 'sentence_builder') {
    const tokens = question.options ?? [];
    if (tokens.length < 2) {
      issues.push({ level: 'error', message: `Soal susun kata butuh minimal 2 token: ${location}` });
    }
    if (tokens.some((token) => !token.text.trim())) {
      issues.push({ level: 'error', message: `Ada token kosong: ${location}` });
    }
    return;
  }

  if (question.type === 'translation') {
    if (question.options?.some((token) => !token.text.trim())) {
      issues.push({ level: 'error', message: `Ada token terjemahan kosong: ${location}` });
    }
    return;
  }

  if (question.type === 'speaking') {
    if (!question.scene?.speech?.trim()) {
      issues.push({
        level: 'error',
        message: `Speaking wajib punya audio contoh (scene.speech): ${location}`,
      });
    }
    if (question.options && question.options.length > 0) {
      issues.push({ level: 'error', message: `Speaking tidak memakai opsi: ${location}` });
    }
    return;
  }

  if (question.options && question.options.length > 0) {
    issues.push({ level: 'error', message: `Soal isian tidak boleh punya opsi: ${location}` });
  }
}

export function curriculumStats(subjects: SeedSubject[] = curriculumSubjects): CurriculumStats {
  const byType: Record<string, number> = {};
  const bySubject: CurriculumStats['bySubject'] = [];
  let levels = 0;
  let units = 0;
  let lessons = 0;
  let questions = 0;

  for (const subject of subjects) {
    let subjectLessons = 0;
    let subjectQuestions = 0;

    for (const level of subject.levels) {
      levels += 1;
      for (const unit of level.units) {
        units += 1;
        for (const lessonItem of unit.lessons) {
          lessons += 1;
          subjectLessons += 1;
          for (const question of lessonItem.questions) {
            questions += 1;
            subjectQuestions += 1;
            byType[question.type] = (byType[question.type] ?? 0) + 1;
          }
        }
      }
    }

    bySubject.push({
      slug: subject.slug,
      lessons: subjectLessons,
      questions: subjectQuestions,
    });
  }

  return {
    subjects: subjects.length,
    activeSubjects: subjects.filter((subject) => subject.status === 'active').length,
    developmentSubjects: subjects.filter((subject) => subject.status === 'development').length,
    levels,
    units,
    lessons,
    questions,
    byType,
    bySubject,
  };
}
