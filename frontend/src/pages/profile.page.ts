import type { PageModule } from '../app/router';
import { avatar, avatarMarkup } from '../components/avatar';
import { icon, type IconName } from '../components/icons';
import {
  createLevelProgress,
  levelProgressError,
  tierBadge,
} from '../components/levelProgress';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatDate, trapFocus } from '../utils/dom';

const meta = { title: 'Profil' };

const ROLE_LABEL = {
  player: 'Pemain',
  admin: 'Admin',
  developer: 'Developer',
} as const;

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const { profile, settings, role } = user;
  let closePhotoViewer: (() => void) | null = null;
  let disposed = false;

  ctx.onCleanup(() => {
    disposed = true;
    closePhotoViewer?.();
  });

  const nameEl = el('h2', {
    class: 'profile-hero__name',
    text: profile.display_name || profile.username,
  });
  const handleEl = el('p', { class: 'profile-hero__handle', text: `@${profile.username}` });
  const accountId = String(profile.account_number ?? '').replace(/\D/g, '');
  const accountIdEl = el('p', {
    class: 'profile-hero__id',
    text: accountId ? `ID ${accountId}` : 'ID —',
  });
  const bioEl = el('p', {
    class: 'profile-hero__bio',
    text: profile.bio || 'Belum ada bio. Ceritakan sedikit tentang dirimu.',
  });
  const tierSlot = el('div', { class: 'profile-hero__tier' });
  const levelSlot = el('div', { class: 'profile-hero__level' });
  const followersCountEl = el('span', { class: 'profile-social__value', text: '…' });
  const followingCountEl = el('span', { class: 'profile-social__value', text: '…' });

  const socialLink = (
    href: string,
    label: string,
    countEl: HTMLElement,
  ): HTMLAnchorElement =>
    el(
      'a',
      {
        class: 'profile-social__link',
        attrs: { href, 'aria-label': `Lihat daftar ${label}` },
      },
      [el('span', { class: 'profile-social__label', text: label }), countEl],
    );

  const menu = el('div', {
    class: 'avatar-menu',
    attrs: { role: 'menu', 'aria-label': 'Menu foto profil' },
  });
  menu.hidden = true;

  const avatarButton = el(
    'button',
    {
      class: 'profile-hero__avatar-btn',
      attrs: {
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        'aria-label': 'Buka menu foto profil',
      },
    },
    [avatar(profile.avatar_key, 'xl', profile.avatar_url)],
  );

  const editLink = el(
    'a',
    {
      class: 'avatar-menu__item',
      attrs: { href: '/profile/edit', role: 'menuitem' },
    },
    [icon('settings', 18), el('span', { text: 'Edit Profile' })],
  );

  const viewPhoto = el(
    'button',
    {
      class: 'avatar-menu__item',
      attrs: { type: 'button', role: 'menuitem' },
    },
    [icon('eye', 18), el('span', { text: 'Lihat Profile' })],
  );

  menu.append(editLink, viewPhoto);

  const avatarSlot = el('div', { class: 'profile-hero__avatar' }, [avatarButton, menu]);

  const setMenuOpen = (open: boolean) => {
    menu.hidden = !open;
    menu.dataset.open = String(open);
    avatarButton.setAttribute('aria-expanded', String(open));
  };

  avatarButton.addEventListener('click', () => setMenuOpen(menu.hidden));

  const onDocumentClick = (event: MouseEvent) => {
    if (menu.hidden) return;
    if (!(event.target instanceof Node)) return;
    if (avatarSlot.contains(event.target)) return;
    setMenuOpen(false);
  };

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenuOpen(false);
      avatarButton.focus();
    }
  };

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeyDown);
  ctx.onCleanup(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeyDown);
  });

  viewPhoto.addEventListener('click', () => {
    setMenuOpen(false);
    closePhotoViewer = openProfilePhotoViewer(profile.avatar_key, profile.avatar_url);
  });

  const hero = el('section', { class: 'profile-hero' }, [
    el('div', { class: 'profile-hero__banner' }),
    el('div', { class: 'profile-hero__body' }, [
      avatarSlot,
      el('div', { class: 'profile-hero__main' }, [
        el('div', { class: 'profile-hero__top' }, [
          el('div', { class: 'profile-hero__identity' }, [nameEl, handleEl, accountIdEl]),
          tierSlot,
        ]),
        levelSlot,
        el('div', { class: 'profile-hero__badges' }, [
          el('span', { class: 'badge badge--muted', text: ROLE_LABEL[role] }),
          el('span', { class: 'badge badge--blue' }, [
            icon('clock', 12),
            `Bergabung ${formatDate(profile.created_at)}`,
          ]),
        ]),
        bioEl,
        el('div', { class: 'profile-social' }, [
          socialLink('/profile/followers', 'Followers', followersCountEl),
          socialLink('/profile/following', 'Following', followingCountEl),
        ]),
      ]),
    ]),
  ]);

  let levelProgress: ReturnType<typeof createLevelProgress> | null = null;

  const paintLevel = (state: PlayerStoreState) => {
    if (state.data) {
      const level = state.data.level;
      tierSlot.replaceChildren(tierBadge(level.title));

      if (levelProgress?.element.isConnected) {
        levelProgress.update(level.level, level.progressPercent);
      } else {
        levelProgress = createLevelProgress(level.level, level.progressPercent);
        levelSlot.replaceChildren(levelProgress.element);
      }
      return;
    }

    if (state.status === 'error') {
      levelSlot.replaceChildren(levelProgressError());
    }
  };

  ctx.onCleanup(playerStore.subscribe(paintLevel));
  paintLevel(playerStore.getState());
  void playerStore.load();

  void socialService
    .getFriendProfile(profile.username)
    .then((data) => {
      if (disposed) return;
      followersCountEl.textContent = String(data.followersCount);
      followingCountEl.textContent = String(data.followingCount);
    })
    .catch(() => {
      if (disposed) return;
      followersCountEl.textContent = '—';
      followingCountEl.textContent = '—';
    });

  const accountCard = el('section', { class: 'card card--padded profile-account' }, [
    el('h2', { class: 'card__title', text: 'Informasi akun' }),
    el('p', {
      class: 'card__subtitle',
      text: 'Target belajar dan zona waktu yang dipakai akunmu.',
    }),
    el('div', { class: 'profile-account__grid' }, [
      accountItem('target', 'Target harian', `${settings.daily_goal_minutes} menit`),
      accountItem('globe', 'Zona waktu', settings.timezone.replace('_', ' ')),
    ]),
    el('div', { class: 'profile-account__meta' }, [
      infoRow('Peran', el('span', { class: 'badge badge--muted', text: ROLE_LABEL[role] })),
      infoRow('Diperbarui', formatDate(profile.updated_at)),
    ]),
  ]);

  const privacyCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Privasi profil' }),
    el('p', {
      class: 'card__subtitle',
      text: 'Pemain lain hanya dapat melihat username, nama tampilan, avatar, dan bio.',
    }),
    el('div', { class: 'summary-list', style: { marginTop: '1rem' } }, [
      infoRow(
        'Statistik',
        el('span', {
          class: 'badge badge--muted',
          text:
            settings.profile_visibility === 'public'
              ? 'Public'
              : settings.profile_visibility === 'private'
                ? 'Privat'
                : 'Teman',
        }),
      ),
      infoRow(
        'Daftar Following',
        el('span', {
          class: 'badge',
          text: settings.following_privacy === 'public' ? 'Public' : 'Privat',
        }),
      ),
    ]),
  ]);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Akun',
      title: 'Profil',
      subtitle:
        'Klik foto profilmu untuk mengedit profil. Buka Followers atau Following untuk melihat daftar akun.',
    }),
    hero,
    el('div', { class: 'dashboard-grid profile-detail-grid', style: { marginTop: '1.25rem' } }, [
      el('div', { class: 'dashboard-main' }, [accountCard]),
      el('div', { class: 'dashboard-aside' }, [privacyCard]),
    ]),
  ]);

  renderAppLayout(ctx, { active: 'profile', title: 'Profil', content });
}

function infoRow(label: string, value: Node | string): HTMLElement {
  return el('div', { class: 'summary-list__row' }, [
    el('span', { class: 'summary-list__label', text: label }),
    el('span', { class: 'summary-list__value' }, [value]),
  ]);
}

function accountItem(iconName: IconName, label: string, value: string): HTMLElement {
  return el('div', { class: 'profile-account__item' }, [
    el('span', { class: 'profile-account__icon' }, [icon(iconName, 18)]),
    el('span', { class: 'profile-account__copy' }, [
      el('span', { class: 'profile-account__label', text: label }),
      el('span', { class: 'profile-account__value', text: value }),
    ]),
  ]);
}

/**
 * Full-screen photo viewer. It deliberately renders only the picture: no
 * username, stats, email, or bio exists in this DOM.
 */
function openProfilePhotoViewer(avatarKey: string, avatarUrl: string | null): () => void {
  const closeButton = el('button', {
    class: 'profile-photo-viewer__close',
    attrs: { type: 'button', 'aria-label': 'Tutup foto profil' },
  });
  closeButton.append(icon('close', 24));

  const picture = avatarUrl
    ? el('img', {
        class: 'profile-photo-viewer__image',
        attrs: { src: avatarUrl, alt: 'Foto profil' },
      })
    : el('div', {
        class: 'profile-photo-viewer__image profile-photo-viewer__image--art',
        html: avatarMarkup(avatarKey, 720),
      });

  const overlay = el(
    'div',
    {
      class: 'profile-photo-viewer',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Foto profil',
      },
    },
    [closeButton, picture],
  );

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.append(overlay);
  const releaseFocus = trapFocus(overlay);
  closeButton.focus({ preventScroll: true });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    releaseFocus();
    overlay.remove();
    document.body.style.overflow = previousOverflow;
    document.removeEventListener('keydown', onKeyDown);
    closeButton.removeEventListener('click', close);
    overlay.removeEventListener('click', onClick);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (event.target === overlay) close();
  };

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);

  return close;
}

export { meta, render };
