import type {
  SeedDifficulty,
  SeedLesson,
  SeedLevel,
  SeedQuestion,
  SeedSceneScreen,
  SeedSubject,
  SeedUnit,
} from './types';

/** Content defaults to Indonesian audio; English lessons opt into en-US. */
const DEFAULT_LANG = 'id-ID';

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

export function listening(
  slug: string,
  topic: string,
  prompt: string,
  speech: string,
  options: string[],
  correctIndex: number,
  explanation: string,
  hint?: string,
  lang = DEFAULT_LANG,
): SeedQuestion {
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${slug} has an invalid correct option index.`);
  }

  return {
    slug,
    type: 'listening',
    topic,
    instruction: 'Dengarkan audio, lalu pilih jawaban yang sesuai.',
    prompt,
    explanation,
    hint,
    points: 15,
    options: options.map((text, index) => ({ text, correct: index === correctIndex })),
    scene: { speech, lang },
  };
}

export function speaking(
  slug: string,
  topic: string,
  prompt: string,
  spokenText: string,
  answers: string[],
  explanation: string,
  hint?: string,
  lang = DEFAULT_LANG,
): SeedQuestion {
  return {
    slug,
    type: 'speaking',
    topic,
    instruction: 'Ucapkan kalimat berikut, lalu periksa apakah ucapanmu dikenali.',
    prompt,
    explanation,
    hint,
    points: 15,
    answers,
    scene: { speech: spokenText, lang },
  };
}

export function translation(
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
    type: 'translation',
    topic,
    instruction: 'Susun terjemahan dari kata yang tersedia atau ketik jawabanmu sendiri.',
    prompt,
    explanation,
    hint,
    points: 15,
    options: tokens.map((text) => ({ text, correct: false })),
    answers,
  };
}

export function conversation(
  slug: string,
  topic: string,
  prompt: string,
  npc: { name: string; role?: string },
  screens: Array<{ speaker?: string; line: string }>,
  options: string[],
  correctIndex: number,
  explanation: string,
  hint?: string,
  /** One NPC reaction per option, aligned with `options`. */
  responses?: string[],
  lang = DEFAULT_LANG,
): SeedQuestion {
  if (responses && responses.length !== options.length) {
    throw new Error(`Question ${slug} needs one response per option.`);
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${slug} has an invalid correct option index.`);
  }

  return {
    slug,
    type: 'conversation',
    topic,
    instruction: 'Baca percakapan, lalu pilih respons yang paling tepat.',
    prompt,
    explanation,
    hint,
    points: 15,
    options: options.map((text, index) => ({ text, correct: index === correctIndex })),
    scene: { npc, screens, ...(responses ? { responses } : {}), lang },
  };
}

export function story(
  slug: string,
  topic: string,
  prompt: string,
  screens: SeedSceneScreen[],
  options: string[],
  correctIndex: number,
  explanation: string,
  hint?: string,
  lang = DEFAULT_LANG,
): SeedQuestion {
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${slug} has an invalid correct option index.`);
  }

  return {
    slug,
    type: 'story',
    topic,
    instruction: 'Baca cerita sampai selesai, lalu jawab pertanyaan pemahaman.',
    prompt,
    explanation,
    hint,
    points: 20,
    options: options.map((text, index) => ({ text, correct: index === correctIndex })),
    scene: { screens, lang },
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
