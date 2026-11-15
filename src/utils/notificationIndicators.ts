import type { NotificationIndicators } from '../types/social';

export const EMPTY_NOTIFICATION_INDICATORS: NotificationIndicators = {
  notifications: 0,
  inbox: 0,
  quests: 0,
  achievements: 0,
  learnRewards: 0,
  league: 0,
  friends: 0,
};

/**
 * Maps one real server count to a navigation destination. Achievements live on
 * the Misi page, and the Learn badge covers claimable level reward nodes.
 */
export function indicatorActive(key: string, counts: NotificationIndicators): boolean {
  switch (key) {
    case 'notifications':
      return counts.notifications > 0;
    case 'inbox':
      return counts.inbox > 0;
    case 'quests':
      return counts.quests > 0 || counts.achievements > 0;
    case 'learn':
      return counts.learnRewards > 0;
    case 'leaderboard':
      return counts.league > 0;
    case 'friends':
      return counts.friends > 0;
    default:
      return false;
  }
}

const DRAWER_INDICATOR_KEYS = ['friends', 'inbox', 'leaderboard', 'notifications'] as const;

export function drawerIndicatorActive(counts: NotificationIndicators): boolean {
  return DRAWER_INDICATOR_KEYS.some((key) => indicatorActive(key, counts));
}
