import { friendsQuestRepository } from '../repositories/friendsQuest.repository';
import type { Json } from '../types/database';

export type FriendQuestStatus = 'active' | 'completed' | 'expired';

export interface FriendQuestMember {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string;
  contributionXp: number;
  isCreator: boolean;
}

export interface FriendQuest {
  id: string;
  code: string;
  title: string;
  description: string;
  targetXp: number;
  rewardXp: number;
  rewardCoins: number;
  status: FriendQuestStatus;
  maxMembers: number;
  memberCount: number;
  totalXp: number;
  progressPercent: number;
  viewerContribution: number;
  viewerClaimed: boolean;
  canClaim: boolean;
  isCreator: boolean;
  startsAt: string;
  endsAt: string;
  members: FriendQuestMember[];
}

export interface FriendQuestClaim extends FriendQuest {
  alreadyClaimed: boolean;
  xpAwarded: number;
  coinsAwarded: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  friend_quest_invalid_title: 'Judul quest harus terdiri dari 3–80 karakter.',
  friend_quest_invalid_target: 'Target XP harus antara 20 dan 10.000.',
  friend_quest_invalid_reward: 'Hadiah XP dan Koin harus antara 0 dan 1.000.',
  friend_quest_limit: 'Kamu sudah mengikuti 3 quest aktif. Selesaikan salah satu terlebih dahulu.',
  friend_quest_not_found: 'Kode quest tidak ditemukan. Periksa kembali kode dari temanmu.',
  friend_quest_closed: 'Quest ini sudah selesai atau kedaluwarsa.',
  friend_quest_full: 'Quest ini sudah penuh.',
  friend_quest_not_member: 'Kamu bukan anggota quest ini.',
  friend_quest_not_complete: 'Quest belum mencapai target gabungan.',
  friend_quest_expired: 'Quest sudah kedaluwarsa dan hadiah tidak dapat diklaim.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Friends Quest gagal dimuat.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key]! : raw);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function parseMember(value: unknown): FriendQuestMember {
  const record = asRecord(value);
  return {
    userId: asString(record.userId),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    contributionXp: Math.max(0, asNumber(record.contributionXp)),
    isCreator: asBoolean(record.isCreator),
  };
}

function parseQuest(value: unknown): FriendQuest {
  const record = asRecord(value);
  const status = asString(record.status, 'active');
  return {
    id: asString(record.id),
    code: asString(record.code),
    title: asString(record.title, 'Friends Quest'),
    description: asString(record.description),
    targetXp: Math.max(1, asNumber(record.targetXp, 1)),
    rewardXp: Math.max(0, asNumber(record.rewardXp)),
    rewardCoins: Math.max(0, asNumber(record.rewardCoins)),
    status: status === 'completed' || status === 'expired' ? status : 'active',
    maxMembers: Math.max(2, asNumber(record.maxMembers, 8)),
    memberCount: Math.max(0, asNumber(record.memberCount)),
    totalXp: Math.max(0, asNumber(record.totalXp)),
    progressPercent: Math.min(100, Math.max(0, asNumber(record.progressPercent))),
    viewerContribution: Math.max(0, asNumber(record.viewerContribution)),
    viewerClaimed: asBoolean(record.viewerClaimed),
    canClaim: asBoolean(record.canClaim),
    isCreator: asBoolean(record.isCreator),
    startsAt: asString(record.startsAt),
    endsAt: asString(record.endsAt),
    members: Array.isArray(record.members) ? record.members.map(parseMember) : [],
  };
}

function parseList(payload: Json): FriendQuest[] {
  return Array.isArray(payload) ? payload.map(parseQuest) : [];
}

function parseClaim(payload: Json): FriendQuestClaim {
  const quest = parseQuest(payload);
  const record = asRecord(payload);
  return {
    ...quest,
    alreadyClaimed: asBoolean(record.alreadyClaimed),
    xpAwarded: Math.max(0, asNumber(record.xpAwarded)),
    coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
  };
}

export const friendsQuestService = {
  async list(): Promise<FriendQuest[]> {
    try {
      return parseList(await friendsQuestRepository.list());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async create(
    title: string,
    targetXp: number,
    rewardXp: number,
    rewardCoins: number,
  ): Promise<FriendQuest> {
    try {
      return parseQuest(
        await friendsQuestRepository.create(title, targetXp, rewardXp, rewardCoins),
      );
    } catch (error) {
      throw messageFor(error);
    }
  },

  async join(code: string): Promise<FriendQuest> {
    try {
      return parseQuest(await friendsQuestRepository.join(code));
    } catch (error) {
      throw messageFor(error);
    }
  },

  async claim(questId: string): Promise<FriendQuestClaim> {
    try {
      return parseClaim(await friendsQuestRepository.claim(questId));
    } catch (error) {
      throw messageFor(error);
    }
  },
};
