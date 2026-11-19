import type { RouteContext } from '../app/router';
import { avatar } from '../components/avatar';
import { kikoMarkup } from '../components/brandArt';
import { brandMark } from '../components/brandMark';
import { icon, type IconName } from '../components/icons';
import { createNotificationDot } from '../components/notificationDot';
import { resourceIcon } from '../components/resourceIcons';
import { showToast } from '../components/toast';
import { contentService } from '../services/content.service';
import {
  notificationIndicatorsStore,
  type NotificationIndicatorsState,
} from '../stores/notificationIndicators.store';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber, trapFocus } from '../utils/dom';
import { drawerIndicatorActive, indicatorActive } from '../utils/notificationIndicators';

export type NavKey =
  | 'home'
  | 'learn'
  | 'practice'
  | 'wallet'
  | 'quests'
  | 'friends'
  | 'leaderboard'
  | 'inbox'
  | 'notifications'
  | 'shop'
  | 'inventory'
  | 'profile'
  | 'developer'
  | 'settings';

interface NavItem {
  key: NavKey;
  href: string;
  label: string;
  shortLabel: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/app', label: 'Beranda', shortLabel: 'Beranda', icon: 'home' },
  { key: 'learn', href: '/learn', label: 'Belajar', shortLabel: 'Belajar', icon: 'map' },
  { key: 'practice', href: '/practice', label: 'Latihan', shortLabel: 'Latihan', icon: 'target' },
  { key: 'wallet', href: '/wallet', label: 'Wallet', shortLabel: 'Wallet', icon: 'bag' },
  { key: 'quests', href: '/quests', label: 'Misi', shortLabel: 'Misi', icon: 'flag' },
  { key: 'friends', href: '/friends', label: 'Teman', shortLabel: 'Teman', icon: 'users' },
  { key: 'leaderboard', href: '/leaderboard', label: 'Liga', shortLabel: 'Liga', icon: 'trophy' },
  { key: 'inbox', href: '/inbox', label: 'Kotak Masuk', shortLabel: 'Kotak', icon: 'inbox' },
  { key: 'notifications', href: '/notifications', label: 'Notifikasi', shortLabel: 'Kabar', icon: 'bell' },
  { key: 'shop', href: '/shop', label: 'Toko', shortLabel: 'Toko', icon: 'gift' },
  { key: 'inventory', href: '/inventory', label: 'Tas', shortLabel: 'Tas', icon: 'bag' },
  { key: 'profile', href: '/profile', label: 'Profil', shortLabel: 'Profil', icon: 'user' },
  { key: 'developer', href: '/admin', label: 'Admin', shortLabel: 'Admin', icon: 'shield' },
  { key: 'settings', href: '/settings', label: 'Pengaturan', shortLabel: 'Atur', icon: 'settings' },
];

/**
 * Five primary destinations fit comfortably across a phone without shrinking
 * labels. Toko stays in the topbar, Tas and the community pages live in the
 * hamburger drawer, and Wallet stays reachable from the resource chips.
 */
const MOBILE_NAV_KEYS: readonly NavKey[] = [
  'home',
  'learn',
  'practice',
  'quests',
  'profile',
];

/**
 * Drawer-only destinations. Toko is intentionally absent because it already
 * has a dedicated button beside the hamburger; duplicating it in the drawer
 * made the same page reachable twice on mobile.
 */
const DRAWER_NAV_KEYS: readonly NavKey[] = [
  'friends',
  'leaderboard',
  'inventory',
  'inbox',
  'notifications',
  'settings',
];

export interface AppLayoutOptions {
  active: NavKey;
  title: string;
  content: HTMLElement;
}

function navLink(item: NavItem, active: NavKey, compact: boolean): HTMLAnchorElement {
  const link = el('a', {
    class: compact ? 'bottom-nav__item' : 'nav-item',
    attrs: {
      href: item.href,
      'aria-current': item.key === active ? 'page' : null,
    },
  });
  link.dataset.navKey = item.key;

  const iconWrap = el('span', {
    class: `${compact ? 'bottom-nav__icon' : 'nav-item__icon'} notification-dot-host`,
  });
  iconWrap.append(icon(item.icon, compact ? 22 : 20), createNotificationDot().root);

  if (compact) {
    link.append(iconWrap, el('span', { text: item.shortLabel }));
  } else {
    link.append(iconWrap, el('span', { text: item.label }));
  }

  return link;
}

function drawerNavLink(
  item: NavItem,
  active: NavKey,
  label = item.label,
): HTMLAnchorElement {
  const link = el(
    'a',
    {
      class: 'drawer-nav__item',
      attrs: {
        href: item.href,
        'aria-current': item.key === active ? 'page' : null,
      },
    },
    [
      el('span', { class: 'drawer-nav__icon notification-dot-host' }, [
        icon(item.icon, 20),
        createNotificationDot().root,
      ]),
      el('span', { class: 'drawer-nav__label', text: label }),
      el('span', { class: 'drawer-nav__chevron' }, [icon('chevron-right', 18)]),
    ],
  );
  link.dataset.navKey = item.key;
  return link;
}

interface ResourceView {
  root: HTMLElement;
  paint: (state: PlayerStoreState) => void;
}

function resourceChips(layout: 'mobile' | 'desktop'): ResourceView {
  const coinValue = el('span', { class: 'resource-chip__value', text: '—' });
  const heartsValue = el('span', { class: 'resource-chip__value', text: '—' });
  const streakValue = el('span', { class: 'resource-chip__value', text: '—' });
  let lastHearts: number | null = null;
  let lastCoins: number | null = null;
  let heartAnimationTimer = 0;
  let coinAnimationTimer = 0;

  const coinChip = el(
    'a',
    {
      class: 'resource-chip resource-chip--coin',
      attrs: {
        href: '/wallet',
        'aria-label': 'Buka Koin di wallet',
        title: 'Koin',
      },
    },
    [resourceIcon('coin'), coinValue],
  );

  const heartsChip = el(
    'a',
    {
      class: 'resource-chip resource-chip--hearts',
      attrs: {
        href: '/wallet',
        'aria-label': 'Buka Nyawa di wallet',
        title: 'Nyawa',
      },
    },
    [resourceIcon('heart'), heartsValue],
  );

  const streakChip = el(
    'a',
    {
      class: 'resource-chip resource-chip--streak',
      attrs: {
        href: '/wallet',
        'aria-label': 'Buka Streak di wallet',
        title: 'Streak harian',
      },
    },
    [resourceIcon('streak'), streakValue],
  );

  if (layout === 'mobile') {
    for (const chip of [coinChip, heartsChip, streakChip]) {
      chip.classList.add('header-resource');
    }
  }

  const root = el(
    'div',
    {
      class: layout === 'mobile' ? 'header-resources' : 'resource-bar',
      attrs: { 'aria-label': 'Ringkasan progres' },
    },
    layout === 'mobile' ? [heartsChip, coinChip, streakChip] : [coinChip, heartsChip, streakChip],
  );

  const paint = (state: PlayerStoreState) => {
    const data = state.data;
    const hearts = data ? data.hearts.current : null;
    const coins = data ? data.coins : null;
    coinValue.textContent = data ? formatNumber(data.coins) : '—';
    // The header shows the current hearts only; the maximum stays in the title
    // and accessible label for context without printing "/5" in the UI.
    heartsValue.textContent = data ? String(data.hearts.current) : '—';
    streakValue.textContent = data ? String(data.streak.current) : '—';
    heartsChip.classList.toggle('resource-chip--low', Boolean(data && data.hearts.current <= 1));
    heartsChip.setAttribute('title', data ? `Nyawa ${data.hearts.current}` : 'Nyawa');
    heartsChip.setAttribute(
      'aria-label',
      data
        ? `Buka Nyawa di wallet, ${data.hearts.current} dari ${data.hearts.max}`
        : 'Buka Nyawa di wallet',
    );
    streakChip.setAttribute(
      'title',
      data ? `Streak ${data.streak.current} hari` : 'Streak harian',
    );

    if (hearts !== null && lastHearts !== null && hearts < lastHearts) {
      window.clearTimeout(heartAnimationTimer);
      heartsChip.classList.remove('is-losing');
      void heartsChip.offsetWidth;
      heartsChip.classList.add('is-losing');
      heartAnimationTimer = window.setTimeout(
        () => heartsChip.classList.remove('is-losing'),
        700,
      );
    }
    if (coins !== null && lastCoins !== null && coins > lastCoins) {
      window.clearTimeout(coinAnimationTimer);
      coinChip.classList.remove('is-gaining');
      void coinChip.offsetWidth;
      coinChip.classList.add('is-gaining');
      coinAnimationTimer = window.setTimeout(
        () => coinChip.classList.remove('is-gaining'),
        900,
      );
    }
    lastHearts = hearts;
    lastCoins = coins;
  };

  return { root, paint };
}

export function renderAppLayout(ctx: RouteContext, options: AppLayoutOptions): void {
  const state = sessionStore.getState();
  const user = state.user;
  if (!user) return;

  const displayName = user.profile.display_name || user.profile.username;
  const isStaff = user.role === 'developer' || user.role === 'admin';
  const site = contentService.settings;
  const visibleNav = NAV_ITEMS.filter((item) => item.key !== 'developer' || isStaff);
  // Players get Teman → Liga → Tas → Kotak Masuk → Notifikasi → Pengaturan.
  // Staff sees the same order with Admin Dashboard directly below Pengaturan.
  // The /admin route is still guarded by the router and every admin RPC, not
  // by this menu alone.
  const drawerKeys: readonly NavKey[] = isStaff
    ? [...DRAWER_NAV_KEYS, 'developer']
    : DRAWER_NAV_KEYS;
  const drawerItems = drawerKeys.map(
    (key) => NAV_ITEMS.find((item) => item.key === key)!,
  );

  const logoutButton = el(
    'button',
    {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': 'Keluar dari akun', title: 'Keluar' },
      events: {
        click: () => {
          void (async () => {
            logoutButton.disabled = true;
            notificationIndicatorsStore.clear();
            await sessionStore.signOut();
            showToast('Kamu sudah keluar. Sampai jumpa!', 'success');
            ctx.navigate('/login', { replace: true });
          })();
        },
      },
    },
    [icon('logout', 20)],
  );

  const userChip = el('a', { class: 'user-chip', attrs: { href: '/profile' } }, [
    avatar(user.profile.avatar_key, 'sm', user.profile.avatar_url),
    el('span', { class: 'user-chip__meta' }, [
      el('span', { class: 'user-chip__name', text: displayName }),
      el('span', { class: 'user-chip__handle', text: `@${user.profile.username}` }),
    ]),
  ]);

  const sidebar = el('aside', { class: 'sidebar', attrs: { 'aria-label': 'Navigasi utama' } }, [
    el('a', { class: 'brand', attrs: { href: '/app' } }, [
      brandMark(30),
      el('span', { class: 'brand__text' }, [
        el('span', { class: 'brand__name', text: site.siteName }),
        el('span', { class: 'brand__tag', text: site.tagline }),
      ]),
    ]),
    el(
      'nav',
      { class: 'sidebar__nav', attrs: { 'aria-label': 'Menu' } },
      visibleNav.map((item) => navLink(item, options.active, false)),
    ),
    el('div', { class: 'sidebar__tip' }, [
      el('span', { class: 'sidebar__tip-art', html: kikoMarkup(72) }),
      el('p', { class: 'sidebar__tip-title', text: 'Kiko berkata' }),
      el('p', {
        class: 'sidebar__tip-body',
        text: 'Belajar sepuluh menit setiap hari lebih ampuh daripada dua jam sekali seminggu.',
      }),
    ]),
    el('div', { class: 'sidebar__footer' }, [
      userChip,
      el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [logoutButton]),
    ]),
  ]);

  const desktopResources = resourceChips('desktop');
  const mobileResources = resourceChips('mobile');

  const mobileAvatar = el(
    'a',
    {
      class: 'header-avatar',
      attrs: { href: '/profile', 'aria-label': 'Buka profil' },
    },
    [avatar(user.profile.avatar_key, 'xs', user.profile.avatar_url)],
  );

  const shopButton = el(
    'a',
    {
      class: 'icon-btn header-shop',
      attrs: { href: '/shop', 'aria-label': 'Toko', title: 'Toko' },
    },
    [icon('cart', 20)],
  );

  const drawerPanel = el('aside', {
    class: 'drawer',
    attrs: {
      id: 'app-drawer',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Menu tambahan',
      tabindex: '-1',
    },
  });

  const closeDrawerButton = el(
    'button',
    {
      class: 'icon-btn drawer__close',
      attrs: { type: 'button', 'aria-label': 'Tutup menu' },
    },
    [icon('close', 20)],
  );

  const drawerLinks = drawerItems.map((item) =>
    drawerNavLink(
      item,
      options.active,
      item.key === 'developer' ? 'Admin Dashboard' : item.label,
    ),
  );

  drawerPanel.append(
    el('div', { class: 'drawer__header' }, [
      el('span', { class: 'drawer__brand' }, [
        brandMark(26),
        el('span', { class: 'drawer__brand-name', text: site.siteName }),
      ]),
      closeDrawerButton,
    ]),
    el(
      'nav',
      { class: 'drawer__nav', attrs: { 'aria-label': 'Menu tambahan' } },
      drawerLinks,
    ),
  );

  const hamburgerDot = createNotificationDot();
  const hamburgerButton = el(
    'button',
    {
      class: 'icon-btn header-hamburger',
      attrs: {
        type: 'button',
        'aria-label': 'Buka menu',
        'aria-expanded': 'false',
        'aria-controls': 'app-drawer',
      },
    },
    [
      el('span', { class: 'icon-btn__glyph notification-dot-host' }, [
        icon('menu', 22),
        hamburgerDot.root,
      ]),
    ],
  );

  const drawerBackdrop = el('div', { class: 'drawer__backdrop' });
  const drawerLayer = el(
    'div',
    {
      class: 'drawer-layer',
      attrs: { 'data-open': 'false', 'aria-hidden': 'true' },
    },
    [drawerBackdrop, drawerPanel],
  );

  let focusTrap: (() => void) | null = null;
  let lastFocused: HTMLElement | null = null;
  let drawerOpen = false;

  const openDrawer = () => {
    if (drawerOpen) return;
    drawerOpen = true;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hamburgerButton.setAttribute('aria-expanded', 'true');
    drawerLayer.dataset.open = 'true';
    drawerLayer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('app-drawer-open');
    focusTrap = trapFocus(drawerPanel);
    closeDrawerButton.focus();
  };

  const closeDrawer = (restoreFocus = false) => {
    if (!drawerOpen) return;
    drawerOpen = false;
    hamburgerButton.setAttribute('aria-expanded', 'false');
    drawerLayer.dataset.open = 'false';
    drawerLayer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('app-drawer-open');
    focusTrap?.();
    focusTrap = null;
    if (restoreFocus) (lastFocused ?? hamburgerButton).focus();
  };

  hamburgerButton.addEventListener('click', openDrawer);
  closeDrawerButton.addEventListener('click', () => closeDrawer(true));
  drawerBackdrop.addEventListener('click', () => closeDrawer(true));
  for (const link of drawerLinks) {
    link.addEventListener('click', () => closeDrawer(false));
  }

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && drawerOpen) {
      event.preventDefault();
      closeDrawer(true);
    }
  };
  document.addEventListener('keydown', onDocumentKeyDown);
  ctx.onCleanup(() => {
    document.removeEventListener('keydown', onDocumentKeyDown);
    focusTrap?.();
    document.documentElement.classList.remove('app-drawer-open');
  });

  const mobileHeader = el('div', { class: 'topbar__mobile' }, [
    hamburgerButton,
    shopButton,
    mobileResources.root,
    mobileAvatar,
  ]);

  const desktopAvatar = el(
    'a',
    {
      class: 'topbar__avatar',
      attrs: { href: '/profile', 'aria-label': 'Buka profil' },
    },
    [avatar(user.profile.avatar_key, 'xs', user.profile.avatar_url)],
  );

  const desktopActions = el('div', { class: 'topbar__actions' }, [
    desktopResources.root,
    isStaff
      ? el(
          'a',
          {
            class: 'icon-btn',
            attrs: {
              href: '/admin',
              'aria-label': 'Admin Dashboard',
              title: 'Admin Dashboard',
            },
          },
          [icon('code', 20)],
        )
      : null,
    el(
      'a',
      {
        class: 'icon-btn',
        attrs: { href: '/settings', 'aria-label': 'Pengaturan', title: 'Pengaturan' },
      },
      [icon('settings', 20)],
    ),
    desktopAvatar,
  ]);

  const topbar = el('header', { class: 'topbar' }, [
    mobileHeader,
    el('span', { class: 'topbar__title', text: options.title }),
    desktopActions,
  ]);

  const paintResources = (playerState: PlayerStoreState) => {
    desktopResources.paint(playerState);
    mobileResources.paint(playerState);
  };

  paintResources(playerStore.getState());
  const unsubscribePlayer = playerStore.subscribe(paintResources);
  ctx.onCleanup(unsubscribePlayer);
  void playerStore.load();

  const announcementSlot = el('div', { class: 'site-announcements' });
  if (site.maintenanceMode) {
    announcementSlot.append(
      el('div', { class: 'site-announcement site-announcement--maintenance', attrs: { role: 'status' } }, [
        el('span', { class: 'site-announcement__icon' }, [icon('clock', 18)]),
        el('div', { class: 'site-announcement__body' }, [
          el('strong', { text: 'Mode pemeliharaan aktif' }),
          el('span', {
            text: 'Aksi yang mengubah data sedang dinonaktifkan sementara. Kamu masih bisa membaca konten yang sudah ada.',
          }),
        ]),
      ]),
    );
  }
  void contentService
    .getAnnouncements()
    .then((items) => {
      if (items.length === 0) return;
      announcementSlot.append(
        ...items.slice(0, 3).map((item) =>
          el('div', { class: 'site-announcement', attrs: { role: 'status' } }, [
            el('span', { class: 'site-announcement__icon' }, [icon('bell', 18)]),
            el('div', { class: 'site-announcement__body' }, [
              el('strong', { text: item.title }),
              item.body ? el('span', { text: item.body }) : null,
            ]),
            item.link
              ? el('a', {
                  class: 'btn btn--secondary btn--sm',
                  attrs: { href: item.link },
                  text: 'Lihat',
                })
              : null,
          ]),
        ),
      );
    })
    .catch(() => undefined);

  const main = el(
    'main',
    { class: 'shell__main', attrs: { id: 'main', tabindex: '-1' } },
    [announcementSlot, el('div', { class: 'page' }, [options.content])],
  );

  const bottomNav = el(
    'nav',
    { class: 'bottom-nav', attrs: { 'aria-label': 'Navigasi cepat' } },
    MOBILE_NAV_KEYS.map((key) =>
      navLink(NAV_ITEMS.find((item) => item.key === key)!, options.active, true),
    ),
  );

  ctx.outlet.append(
    el('div', { class: 'shell' }, [
      sidebar,
      el('div', { class: 'shell__body' }, [topbar, main]),
      bottomNav,
      drawerLayer,
    ]),
  );

  const navIndicatorLinks = Array.from(
    ctx.outlet.querySelectorAll<HTMLAnchorElement>('a[data-nav-key]'),
  ).map((link) => ({
    key: link.dataset.navKey ?? '',
    link,
    dot: link.querySelector<HTMLElement>('.notification-dot'),
    label: NAV_ITEMS.find((item) => item.key === link.dataset.navKey)?.label ?? '',
  }));

  const paintIndicators = (indicatorState: NotificationIndicatorsState) => {
    for (const control of navIndicatorLinks) {
      const active = indicatorActive(control.key, indicatorState.counts);
      control.dot?.setAttribute('data-active', String(active));
      if (active) {
        control.link.setAttribute('aria-label', `${control.label}, ada aktivitas baru`);
      } else {
        control.link.removeAttribute('aria-label');
      }
    }

    const drawerActive = drawerIndicatorActive(indicatorState.counts);
    hamburgerDot.setActive(drawerActive);
    hamburgerButton.setAttribute(
      'aria-label',
      drawerActive ? 'Buka menu, ada aktivitas baru' : 'Buka menu',
    );
  };

  paintIndicators(notificationIndicatorsStore.getState());
  ctx.onCleanup(notificationIndicatorsStore.subscribe(paintIndicators));

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void notificationIndicatorsStore.load();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  ctx.onCleanup(() => document.removeEventListener('visibilitychange', onVisibilityChange));
  void notificationIndicatorsStore.load();
}

export function pageHeader(options: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: HTMLElement[];
}): HTMLElement {
  return el('div', { class: 'page-header' }, [
    el('div', {}, [
      options.eyebrow
        ? el('span', { class: 'page-header__eyebrow' }, [
            icon('sparkles', 14),
            el('span', { text: options.eyebrow }),
          ])
        : null,
      el('h1', { class: 'page-header__title', text: options.title }),
      options.subtitle ? el('p', { class: 'page-header__subtitle', text: options.subtitle }) : null,
    ]),
    options.actions?.length
      ? el('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } }, options.actions)
      : null,
  ]);
}
