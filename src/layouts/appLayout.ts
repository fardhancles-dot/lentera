import type { RouteContext } from '../app/router';
import { avatar } from '../components/avatar';
import { kikoMarkup } from '../components/brandArt';
import { brandMark } from '../components/brandMark';
import { icon, type IconName } from '../components/icons';
import { showToast } from '../components/toast';
import { contentService } from '../services/content.service';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber, trapFocus } from '../utils/dom';

export type NavKey =
  | 'home'
  | 'learn'
  | 'practice'
  | 'wallet'
  | 'quests'
  | 'friends'
  | 'leaderboard'
  | 'notifications'
  | 'shop'
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
  { key: 'notifications', href: '/notifications', label: 'Notifikasi', shortLabel: 'Kabar', icon: 'bell' },
  { key: 'shop', href: '/shop', label: 'Toko', shortLabel: 'Toko', icon: 'gift' },
  { key: 'profile', href: '/profile', label: 'Profil', shortLabel: 'Profil', icon: 'user' },
  { key: 'developer', href: '/admin', label: 'Admin', shortLabel: 'Admin', icon: 'shield' },
  { key: 'settings', href: '/settings', label: 'Pengaturan', shortLabel: 'Atur', icon: 'settings' },
];

/**
 * Five primary destinations fit comfortably across a phone without shrinking
 * labels. Toko lives in the topbar, Wallet stays reachable from the resource
 * chips, and the remaining community pages live in the hamburger drawer.
 */
const MOBILE_NAV_KEYS: readonly NavKey[] = [
  'home',
  'learn',
  'practice',
  'quests',
  'profile',
];

const DRAWER_NAV_KEYS: readonly NavKey[] = [
  'settings',
  'leaderboard',
  'notifications',
  'friends',
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

  if (compact) {
    const iconWrap = el('span', { class: 'bottom-nav__icon' });
    iconWrap.append(icon(item.icon, 22));
    link.append(iconWrap, el('span', { text: item.shortLabel }));
  } else {
    const iconWrap = el('span', { class: 'nav-item__icon' });
    iconWrap.append(icon(item.icon, 20));
    link.append(iconWrap, el('span', { text: item.label }));
  }

  return link;
}

function drawerNavLink(item: NavItem, active: NavKey): HTMLAnchorElement {
  return el(
    'a',
    {
      class: 'drawer-nav__item',
      attrs: {
        href: item.href,
        'aria-current': item.key === active ? 'page' : null,
      },
    },
    [
      el('span', { class: 'drawer-nav__icon' }, [icon(item.icon, 20)]),
      el('span', { class: 'drawer-nav__label', text: item.label }),
      el('span', { class: 'drawer-nav__chevron' }, [icon('chevron-right', 18)]),
    ],
  );
}

interface ResourceView {
  root: HTMLElement;
  paint: (state: PlayerStoreState) => void;
}

function resourceChips(layout: 'mobile' | 'desktop'): ResourceView {
  const coinValue = el('span', { class: 'resource-chip__value', text: '—' });
  const heartsValue = el('span', { class: 'resource-chip__value', text: '—' });
  const streakValue = el('span', { class: 'resource-chip__value', text: '—' });

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
    [icon('coin', 16), coinValue],
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
    [icon('heart', 16), heartsValue],
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
    [icon('flame', 16), streakValue],
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
    coinValue.textContent = data ? formatNumber(data.coins) : '—';
    heartsValue.textContent = data ? `${data.hearts.current}/${data.hearts.max}` : '—';
    streakValue.textContent = data ? String(data.streak.current) : '—';
    heartsChip.classList.toggle('resource-chip--low', Boolean(data && data.hearts.current <= 1));
    heartsChip.setAttribute(
      'title',
      data ? `Nyawa ${data.hearts.current}/${data.hearts.max}` : 'Nyawa',
    );
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
  const drawerItems = DRAWER_NAV_KEYS.map(
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
    avatar(user.profile.avatar_key, 'sm'),
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
    [avatar(user.profile.avatar_key, 'xs')],
  );

  const shopButton = el(
    'a',
    {
      class: 'icon-btn header-shop',
      attrs: { href: '/shop', 'aria-label': 'Toko', title: 'Toko' },
    },
    [icon('bag', 20)],
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

  const drawerLinks = drawerItems.map((item) => drawerNavLink(item, options.active));

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
    [icon('menu', 22)],
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
    [avatar(user.profile.avatar_key, 'xs')],
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
