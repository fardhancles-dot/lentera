import { icon, type IconName } from './icons';
import type { PlayerState } from '../types/player';
import { el, formatNumber } from '../utils/dom';

function stat(iconName: IconName, label: string, value: string, tone?: string): HTMLElement {
  return el('div', { class: `player-stat${tone ? ` player-stat--${tone}` : ''}` }, [
    el('span', { class: 'player-stat__icon' }, [icon(iconName, 18)]),
    el('span', { class: 'player-stat__meta' }, [
      el('span', { class: 'player-stat__value', text: value }),
      el('span', { class: 'player-stat__label', text: label }),
    ]),
  ]);
}

export function playerProgressPanel(state: PlayerState): HTMLElement {
  const { level, hearts, streak } = state;
  const fill = el('span', { class: 'xp-bar__fill' });
  fill.style.width = `${level.progressPercent}%`;

  return el('div', { class: 'player-progress' }, [
    el('div', { class: 'player-progress__head' }, [
      el('span', { class: 'level-badge' }, [
        icon('star', 18),
        el('span', { text: `Lv ${level.level}` }),
      ]),
      el('div', { class: 'player-progress__identity' }, [
        el('p', { class: 'player-progress__title', text: level.title }),
        el('p', {
          class: 'player-progress__meta',
          text:
            level.nextLevelXp === null
              ? `${formatNumber(state.totalXp)} XP · level maksimal`
              : `${formatNumber(state.totalXp)} XP · ${formatNumber(level.xpToNext)} XP lagi ke Lv ${level.level + 1}`,
        }),
      ]),
    ]),
    el(
      'div',
      {
        class: 'xp-bar',
        attrs: {
          role: 'progressbar',
          'aria-label': `Progres level ${level.level}`,
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-valuenow': String(level.progressPercent),
        },
      },
      [fill],
    ),
    el('div', { class: 'player-progress__stats' }, [
      stat('coin', 'Koin', formatNumber(state.coins)),
      stat(
        'heart',
        hearts.current <= 1 ? 'Hearts — segera isi' : 'Hearts',
        `${hearts.current}/${hearts.max}`,
        hearts.current <= 1 ? 'danger' : undefined,
      ),
      stat('flame', 'Streak', `${streak.current} hari`, streak.current > 0 ? 'warm' : undefined),
      stat('sparkles', 'XP hari ini', `+${formatNumber(state.todayXp)}`),
    ]),
  ]);
}

export function playerProgressSkeleton(): HTMLElement {
  return el('div', { class: 'player-progress player-progress--loading' }, [
    el('span', { class: 'spinner' }),
    el('p', { class: 'small muted', text: 'Memuat progres akun…' }),
  ]);
}

export function playerProgressError(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);

  return el('div', { class: 'player-progress player-progress--error' }, [
    el('p', { class: 'small', text: message }),
    button,
  ]);
}

export function formatRefillCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds === 0) return 'Penuh';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}j ${minutes % 60}m`;
  }
  return `${minutes}m ${String(rest).padStart(2, '0')}d`;
}
