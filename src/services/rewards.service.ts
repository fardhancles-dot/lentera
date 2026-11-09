import { rewardsRepository } from '../repositories/rewards.repository';
import type {
  Achievement,
  AchievementBoard,
  AchievementMetric,
  Inventory,
  InventoryItem,
  PurchaseOutcome,
  Quest,
  RewardNodeClaim,
  QuestBoard,
  QuestCadence,
  QuestClaim,
  QuestMetric,
  ShopCatalog,
  ShopItem,
  ShopItemKind,
  UseItemOutcome,
} from '../types/rewards';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.',
  quest_not_found: 'Misi ini tidak tersedia lagi.',
  quest_not_complete: 'Misi belum selesai. Selesaikan targetnya terlebih dahulu.',
  shop_item_not_found: 'Item ini tidak tersedia di toko.',
  inventory_full: 'Stok item ini sudah penuh. Gunakan atau habiskan dulu.',
  inventory_item_not_owned: 'Item ini tidak ada di tasmu.',
  inventory_item_unsupported: 'Item ini belum bisa digunakan.',
  not_enough_coins: 'Koin kamu belum cukup untuk membeli item ini.',
  hearts_full: 'Hearts kamu sudah penuh. Ramuan tidak perlu dipakai.',
  freeze_limit: 'Perisai Streak sudah maksimal dua. Gunakan salah satu dulu.',
  reward_not_found: 'Hadiah level ini tidak ditemukan atau sudah tidak aktif.',
  reward_locked: 'Selesaikan semua lesson di level ini sebelum mengambil hadiah.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Data hadiah gagal dimuat.';
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

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asCadence(value: unknown): QuestCadence {
  return value === 'weekly' ? 'weekly' : 'daily';
}

function asQuestMetric(value: unknown): QuestMetric {
  return value === 'lesson' || value === 'practice' ? value : 'xp';
}

function asAchievementMetric(value: unknown): AchievementMetric {
  if (value === 'lesson' || value === 'practice' || value === 'streak' || value === 'level') {
    return value;
  }
  return 'xp';
}

function asItemKind(value: unknown): ShopItemKind {
  return value === 'streak_freeze' ? 'streak_freeze' : 'heart_potion';
}

function parseQuest(value: unknown): Quest {
  const record = asRecord(value);
  const target = Math.max(1, asNumber(record.target, 1));

  return {
    id: asString(record.id),
    code: asString(record.code),
    cadence: asCadence(record.cadence),
    metric: asQuestMetric(record.metric),
    target,
    rewardCoins: Math.max(0, asNumber(record.rewardCoins)),
    title: asString(record.title, 'Misi'),
    description: asString(record.description),
    icon: asString(record.icon, 'target'),
    periodStart: asString(record.periodStart),
    periodEnd: asString(record.periodEnd),
    progress: Math.max(0, asNumber(record.progress)),
    claimedAt: asNullableString(record.claimedAt),
    canClaim: asBoolean(record.canClaim),
  };
}

export function parseQuestBoard(value: unknown): QuestBoard {
  const record = asRecord(value);

  return {
    today: asString(record.today),
    timezone: asString(record.timezone, 'Asia/Jakarta'),
    quests: Array.isArray(record.quests)
      ? record.quests.map(parseQuest).filter((quest) => Boolean(quest.id))
      : [],
  };
}

function parseAchievement(value: unknown): Achievement {
  const record = asRecord(value);
  const target = Math.max(1, asNumber(record.target, 1));

  return {
    id: asString(record.id),
    code: asString(record.code),
    title: asString(record.title, 'Pencapaian'),
    description: asString(record.description),
    metric: asAchievementMetric(record.metric),
    target,
    progress: clamp(asNumber(record.progress), 0, target),
    icon: asString(record.icon, 'trophy'),
    unlockedAt: asNullableString(record.unlockedAt),
  };
}

export function parseAchievementBoard(value: unknown): AchievementBoard {
  const record = asRecord(value);
  const achievements = Array.isArray(record.achievements)
    ? record.achievements.map(parseAchievement).filter((item) => Boolean(item.id))
    : [];

  return {
    unlockedCount: Math.max(0, asNumber(record.unlockedCount)),
    total: Math.max(achievements.length, asNumber(record.total)),
    achievements,
  };
}

function parseShopItem(value: unknown): ShopItem {
  const record = asRecord(value);
  const maxStack = Math.max(1, asNumber(record.maxStack, 1));

  return {
    id: asString(record.id),
    slug: asString(record.slug),
    name: asString(record.name, 'Item'),
    description: asString(record.description),
    kind: asItemKind(record.kind),
    priceCoins: Math.max(0, asNumber(record.priceCoins)),
    maxStack,
    owned: clamp(asNumber(record.owned), 0, maxStack),
    canBuy: asBoolean(record.canBuy),
    icon: asString(record.icon, 'bag'),
  };
}

export function parseShopCatalog(value: unknown): ShopCatalog {
  const record = asRecord(value);

  return {
    coins: Math.max(0, asNumber(record.coins)),
    items: Array.isArray(record.items)
      ? record.items.map(parseShopItem).filter((item) => Boolean(item.id))
      : [],
  };
}

function parseInventoryItem(value: unknown): InventoryItem {
  const record = asRecord(value);

  return {
    id: asString(record.id),
    slug: asString(record.slug),
    name: asString(record.name, 'Item'),
    description: asString(record.description),
    kind: asItemKind(record.kind),
    quantity: Math.max(0, asNumber(record.quantity)),
    maxStack: Math.max(1, asNumber(record.maxStack, 1)),
    icon: asString(record.icon, 'bag'),
  };
}

export function parseInventory(value: unknown): Inventory {
  const record = asRecord(value);

  return {
    coins: Math.max(0, asNumber(record.coins)),
    streakFreezes: Math.min(2, Math.max(0, asNumber(record.streakFreezes))),
    items: Array.isArray(record.items)
      ? record.items.map(parseInventoryItem).filter((item) => Boolean(item.id))
      : [],
  };
}

export function parseQuestClaim(value: unknown): QuestClaim {
  const record = asRecord(value);

  return {
    alreadyClaimed: asBoolean(record.alreadyClaimed),
    questId: asString(record.questId),
    coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
    coinBalance: Math.max(0, asNumber(record.coinBalance)),
    claimedAt: asNullableString(record.claimedAt),
  };
}

export function parsePurchase(value: unknown): PurchaseOutcome {
  const record = asRecord(value);

  return {
    itemId: asString(record.itemId),
    slug: asString(record.slug),
    quantity: Math.max(0, asNumber(record.quantity)),
    priceCoins: Math.max(0, asNumber(record.priceCoins)),
    coinBalance: Math.max(0, asNumber(record.coinBalance)),
  };
}

export function parseRewardNodeClaim(value: unknown): RewardNodeClaim {
  const record = asRecord(value);

  return {
    nodeId: asString(record.nodeId),
    alreadyClaimed: asBoolean(record.alreadyClaimed),
    coinsAwarded: Math.max(0, asNumber(record.coinsAwarded)),
    xpAwarded: Math.max(0, asNumber(record.xpAwarded)),
    coinBalance: Math.max(0, asNumber(record.coinBalance)),
    totalXp: Math.max(0, asNumber(record.totalXp)),
    claimedAt: asNullableString(record.claimedAt),
  };
}

export function parseUseItem(value: unknown): UseItemOutcome {
  const record = asRecord(value);
  const hearts = record.hearts ? asRecord(record.hearts) : null;
  const effect = record.effect === 'freeze' ? 'freeze' : 'hearts';

  return {
    kind: asItemKind(record.kind),
    effect,
    quantity: Math.max(0, asNumber(record.quantity)),
    restored: Math.max(0, asNumber(record.restored)),
    hearts: hearts
      ? {
          current: Math.max(0, asNumber(hearts.current)),
          max: Math.max(1, asNumber(hearts.max, 5)),
        }
      : null,
    freezes: Math.min(2, Math.max(0, asNumber(record.freezes))),
  };
}

export const rewardsService = {
  async loadQuests(): Promise<QuestBoard> {
    try {
      return parseQuestBoard(await rewardsRepository.fetchQuests());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async claimQuest(questId: string): Promise<QuestClaim> {
    try {
      return parseQuestClaim(await rewardsRepository.claimQuest(questId));
    } catch (error) {
      throw messageFor(error);
    }
  },

  async loadAchievements(): Promise<AchievementBoard> {
    try {
      return parseAchievementBoard(await rewardsRepository.fetchAchievements());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async loadShop(): Promise<ShopCatalog> {
    try {
      return parseShopCatalog(await rewardsRepository.fetchShop());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async purchase(itemId: string): Promise<PurchaseOutcome> {
    try {
      return parsePurchase(await rewardsRepository.purchaseItem(itemId));
    } catch (error) {
      throw messageFor(error);
    }
  },

  async loadInventory(): Promise<Inventory> {
    try {
      return parseInventory(await rewardsRepository.fetchInventory());
    } catch (error) {
      throw messageFor(error);
    }
  },

  async useItem(itemId: string): Promise<UseItemOutcome> {
    try {
      return parseUseItem(await rewardsRepository.useItem(itemId));
    } catch (error) {
      throw messageFor(error);
    }
  },

  async claimRewardNode(nodeId: string): Promise<RewardNodeClaim> {
    try {
      return parseRewardNodeClaim(await rewardsRepository.claimRewardNode(nodeId));
    } catch (error) {
      throw messageFor(error);
    }
  },
};
