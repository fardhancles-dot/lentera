import { version } from '../../package.json';
import { basePath } from '../app/basePath';

const env = import.meta.env;

const publicUrl = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Central branding. Change the game name, mascot or support link here (or with
 * VITE_* variables) instead of hunting through components.
 */
export const brand = {
  name: publicUrl(env.VITE_GAME_NAME) || 'Lentera',
  tagline: publicUrl(env.VITE_GAME_TAGLINE) || 'Petualangan belajar yang seru',
  version: publicUrl(env.VITE_GAME_VERSION) || version,
  supportUrl: publicUrl(env.VITE_SUPPORT_URL),
  mascot: {
    name: 'Kiko',
    role: 'roh daun penjaga Lentera',
  },
  copyright: `© ${new Date().getFullYear()} Lentera. Dibuat untuk belajar dengan gembira.`,
  colors: {
    primary: '#58CC02',
    primaryDark: '#2F8F24',
    primaryLight: '#E9F9DC',
    yellow: '#FFC83D',
    blue: '#4CA8E8',
    red: '#EA5B5B',
    ink: '#303A32',
    muted: '#89928A',
    border: '#E5EBE2',
    background: '#F7FAF5',
  },
} as const;

/** Auth redirect target; includes the GitHub Pages sub-path when used there. */
export const appOrigin =
  publicUrl(env.VITE_APP_URL).replace(/\/+$/, '') || `${window.location.origin}${basePath}`;
