import { developerRepository } from '../repositories/developer.repository';
import type { AppRole, Json } from '../types/database';
import type {
  AuditLogEntry,
  BroadcastResult,
  DeveloperOverview,
  DeveloperUser,
  RewardGrantResult,
} from '../types/developer';

const ERROR_MESSAGES: Record<string, string> = {
  staff_required: 'Halaman ini hanya untuk developer atau admin.',
  player_not_found: 'Pemain tidak ditemukan.',
  reward_coins_invalid: 'Koin harus antara 0 dan 10.000.',
  reward_xp_invalid: 'XP harus antara 0 dan 100.000.',
  reward_empty: 'Isi minimal satu hadiah: Koin atau XP.',
  reward_reason_invalid: 'Alasan harus 3–160 karakter.',
  broadcast_title_invalid: 'Judul broadcast harus 3–80 karakter.',
  broadcast_body_invalid: 'Isi broadcast maksimal 300 karakter.',
  broadcast_link_invalid: 'Tautan harus berupa path internal yang diawali /.',
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Aksi developer gagal.';
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

function asRole(value: unknown): AppRole {
  return value === 'admin' || value === 'developer' ? value : 'player';
}

function asJson(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => asJson(item));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, asJson(item)]),
    );
  }
  return {};
}

function parseOverview(value: Json): DeveloperOverview {
  const record = asRecord(value);
  const players = asRecord(record.players);
  const activity = asRecord(record.activity);
  const content = asRecord(record.content);
  return {
    generatedAt: asString(record.generatedAt),
    players: {
      total: Math.max(0, asNumber(players.total)),
      onboarded: Math.max(0, asNumber(players.onboarded)),
      staff: Math.max(0, asNumber(players.staff)),
      new7d: Math.max(0, asNumber(players.new7d)),
    },
    activity: {
      lessonsCompleted: Math.max(0, asNumber(activity.lessonsCompleted)),
      practicesCompleted: Math.max(0, asNumber(activity.practicesCompleted)),
      xpAwarded: Math.max(0, asNumber(activity.xpAwarded)),
      coinsCirculating: Math.max(0, asNumber(activity.coinsCirculating)),
      activeStreaks: Math.max(0, asNumber(activity.activeStreaks)),
    },
    content: {
      subjects: Math.max(0, asNumber(content.subjects)),
      lessons: Math.max(0, asNumber(content.lessons)),
      questions: Math.max(0, asNumber(content.questions)),
      nodes: Math.max(0, asNumber(content.nodes)),
    },
    auditEntries: Math.max(0, asNumber(record.auditEntries)),
  };
}

function parseUser(value: unknown): DeveloperUser {
  const record = asRecord(value);
  return {
    userId: asString(record.userId),
    email: asString(record.email),
    username: asString(record.username, 'pemain'),
    displayName: asString(record.displayName, 'Pemain'),
    avatarKey: asString(record.avatarKey, 'sprout'),
    role: asRole(record.role),
    onboardingCompleted: asBoolean(record.onboardingCompleted),
    totalXp: Math.max(0, asNumber(record.totalXp)),
    coins: Math.max(0, asNumber(record.coins)),
    joinedAt: asString(record.joinedAt),
  };
}

function parseAudit(value: unknown): AuditLogEntry {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    actorId: typeof record.actorId === 'string' ? record.actorId : null,
    actorRole: asRole(record.actorRole),
    actorName: asString(record.actorName, 'Sistem'),
    actorUsername: asString(record.actorUsername),
    action: asString(record.action, 'unknown'),
    targetType: asString(record.targetType, 'system'),
    targetId: typeof record.targetId === 'string' ? record.targetId : null,
    details: asJson(record.details),
    createdAt: asString(record.createdAt),
  };
}

async function run<T>(task: () => Promise<Json>, parse: (value: Json) => T): Promise<T> {
  try {
    return parse(await task());
  } catch (error) {
    throw messageFor(error);
  }
}

export const developerService = {
  getOverview(): Promise<DeveloperOverview> {
    return run(() => developerRepository.getOverview(), parseOverview);
  },

  getUsers(query: string): Promise<DeveloperUser[]> {
    return run(() => developerRepository.getUsers(query.trim()), (value) =>
      asArray(value).map(parseUser),
    );
  },

  getAuditLogs(limit = 30): Promise<AuditLogEntry[]> {
    return run(() => developerRepository.getAuditLogs(limit), (value) =>
      asArray(value).map(parseAudit),
    );
  },

  async grantReward(
    userId: string,
    coins: number,
    xp: number,
    reason: string,
  ): Promise<RewardGrantResult> {
    try {
      const record = asRecord(
        await developerRepository.grantReward(userId, coins, xp, reason),
      );
      return {
        userId: asString(record.userId),
        coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
        xpAwarded: Math.max(0, asNumber(record.xpAwarded)),
        totalCoins: Math.max(0, asNumber(record.totalCoins)),
        totalXp: Math.max(0, asNumber(record.totalXp)),
        reference: asString(record.reference),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },

  async broadcast(title: string, body: string, link: string): Promise<BroadcastResult> {
    try {
      const record = asRecord(
        await developerRepository.broadcastNotification(title, body, link),
      );
      return {
        recipients: Math.max(0, asNumber(record.recipients)),
        title: asString(record.title),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },
};
