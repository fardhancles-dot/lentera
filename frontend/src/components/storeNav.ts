import { icon, type IconName } from './icons';
import { el } from '../utils/dom';

export type StoreTab = 'shop' | 'inventory';

const TABS: { key: StoreTab; href: string; label: string; icon: IconName }[] = [
  { key: 'shop', href: '/shop', label: 'Toko', icon: 'gift' },
  { key: 'inventory', href: '/inventory', label: 'Tas', icon: 'bag' },
];

/** Shared local navigation so Toko and Tas never hide each other. */
export function storeNav(active: StoreTab): HTMLElement {
  return el(
    'nav',
    { class: 'store-tabs', attrs: { 'aria-label': 'Toko dan Tas' } },
    TABS.map((tab) =>
      el(
        'a',
        {
          class: 'store-tabs__link',
          attrs: {
            href: tab.href,
            'aria-current': tab.key === active ? 'page' : null,
          },
        },
        [icon(tab.icon, 17), el('span', { text: tab.label })],
      ),
    ),
  );
}
