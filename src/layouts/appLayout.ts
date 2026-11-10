import type { RouteContext } from '../app/router';
import { avatar } from '../components/avatar';
import { kikoMarkup, lampMarkup } from '../components/brandArt';
import { icon, iconMarkup, type IconName } from '../components/icons';
import { showToast } from '../components/toast';
import { brand } from '../config/brand';
import { audioEngine } from '../game/audio/audioEngine';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

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
  { key: 'settings', href: '/settings', label: 'Pengaturan', shortLabel: 'Atur', icon: 'settings' },
];

/**
 * Eight items do not fit a 390px phone without shrinking labels below a
 * comfortable size. Wallet and Settings stay one tap away through the topbar
 * resource chips and gear, so the bottom bar keeps six real navigation targets.
 */
const MOBILE_NAV_KEYS: readonly NavKey[] = [
  'home',
  'learn',
  'practice',
  'quests',
  'shop',
  'profile',
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

export function renderAppLayout(ctx: RouteContext, options: AppLayoutOptions): void {
  const state = sessionStore.getState();
  const user = state.user;
  if (!user) return;

  const displayName = user.profile.display_name || user.profile.username;

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
      el('span', { class: 'brand__mark', html: lampMarkup(30) }),
      el('span', { class: 'brand__text' }, [
        el('span', { class: 'brand__name', text: brand.name }),
        el('span', { class: 'brand__tag', text: brand.tagline }),
      ]),
    ]),
    el(
      'nav',
      { class: 'sidebar__nav', attrs: { 'aria-label': 'Menu' } },
      NAV_ITEMS.map((item) => navLink(item, options.active, false)),
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

  const coinValue = el('span', { class: 'resource-chip__value', text: '—' });
  const heartsValue = el('span', { class: 'resource-chip__value', text: '—' });
  const streakValue = el('span', { class: 'resource-chip__value', text: '—' });
  const heartsChip = el(
    'a',
    {
      class: 'resource-chip resource-chip--hearts',
      attrs: { href: '/wallet', 'aria-label': 'Buka Hearts di wallet', title: 'Hearts' },
    },
    [icon('heart', 16), heartsValue],
  );

  const resourceBar = el('div', { class: 'resource-bar', attrs: { 'aria-label': 'Ringkasan progres' } }, [
    el(
      'a',
      {
        class: 'resource-chip resource-chip--coin',
        attrs: { href: '/wallet', 'aria-label': 'Buka Koin di wallet', title: 'Koin' },
      },
      [icon('coin', 16), coinValue],
    ),
    heartsChip,
    el(
      'a',
      {
        class: 'resource-chip resource-chip--streak',
        attrs: { href: '/wallet', 'aria-label': 'Buka Streak di wallet', title: 'Streak harian' },
      },
      [icon('flame', 16), streakValue],
    ),
  ]);

  const paintResources = (state: PlayerStoreState) => {
    const data = state.data;
    coinValue.textContent = data ? formatNumber(data.coins) : '—';
    heartsValue.textContent = data ? `${data.hearts.current}/${data.hearts.max}` : '—';
    streakValue.textContent = data ? String(data.streak.current) : '—';
    heartsChip.classList.toggle('resource-chip--low', Boolean(data && data.hearts.current <= 1));
    heartsChip.setAttribute(
      'title',
      data
        ? `Hearts ${data.hearts.current}/${data.hearts.max}`
        : 'Hearts',
    );
  };

  paintResources(playerStore.getState());
  const unsubscribePlayer = playerStore.subscribe(paintResources);
  ctx.onCleanup(unsubscribePlayer);
  void playerStore.load();

  const muteButton = el('button', {
    class: 'icon-btn',
    attrs: {
      type: 'button',
      title: 'Bisukan suara',
      'aria-label': 'Bisukan suara',
      'aria-pressed': String(audioEngine.isMuted()),
    },
    html: iconMarkup(audioEngine.isMuted() ? 'volume-off' : 'volume', 20),
  });
  muteButton.addEventListener('click', () => {
    const muted = audioEngine.toggleMuted();
    muteButton.setAttribute('aria-pressed', String(muted));
    muteButton.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Bisukan suara');
    muteButton.setAttribute('title', muted ? 'Nyalakan suara' : 'Bisukan suara');
    muteButton.innerHTML = iconMarkup(muted ? 'volume-off' : 'volume', 20);
  });

  const topbar = el('header', { class: 'topbar' }, [
    el('a', { class: 'topbar__mobile-brand', attrs: { href: '/app' } }, [
      el('span', { class: 'brand__mark', html: lampMarkup(24) }),
      el('span', { text: brand.name }),
    ]),
    el('span', { class: 'topbar__title', text: options.title }),
    el('div', { class: 'topbar__actions' }, [
      resourceBar,
      muteButton,
      el(
        'a',
        {
          class: 'icon-btn',
          attrs: { href: '/settings', 'aria-label': 'Pengaturan', title: 'Pengaturan' },
        },
        [icon('settings', 20)],
      ),
      el('a', {
        class: 'icon-btn',
        attrs: { href: '/profile', 'aria-label': 'Buka profil' },
        style: { padding: '3px' },
      }, [avatar(user.profile.avatar_key, 'xs')]),
    ]),
  ]);

  const main = el(
    'main',
    { class: 'shell__main', attrs: { id: 'main', tabindex: '-1' } },
    [el('div', { class: 'page' }, [options.content])],
  );

  const bottomNav = el(
    'nav',
    { class: 'bottom-nav', attrs: { 'aria-label': 'Navigasi cepat' } },
    NAV_ITEMS.filter((item) => MOBILE_NAV_KEYS.includes(item.key)).map((item) =>
      navLink(item, options.active, true),
    ),
  );

  ctx.outlet.append(
    el('div', { class: 'shell' }, [
      sidebar,
      el('div', { class: 'shell__body' }, [topbar, main]),
      bottomNav,
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
