import { socialRepository, type PlayerLevelThreshold } from '../repositories/social.repository';
import type { Json } from '../types/database';
import type {
  ActiveEvent,
  ActivityItem,
  FriendProfile,
  FriendRequestSummary,
  FriendSummary,
  FriendsPayload,
  LeaderboardEntry,
  LeaderboardPayload,
  LeagueMemberSummary,
  LeaguePayload,
  LeagueResultSummary,
  NotificationItem,
  NotificationsPayload,
  PlayerSearchResult,
} from '../types/social';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  search_query_too_short: 'Ketik minimal dua karakter untuk mencari pemain.',
  player_not_found: 'Pemain tidak ditemukan.',
  friend_self: 'Kamu tidak dapat berteman dengan dirimu sendiri.',
  already_friends: 'Kamu sudah berteman dengan pemain ini.',
  friend_request_pending: 'Permintaan pertemanan sudah dikirim. Tunggu jawabannya.',
  friend_request_incoming: 'Pemain ini sudah mengirim permintaan. Buka daftar permintaan.',
  friend_request_not_found: 'Permintaan pertemanan tidak ditemukan.',
  friend_request_forbidden: 'Permintaan ini bukan untukmu.',
  friend_request_closed: 'Permintaan ini sudah dijawab.',
  league_result_not_found: 'Hasil liga untuk minggu itu tidak ditemukan.',
  event_not_complete: 'Target event belum tercapai.',
  leaderboard_scope_invalid: 'Jenis leaderboard tidak dikenali.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Permintaan sosial gagal.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key]! : raw);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asRelation(value: unknown): PlayerSearchResult['relation'] {
  return value === 'friend' || value === 'incoming' || value === 'outgoing' ? value : 'none';
}

function asVisibility(value: unknown): FriendProfile['visibility'] {
  return value === 'public' || value === 'private' ? value : 'friends';
}

function asOutcome(value: unknown): LeagueResultSummary['outcome'] {
  return value === 'promoted' || value === 'demoted' ? value : 'stayed';
}

function parseFriend(value: unknown): FriendSummary {
  const record = asRecord(value);
  return {
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    bio: asString(record.bio),
    weeklyXp: Math.max(0, asNumber(record.weeklyXp)),
    totalXp: Math.max(0, asNumber(record.totalXp)),
    level: Math.max(1, asNumber(record.level, 1)),
    friendStreak: Math.max(0, asNumber(record.friendStreak)),
    since: typeof record.since === 'string' ? record.since : null,
  };
}

function parseRequest(value: unknown): FriendRequestSummary {
  const record = asRecord(value);
  return {
    requestId: asString(record.requestId),
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    createdAt: asString(record.createdAt),
  };
}

function parseFriends(value: Json): FriendsPayload {
  const record = asRecord(value);
  return {
    friends: asArray(record.friends).map(parseFriend),
    incoming: asArray(record.incoming).map(parseRequest),
    outgoing: asArray(record.outgoing).map(parseRequest),
  };
}

function parseSearch(value: Json): PlayerSearchResult[] {
  return asArray(value).map((item) => {
    const record = asRecord(item);
    return {
      userId: asString(record.userId),
      username: asString(record.username, 'pemain'),
      displayName: asString(record.displayName, 'Pemain'),
      avatarKey: asString(record.avatarKey, 'sprout'),
      bio: asString(record.bio),
      relation: asRelation(record.relation),
      requestId: typeof record.requestId === 'string' ? record.requestId : null,
    };
  });
}

function parseProfile(value: Json): FriendProfile {
  const record = asRecord(value);
  const nullableNumber = (input: unknown): number | null => {
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    if (typeof input === 'string' && input.trim() !== '') {
      const parsed = Number(input);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  return {
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    bio: asString(record.bio),
    isSelf: asBoolean(record.isSelf),
    isFriend: asBoolean(record.isFriend),
    statsVisible: asBoolean(record.statsVisible),
    relation: asRelation(record.relation),
    requestId: typeof record.requestId === 'string' ? record.requestId : null,
    totalXp: nullableNumber(record.totalXp),
    weeklyXp: nullableNumber(record.weeklyXp),
    level: nullableNumber(record.level),
    levelTitle: typeof record.levelTitle === 'string' ? record.levelTitle : null,
    levelProgressPercent: nullableNumber(record.levelProgressPercent),
    currentStreak: nullableNumber(record.currentStreak),
    longestStreak: nullableNumber(record.longestStreak),
    completedLessons: nullableNumber(record.completedLessons),
    achievements: nullableNumber(record.achievements),
    visibility: asVisibility(record.visibility),
  };
}

function parseActivity(value: Json): ActivityItem[] {
  return asArray(value).map((item) => {
    const record = asRecord(item);
    return {
      kind: record.kind === 'achievement' ? 'achievement' : 'xp',
      userId: asString(record.userId),
      username: asString(record.username, 'pemain'),
      displayName: asString(record.displayName, 'Pemain'),
      avatarKey: asString(record.avatarKey, 'sprout'),
      amount: Math.max(0, asNumber(record.amount)),
      label: asString(record.label, 'belajar'),
      createdAt: asString(record.createdAt),
    };
  });
}

function parseLeaderboardEntry(value: unknown): LeaderboardEntry {
  const record = asRecord(value);
  return {
    rank: Math.max(1, asNumber(record.rank, 1)),
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    weeklyXp: Math.max(0, asNumber(record.weeklyXp)),
    isViewer: asBoolean(record.isViewer),
    isFriend: asBoolean(record.isFriend),
  };
}

function parseLeaderboard(value: Json): LeaderboardPayload {
  const record = asRecord(value);
  const viewer = asRecord(record.viewer);
  return {
    scope: record.scope === 'friends' ? 'friends' : 'global',
    weekStart: asString(record.weekStart),
    entries: asArray(record.entries).map(parseLeaderboardEntry),
    viewer:
      typeof viewer.rank === 'number'
        ? {
            rank: asNumber(viewer.rank, 1),
            weeklyXp: Math.max(0, asNumber(viewer.weeklyXp)),
            displayName: asString(viewer.displayName, 'Kamu'),
            username: asString(viewer.username, 'kamu'),
          }
        : null,
  };
}

function parseLeagueMember(value: unknown): LeagueMemberSummary {
  const record = asRecord(value);
  return {
    rank: Math.max(1, asNumber(record.rank, 1)),
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    weeklyXp: Math.max(0, asNumber(record.weeklyXp)),
    isViewer: asBoolean(record.isViewer),
  };
}

function parseLeagueResult(value: unknown): LeagueResultSummary {
  const record = asRecord(value);
  return {
    weekStart: asString(record.weekStart),
    tier: Math.max(1, asNumber(record.tier, 1)),
    tierName: typeof record.tierName === 'string' ? record.tierName : undefined,
    rank: Math.max(1, asNumber(record.rank, 1)),
    memberCount: Math.max(0, asNumber(record.memberCount)),
    outcome: asOutcome(record.outcome),
    nextTier: Math.max(1, asNumber(record.nextTier, 1)),
    rewardCoins: Math.max(0, asNumber(record.rewardCoins)),
    claimed: asBoolean(record.claimed),
  };
}

function parseLeague(value: Json): LeaguePayload {
  const record = asRecord(value);
  return {
    weekStart: asString(record.weekStart),
    endsAt: asString(record.endsAt),
    groupId: asString(record.groupId),
    tier: Math.max(1, asNumber(record.tier, 1)),
    tierName: asString(record.tierName, 'Benih'),
    accent: asString(record.accent, '#58CC02'),
    rank: Math.max(1, asNumber(record.rank, 1)),
    memberCount: Math.max(0, asNumber(record.memberCount)),
    promotionCount: Math.max(0, asNumber(record.promotionCount)),
    demotionCount: Math.max(0, asNumber(record.demotionCount)),
    weeklyXp: Math.max(0, asNumber(record.weeklyXp)),
    canClaimReward: asBoolean(record.canClaimReward),
    previousResult: record.previousResult ? parseLeagueResult(record.previousResult) : null,
    members: asArray(record.members).map(parseLeagueMember),
    history: asArray(record.history).map(parseLeagueResult),
  };
}

function parseEvent(value: Json): ActiveEvent {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    title: asString(record.title, 'Festival Lentera'),
    description: asString(record.description),
    targetXp: Math.max(1, asNumber(record.targetXp, 100)),
    rewardCoins: Math.max(0, asNumber(record.rewardCoins)),
    startsAt: asString(record.startsAt),
    endsAt: asString(record.endsAt),
    progress: Math.max(0, asNumber(record.progress)),
    weeklyXp: Math.max(0, asNumber(record.weeklyXp)),
    claimed: asBoolean(record.claimed),
    canClaim: asBoolean(record.canClaim),
  };
}

function parseNotifications(value: Json): NotificationsPayload {
  const record = asRecord(value);
  const items = asArray(record.items).map((item) => {
    const row = asRecord(item);
    return {
      id: asString(row.id),
      kind: asString(row.kind, 'info'),
      title: asString(row.title, 'Notifikasi'),
      body: asString(row.body),
      link: asString(row.link),
      read: asBoolean(row.read),
      createdAt: asString(row.createdAt),
    } satisfies NotificationItem;
  });
  return {
    unreadCount: Math.max(0, asNumber(record.unreadCount)),
    items,
  };
}

async function run<T>(task: () => Promise<Json>, parse: (value: Json) => T): Promise<T> {
  try {
    return parse(await task());
  } catch (error) {
    throw messageFor(error);
  }
}

let levelThresholdsPromise: Promise<PlayerLevelThreshold[]> | null = null;

function loadLevelThresholds(): Promise<PlayerLevelThreshold[]> {
  if (!levelThresholdsPromise) {
    levelThresholdsPromise = socialRepository.getLevelThresholds().catch((error: unknown) => {
      levelThresholdsPromise = null;
      throw error;
    });
  }
  return levelThresholdsPromise;
}

function progressPercentForXp(
  totalXp: number,
  thresholds: PlayerLevelThreshold[],
): number | null {
  if (thresholds.length === 0) return null;

  const current = [...thresholds]
    .reverse()
    .find((entry) => entry.xpRequired <= totalXp) ?? thresholds[0]!;
  const next = thresholds.find((entry) => entry.xpRequired > totalXp);

  if (!next) return 100;

  const span = next.xpRequired - current.xpRequired;
  if (span <= 0) return 0;

  const percent = Math.round(((totalXp - current.xpRequired) / span) * 100);
  return Math.min(100, Math.max(0, percent));
}

export const socialService = {
  searchPlayers(query: string): Promise<PlayerSearchResult[]> {
    return run(() => socialRepository.searchPlayers(query.trim()), parseSearch);
  },

  async sendFriendRequest(username: string): Promise<{ status: string; requestId: string }> {
    try {
      const record = asRecord(await socialRepository.sendFriendRequest(username));
      return {
        status: asString(record.status, 'pending'),
        requestId: asString(record.requestId),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },

  async respondFriendRequest(requestId: string, accept: boolean): Promise<string> {
    try {
      const record = asRecord(
        await socialRepository.respondFriendRequest(requestId, accept),
      );
      return asString(record.status, accept ? 'accepted' : 'declined');
    } catch (error) {
      throw messageFor(error);
    }
  },

  async removeFriend(userId: string): Promise<void> {
    try {
      await socialRepository.removeFriend(userId);
    } catch (error) {
      throw messageFor(error);
    }
  },

  getFriends(): Promise<FriendsPayload> {
    return run(() => socialRepository.getFriends(), parseFriends);
  },

  async getFriendProfile(username: string): Promise<FriendProfile> {
    const profile = await run(() => socialRepository.getFriendProfile(username), parseProfile);

    if (!profile.statsVisible || profile.totalXp === null) return profile;

    try {
      const thresholds = await loadLevelThresholds();
      return {
        ...profile,
        levelProgressPercent: progressPercentForXp(profile.totalXp, thresholds),
      };
    } catch {
      // The profile itself remains usable if the reference query fails.
      return profile;
    }
  },

  getFriendActivity(limit = 20): Promise<ActivityItem[]> {
    return run(() => socialRepository.getFriendActivity(limit), parseActivity);
  },

  getLeaderboard(scope: 'global' | 'friends'): Promise<LeaderboardPayload> {
    return run(() => socialRepository.getLeaderboard(scope), parseLeaderboard);
  },

  getMyLeague(): Promise<LeaguePayload> {
    return run(() => socialRepository.getMyLeague(), parseLeague);
  },

  async claimLeagueReward(
    weekStart: string,
  ): Promise<{ alreadyClaimed: boolean; coinsAwarded: number }> {
    try {
      const record = asRecord(await socialRepository.claimLeagueReward(weekStart));
      return {
        alreadyClaimed: asBoolean(record.alreadyClaimed),
        coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },

  getActiveEvent(): Promise<ActiveEvent> {
    return run(() => socialRepository.getActiveEvent(), parseEvent);
  },

  async claimEventReward(): Promise<{ alreadyClaimed: boolean; coinsAwarded: number }> {
    try {
      const record = asRecord(await socialRepository.claimEventReward());
      return {
        alreadyClaimed: asBoolean(record.alreadyClaimed),
        coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },

  getNotifications(): Promise<NotificationsPayload> {
    return run(() => socialRepository.getNotifications(), parseNotifications);
  },

  async markNotificationsRead(id?: string): Promise<number> {
    try {
      const record = asRecord(await socialRepository.markNotificationsRead(id));
      return Math.max(0, asNumber(record.updated));
    } catch (error) {
      throw messageFor(error);
    }
  },
};
