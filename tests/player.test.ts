import { describe, expect, it } from 'vitest';
import { formatRefillCountdown } from '../src/components/playerSummary';
import { parsePlayerState, parsePlayerWallet } from '../src/services/player.service';

describe('player payload parsing', () => {
  it('parses the server progression state', () => {
    const state = parsePlayerState({
      totalXp: 135,
      todayXp: 35,
      coins: 70,
      hearts: {
        current: 4,
        max: 5,
        nextRefillSeconds: 1200,
        regenMinutes: 30,
        refillCostCoins: 10,
      },
      streak: {
        current: 3,
        longest: 5,
        lastActivityDate: '2026-11-10',
        todayDate: '2026-11-10',
        activityDays: ['2026-11-10', '2026-11-09'],
      },
      level: {
        level: 2,
        title: 'Penjelajah',
        xpRequired: 100,
        nextLevelXp: 250,
        xpToNext: 115,
        progressPercent: 23,
      },
    });

    expect(state.totalXp).toBe(135);
    expect(state.hearts).toMatchObject({ current: 4, max: 5, refillCostCoins: 10 });
    expect(state.streak.current).toBe(3);
    expect(state.streak.activityDays).toHaveLength(2);
    expect(state.level.title).toBe('Penjelajah');
    expect(state.level.nextLevelXp).toBe(250);
  });

  it('clamps invalid percentages and out-of-range Hearts', () => {
    const state = parsePlayerState({
      hearts: { current: 9, max: 5 },
      level: { level: 0, progressPercent: 140 },
    });

    expect(state.hearts.current).toBe(5);
    expect(state.level.level).toBe(1);
    expect(state.level.progressPercent).toBe(100);
  });

  it('falls back safely when the payload is empty', () => {
    const state = parsePlayerState(null);

    expect(state.totalXp).toBe(0);
    expect(state.coins).toBe(0);
    expect(state.hearts.max).toBe(5);
    expect(state.streak.current).toBe(0);
    expect(state.level.level).toBe(1);
  });

  it('parses wallet transactions and drops malformed rows', () => {
    const wallet = parsePlayerWallet({
      totalXp: 20,
      coins: 2,
      transactions: [
        { id: 'tx-1', amount: -10, source: 'heart_refill', createdAt: '2026-11-10T12:00:00Z' },
        { amount: 5 },
      ],
      xpTransactions: [
        { id: 'xp-1', amount: 10, source: 'lesson', createdAt: '2026-11-10T11:00:00Z' },
      ],
    });

    expect(wallet.transactions).toHaveLength(1);
    expect(wallet.transactions[0]?.amount).toBe(-10);
    expect(wallet.xpTransactions[0]?.source).toBe('lesson');
  });

  it('parses Streak freezes and reward catalogs from the wallet', () => {
    const wallet = parsePlayerWallet({
      streak: { current: 4, longest: 7, freezes: 9 },
      levelRewards: [
        {
          level: 2,
          title: 'Penjelajah',
          xpRequired: 100,
          rewardCoins: 25,
          awardedAt: '2026-11-10T12:00:00Z',
        },
      ],
      streakMilestones: [
        {
          days: 3,
          title: 'Tiga Hari',
          rewardCoins: 20,
          icon: 'flame',
          awardedAt: null,
        },
      ],
    });

    expect(wallet.streak.freezes).toBe(2);
    expect(wallet.levelRewards[0]?.rewardCoins).toBe(25);
    expect(wallet.levelRewards[0]?.awardedAt).toBe('2026-11-10T12:00:00Z');
    expect(wallet.streakMilestones[0]).toMatchObject({ days: 3, awardedAt: null });
  });
});

describe('Heart refill countdown', () => {
  it('reports a full wallet without a timer', () => {
    expect(formatRefillCountdown(0)).toBe('Penuh');
  });

  it('formats minutes and seconds', () => {
    expect(formatRefillCountdown(65)).toBe('1m 05d');
  });

  it('formats longer waits as hours', () => {
    expect(formatRefillCountdown(3660)).toBe('1j 1m');
  });
});
