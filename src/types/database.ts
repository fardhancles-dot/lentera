export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'player' | 'admin' | 'developer';
export type ProfileVisibility = 'public' | 'friends' | 'private';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined';
export type LeagueOutcome = 'promoted' | 'stayed' | 'demoted';
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
  profile_visibility: ProfileVisibility;
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
  reward_coins: number;
  reward_xp: number;
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

export type UserQuestionMasteryRow = {
  user_id: string;
  question_id: string;
  attempts: number;
  correct_count: number;
  correct_streak: number;
  mastery_level: number;
  interval_days: number;
  last_answered_at: string;
  next_review_at: string;
  updated_at: string;
};

export type UserRewardClaimRow = {
  id: string;
  user_id: string;
  node_id: string;
  coins: number;
  xp: number;
  claimed_at: string;
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
  reward_claim_id: string | null;
  reference_id: string | null;
  created_at: string;
};

export type CoinTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  lesson_attempt_id: string | null;
  reference_id: string | null;
  reward_claim_id: string | null;
  created_at: string;
};

export type PlayerLevelRow = {
  level: number;
  title: string;
  xp_required: number;
  reward_coins: number;
  created_at: string;
  updated_at: string;
};

export type UserLevelRewardRow = {
  user_id: string;
  level: number;
  coins: number;
  awarded_at: string;
};

export type StreakMilestoneRow = {
  days: number;
  title: string;
  reward_coins: number;
  icon: string;
  sort_order: number;
};

export type UserStreakMilestoneRow = {
  user_id: string;
  days: number;
  coins: number;
  awarded_at: string;
};

export type QuestDefinitionRow = {
  id: string;
  code: string;
  cadence: 'daily' | 'weekly';
  metric: 'xp' | 'lesson' | 'practice';
  target: number;
  reward_coins: number;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type UserQuestClaimRow = {
  id: string;
  user_id: string;
  quest_id: string;
  period_start: string;
  coins: number;
  claimed_at: string;
};

export type AchievementDefinitionRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  metric: 'xp' | 'lesson' | 'practice' | 'streak' | 'level';
  target: number;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type UserAchievementRow = {
  user_id: string;
  achievement_id: string;
  awarded_at: string;
};

export type ShopItemRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: 'heart_potion' | 'streak_freeze';
  price_coins: number;
  max_stack: number;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type UserInventoryRow = {
  user_id: string;
  item_id: string;
  quantity: number;
  updated_at: string;
};

export type ShopPurchaseRow = {
  id: string;
  user_id: string;
  item_id: string;
  price_coins: number;
  created_at: string;
};

export type UserHeartsRow = {
  user_id: string;
  current_hearts: number;
  max_hearts: number;
  last_refill_at: string;
  updated_at: string;
};

export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  created_at: string;
  read_at: string | null;
};

export type LeagueTierRow = {
  tier: number;
  name: string;
  accent: string;
  sort_order: number;
};

export type LeagueGroupRow = {
  id: string;
  tier: number;
  week_start: string;
  created_at: string;
  finalized_at: string | null;
};

export type LeagueMemberRow = {
  group_id: string;
  user_id: string;
  week_start: string;
  weekly_xp: number;
  joined_at: string;
};

export type LeagueResultRow = {
  user_id: string;
  week_start: string;
  tier: number;
  rank: number;
  member_count: number;
  outcome: LeagueOutcome;
  next_tier: number;
  reward_coins: number;
  reward_xp: number;
  claimed_at: string | null;
  created_at: string;
};

export type GameEventRow = {
  id: string;
  week_start: string;
  title: string;
  description: string;
  target_xp: number;
  reward_coins: number;
  reward_xp: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

export type UserEventClaimRow = {
  user_id: string;
  event_id: string;
  coins: number;
  xp: number;
  claimed_at: string;
};

export type UserStreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  freezes: number;
  last_activity_date: string | null;
  last_activity_at: string | null;
  updated_at: string;
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
          profile_visibility?: ProfileVisibility;
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
          profile_visibility?: ProfileVisibility;
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
      user_question_mastery: {
        Row: UserQuestionMasteryRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_reward_claims: {
        Row: UserRewardClaimRow;
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
      player_levels: {
        Row: PlayerLevelRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      league_tiers: {
        Row: LeagueTierRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      league_groups: {
        Row: LeagueGroupRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      league_members: {
        Row: LeagueMemberRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      league_results: {
        Row: LeagueResultRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      game_events: {
        Row: GameEventRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_event_claims: {
        Row: UserEventClaimRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_hearts: {
        Row: UserHeartsRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_streaks: {
        Row: UserStreakRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_level_rewards: {
        Row: UserLevelRewardRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      streak_milestones: {
        Row: StreakMilestoneRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_streak_milestones: {
        Row: UserStreakMilestoneRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      quest_definitions: {
        Row: QuestDefinitionRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_quest_claims: {
        Row: UserQuestClaimRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      achievement_definitions: {
        Row: AchievementDefinitionRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_achievements: {
        Row: UserAchievementRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      shop_items: {
        Row: ShopItemRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_inventory: {
        Row: UserInventoryRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      shop_purchases: {
        Row: ShopPurchaseRow;
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
      start_practice: {
        Args: { p_mode: string; p_course_id: string; p_unit_id?: string | null };
        Returns: Json;
      };
      submit_practice_answer: {
        Args: {
          p_session_id: string;
          p_question_id: string;
          p_answer: Json;
          p_elapsed_ms?: number;
        };
        Returns: Json;
      };
      complete_practice_session: {
        Args: { p_session_id: string };
        Returns: Json;
      };
      create_friend_quest: {
        Args: {
          p_title: string;
          p_target_xp: number;
          p_reward_xp?: number;
          p_reward_coins?: number;
        };
        Returns: Json;
      };
      join_friend_quest: {
        Args: { p_code: string };
        Returns: Json;
      };
      get_my_friend_quests: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      claim_friend_quest_reward: {
        Args: { p_quest_id: string };
        Returns: Json;
      };
      get_player_state: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_my_wallet: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      refill_hearts: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_my_quests: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      claim_quest_reward: {
        Args: { p_quest_id: string };
        Returns: Json;
      };
      get_my_achievements: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_shop_catalog: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      purchase_shop_item: {
        Args: { p_item_id: string };
        Returns: Json;
      };
      get_my_inventory: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      use_inventory_item: {
        Args: { p_item_id: string };
        Returns: Json;
      };
      get_my_mastery: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      start_scheduled_review: {
        Args: { p_course_id: string };
        Returns: Json;
      };
      claim_reward_node: {
        Args: { p_node_id: string };
        Returns: Json;
      };
      search_players: {
        Args: { p_query: string };
        Returns: Json;
      };
      send_friend_request: {
        Args: { p_username: string };
        Returns: Json;
      };
      respond_friend_request: {
        Args: { p_request_id: string; p_accept: boolean };
        Returns: Json;
      };
      remove_friend: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_my_friends: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_friend_profile: {
        Args: { p_username: string };
        Returns: Json;
      };
      get_friend_activity: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      get_leaderboard: {
        Args: { p_scope?: string };
        Returns: Json;
      };
      get_my_league: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      claim_league_reward: {
        Args: { p_week_start: string };
        Returns: Json;
      };
      get_active_event: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      claim_event_reward: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_my_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      mark_notifications_read: {
        Args: { p_id?: string | null };
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
