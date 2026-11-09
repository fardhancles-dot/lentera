import {
  AVATAR_KEYS,
  AVATAR_LABELS,
  isAvatarKey,
  type AvatarKey,
} from '../config/avatars';

export { AVATAR_KEYS, AVATAR_LABELS, isAvatarKey };
export type { AvatarKey };

interface Palette {
  body: string;
  dark: string;
  bg: string;
  accessory: 'leaf' | 'flame' | 'drop' | 'star' | 'berry';
}

const PALETTES: Record<AvatarKey, Palette> = {
  sprout: { body: '#58CC02', dark: '#2F8F24', bg: '#E9F9DC', accessory: 'leaf' },
  ember: { body: '#FF9F45', dark: '#D97A1F', bg: '#FFF1E3', accessory: 'flame' },
  wave: { body: '#4CA8E8', dark: '#2F8FD0', bg: '#E8F4FD', accessory: 'drop' },
  star: { body: '#FFC83D', dark: '#D9A11C', bg: '#FFF6D9', accessory: 'star' },
  berry: { body: '#B98CFF', dark: '#8A5BD6', bg: '#F3ECFF', accessory: 'berry' },
};

function accessoryMarkup(kind: Palette['accessory'], dark: string): string {
  switch (kind) {
    case 'leaf':
      return `<path d="M60 30c-9-13 4-21 11-13 6 7-2 15-11 13Z" fill="${dark}"/>
        <path d="M60 29v10" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`;
    case 'flame':
      return `<path d="M60 32c-7-5-9-13-3-19 1 5 5 6 5 10 3-2 3-5 3-5 5 5 4 11-1 14Z" fill="${dark}"/>
        <path d="M60 31c-3-2-4-5-2-8 1 2 3 3 3 5 1-1 1-2 1-2 2 2 2 4-2 5Z" fill="#FFD98A"/>`;
    case 'drop':
      return `<path d="M60 15c6 8 11 13 11 18a11 11 0 0 1-22 0c0-5 5-10 11-18Z" fill="${dark}"/>
        <ellipse cx="55" cy="34" rx="3" ry="4.5" fill="#BFE4FA"/>`;
    case 'star':
      return `<path d="m60 16 4.6 9.6 10.4 1.5-7.5 7.3 1.8 10.4L60 40l-9.3 4.8 1.8-10.4-7.5-7.3 10.4-1.5L60 16Z" fill="${dark}"/>`;
    case 'berry':
      return `<circle cx="52" cy="24" r="5" fill="${dark}"/><circle cx="62" cy="19" r="5" fill="${dark}"/>
        <circle cx="70" cy="26" r="5" fill="${dark}"/><path d="M61 26c0-5 1-7 3-9" stroke="#2F8F24" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
}

export function avatarMarkup(key: string, size = 120): string {
  const safeKey: AvatarKey = isAvatarKey(key) ? key : 'sprout';
  const palette = PALETTES[safeKey];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Avatar ${AVATAR_LABELS[safeKey]}">
    <circle cx="60" cy="60" r="60" fill="${palette.bg}"/>
    ${accessoryMarkup(palette.accessory, palette.dark)}
    <ellipse cx="60" cy="68" rx="37" ry="35" fill="${palette.body}"/>
    <ellipse cx="60" cy="75" rx="21" ry="19" fill="#FFF8E6"/>
    <ellipse cx="47" cy="64" rx="7" ry="8.5" fill="#fff"/>
    <ellipse cx="73" cy="64" rx="7" ry="8.5" fill="#fff"/>
    <circle cx="47.5" cy="65" r="3.4" fill="#303A32"/>
    <circle cx="73.5" cy="65" r="3.4" fill="#303A32"/>
    <circle cx="48.6" cy="63.6" r="1.1" fill="#fff"/>
    <circle cx="74.6" cy="63.6" r="1.1" fill="#fff"/>
    <ellipse cx="39" cy="77" rx="5" ry="3" fill="#F39A9A" opacity=".55"/>
    <ellipse cx="81" cy="77" rx="5" ry="3" fill="#F39A9A" opacity=".55"/>
    <path d="M54.5 81c3.2 3.6 7.8 3.6 11 0" fill="none" stroke="#303A32" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="44" cy="102" rx="9" ry="5" fill="${palette.dark}"/>
    <ellipse cx="76" cy="102" rx="9" ry="5" fill="${palette.dark}"/>
  </svg>`;
}

export function avatar(key: string, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `avatar avatar--${size}`;
  span.innerHTML = avatarMarkup(key, 120);
  return span;
}
