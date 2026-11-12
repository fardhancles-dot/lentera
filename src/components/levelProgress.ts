import { icon } from './icons';
import { el } from '../utils/dom';

export interface LevelProgressHandle {
  element: HTMLElement;
  update: (level: number, progressPercent: number | null) => void;
}

function clampPercent(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Compact level meter used by both the private and public profile. It only
 * renders the level and its server-derived progress; the tier name lives in a
 * separate badge beside the player's identity.
 */
export function createLevelProgress(
  level: number,
  progressPercent: number | null,
): LevelProgressHandle {
  const label = el('span', { class: 'profile-level__label' });
  const fill = el('span', { class: 'profile-level__fill' });
  const track = el(
    'div',
    {
      class: 'profile-level__track',
      attrs: {
        role: 'progressbar',
        'aria-label': `Progres level ${level}`,
        'aria-valuemin': '0',
        'aria-valuemax': '100',
      },
    },
    [fill],
  );

  const element = el('div', { class: 'profile-level' }, [
    el('div', { class: 'profile-level__head' }, [label]),
    track,
  ]);

  let currentLevel = level;
  let currentPercent = progressPercent;

  const paint = (animate: boolean) => {
    const percent = clampPercent(currentPercent);
    label.textContent = `LV ${currentLevel}`;
    track.setAttribute('aria-label', `Progres level ${currentLevel}`);

    if (percent === null) {
      track.removeAttribute('aria-valuenow');
      track.removeAttribute('aria-valuetext');
      element.dataset.pending = 'true';
      fill.style.width = '0%';
      return;
    }

    element.dataset.pending = 'false';
    track.setAttribute('aria-valuenow', String(percent));
    track.setAttribute('aria-valuetext', `${percent}%`);

    if (animate) {
      fill.style.width = `${percent}%`;
      return;
    }

    fill.style.width = '0%';
    requestAnimationFrame(() => {
      const latest = clampPercent(currentPercent);
      if (latest !== null) fill.style.width = `${latest}%`;
    });
  };

  paint(false);

  return {
    element,
    update(nextLevel: number, nextPercent: number | null) {
      currentLevel = nextLevel;
      currentPercent = nextPercent;
      paint(true);
    },
  };
}

export function tierBadge(title: string): HTMLElement {
  return el('span', { class: 'profile-tier', attrs: { title: `Tingkatan: ${title}` } }, [
    icon('star', 12),
    el('span', { text: title }),
  ]);
}

export function levelProgressError(): HTMLElement {
  return el('div', { class: 'profile-level profile-level--error' }, [
    el('span', { class: 'small muted', text: 'Progres belum dapat dimuat.' }),
  ]);
}
