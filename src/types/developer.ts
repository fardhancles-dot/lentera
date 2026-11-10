import type { AppRole, Json } from './database';

export interface DeveloperOverview {
  generatedAt: string;
  players: {
    total: number;
    onboarded: number;
    staff: number;
    new7d: number;
  };
  activity: {
    lessonsCompleted: number;
    practicesCompleted: number;
    xpAwarded: number;
    coinsCirculating: number;
    activeStreaks: number;
  };
  content: {
    subjects: number;
    lessons: number;
    questions: number;
    nodes: number;
  };
  auditEntries: number;
}

export interface DeveloperUser {
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

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorRole: AppRole;
  actorName: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Json;
  createdAt: string;
}

export interface RewardGrantResult {
  userId: string;
  coinsAwarded: number;
  xpAwarded: number;
  totalCoins: number;
  totalXp: number;
  reference: string;
}

export interface BroadcastResult {
  recipients: number;
  title: string;
}
