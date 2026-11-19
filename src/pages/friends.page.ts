import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { createFollowButton } from '../components/follow';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import type {
  ActivityItem,
  FriendsPayload,
  FriendSummary,
  PlayerSearchResult,
} from '../types/social';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Teman' };

function emptyState(title: string, body: string, iconName: Parameters<typeof icon>[0] = 'users') {
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon(iconName, 34)]),
    el('h2', { class: 'empty-state__title', text: title }),
    el('p', { class: 'empty-state__body', text: body }),
  ]);
}

function friendRow(
  friend: FriendSummary,
  onRemove: (friend: FriendSummary) => Promise<void>,
): HTMLElement {
  const remove = el('button', {
    class: 'btn btn--ghost btn--sm',
    attrs: { type: 'button' },
    text: 'Hapus',
  });
  remove.addEventListener('click', () => {
    if (!window.confirm(`Hapus ${friend.displayName} dari daftar teman?`)) return;
    remove.disabled = true;
    void onRemove(friend).catch(() => {
      remove.disabled = false;
    });
  });

  return el('li', { class: 'friend-row' }, [
    avatar(friend.avatarKey, 'md', friend.avatarUrl),
    el('span', { class: 'friend-row__meta' }, [
      el('a', {
        class: 'friend-row__name',
        attrs: { href: `/players/${encodeURIComponent(friend.username)}` },
        text: friend.displayName,
      }),
      el('span', {
        class: 'friend-row__handle',
        text: `@${friend.username} · Level ${friend.level}`,
      }),
      el('span', { class: 'friend-row__stats' }, [
        el('span', {
          class: 'badge badge--blue',
          text: `${formatNumber(friend.weeklyXp)} XP minggu ini`,
        }),
        friend.friendStreak > 0
          ? el('span', { class: 'badge badge--warm' }, [
              icon('flame', 13),
              `${friend.friendStreak} hari bersama`,
            ])
          : null,
      ]),
    ]),
    el('span', { class: 'friend-row__actions' }, [remove]),
  ]);
}

function activityRow(item: ActivityItem): HTMLElement {
  return el('li', { class: 'activity-row' }, [
    avatar(item.avatarKey, 'sm'),
    el('span', { class: 'activity-row__meta' }, [
      el('span', {}, [
        el('a', {
          class: 'activity-row__name',
          attrs: { href: `/players/${encodeURIComponent(item.username)}` },
          text: item.displayName,
        }),
        ` ${item.label}`,
      ]),
      el('span', {
        class: 'activity-row__time',
        text: new Date(item.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        }),
      }),
    ]),
    item.kind === 'achievement'
      ? el('span', { class: 'badge' }, [icon('trophy', 13), 'Pencapaian'])
      : el('span', { class: 'activity-row__xp', text: `+${formatNumber(item.amount)} XP` }),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const searchInput = el('input', {
    class: 'input',
    attrs: {
      type: 'search',
      name: 'player-search',
      placeholder: 'Cari username atau nama…',
      'aria-label': 'Cari pemain',
      autocomplete: 'off',
      minlength: '2',
      maxlength: '30',
    },
  });
  const searchButton = el('button', { class: 'btn btn--sm', attrs: { type: 'submit' } }, [
    icon('users', 16),
    'Cari',
  ]);
  const searchForm = el('form', { class: 'friend-search' }, [searchInput, searchButton]);
  const searchSlot = el('div');
  const friendsSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat teman…' }),
  ]);

  const loadFriends = () => {
    friendsSlot.className = 'loading-screen';
    friendsSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat teman…' }),
    );

    void Promise.all([socialService.getFriends(), socialService.getFriendActivity(5)])
      .then(([payload, activity]) => {
        if (disposed || !friendsSlot.isConnected) return;
        friendsSlot.className = '';
        friendsSlot.replaceChildren(friendsContent(payload, activity, loadFriends));
      })
      .catch((error: unknown) => {
        if (disposed || !friendsSlot.isConnected) return;
        friendsSlot.className = '';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', loadFriends);
        friendsSlot.replaceChildren(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Teman gagal dimuat' }),
            el('p', {
              class: 'empty-state__body',
              text: error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
            }),
            retry,
          ]),
        );
      });
  };

  const search = () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchSlot.replaceChildren(
        el('p', { class: 'form-hint', text: 'Ketik minimal dua karakter.' }),
      );
      return;
    }
    searchButton.disabled = true;
    searchSlot.replaceChildren(
      el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Mencari…']),
    );

    void socialService
      .searchPlayers(query)
      .then((results) => {
        if (disposed || !searchSlot.isConnected) return;
        if (results.length === 0) {
          searchSlot.replaceChildren(
            emptyState(
              'Pemain tidak ditemukan',
              'Periksa ejaan username atau nama tampilan.',
              'users',
            ),
          );
          return;
        }
        searchSlot.replaceChildren(
          el(
            'ul',
            { class: 'friend-results' },
            results.map((result) => searchResultRow(result, loadFriends, search)),
          ),
        );
      })
      .catch((error: unknown) => {
        if (disposed || !searchSlot.isConnected) return;
        searchSlot.replaceChildren(
          el('p', {
            class: 'form-error',
            text: error instanceof Error ? error.message : 'Pencarian gagal.',
          }),
        );
      })
      .finally(() => {
        if (!disposed) searchButton.disabled = false;
      });
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    search();
  });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Tahap 7 · sosial',
      title: 'Teman',
      subtitle:
        'Teman terbentuk otomatis saat kalian saling Follow. Cari pemain, ikuti, dan lihat XP serta streak bersama.',
      actions: [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/leaderboard' } }, [
          icon('trophy', 16),
          'Liga',
        ]),
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/friends-quest' } }, [
          icon('flag', 16),
          'Friends Quest',
        ]),
      ],
    }),
    el('section', { class: 'card friend-search-card' }, [
      el('h2', { class: 'card__title', text: 'Cari pemain' }),
      el('p', {
        class: 'card__subtitle',
        text: 'Gunakan username atau nama tampilan. Follow balik untuk menjadi teman.',
      }),
      searchForm,
      searchSlot,
    ]),
    friendsSlot,
  ]);

  renderAppLayout(ctx, { active: 'friends', title: 'Teman', content });
  loadFriends();
}

function searchResultRow(
  result: PlayerSearchResult,
  reload: () => void,
  refreshSearch: () => void,
): HTMLElement {
  const actionSlot = el('span', { class: 'friend-row__actions' });

  const onChange = () => {
    reload();
    refreshSearch();
  };

  if (result.isFriend) {
    actionSlot.append(el('span', { class: 'badge', text: 'Teman' }));
  } else {
    actionSlot.append(
      createFollowButton({
        userId: result.userId,
        username: result.username,
        isFollowing: result.isFollowing,
        onChange,
      }),
    );
  }

  return el('li', { class: 'friend-row' }, [
    avatar(result.avatarKey, 'sm', result.avatarUrl),
    el('span', { class: 'friend-row__meta' }, [
      el('a', {
        class: 'friend-row__name',
        attrs: { href: `/players/${encodeURIComponent(result.username)}` },
        text: result.displayName,
      }),
      el('span', { class: 'friend-row__handle', text: `@${result.username}` }),
      result.bio ? el('span', { class: 'friend-row__bio', text: result.bio }) : null,
    ]),
    actionSlot,
  ]);
}

function friendsContent(
  payload: FriendsPayload,
  activity: ActivityItem[],
  reload: () => void,
): HTMLElement {
  const remove = async (friend: FriendSummary) => {
    try {
      await socialService.removeFriend(friend.userId);
      showToast(`${friend.displayName} dihapus dari daftar teman.`, 'default');
      reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Teman gagal dihapus.', 'error');
      throw error;
    }
  };

  return el('div', { class: 'friends-layout' }, [
    el('div', { class: 'friends-main' }, [
      el('section', { class: 'card friend-section' }, [
        el('div', { class: 'friend-section__head' }, [
          el('h2', { class: 'card__title', text: 'Daftar Temanmu' }),
          el('span', { class: 'badge', text: String(payload.friends.length) }),
        ]),
        el('p', {
          class: 'card__subtitle',
          text: 'Hanya pemain yang saling Follow yang tampil di sini.',
        }),
        payload.friends.length > 0
          ? el(
              'ul',
              { class: 'friend-list' },
              payload.friends.map((friend) => friendRow(friend, remove)),
            )
          : emptyState(
              'Belum punya teman',
              'Cari pemain di atas, Follow mereka, dan tunggu Follow balik.',
            ),
      ]),
    ]),
    el('aside', { class: 'friends-aside' }, [
      el('section', { class: 'card friend-section' }, [
        el('h2', { class: 'card__title', text: 'Aktivitas teman' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Lima aktivitas terbaru dari lingkaranmu, terbaru di paling atas.',
        }),
        activity.length > 0
          ? el('ul', { class: 'activity-list' }, activity.map(activityRow))
          : emptyState(
              'Belum ada aktivitas',
              'Aktivitas muncul setelah kamu atau temanmu menyelesaikan lesson.',
              'sparkles',
            ),
      ]),
    ]),
  ]);
}

export { meta, render };
