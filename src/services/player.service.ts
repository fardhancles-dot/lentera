import { playerRepository } from '../repositories/player.repository';
import type { Json } from '../types/database';
import type {
  PlayerHearts,
  PlayerLevel,
  PlayerState,
  PlayerStreak,
  PlayerWallet,
  RefillOutcome,
  WalletTransaction,
} from '../types/player';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melihat progres.',
  not_enough_coins: 'Koin kamu belum cukup untuk mengisi Hearts.',
  hearts_empty: 'Hearts habis. Isi Hearts atau tunggu pemulihan otomatis.',
};

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

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHearts(value: unknown): PlayerHearts {
  const record = asRecord(value);
  const max = Math.max(0, asNumber(record.max, 5));
  const current = clamp(asNumber(record.current, max), 0, max || 5);

  return {
    current,
    max: max || 5,
    nextRefillSeconds: Math.max(0, asNumber(record.nextRefillSeconds)),
    regenMinutes: Math.max(1, asNumber(record.regenMinutes, 30)),
    refillCostCoins: Math.max(0, asNumber(record.refillCostCoins, (max - current) * 10)),
  };
}

function parseStreak(value: unknown): PlayerStreak {
  const record = asRecord(value);
  const lastActivityDate = record.lastActivityDate;

  return {
    current: Math.max(0, asNumber(record.current)),
    longest: Math.max(0, asNumber(record.longest)),
    lastActivityDate: typeof lastActivityDate === 'string' ? lastActivityDate : null,
    todayDate: asString(record.todayDate),
    activityDays: asStringArray(record.activityDays),
  };
}

function parseLevel(value: unknown): PlayerLevel {
  const record = asRecord(value);

  return {
    level: Math.max(1, asNumber(record.level, 1)),
    title: asString(record.title, 'Pemula'),
    xpRequired: Math.max(0, asNumber(record.xpRequired)),
    nextLevelXp: asNullableNumber(record.nextLevelXp),
    xpToNext: Math.max(0, asNumber(record.xpToNext)),
    progressPercent: clamp(asNumber(record.progressPercent), 0, 100),
  };
}

export function parsePlayerState(value: unknown): PlayerState {
  const record = asRecord(value);

  return {
    totalXp: Math.max(0, asNumber(record.totalXp)),
    todayXp: Math.max(0, asNumber(record.todayXp)),
    coins: Math.max(0, asNumber(record.coins)),
    hearts: parseHearts(record.hearts),
    streak: parseStreak(record.streak),
    level: parseLevel(record.level),
  };
}

function parseTransaction(value: unknown): WalletTransaction {
  const record = asRecord(value);

  return {
    id: asString(record.id),
    amount: asNumber(record.amount),
    source: asString(record.source, 'lainnya'),
    createdAt: asString(record.createdAt),
  };
}

function parseTransactions(value: unknown): WalletTransaction[] {
  return Array.isArray(value) ? value.map(parseTransaction).filter((item) => Boolean(item.id)) : [];
}

export function parsePlayerWallet(value: unknown): PlayerWallet {
  const record = asRecord(value);

  return {
    ...parsePlayerState(record),
    transactions: parseTransactions(record.transactions),
    xpTransactions: parseTransactions(record.xpTransactions),
  };
}

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Data progres gagal dimuat.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key] : raw);
}

export const playerService = {
  async loadState(): Promise<PlayerState> {
    try {
      return parsePlayerState(await playerRepository.fetchState());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async loadWallet(): Promise<PlayerWallet> {
    try {
      return parsePlayerWallet(await playerRepository.fetchWallet());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async refillHearts(): Promise<RefillOutcome> {
    try {
      const payload: Json = await playerRepository.refillHearts();
      const record = asRecord(payload);

      return {
        state: parsePlayerState(record),
        alreadyFull: record.alreadyFull === true,
        coinsSpent: Math.max(0, asNumber(record.coinsSpent)),
        heartsRestored: Math.max(0, asNumber(record.heartsRestored)),
      };
    } catch (error) {
      throw messageFor(error);
    }
  },
};
