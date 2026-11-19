export type ResourceIconName = 'heart' | 'streak' | 'coin';

let iconSerial = 0;

function uniqueId(name: string): string {
  iconSerial += 1;
  return `lentera-${name}-${iconSerial}`;
}

function heartMarkup(): string {
  const gradient = uniqueId('heart-fill');
  const shine = uniqueId('heart-shine');
  const glow = uniqueId('heart-glow');

  return `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
  <defs>
    <linearGradient id="${gradient}" x1="6" y1="3" x2="18" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff9eb3"/>
      <stop offset="0.42" stop-color="#ff4d6d"/>
      <stop offset="1" stop-color="#b90f38"/>
    </linearGradient>
    <radialGradient id="${shine}" cx="0.32" cy="0.24" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="${glow}" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.4" flood-color="#ff2d55" flood-opacity="0.55"/>
    </filter>
  </defs>
  <path class="resource-icon__heart-shape" d="M12 20.9c-.32 0-.63-.1-.88-.3C7.05 16.9 3.2 13.5 3.2 9.5 3.2 6.45 5.5 4.15 8.4 4.15c1.5 0 2.9.68 3.6 1.83.7-1.15 2.1-1.83 3.6-1.83 2.9 0 5.2 2.3 5.2 5.35 0 4-3.85 7.4-7.92 11.1-.25.2-.56.3-.88.3Z" fill="url(#${gradient})" stroke="#9d0b2f" stroke-width="0.75" filter="url(#${glow})"/>
  <ellipse cx="8.8" cy="8.8" rx="3" ry="1.8" transform="rotate(-28 8.8 8.8)" fill="url(#${shine})"/>
  <path d="M7.4 13.2c.8 2 2.4 3.7 4.5 5" stroke="#ffd7df" stroke-opacity="0.75" stroke-width="1" stroke-linecap="round" fill="none"/>
</svg>`;
}

function flameMarkup(): string {
  const outer = uniqueId('flame-outer');
  const inner = uniqueId('flame-inner');
  const glow = uniqueId('flame-blur');

  return `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
  <defs>
    <linearGradient id="${outer}" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffe066"/>
      <stop offset="0.45" stop-color="#ffa41b"/>
      <stop offset="1" stop-color="#f4530a"/>
    </linearGradient>
    <linearGradient id="${inner}" x1="12" y1="7" x2="12" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fffbe0"/>
      <stop offset="0.55" stop-color="#ffe14d"/>
      <stop offset="1" stop-color="#ffb300"/>
    </linearGradient>
    <filter id="${glow}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  <ellipse class="flame-glow" cx="12" cy="15.5" rx="6.4" ry="7" fill="#ff8a00" opacity="0.3" filter="url(#${glow})"/>
  <g class="flame-outer">
    <path d="M12 21.5c4.1 0 7-2.8 7-6.8 0-2.7-1.5-4.4-3-6.3-1.5-1.9-2.2-4.4-2.2-6.4-2.4 1.9-4.7 4.9-4.7 7.9 0 1.3.4 2.3.4 2.3-1.2-.2-2.1-1.2-2.6-2.3C6.2 10.9 5 12.9 5 15.3c0 3.5 2.9 6.2 7 6.2Z" fill="url(#${outer})" stroke="#d64a00" stroke-width="0.6"/>
  </g>
  <g class="flame-inner">
    <path d="M12 20c2.5 0 4.4-1.7 4.4-4.2 0-1.8-1-3-2.1-4.4-.8-1.1-1.2-2.3-1.2-3.7-1.6 1.5-2.9 3.4-2.9 5.2 0 .8.2 1.3.2 1.3-.8-.1-1.5-.7-1.9-1.5-.8 1.1-1.2 2.2-1.2 3.4C7.3 18.3 9.2 20 12 20Z" fill="url(#${inner})"/>
  </g>
  <g class="flame-sparks">
    <circle cx="15.9" cy="6.1" r="0.85" fill="#ffe066"/>
    <circle cx="8.5" cy="8.4" r="0.55" fill="#ffc247"/>
  </g>
</svg>`;
}

function coinMarkup(): string {
  const rim = uniqueId('coin-rim');
  const face = uniqueId('coin-face');
  const shine = uniqueId('coin-shine');
  const glow = uniqueId('coin-glow');
  const clip = uniqueId('coin-clip');

  return `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
  <defs>
    <linearGradient id="${rim}" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff8c4"/>
      <stop offset="0.3" stop-color="#ffd75e"/>
      <stop offset="0.62" stop-color="#c88a06"/>
      <stop offset="1" stop-color="#ffe98a"/>
    </linearGradient>
    <radialGradient id="${face}" cx="0.34" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#fffbe0"/>
      <stop offset="0.38" stop-color="#ffe066"/>
      <stop offset="0.78" stop-color="#f2b617"/>
      <stop offset="1" stop-color="#c28705"/>
    </radialGradient>
    <radialGradient id="${shine}" cx="0.35" cy="0.3" r="0.65">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="${clip}"><circle cx="12" cy="12" r="8.1"/></clipPath>
    <filter id="${glow}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#d99a12" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="12" cy="12" r="9.6" fill="url(#${rim})" stroke="#9a6500" stroke-width="0.8" filter="url(#${glow})"/>
  <circle cx="12" cy="12" r="7.9" fill="url(#${face})" stroke="#c88a06" stroke-width="0.6"/>
  <circle cx="12" cy="12" r="6.3" fill="none" stroke="#a86e00" stroke-opacity="0.55" stroke-width="0.7"/>
  <path d="M12 7.4l1.35 2.8 3.05.45-2.2 2.15.5 3.05L12 14.4l-2.7 1.45.5-3.05-2.2-2.15 3.05-.45L12 7.4Z" fill="#a86e00" opacity="0.88"/>
  <ellipse cx="8.6" cy="7.4" rx="3.2" ry="1.6" transform="rotate(-28 8.6 7.4)" fill="url(#${shine})"/>
  <g clip-path="url(#${clip})">
    <g transform="rotate(22 12 12)">
      <rect class="coin-shimmer" x="10" y="-2" width="2.1" height="28" rx="1" fill="#ffffff" opacity="0"/>
    </g>
  </g>
</svg>`;
}

function markup(name: ResourceIconName): string {
  if (name === 'heart') return heartMarkup();
  if (name === 'streak') return flameMarkup();
  return coinMarkup();
}

/** Decorative, self-contained game icon for the header resource chips. */
export function resourceIcon(name: ResourceIconName): HTMLSpanElement {
  const wrapper = document.createElement('span');
  wrapper.className = `resource-icon resource-icon--${name}`;
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.innerHTML = markup(name);
  return wrapper;
}
