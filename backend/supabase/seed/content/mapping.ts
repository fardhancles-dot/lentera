import type { SeedCategory, SeedQuestionType, SeedSubject } from './types';

/**
 * Question types are mapped by subject category rather than forced onto every
 * subject. Language subjects can use production and dialogue mechanics;
 * technology, science, and social subjects keep mechanics that fit their
 * material (choice, typing, matching, ordering, and picture identification).
 */
const BY_CATEGORY: Record<SeedCategory, SeedQuestionType[]> = {
  bahasa: [
    'multiple_choice',
    'typing',
    'fill_blank',
    'word_bank',
    'sentence_builder',
    'matching_pairs',
    'picture_identification',
    'listening',
    'speaking',
    'translation',
    'conversation',
    'story',
  ],
  'bahasa-daerah': [
    'multiple_choice',
    'typing',
    'fill_blank',
    'word_bank',
    'sentence_builder',
    'matching_pairs',
    'picture_identification',
    'listening',
    'speaking',
    'translation',
    'conversation',
    'story',
  ],
  teknologi: [
    'multiple_choice',
    'typing',
    'fill_blank',
    'word_bank',
    'sentence_builder',
    'matching_pairs',
    'picture_identification',
  ],
  sains: [
    'multiple_choice',
    'typing',
    'fill_blank',
    'matching_pairs',
    'picture_identification',
  ],
  sosial: [
    'multiple_choice',
    'typing',
    'fill_blank',
    'matching_pairs',
    'picture_identification',
  ],
};

export function allowedQuestionTypes(subject: SeedSubject): Set<SeedQuestionType> {
  return new Set(BY_CATEGORY[subject.category]);
}

export function isQuestionTypeAllowed(
  subject: SeedSubject,
  type: SeedQuestionType,
): boolean {
  return allowedQuestionTypes(subject).has(type);
}
