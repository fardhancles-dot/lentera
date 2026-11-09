import { describe, expect, it } from 'vitest';
import {
  parseAchievementBoard,
  parseInventory,
  parsePurchase,
  parseQuestBoard,
  parseRewardNodeClaim,
  parseQuestClaim,
  parseShopCatalog,
  parseUseItem,
} from '../src/services/rewards.service';

describe('reward payload parsing', () => {
  it('parses quests and defaults unknown cadence/metric safely', () => {
    const board = parseQuestBoard({
      today: '2026-11-10',
      timezone: 'Asia/Jakarta',
      quests: [
        {
          id: 'daily-1',
          code: 'daily-xp-50',
          cadence: 'daily',
          metric: 'xp',
          target: 50,
          rewardCoins: 20,
          title: 'Hangatkan Lentera',
          description: 'Dapatkan XP.',
          icon: 'sparkles',
          periodStart: '2026-11-10',
          periodEnd: '2026-11-11',
          progress: 42,
          claimedAt: null,
          canClaim: false,
        },
        {
          id: 'weekly-1',
          cadence: 'unknown',
          metric: 'unknown',
          target: 0,
          progress: -3,
        },
      ],
    });

    expect(board.quests).toHaveLength(2);
    expect(board.quests[0]?.progress).toBe(42);
    expect(board.quests[1]?.cadence).toBe('daily');
    expect(board.quests[1]?.metric).toBe('xp');
    expect(board.quests[1]?.target).toBe(1);
    expect(board.quests[1]?.progress).toBe(0);
    expect(board.quests[1]?.canClaim).toBe(false);
  });

  it('drops quests without an id', () => {
    expect(parseQuestBoard({ quests: [{ title: 'rusak' }, null] }).quests).toEqual([]);
  });

  it('clamps achievement progress and keeps unlocked state', () => {
    const board = parseAchievementBoard({
      unlockedCount: 1,
      total: 8,
      achievements: [
        {
          id: 'a-1',
          code: 'first-lesson',
          title: 'Langkah Pertama',
          description: 'Selesaikan lesson.',
          metric: 'lesson',
          target: 1,
          progress: 9,
          icon: 'flag',
          unlockedAt: '2026-11-10T01:00:00Z',
        },
        {
          id: 'a-2',
          code: 'xp-500',
          title: 'Lima Ratus XP',
          metric: 'unknown',
          target: 500,
          progress: 120,
        },
      ],
    });

    expect(board.total).toBe(8);
    expect(board.achievements[0]?.progress).toBe(1);
    expect(board.achievements[0]?.unlockedAt).toBe('2026-11-10T01:00:00Z');
    expect(board.achievements[1]?.metric).toBe('xp');
    expect(board.achievements[1]?.progress).toBe(120);
  });

  it('clamps shop ownership and preserves server prices', () => {
    const shop = parseShopCatalog({
      coins: 500,
      items: [
        {
          id: 'item-1',
          slug: 'heart-potion',
          name: 'Ramuan Hati',
          description: 'Pulihkan Hearts.',
          kind: 'heart_potion',
          priceCoins: 80,
          maxStack: 5,
          owned: 99,
          canBuy: true,
          icon: 'heart',
        },
        { id: 'item-2', kind: 'unknown', maxStack: 0, priceCoins: -5, owned: -1 },
      ],
    });

    expect(shop.coins).toBe(500);
    expect(shop.items[0]?.owned).toBe(5);
    expect(shop.items[1]?.kind).toBe('heart_potion');
    expect(shop.items[1]?.maxStack).toBe(1);
    expect(shop.items[1]?.priceCoins).toBe(0);
    expect(shop.items[1]?.owned).toBe(0);
  });

  it('parses inventory and caps streak shields at two', () => {
    const inventory = parseInventory({
      coins: 120,
      streakFreezes: 9,
      items: [
        {
          id: 'item-1',
          slug: 'streak-freeze',
          name: 'Perisai Streak',
          description: 'Lindungi Streak.',
          kind: 'streak_freeze',
          quantity: 2,
          maxStack: 2,
          icon: 'shield',
        },
      ],
    });

    expect(inventory.streakFreezes).toBe(2);
    expect(inventory.items[0]?.quantity).toBe(2);
    expect(inventory.items[0]?.kind).toBe('streak_freeze');
  });

  it('parses quest claims and purchase outcomes with numeric guards', () => {
    expect(
      parseQuestClaim({
        alreadyClaimed: false,
        questId: 'q-1',
        coinsAwarded: 20,
        coinBalance: 70,
        claimedAt: '2026-11-10T01:00:00Z',
      }),
    ).toMatchObject({ alreadyClaimed: false, coinsAwarded: 20, coinBalance: 70 });

    expect(
      parsePurchase({
        itemId: 'i-1',
        slug: 'heart-potion',
        quantity: 1,
        priceCoins: 80,
        coinBalance: 420,
      }),
    ).toMatchObject({ quantity: 1, priceCoins: 80, coinBalance: 420 });
  });

  it('parses heart and shield item effects', () => {
    const hearts = parseUseItem({
      kind: 'heart_potion',
      effect: 'hearts',
      restored: 3,
      quantity: 0,
      hearts: { current: 4, max: 5 },
    });
    expect(hearts.effect).toBe('hearts');
    expect(hearts.restored).toBe(3);
    expect(hearts.hearts).toEqual({ current: 4, max: 5 });

    const freeze = parseUseItem({
      kind: 'streak_freeze',
      effect: 'freeze',
      quantity: 1,
      freezes: 9,
    });
    expect(freeze.effect).toBe('freeze');
    expect(freeze.freezes).toBe(2);
  });

  it('parses reward node claims and keeps repeat claims at zero', () => {
    const first = parseRewardNodeClaim({
      nodeId: 'node-1',
      alreadyClaimed: false,
      coinsAwarded: 30,
      xpAwarded: 10,
      coinBalance: 130,
      totalXp: 420,
      claimedAt: '2026-11-10T02:00:00Z',
    });
    expect(first).toMatchObject({
      nodeId: 'node-1',
      alreadyClaimed: false,
      coinsAwarded: 30,
      xpAwarded: 10,
      coinBalance: 130,
      totalXp: 420,
    });

    const repeat = parseRewardNodeClaim({
      nodeId: 'node-1',
      alreadyClaimed: true,
      coinsAwarded: 0,
      xpAwarded: 0,
      coinBalance: -5,
      totalXp: 'rusak',
    });
    expect(repeat.alreadyClaimed).toBe(true);
    expect(repeat.coinsAwarded).toBe(0);
    expect(repeat.xpAwarded).toBe(0);
    expect(repeat.coinBalance).toBe(0);
    expect(repeat.totalXp).toBe(0);
    expect(repeat.claimedAt).toBeNull();
  });
});
