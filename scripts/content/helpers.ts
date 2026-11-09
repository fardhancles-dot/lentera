import type {
  SeedDifficulty,
  SeedLesson,
  SeedLevel,
  SeedQuestion,
  SeedSubject,
  SeedUnit,
} from './types';

const MC_INSTRUCTION = 'Pilih satu jawaban yang paling tepat.';
const TYPING_INSTRUCTION = 'Tulis jawaban pada kolom yang tersedia.';
const FILL_INSTRUCTION = 'Lengkapi bagian rumpang dengan jawaban yang tepat.';

export function mc(
  slug: string,
  topic: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  explanation: string,
  hint?: string,
): SeedQuestion {
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${slug} has an invalid correct option index.`);
  }

  return {
    slug,
    type: 'multiple_choice',
    topic,
    instruction: MC_INSTRUCTION,
    prompt,
    explanation,
    hint,
    points: 10,
    options: options.map((text, index) => ({ text, correct: index === correctIndex })),
  };
}

export function typing(
  slug: string,
  topic: string,
  prompt: string,
  answers: string[],
  explanation: string,
  hint?: string,
): SeedQuestion {
  return {
    slug,
    type: 'typing',
    topic,
    instruction: TYPING_INSTRUCTION,
    prompt,
    explanation,
    hint,
    points: 15,
    answers,
  };
}

export function fill(
  slug: string,
  topic: string,
  prompt: string,
  answers: string[],
  explanation: string,
  hint?: string,
): SeedQuestion {
  return {
    slug,
    type: 'fill_blank',
    topic,
    instruction: FILL_INSTRUCTION,
    prompt,
    explanation,
    hint,
    points: 10,
    answers,
  };
}

export function wordBank(
  slug: string,
  topic: string,
  prompt: string,
  tokens: string[],
  answers: string[],
  explanation: string,
  hint?: string,
): SeedQuestion {
  return {
    slug,
    type: 'word_bank',
    topic,
    instruction: 'Susun jawaban dengan mengetuk kata yang tersedia.',
    prompt,
    explanation,
    hint,
    points: 15,
    options: tokens.map((text) => ({ text, correct: false })),
    answers,
  };
}

export function sentenceBuilder(
  slug: string,
  topic: string,
  prompt: string,
  tokens: string[],
  answers: string[],
  explanation: string,
  hint?: string,
): SeedQuestion {
  return {
    slug,
    type: 'sentence_builder',
    topic,
    instruction: 'Susun kata acak menjadi kalimat yang benar.',
    prompt,
    explanation,
    hint,
    points: 15,
    options: tokens.map((text) => ({ text, correct: false })),
    answers,
  };
}

export function matching(
  slug: string,
  topic: string,
  prompt: string,
  pairs: Array<{ left: string; right: string }>,
  explanation: string,
  hint?: string,
): SeedQuestion {
  return {
    slug,
    type: 'matching_pairs',
    topic,
    instruction: 'Cocokkan setiap item di kolom kiri dengan pasangannya di kolom kanan.',
    prompt,
    explanation,
    hint,
    points: 20,
    pairs,
  };
}

export function picture(
  slug: string,
  topic: string,
  prompt: string,
  image: { url: string; alt: string },
  options: string[],
  correctIndex: number,
  explanation: string,
  hint?: string,
): SeedQuestion {
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${slug} has an invalid correct option index.`);
  }

  return {
    slug,
    type: 'picture_identification',
    topic,
    instruction: 'Pilih nama yang sesuai dengan gambar.',
    prompt,
    explanation,
    hint,
    points: 10,
    options: options.map((text, index) => ({ text, correct: index === correctIndex })),
    media: [{ kind: 'image', url: image.url, alt: image.alt }],
  };
}

export function lesson(
  slug: string,
  title: string,
  description: string,
  questions: SeedQuestion[],
  estimatedMinutes = 7,
  kind: SeedLesson['kind'] = 'lesson',
): SeedLesson {
  return { slug, title, description, kind, estimatedMinutes, questions };
}

/** A lesson whose learning-path node type differs from its lesson kind. */
export function nodeLesson(
  nodeType: NonNullable<SeedLesson['nodeType']>,
  item: SeedLesson,
): SeedLesson {
  return { ...item, nodeType };
}

export function stage(input: {
  slug: string;
  title: string;
  difficulty: SeedDifficulty;
  description: string;
  unitSlug: string;
  unitTitle: string;
  unitDescription: string;
  objectives: string[];
  lesson: SeedLesson;
}): SeedLevel {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    units: [
      {
        slug: input.unitSlug,
        title: input.unitTitle,
        description: input.unitDescription,
        objectives: input.objectives,
        lessons: [input.lesson],
      },
    ],
  };
}

/** A development-only subject that is visible in the catalog but has no course. */
export function developmentSubject(input: {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: SeedSubject['category'];
  iconKey: string;
  accentColor: string;
  sortOrder: number;
}): SeedSubject {
  return {
    ...input,
    status: 'development',
    isPrimary: false,
    levels: [],
  };
}

export type { SeedUnit };
