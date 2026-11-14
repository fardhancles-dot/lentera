import type { AppRole, Json } from './database';

export interface AdminContext {
  role: AppRole;
  isDeveloper: boolean;
  permissions: string[];
  catalog: Array<{ code: string; label: string; group: string; sortOrder: number }>;
}

export interface AdminOverview {
  players: { total: number; onboarded: number; staff: number; new7d: number };
  activity: {
    lessonsCompleted: number;
    practicesCompleted: number;
    xpAwarded: number;
    coinsCirculating: number;
    activeStreaks: number;
  };
  content: { subjects: number; lessons: number; questions: number; nodes: number };
  auditEntries: number;
  daily: Array<{ date: string; users: number; lessons: number; practices: number; xp: number }>;
  warnings: Array<{ code: string; label: string; count: number }>;
  drafts: Record<string, number>;
}

export interface CurriculumLesson {
  id: string;
  unitId?: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  heartsEnabled: boolean;
  sortOrder: number;
  isPublished: boolean;
  questionCount: number;
  nodes: Array<Record<string, unknown>>;
}

export interface CurriculumUnit {
  id: string;
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  rewardCoins: number;
  sortOrder: number;
  isPublished: boolean;
  lessons: CurriculumLesson[];
  nodes: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    nodeType: string;
    lessonId: string | null;
    lessonTitle: string | null;
    questionId: string | null;
    levelNumber: number | null;
    questionPrompt: string | null;
    questionActive: boolean | null;
    sortOrder: number;
    isActive: boolean;
    rewardCoins: number;
    rewardXp: number;
  }>;
}

export interface CurriculumLevel {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  sortOrder: number;
  isPublished: boolean;
  units: CurriculumUnit[];
}

export interface CurriculumCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  iconKey: string;
  sortOrder: number;
  isPublished: boolean;
  levels: CurriculumLevel[];
}

export interface CurriculumSubject {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description: string;
  category: string;
  iconKey: string;
  iconUrl: string | null;
  accentColor: string;
  status: string;
  isPrimary: boolean;
  sortOrder: number;
  courses: CurriculumCourse[];
}

export interface AdminSubjectCategory {
  id: string;
  slug: string;
  name: string;
  status: string;
  learnCategory: string;
}

export interface AdminLearningSection {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  startLevel: number;
  endLevel: number;
  isActive: boolean;
}

export interface AdminQuestionListItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  subjectId: string;
  subjectName: string;
  nodeId: string | null;
  levelNumber: number | null;
  levelActive: boolean;
  attemptCount: number;
  type: string;
  topic: string;
  difficulty: string;
  prompt: string;
  points: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminQuestion extends AdminQuestionListItem {
  slug: string;
  instruction: string;
  explanation: string;
  hint: string | null;
  scene: Record<string, unknown>;
  options: Array<{ id: string; label: string; isCorrect: boolean; sortOrder: number }>;
  answers: Array<{ id: string; answer: string; isCaseSensitive: boolean }>;
  pairs: Array<{ leftId: string; left: string; rightId: string; right: string; sortOrder: number }>;
  media: Array<{ id: string; kind: string; url: string; alt: string; sortOrder: number }>;
}

export interface AdminPageResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface AdminUser {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  avatarKey: string;
  role: AppRole;
  onboardingCompleted: boolean;
  totalXp: number;
  coins: number;
  joinedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  bio: string;
  level: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  longestStreak: number;
  lessonsCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  achievements: number;
  friendCount: number;
  recentXp: Array<{ amount: number; source: string; createdAt: string }>;
  recentCoins: Array<{ amount: number; source: string; createdAt: string }>;
  settings: Record<string, unknown>;
}

export interface AdminAnalytics {
  days: number;
  totals: Record<string, number>;
  daily: Array<Record<string, number | string>>;
  topLessons: Array<{
    lessonId: string;
    title: string;
    attempts: number;
    passed: number;
    accuracy: number;
  }>;
}

export interface AdminMediaItem {
  id: string;
  storagePath: string;
  url: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  status: string;
  createdAt: string;
}

export interface AdminSiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  copyright: string;
  supportUrl: string;
  primaryColor: string;
  faviconUrl: string;
  logoUrl: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  footerText: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  updatedAt: string;
}

export interface AdminContentPage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  blocks: Array<Record<string, unknown>>;
  status: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  link: string;
  audience: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminGamification {
  quests: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  shopItems: Array<Record<string, unknown>>;
  playerLevels: Array<Record<string, unknown>>;
  streakMilestones: Array<Record<string, unknown>>;
  leagueTiers: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  heartSettings: Record<string, unknown>;
}

export interface AdminSocialLink {
  id: string;
  status: string;
  requesterId: string;
  requesterUsername: string;
  requesterName: string;
  addresseeId: string;
  addresseeUsername: string;
  addresseeName: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface AdminFriendQuest {
  id: string;
  code: string;
  title: string;
  status: string;
  targetXp: number;
  rewardXp: number;
  rewardCoins: number;
  memberCount: number;
  totalXp: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Json;
  createdAt: string;
}

export interface AdminContentHealth {
  publishedLessonsWithoutQuestions: Array<{ id: string; title: string }>;
  nodesWithoutLesson: Array<{ id: string; title: string }>;
  rewardNodesWithoutValue: Array<{ id: string; title: string }>;
  levelsWithoutUnits: Array<{ id: string; title: string }>;
  archivedQuestions: number;
  archivedMedia: number;
}
