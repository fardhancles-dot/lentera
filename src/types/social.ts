export type FriendRelation = 'friend' | 'incoming' | 'outgoing' | 'none';

export interface FriendSummary {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  avatarUrl: string | null;
  bio: string;
  weeklyXp: number;
  totalXp: number;
  level: number;
  friendStreak: number;
  since: string | null;
}

export interface FriendRequestSummary {
  requestId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  createdAt: string;
}

export interface FriendsPayload {
  friends: FriendSummary[];
  incoming: FriendRequestSummary[];
  outgoing: FriendRequestSummary[];
}

export interface PlayerSearchResult {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  avatarUrl: string | null;
  bio: string;
  relation: FriendRelation;
  isFollowing: boolean;
  isFriend: boolean;
  requestId: string | null;
}

export interface FollowUserSummary {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  avatarUrl: string | null;
  bio?: string;
  followedAt: string;
  isFollowing: boolean;
  isFriend: boolean;
}

export interface FollowSuggestion {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  avatarUrl: string | null;
  bio: string;
}

export interface FollowListPayload {
  private: boolean;
  items: FollowUserSummary[];
  followersCount: number;
  followingCount: number;
}

export interface FollowActionResult {
  userId: string;
  username: string;
  isFollowing: boolean;
  isFriend: boolean;
  followersCount: number;
  followingCount: number;
}

export interface FriendProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  avatarUrl: string | null;
  bio: string;
  isSelf: boolean;
  isFriend: boolean;
  isFollowing: boolean;
  followsYou: boolean;
  followersCount: number;
  followingCount: number;
  followingPrivate: boolean;
  statsVisible: boolean;
  relation: FriendRelation;
  requestId: string | null;
  totalXp: number | null;
  weeklyXp: number | null;
  level: number | null;
  levelTitle: string | null;
  levelProgressPercent: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
  completedLessons: number | null;
  achievements: number | null;
  visibility: 'public' | 'friends' | 'private';
}

export interface ActivityItem {
  kind: 'xp' | 'achievement';
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  amount: number;
  label: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  weeklyXp: number;
  isViewer: boolean;
  isFriend: boolean;
}

export interface LeaderboardPayload {
  scope: 'global' | 'friends';
  weekStart: string;
  entries: LeaderboardEntry[];
  viewer: {
    rank: number;
    weeklyXp: number;
    displayName: string;
    username: string;
  } | null;
}

export interface LeagueMemberSummary {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  weeklyXp: number;
  isViewer: boolean;
}

export type LeagueOutcome = 'promoted' | 'stayed' | 'demoted';

export interface LeagueResultSummary {
  weekStart: string;
  tier: number;
  tierName?: string;
  rank: number;
  memberCount: number;
  outcome: LeagueOutcome;
  nextTier: number;
  rewardCoins: number;
  claimed: boolean;
}

export interface LeaguePayload {
  weekStart: string;
  endsAt: string;
  groupId: string;
  tier: number;
  tierName: string;
  accent: string;
  rank: number;
  memberCount: number;
  promotionCount: number;
  demotionCount: number;
  weeklyXp: number;
  canClaimReward: boolean;
  previousResult: LeagueResultSummary | null;
  members: LeagueMemberSummary[];
  history: LeagueResultSummary[];
}

export interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  targetXp: number;
  rewardCoins: number;
  startsAt: string;
  endsAt: string;
  progress: number;
  weeklyXp: number;
  claimed: boolean;
  canClaim: boolean;
}

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPayload {
  unreadCount: number;
  items: NotificationItem[];
}

export interface NotificationIndicators {
  notifications: number;
  inbox: number;
  quests: number;
  achievements: number;
  learnRewards: number;
  league: number;
  friends: number;
}

