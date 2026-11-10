import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { icon } from '../components/icons';
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

  const finish = (message: string) => {
    showToast(message, 'success');
    reload();
  };

  if (profile.isSelf) {
    slot.append(
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/profile' } }, [
        icon('user', 16),
        'Edit profil',
      ]),
    );
    return slot;
  }

  if (profile.isFriend) {
    const remove = el('button', { class: 'btn btn--ghost btn--sm', attrs: { type: 'button' } }, [
      icon('users', 16),
      'Hapus teman',
    ]);
    remove.addEventListener('click', () => {
      if (!window.confirm(`Hapus ${profile.displayName} dari daftar teman?`)) return;
      remove.disabled = true;
      void socialService
        .removeFriend(profile.userId)
        .then(() => finish('Teman dihapus.'))
        .catch((error: unknown) => {
          remove.disabled = false;
          showToast(error instanceof Error ? error.message : 'Gagal menghapus teman.', 'error');
        });
    });
    slot.append(remove);
    return slot;
  }

  if (profile.relation === 'outgoing') {
    slot.append(el('span', { class: 'badge badge--muted', text: 'Menunggu jawaban' }));
    return slot;
  }

  if (profile.relation === 'incoming' && profile.requestId) {
    const accept = el('button', { class: 'btn btn--sm', attrs: { type: 'button' } }, [
      icon('check', 16),
      'Terima pertemanan',
    ]);
    const decline = el('button', { class: 'btn btn--ghost btn--sm', attrs: { type: 'button' } }, [
      'Tolak',
    ]);
    accept.addEventListener('click', () => {
      accept.disabled = true;
      void socialService
        .respondFriendRequest(profile.requestId!, true)
        .then(() => finish(`Kamu dan ${profile.displayName} sekarang berteman.`))
        .catch((error: unknown) => {
          accept.disabled = false;
          showToast(error instanceof Error ? error.message : 'Permintaan gagal diterima.', 'error');
        });
    });
    decline.addEventListener('click', () => {
      decline.disabled = true;
      void socialService
        .respondFriendRequest(profile.requestId!, false)
        .then(() => finish('Permintaan ditolak.'))
        .catch((error: unknown) => {
          decline.disabled = false;
          showToast(error instanceof Error ? error.message : 'Permintaan gagal ditolak.', 'error');
        });
    });
    slot.append(accept, decline);
    return slot;
  }

  const add = el('button', { class: 'btn btn--sm', attrs: { type: 'button' } }, [
    icon('users', 16),
    'Tambah teman',
  ]);
  add.addEventListener('click', () => {
    add.disabled = true;
    void socialService
      .sendFriendRequest(profile.username)
      .then(() => finish(`Permintaan dikirim ke ${profile.displayName}.`))
      .catch((error: unknown) => {
        add.disabled = false;
        showToast(error instanceof Error ? error.message : 'Permintaan gagal dikirim.', 'error');
      });
  });
  slot.append(add);
  return slot;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const username = ctx.params.username ?? '';
  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const slot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat profil…' }),
  ]);

  const load = () => {
    slot.className = 'loading-screen';
    slot.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat profil…' }));
    void socialService
      .getFriendProfile(username)
      .then((profile) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        document.title = `${profile.displayName} · Lentera`;
        slot.replaceChildren(profileCard(profile, load));
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

function profileCard(profile: FriendProfile, reload: () => void): HTMLElement {
  return el('div', { class: 'player-layout' }, [
    el('section', { class: 'card player-card' }, [
      el('div', { class: 'player-card__top' }, [
        avatar(profile.avatarKey, 'xl'),
        el('div', { class: 'player-card__identity' }, [
          el('h2', { class: 'player-card__name', text: profile.displayName }),
          el('p', { class: 'player-card__handle', text: `@${profile.username}` }),
          profile.statsVisible && profile.level
            ? el('span', {
                class: 'badge badge--blue',
                text: `Level ${profile.level}${profile.levelTitle ? ` · ${profile.levelTitle}` : ''}`,
              })
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
    ]),
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
                  : 'Tambahkan sebagai teman untuk melihat statistik belajar.',
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
