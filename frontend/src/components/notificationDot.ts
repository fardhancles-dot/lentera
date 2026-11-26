import { el } from '../utils/dom';

export interface NotificationDot {
  root: HTMLElement;
  setActive: (active: boolean) => void;
}

/**
 * A single visual badge. It is purely presentational: hidden by default and
 * never changes the size of its host. Screen readers get the state from the
 * navigation link's aria-label, so the dot itself stays decorative.
 */
export function createNotificationDot(): NotificationDot {
  const root = el('span', {
    class: 'notification-dot',
    attrs: { 'aria-hidden': 'true' },
  });
  root.dataset.active = 'false';

  return {
    root,
    setActive(active: boolean) {
      root.dataset.active = String(active);
    },
  };
}
