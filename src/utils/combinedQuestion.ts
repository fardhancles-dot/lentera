/**
 * Shared model for Soal Kombinasi. One combined question keeps a list of
 * presentation elements (story, conversation, image, audio, text, hint) and
 * exactly one answer interaction. The answer keys stay on the server; this
 * module only describes what the player sees.
 */

export type CombinedAnswerMode =
  | 'choice'
  | 'text'
  | 'order'
  | 'match'
  | 'speak'
  | 'translate';
export type CombinedGrading = 'all' | 'weighted';
export type CombinedChoiceDisplay = 'bank' | 'choices';
export type CombinedElementKind =
  | 'text'
  | 'story'
  | 'conversation'
  | 'hint'
  | 'image'
  | 'audio';

export interface CombinedDialogLine {
  speaker: string;
  line: string;
}

export interface CombinedElement {
  kind: CombinedElementKind;
  text?: string;
  title?: string;
  body?: string;
  lines?: CombinedDialogLine[];
}

export interface CombinedAnswerConfig {
  mode: CombinedAnswerMode;
  grading: CombinedGrading;
  /** How choices are presented when mode is `choice`. */
  display: CombinedChoiceDisplay;
  /** Public labels for each answer part, e.g. "Rumpang 1". */
  partLabels: string[];
}

export interface CombinedConfig {
  elements: CombinedElement[];
  mechanics: string[];
  answer: CombinedAnswerConfig;
}

export const COMBINED_MODES: Array<{
  value: CombinedAnswerMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'choice',
    label: 'Pilih satu jawaban',
    hint: 'Pemain memilih satu kata atau pilihan jawaban yang tersedia.',
  },
  {
    value: 'text',
    label: 'Isi rumpang dengan mengetik',
    hint: 'Pemain mengetik jawaban pada setiap bagian kosong.',
  },
  {
    value: 'order',
    label: 'Susun kata',
    hint: 'Pemain menyusun kata menjadi kalimat yang benar.',
  },
  {
    value: 'match',
    label: 'Cocokkan pasangan',
    hint: 'Pemain mencocokkan dua kelompok informasi.',
  },
  {
    value: 'speak',
    label: 'Ucapkan jawaban',
    hint: 'Pemain berbicara lewat mikrofon, dengan alternatif menulis bila browser tidak mendukung.',
  },
  {
    value: 'translate',
    label: 'Terjemahkan',
    hint: 'Pemain menulis atau menyusun terjemahan dari kalimat yang diberikan.',
  },
];

export const COMBINED_GRADINGS: Array<{ value: CombinedGrading; label: string; hint: string }> = [
  {
    value: 'all',
    label: 'Semua elemen harus benar',
    hint: 'Poin penuh hanya diberikan bila seluruh bagian jawaban benar.',
  },
  {
    value: 'weighted',
    label: 'Poin berdasarkan bobot',
    hint: 'Poin dibagi rata ke setiap bagian jawaban yang benar.',
  },
];

export const COMBINED_ELEMENT_KINDS: Array<{ value: CombinedElementKind; label: string }> = [
  { value: 'text', label: 'Teks' },
  { value: 'story', label: 'Cerita' },
  { value: 'conversation', label: 'Percakapan' },
  { value: 'hint', label: 'Catatan / petunjuk' },
  { value: 'image', label: 'Gambar' },
  { value: 'audio', label: 'Audio' },
];

export const MECHANIC_LABELS: Record<string, string> = {
  multiple_choice: 'Pilihan ganda',
  fill_blank: 'Isi rumpang',
  typing: 'Mengetik',
  matching_pairs: 'Mencocokkan pasangan',
  listening: 'Menyimak',
  picture_identification: 'Identifikasi gambar',
  speaking: 'Berbicara',
  conversation: 'Percakapan',
  story: 'Cerita',
  word_bank: 'Word bank',
  sentence_builder: 'Susun kalimat',
  translation: 'Terjemahan',
};

const ELEMENT_KINDS = new Set<CombinedElementKind>(
  COMBINED_ELEMENT_KINDS.map((entry) => entry.value),
);
const MODES = new Set<CombinedAnswerMode>(COMBINED_MODES.map((entry) => entry.value));

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseElement(value: unknown): CombinedElement | null {
  const data = record(value);
  const kind = str(data.kind) as CombinedElementKind;
  if (!ELEMENT_KINDS.has(kind)) return null;

  if (kind === 'conversation') {
    const lines = Array.isArray(data.lines)
      ? data.lines
          .map((item) => {
            const line = record(item);
            return { speaker: str(line.speaker), line: str(line.line) };
          })
          .filter((line) => line.line.trim().length > 0)
      : [];
    return { kind, lines };
  }

  if (kind === 'story') {
    const body = str(data.body);
    if (!body.trim()) return null;
    return { kind, title: str(data.title), body };
  }

  if (kind === 'text' || kind === 'hint') {
    const text = str(data.text);
    if (!text.trim()) return null;
    return { kind, text };
  }

  return { kind };
}

/** Tolerant parser: old or partial data must never break the game. */
export function parseCombinedConfig(scene: unknown): CombinedConfig {
  const root = record(scene);
  const answer = record(root.answer);
  const rawMode = str(answer.mode) as CombinedAnswerMode;
  const mode: CombinedAnswerMode = MODES.has(rawMode) ? rawMode : 'choice';
  const display: CombinedChoiceDisplay = answer.display === 'choices' ? 'choices' : 'bank';
  const grading: CombinedGrading = answer.grading === 'weighted' ? 'weighted' : 'all';
  const elements = (Array.isArray(root.elements) ? root.elements : [])
    .map(parseElement)
    .filter((element): element is CombinedElement => element !== null);
  const partLabels = Array.isArray(answer.partLabels)
    ? answer.partLabels.map(str).filter((label) => label.trim().length > 0)
    : [];
  const mechanics = Array.isArray(root.mechanics)
    ? root.mechanics.map(str).filter((code) => code in MECHANIC_LABELS)
    : [];

  return {
    elements,
    mechanics,
    answer: { mode, grading, display, partLabels },
  };
}

/** Number of `__` markers in a prompt, matching the Fill in the Blank rule. */
export function countPromptBlanks(prompt: string): number {
  return (prompt.match(/_{2,}/g) ?? []).length;
}

/**
 * Mechanism list that is actually active for a config. Used as the admin's
 * "Mekanisme aktif" summary so a mechanism is never shown as decoration.
 */
export function describeMechanics(config: CombinedConfig, hasMedia = false): string[] {
  const active = new Set<string>();
  for (const element of config.elements) {
    if (element.kind === 'image') active.add('picture_identification');
    if (element.kind === 'audio') active.add('listening');
    if (element.kind === 'story') active.add('story');
    if (element.kind === 'conversation') active.add('conversation');
    if (element.kind === 'text' && countPromptBlanks(element.text ?? '') > 0) {
      active.add('fill_blank');
    }
  }

  const mode = config.answer.mode;
  if (mode === 'choice') {
    active.add('multiple_choice');
    if (config.answer.display === 'bank') active.add('word_bank');
  } else if (mode === 'text') {
    active.add('typing');
    active.add('fill_blank');
  } else if (mode === 'order') {
    active.add('sentence_builder');
    active.add('word_bank');
  } else if (mode === 'speak') {
    active.add('speaking');
  } else if (mode === 'translate') {
    active.add('translation');
    active.add('typing');
  } else {
    active.add('matching_pairs');
  }

  if (hasMedia) active.add('picture_identification');
  return [...active];
}
