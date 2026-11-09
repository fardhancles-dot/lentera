export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'player' | 'admin' | 'developer';
export type SubjectStatus = 'active' | 'development' | 'inactive';
export type DifficultyBand =
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'upper_intermediate'
  | 'advanced'
  | 'expert';
export type LessonKind = 'lesson' | 'practice' | 'review' | 'challenge' | 'legendary';
export type NodeKind =
  | 'lesson'
  | 'review'
  | 'practice'
  | 'challenge'
  | 'checkpoint'
  | 'legendary'
  | 'reward';
export type NodeProgressStatus = 'available' | 'in_progress' | 'completed';
export type QuestionType =
  | 'multiple_choice'
  | 'word_bank'
  | 'sentence_builder'
  | 'listening'
  | 'speaking'
  | 'typing'
  | 'matching_pairs'
  | 'picture_identification'
  | 'fill_blank'
  | 'translation'
  | 'conversation'
  | 'story';

// Supabase's generic schema requires plain object types (not interfaces), so
// these rows are declared with `type` aliases.
export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_key: string;
  bio: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type UserSettingsRow = {
  user_id: string;
  locale: 'id' | 'en';
  timezone: string;
  daily_goal_minutes: number;
  music_volume: number;
  sfx_volume: number;
  voice_volume: number;
  reduced_motion: boolean;
  email_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  user_id: string;
  role: AppRole;
  granted_at: string;
  granted_by: string | null;
};

export type SubjectRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string;
  category: string;
  icon_key: string;
  accent_color: string;
  status: SubjectStatus;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Row returned by the public.subject_overview view. */
export type SubjectOverviewRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string;
  category: string;
  icon_key: string;
  accent_color: string;
  status: SubjectStatus;
  is_primary: boolean;
  sort_order: number;
  course_id: string | null;
  level_count: number;
  unit_count: number;
  lesson_count: number;
  question_count: number;
};

export type CourseRow = {
  id: string;
  subject_id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon_key: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseLevelRow = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: DifficultyBand;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type UnitRow = {
  id: string;
  course_level_id: string;
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  reward_coins: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  description: string;
  kind: LessonKind;
  estimated_minutes: number;
  xp_reward: number;
  coin_reward: number;
  hearts_enabled: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningNodeRow = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  description: string;
  node_type: NodeKind;
  lesson_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type LessonQuestionStatsRow = {
  lesson_id: string;
  question_count: number;
  topics: string[] | null;
  question_types: string[] | null;
};

export type UserCourseProgressRow = {
  user_id: string;
  course_id: string;
  xp: number;
  completed_lessons: number;
  updated_at: string;
};

export type UserNodeProgressRow = {
  user_id: string;
  node_id: string;
  status: NodeProgressStatus;
  best_score: number;
  attempts: number;
  completed_at: string | null;
  updated_at: string;
};

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

export type LessonAttemptRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  node_id: string;
  status: AttemptStatus;
  correct_count: number;
  total_count: number;
  score: number;
  max_score: number;
  accuracy: number;
  started_at: string;
  completed_at: string | null;
};

export type AnswerAttemptRow = {
  id: string;
  attempt_id: string;
  user_id: string;
  question_id: string;
  answer: Json;
  is_correct: boolean;
  points_awarded: number;
  answered_at: string;
};

export type UserWalletRow = {
  user_id: string;
  coins: number;
  updated_at: string;
};

export type UserXpLedgerRow = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  lesson_attempt_id: string | null;
  created_at: string;
};

export type CoinTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  lesson_attempt_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          username: string;
          display_name?: string;
          avatar_key?: string;
          bio?: string;
          onboarding_completed?: boolean;
        };
        Update: {
          username?: string;
          display_name?: string;
          avatar_key?: string;
          bio?: string;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: {
          user_id: string;
          locale?: 'id' | 'en';
          timezone?: string;
          daily_goal_minutes?: number;
          music_volume?: number;
          sfx_volume?: number;
          voice_volume?: number;
          reduced_motion?: boolean;
          email_opt_in?: boolean;
        };
        Update: {
          locale?: 'id' | 'en';
          timezone?: string;
          daily_goal_minutes?: number;
          music_volume?: number;
          sfx_volume?: number;
          voice_volume?: number;
          reduced_motion?: boolean;
          email_opt_in?: boolean;
        };
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: {
          user_id: string;
          role?: AppRole;
          granted_by?: string | null;
        };
        Update: {
          role?: AppRole;
        };
        Relationships: [];
      };
      subjects: {
        Row: SubjectRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      courses: {
        Row: CourseRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      course_levels: {
        Row: CourseLevelRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      units: {
        Row: UnitRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      lessons: {
        Row: LessonRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      learning_nodes: {
        Row: LearningNodeRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      questions: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      question_options: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      question_answers: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      question_media: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      question_pairs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_course_progress: {
        Row: UserCourseProgressRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_node_progress: {
        Row: UserNodeProgressRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      lesson_attempts: {
        Row: LessonAttemptRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      answer_attempts: {
        Row: AnswerAttemptRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_wallets: {
        Row: UserWalletRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_xp_ledger: {
        Row: UserXpLedgerRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coin_transactions: {
        Row: CoinTransactionRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      lesson_question_stats: {
        Row: LessonQuestionStatsRow;
        Relationships: [];
      };
      subject_overview: {
        Row: SubjectOverviewRow;
        Relationships: [];
      };
    };
    Functions: {
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      complete_onboarding: {
        Args: {
          p_username: string;
          p_display_name: string;
          p_avatar_key: string;
          p_daily_goal: number;
          p_timezone: string;
        };
        Returns: ProfileRow;
      };
      start_lesson: {
        Args: { p_node_id: string };
        Returns: Json;
      };
      submit_attempt_answer: {
        Args: { p_attempt_id: string; p_question_id: string; p_answer: Json };
        Returns: Json;
      };
      complete_lesson_attempt: {
        Args: { p_attempt_id: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      subject_status: SubjectStatus;
      difficulty_band: DifficultyBand;
      lesson_kind: LessonKind;
      node_kind: NodeKind;
      node_progress_status: NodeProgressStatus;
      question_type: QuestionType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
