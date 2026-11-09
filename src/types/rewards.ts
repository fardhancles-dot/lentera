export type QuestCadence = 'daily' | 'weekly';
export type QuestMetric = 'xp' | 'lesson' | 'practice';
export type AchievementMetric = 'xp' | 'lesson' | 'practice' | 'streak' | 'level';
export type ShopItemKind = 'heart_potion' | 'streak_freeze';

export interface Quest {
  id: string;
  code: string;
  cadence: QuestCadence;
  metric: QuestMetric;
  target: number;
  rewardCoins: number;
  title: string;
  description: string;
  icon: string;
  periodStart: string;
  periodEnd: string;
  progress: number;
  claimedAt: string | null;
  canClaim: boolean;
}

export interface QuestBoard {
  today: string;
  timezone: string;
  quests: Quest[];
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  progress: number;
  icon: string;
  unlockedAt: string | null;
}

export interface AchievementBoard {
  unlockedCount: number;
  total: number;
  achievements: Achievement[];
}

export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: ShopItemKind;
  priceCoins: number;
  maxStack: number;
  owned: number;
  canBuy: boolean;
  icon: string;
}

export interface ShopCatalog {
  coins: number;
  items: ShopItem[];
}

export interface InventoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: ShopItemKind;
  quantity: number;
  maxStack: number;
  icon: string;
}

export interface Inventory {
  coins: number;
  streakFreezes: number;
  items: InventoryItem[];
}

export interface QuestClaim {
  alreadyClaimed: boolean;
  questId: string;
  coinsAwarded: number;
  coinBalance: number;
  claimedAt: string | null;
}

export interface PurchaseOutcome {
  itemId: string;
  slug: string;
  quantity: number;
  priceCoins: number;
  coinBalance: number;
}

export interface UseItemOutcome {
  kind: ShopItemKind;
  effect: 'hearts' | 'freeze';
  quantity: number;
  restored: number;
  hearts: { current: number; max: number } | null;
  freezes: number;
}
