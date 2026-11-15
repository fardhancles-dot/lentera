import { describe, expect, it } from 'vitest';
import {
  EMPTY_NOTIFICATION_INDICATORS,
  drawerIndicatorActive,
  indicatorActive,
} from '../src/utils/notificationIndicators';

describe('notification indicator mapping', () => {
  it('keeps every navigation badge hidden when all counts are zero', () => {
    const counts = EMPTY_NOTIFICATION_INDICATORS;
    for (const key of ['notifications', 'inbox', 'quests', 'learn', 'leaderboard', 'friends']) {
      expect(indicatorActive(key, counts)).toBe(false);
    }
    expect(drawerIndicatorActive(counts)).toBe(false);
  });

  it('uses one badge per destination regardless of item count', () => {
    const counts = {
      ...EMPTY_NOTIFICATION_INDICATORS,
      notifications: 7,
      inbox: 3,
      quests: 2,
      achievements: 4,
      learnRewards: 2,
      league: 2,
      friends: 5,
    };

    expect(indicatorActive('notifications', counts)).toBe(true);
    expect(indicatorActive('inbox', counts)).toBe(true);
    expect(indicatorActive('quests', counts)).toBe(true);
    expect(indicatorActive('learn', counts)).toBe(true);
    expect(indicatorActive('leaderboard', counts)).toBe(true);
    expect(indicatorActive('friends', counts)).toBe(true);
  });

  it('shows achievements on Misi without adding a fake Achievement menu', () => {
    const achievementOnly = {
      ...EMPTY_NOTIFICATION_INDICATORS,
      achievements: 1,
    };
    expect(indicatorActive('quests', achievementOnly)).toBe(true);
    expect(indicatorActive('notifications', achievementOnly)).toBe(false);
    expect(indicatorActive('profile', achievementOnly)).toBe(false);
  });

  it('lights the hamburger only for destinations hidden in the drawer', () => {
    expect(
      drawerIndicatorActive({ ...EMPTY_NOTIFICATION_INDICATORS, inbox: 1 }),
    ).toBe(true);
    expect(
      drawerIndicatorActive({ ...EMPTY_NOTIFICATION_INDICATORS, notifications: 1 }),
    ).toBe(true);
    expect(
      drawerIndicatorActive({ ...EMPTY_NOTIFICATION_INDICATORS, quests: 1 }),
    ).toBe(false);
    expect(
      drawerIndicatorActive({ ...EMPTY_NOTIFICATION_INDICATORS, learnRewards: 1 }),
    ).toBe(false);
  });
});
