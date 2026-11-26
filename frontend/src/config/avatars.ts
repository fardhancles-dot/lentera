export const AVATAR_KEYS = ['sprout', 'ember', 'wave', 'star', 'berry'] as const;
export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const AVATAR_LABELS: Record<AvatarKey, string> = {
  sprout: 'Tunas',
  ember: 'Bara',
  wave: 'Ombak',
  star: 'Bintang',
  berry: 'Beri',
};

export function isAvatarKey(value: string | null | undefined): value is AvatarKey {
  return !!value && (AVATAR_KEYS as readonly string[]).includes(value);
}
