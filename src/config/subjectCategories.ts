export type SubjectCategoryKey = 'umum' | 'bahasa-daerah' | 'bahasa-asing';

export interface SubjectCategory {
  key: SubjectCategoryKey;
  label: string;
  description: string;
}

/**
 * The only three categories the Learn page exposes. Subjects are placed by an
 * admin, never inferred from their name, so the order here is the UI order.
 */
export const SUBJECT_CATEGORIES: readonly SubjectCategory[] = [
  {
    key: 'umum',
    label: 'Mapel Umum',
    description: 'Mata pelajaran inti dan mapel lain yang diatur admin.',
  },
  {
    key: 'bahasa-daerah',
    label: 'Bahasa Daerah',
    description: 'Bahasa daerah yang tersedia di Lentera.',
  },
  {
    key: 'bahasa-asing',
    label: 'Bahasa Asing',
    description: 'Bahasa asing yang tersedia di Lentera.',
  },
] as const;

export const DEFAULT_SUBJECT_CATEGORY: SubjectCategoryKey = 'umum';

export function normalizeSubjectCategory(value: string | null | undefined): SubjectCategoryKey {
  const match = SUBJECT_CATEGORIES.find((category) => category.key === value);
  return match ? match.key : DEFAULT_SUBJECT_CATEGORY;
}

export function subjectCategoryLabel(value: string | null | undefined): string {
  const key = normalizeSubjectCategory(value);
  return SUBJECT_CATEGORIES.find((category) => category.key === key)?.label ?? 'Mapel Umum';
}
