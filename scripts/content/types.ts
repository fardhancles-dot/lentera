export type SeedDifficulty = 'beginner' | 'elementary' | 'intermediate';

export type SeedNodeType =
  | 'lesson'
  | 'review'
  | 'practice'
  | 'challenge'
  | 'checkpoint'
  | 'legendary'
  | 'reward';

export type SeedCategory = 'teknologi' | 'bahasa' | 'sosial' | 'sains' | 'bahasa-daerah';

export type SeedQuestionType =
  | 'multiple_choice'
  | 'typing'
  | 'fill_blank'
  | 'word_bank'
  | 'sentence_builder'
  | 'matching_pairs'
  | 'picture_identification';

export type SeedLessonKind = 'lesson' | 'practice' | 'review' | 'challenge' | 'legendary';

export interface SeedOption {
  text: string;
  correct: boolean;
}

export interface SeedPair {
  left: string;
  right: string;
}

export interface SeedMedia {
  kind: 'image' | 'audio' | 'video';
  url: string;
  alt: string;
}

export interface SeedQuestion {
  slug: string;
  type: SeedQuestionType;
  topic: string;
  instruction: string;
  prompt: string;
  explanation: string;
  hint?: string;
  points: number;
  options?: SeedOption[];
  answers?: string[];
  pairs?: SeedPair[];
  media?: SeedMedia[];
}

export interface SeedLesson {
  slug: string;
  title: string;
  description: string;
  kind: SeedLessonKind;
  estimatedMinutes: number;
  questions: SeedQuestion[];
  /** Overrides the node type shown on the learning path (defaults to `kind`). */
  nodeType?: SeedNodeType;
}

export interface SeedUnit {
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  lessons: SeedLesson[];
}

export interface SeedLevel {
  slug: string;
  title: string;
  description: string;
  difficulty: SeedDifficulty;
  units: SeedUnit[];
}

export interface SeedSubject {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: SeedCategory;
  iconKey: string;
  accentColor: string;
  status: 'active' | 'development';
  isPrimary: boolean;
  sortOrder: number;
  levels: SeedLevel[];
}
