import { describe, expect, it } from 'vitest';
import {
  SUBJECT_CATEGORIES,
  normalizeSubjectCategory,
  subjectCategoryLabel,
} from '../src/config/subjectCategories';

describe('subject categories', () => {
  it('exposes exactly the four fixed categories in UI order', () => {
    expect(SUBJECT_CATEGORIES.map((category) => category.key)).toEqual([
      'umum',
      'bahasa-daerah',
      'bahasa-asing',
      'kejuruan',
    ]);
    expect(SUBJECT_CATEGORIES.map((category) => category.label)).toEqual([
      'Mapel Umum',
      'Bahasa Daerah',
      'Kursus Bahasa',
      'Kejuruan',
    ]);
  });

  it('keeps stored categories and falls back to Mapel Umum', () => {
    expect(normalizeSubjectCategory('bahasa-asing')).toBe('bahasa-asing');
    expect(normalizeSubjectCategory('bahasa-daerah')).toBe('bahasa-daerah');
    expect(normalizeSubjectCategory('kejuruan')).toBe('kejuruan');
    expect(normalizeSubjectCategory('umum')).toBe('umum');
    expect(normalizeSubjectCategory(null)).toBe('umum');
    expect(normalizeSubjectCategory(undefined)).toBe('umum');
    expect(normalizeSubjectCategory('teknologi')).toBe('umum');
    expect(normalizeSubjectCategory('')).toBe('umum');
  });

  it('labels any category value for admin confirmations', () => {
    expect(subjectCategoryLabel('bahasa-asing')).toBe('Kursus Bahasa');
    expect(subjectCategoryLabel('kejuruan')).toBe('Kejuruan');
    expect(subjectCategoryLabel('unknown')).toBe('Mapel Umum');
  });
});
