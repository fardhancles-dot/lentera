import type { IconName } from './icons';

const SUBJECT_ICONS: Record<string, IconName> = {
  book: 'book',
  code: 'code',
  database: 'database',
  phone: 'phone',
  calculator: 'calculator',
  language: 'language',
  shield: 'shield',
  globe: 'globe',
  flag: 'flag',
  leaf: 'leaf',
};

export function subjectIconName(key: string): IconName {
  return SUBJECT_ICONS[key] ?? 'book';
}
