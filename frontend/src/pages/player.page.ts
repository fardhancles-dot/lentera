import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { createFollowButton, createFollowPanel, type FollowPanelHandle } from '../components/follow';
import { icon } from '../components/icons';
import { createLevelProgress, tierBadge } from '../components/levelProgress';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import type { FriendProfile } from '../types/social';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Profil pemain' };

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'player-stat' }, [
    el('span', { class: 'player-stat__value', text: value }),
    el('span', { class: 'player-stat__label', text: label }),
  ]);
}

function visibilityLabel(profile: FriendProfile): string {
  if (profile.visibility === 'private') return 'Privat — hanya pemilik yang melihat statistik.';
  if (profile.visibility === 'friends') return 'Hanya teman yang melihat statistik.';
  return 'Statistik terbuka untuk semua pemain.';
}

function actionSlot(profile: FriendProfile, reload: () => void): HTMLElement {
  const slot = el('span', { class: 'player-actions' });

  if (profile.isSelf) {
    slot.append(
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/profile/edit' } }, [
        icon('settings', 16),
        'Edit Profile',
      ]),
    );
    return slot;
  }

  if (profile.isFriend) {
    slot.append(el('span', { class: 'badge', text: 'Teman' }));

    const remove = el('button', { class: 'btn btn--ghost btn--sm', attrs: { type: 'button' } }, [
      icon('users', 16),
      'Hapus teman',
    ]);
    remove.addEventListener('click', () => {
      if (!window.confirm(`Hapus ${profile.displayName} dari daftar teman?`)) return;
      remove.disabled = true;
      void socialService
        .removeFriend(profile.userId)
        .then(() => {
          showToast('Teman dihapus.', 'success');
          reload();
        })
        .catch((error: unknown) => {
          remove.disabled = false;
          showToast(error instanceof Error ? error.message : 'Gagal menghapus teman.', 'error');
        });
    });
    slot.append(remove);
    return slot;
  }

  slot.append(
    createFollowButton({
      userId: profile.userId,
      username: profile.username,
      isFollowing: profile.isFollowing,
      onChange: () => reload(),
    }),
  );

  if (profile.followsYou) {
    slot.append(el('span', { class: 'badge badge--muted', text: 'Mengikuti kamu' }));
  }

  return slot;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const username = ctx.params.username ?? '';
  let disposed = false;
  let followPanel: FollowPanelHandle | null = null;

  ctx.onCleanup(() => {
    disposed = true;
    followPanel?.destroy();
    followPanel = null;
  });

  const slot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat profil…' }),
  ]);

  const load = () => {
    followPanel?.destroy();
    followPanel = null;
    slot.className = 'loading-screen';
    slot.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat profil…' }));
    void socialService
      .getFriendProfile(username)
      .then((profile) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        document.title = `${profile.displayName} · Lentera`;
        followPanel = createFollowPanel({ username: profile.username });
        slot.replaceChildren(profileCard(profile, load, followPanel.element));
      })
      .catch((error: unknown) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        slot.replaceChildren(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('user', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Profil tidak dapat dimuat' }),
            el('p', {
              class: 'empty-state__body',
              text: error instanceof Error ? error.message : 'Pemain mungkin tidak ada.',
            }),
            el('div', { class: 'empty-state__actions' }, [
              el('a', { class: 'btn btn--secondary', attrs: { href: '/friends' } }, [
                'Kembali ke Teman',
              ]),
              retry,
            ]),
          ]),
        );
      });
  };

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Profil pemain',
      title: 'Komunitas Lentera',
      subtitle: 'Statistik dibagikan sesuai pengaturan privasi masing-masing pemain.',
    }),
    slot,
  ]);

  renderAppLayout(ctx, { active: 'friends', title: 'Profil pemain', content });
  load();
}

function profileCard(
  profile: FriendProfile,
  reload: () => void,
  followPanel: HTMLElement,
): HTMLElement {
  const canSeeLevel = profile.statsVisible && profile.level !== null;

  return el('div', { class: 'player-layout' }, [
    el('section', { class: 'card player-card' }, [
      el('div', { class: 'player-card__top' }, [
        avatar(profile.avatarKey, 'xl', profile.avatarUrl),
        el('div', { class: 'player-card__identity' }, [
          el('div', { class: 'player-card__name-row' }, [
            el('h2', { class: 'player-card__name', text: profile.displayName }),
            canSeeLevel && profile.levelTitle ? tierBadge(profile.levelTitle) : null,
          ]),
          el('p', { class: 'player-card__handle', text: `@${profile.username}` }),
          canSeeLevel
            ? createLevelProgress(profile.level!, profile.levelProgressPercent).element
            : null,
        ]),
        actionSlot(profile, reload),
      ]),
      profile.bio
        ? el('p', { class: 'player-card__bio', text: profile.bio })
        : el('p', { class: 'player-card__bio muted', text: 'Belum menulis bio.' }),
      el('p', { class: 'player-card__privacy' }, [
        icon('shield', 14),
        visibilityLabel(profile),
      ]),
      profile.followingPrivate && !profile.isSelf
        ? el('p', { class: 'player-card__privacy' }, [
            icon('lock', 14),
            'Daftar Following pemain ini privat.',
          ])
        : null,
    ]),
    followPanel,
    profile.statsVisible
      ? el('section', { class: 'card player-stats' }, [
          el('h2', { class: 'card__title', text: 'Statistik belajar' }),
          el('div', { class: 'player-stats__grid' }, [
            stat('Total XP', formatNumber(profile.totalXp ?? 0)),
            stat('XP minggu ini', formatNumber(profile.weeklyXp ?? 0)),
            stat('Streak saat ini', `${formatNumber(profile.currentStreak ?? 0)} hari`),
            stat('Streak terpanjang', `${formatNumber(profile.longestStreak ?? 0)} hari`),
            stat('Lesson selesai', formatNumber(profile.completedLessons ?? 0)),
            stat('Pencapaian', formatNumber(profile.achievements ?? 0)),
          ]),
        ])
      : el('section', { class: 'card player-locked' }, [
          el('span', { class: 'player-locked__icon' }, [icon('lock', 28)]),
          el('div', {}, [
            el('h2', { class: 'card__title', text: 'Statistik disembunyikan' }),
            el('p', {
              class: 'card__subtitle',
              text:
                profile.visibility === 'private'
                  ? 'Pemain ini memilih profil privat.'
                  : 'Ikuti dan saling follow untuk membuka statistik belajar.',
            }),
          ]),
        ]),
    el('div', { class: 'player-layout__links' }, [
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/friends' } }, [
        icon('arrow-left', 16),
        'Teman',
      ]),
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/leaderboard' } }, [
        icon('trophy', 16),
        'Liga & Peringkat',
      ]),
    ]),
  ]);
}

export { meta, render };
