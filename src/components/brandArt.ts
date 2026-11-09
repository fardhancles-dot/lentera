/** Compact lantern mark used in navigation and auth headers. */
export function lampMarkup(size = 30): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="26" r="18" fill="#FFE29A" opacity=".5"/>
    <path d="M18 12v-2a6 6 0 0 1 12 0v2" fill="none" stroke="#8A6320" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="13" y="12" width="22" height="27" rx="7" fill="#FFC83D" stroke="#8A6320" stroke-width="2.6"/>
    <path d="M19 19v13M24 17v15M29 19v13" stroke="#FFF6D9" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

/** Original mascot illustration (static fallback and decorative use). */
export function kikoMarkup(size = 200): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="Kiko, maskot Lentera">
    <defs>
      <radialGradient id="kiko-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFE9A8" stop-opacity=".95"/>
        <stop offset="100%" stop-color="#FFE9A8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="112" r="78" fill="url(#kiko-glow)"/>
    <ellipse cx="100" cy="165" rx="52" ry="11" fill="#2F8F24" opacity=".12"/>
    <path d="M70 72C52 44 58 22 76 32c14 8 12 27 4 42Z" fill="#2F8F24"/>
    <path d="M130 72c18-28 12-50-6-40-14 8-12 27-4 42Z" fill="#2F8F24"/>
    <ellipse cx="100" cy="112" rx="60" ry="57" fill="#58CC02"/>
    <ellipse cx="100" cy="126" rx="33" ry="31" fill="#FFF8E6"/>
    <circle cx="100" cy="94" r="4" fill="#FFF8E6" opacity=".55"/>
    <ellipse cx="78" cy="104" rx="12" ry="14" fill="#fff"/>
    <ellipse cx="122" cy="104" rx="12" ry="14" fill="#fff"/>
    <circle cx="79" cy="106" r="5.6" fill="#303A32"/>
    <circle cx="123" cy="106" r="5.6" fill="#303A32"/>
    <circle cx="81" cy="103.5" r="1.9" fill="#fff"/>
    <circle cx="125" cy="103.5" r="1.9" fill="#fff"/>
    <ellipse cx="62" cy="120" rx="8" ry="4.6" fill="#F39A9A" opacity=".6"/>
    <ellipse cx="138" cy="120" rx="8" ry="4.6" fill="#F39A9A" opacity=".6"/>
    <path d="M92 130c4.5 5 11.5 5 16 0" fill="none" stroke="#303A32" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="72" cy="166" rx="15" ry="8" fill="#2F8F24"/>
    <ellipse cx="128" cy="166" rx="15" ry="8" fill="#2F8F24"/>
    <path d="M145 120c9-2 14 4 13 12" stroke="#2F8F24" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g>
      <circle cx="164" cy="146" r="24" fill="#FFE29A" opacity=".55"/>
      <path d="M155 133v-4a4 4 0 0 1 8 0v4" stroke="#8A6320" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="152" y="133" width="24" height="27" rx="7" fill="#FFC83D" stroke="#8A6320" stroke-width="3"/>
      <path d="M159 141v11M164 139v13M169 141v11" stroke="#FFF6D9" stroke-width="2.4" stroke-linecap="round"/>
    </g>
  </svg>`;
}

export function kiko(size = 200): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'kiko-art';
  span.innerHTML = kikoMarkup(size);
  return span;
}
