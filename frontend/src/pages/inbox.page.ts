import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { createFollowButton } from '../components/follow';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import { notificationIndicatorsStore } from '../stores/notificationIndicators.store';
import { sessionStore } from '../stores/session.store';
import type { FollowSuggestion, FollowUserSummary } from '../types/social';
import { el } from '../utils/dom';

const meta = { title: 'Kotak Masuk' };

type InboxTab = 'activity' | 'followers';

const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

function dismissalKey(userId: string): string {
  return `lentera.inbox.dismissed.${userId}`;
}

function readDismissed(userId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(dismissalKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const active = new Set<string>();
    const next: Record<string, number> = {};
    for (const [id, expiry] of Object.entries(parsed)) {
      if (typeof expiry === 'number' && expiry > now) {
        active.add(id);
        next[id] = expiry;
      }
    }
    if (Object.keys(next).length !== Object.keys(parsed).length) {
      window.localStorage.setItem(dismissalKey(userId), JSON.stringify(next));
    }
    return active;
  } catch {
    // Private browsing can reject localStorage; dismissal simply becomes
    // session-only in that case.
    return new Set();
  }
}

function dismiss(userId: string, targetId: string, current: Set<string>): void {
  current.add(targetId);
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(dismissalKey(userId));
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const next: Record<string, number> = {};
    for (const [id, expiry] of Object.entries(parsed)) {
      if (typeof expiry === 'number' && expiry > now) next[id] = expiry;
    }
    next[targetId] = now + DISMISS_TTL_MS;
    window.localStorage.setItem(dismissalKey(userId), JSON.stringify(next));
  } catch {
    // In-memory dismissal still applies to the current page.
  }
}

function relativeTime(value: string): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '';
  const diff = Date.now() - time;
  const minutes = Math.max(0, Math.round(diff / 60_000));
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function emptyCard(title: string, body: string, iconName: Parameters<typeof icon>[0]) {
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon(iconName, 34)]),
    el('h2', { class: 'empty-state__title', text: title }),
    el('p', { class: 'empty-state__body', text: body }),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let disposed = false;
  let activeTab: InboxTab = 'activity';
  let suggestions: FollowSuggestion[] = [];
  let followers: FollowUserSummary[] = [];
  let suggestionsLoaded = false;
  let followersLoaded = false;
  const dismissed = readDismissed(user.id);

  const activityTab = el('button', {
    class: 'inbox-tabs__tab',
    attrs: { type: 'button', 'aria-pressed': 'true' },
  }, ['Aktivitas']);
  const followersTab = el('button', {
    class: 'inbox-tabs__tab',
    attrs: { type: 'button', 'aria-pressed': 'false' },
  }, ['Pengikut Baru']);

  const slot = el('div', { class: 'inbox-body' });

  const refreshButton = el(
    'button',
    { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } },
    [icon('refresh', 16), 'Muat ulang'],
  );

  const loadSuggestions = async (): Promise<void> => {
    suggestionsLoaded = false;
    const payload = await socialService.getFollowSuggestions(20);
    suggestions = payload;
    suggestionsLoaded = true;
  };

  const loadFollowers = async (): Promise<void> => {
    followersLoaded = false;
    followers = await socialService.getNewFollowers(30);
    followersLoaded = true;
  };

  const renderBody = () => {
    activityTab.setAttribute('aria-pressed', String(activeTab === 'activity'));
    followersTab.setAttribute('aria-pressed', String(activeTab === 'followers'));

    if (activeTab === 'activity') {
      const visible = suggestions.filter((item) => !dismissed.has(item.userId));
      if (!suggestionsLoaded) {
        slot.replaceChildren(
          el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Memuat rekomendasi…']),
        );
        return;
      }
      if (visible.length === 0) {
        slot.replaceChildren(
          emptyCard(
            'Tidak ada rekomendasi',
            'Semua rekomendasi sudah disembunyikan. Muat ulang untuk melihat akun lain.',
            'inbox',
          ),
        );
        return;
      }

      slot.replaceChildren(
        el(
          'ul',
          { class: 'inbox-list' },
          visible.map((item) => suggestionRow(item)),
        ),
      );
      return;
    }

    if (!followersLoaded) {
      slot.replaceChildren(
        el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Memuat pengikut baru…']),
      );
      return;
    }
    if (followers.length === 0) {
      slot.replaceChildren(
        emptyCard(
          'Belum ada pengikut baru',
          'Akun yang mulai mengikuti kamu akan tampil di sini, terbaru di atas.',
          'users',
        ),
      );
      return;
    }

    slot.replaceChildren(
      el('ul', { class: 'inbox-list' }, followers.map((item) => followerRow(item))),
    );
  };

  const suggestionRow = (item: FollowSuggestion): HTMLElement => {
    const hide = el('button', {
      class: 'icon-btn inbox-row__dismiss',
      attrs: { type: 'button', 'aria-label': `Sembunyikan rekomendasi @${item.username}`, title: 'Sembunyikan' },
    });
    hide.append(icon('close', 18));

    const row = el('li', { class: 'inbox-row' }, [
      avatar(item.avatarKey, 'md', item.avatarUrl),
      el('span', { class: 'inbox-row__meta' }, [
        el('a', {
          class: 'inbox-row__name',
          attrs: { href: `/players/${encodeURIComponent(item.username)}` },
          text: item.displayName,
        }),
        el('span', { class: 'inbox-row__handle', text: `@${item.username}` }),
        item.bio ? el('span', { class: 'inbox-row__note', text: item.bio }) : null,
      ]),
      el('span', { class: 'inbox-row__actions' }, [
        createFollowButton({
          userId: item.userId,
          username: item.username,
          isFollowing: false,
        }),
        hide,
      ]),
    ]);

    hide.addEventListener('click', () => {
      dismiss(user.id, item.userId, dismissed);
      row.classList.add('inbox-row--leaving');
      window.setTimeout(() => {
        if (row.isConnected) row.remove();
        if (!disposed && slot.querySelectorAll('.inbox-row').length === 0) renderBody();
      }, 180);
    });

    return row;
  };

  const followerRow = (item: FollowUserSummary): HTMLElement => {
    const action = item.isFriend
      ? el('span', { class: 'badge', text: 'Teman' })
      : item.isFollowing
        ? el('span', { class: 'badge badge--muted', text: 'Following' })
        : createFollowButton({
            userId: item.userId,
            username: item.username,
            isFollowing: false,
            followLabel: 'Follow Back',
            onChange: () => {
              void loadFollowers()
                .then(() => {
                  if (!disposed) renderBody();
                })
                .catch((error: unknown) => {
                  showToast(
                    error instanceof Error ? error.message : 'Daftar pengikut gagal dimuat.',
                    'error',
                  );
                });
            },
          });

    return el('li', { class: 'inbox-row' }, [
      avatar(item.avatarKey, 'md', item.avatarUrl),
      el('span', { class: 'inbox-row__meta' }, [
        el('a', {
          class: 'inbox-row__name',
          attrs: { href: `/players/${encodeURIComponent(item.username)}` },
          text: item.displayName,
        }),
        el('span', { class: 'inbox-row__handle', text: `@${item.username}` }),
        el('span', { class: 'inbox-row__note', text: `Mengikuti kamu ${relativeTime(item.followedAt)}` }),
      ]),
      el('span', { class: 'inbox-row__actions' }, [action]),
    ]);
  };

  const switchTab = (tab: InboxTab) => {
    if (activeTab === tab) return;
    activeTab = tab;
    renderBody();
    void ensureLoaded();
  };

  activityTab.addEventListener('click', () => switchTab('activity'));
  followersTab.addEventListener('click', () => switchTab('followers'));

  const ensureLoaded = async (): Promise<void> => {
    try {
      await Promise.all([loadSuggestions(), loadFollowers()]);
      if (!disposed) {
        followersTab.textContent = `Pengikut Baru${followers.length ? ` ${followers.length}` : ''}`;
        renderBody();
        void notificationIndicatorsStore.markInboxRead();
      }
    } catch (error) {
      if (disposed) return;
      slot.replaceChildren(
        el('div', { class: 'banner banner--error' }, [
          icon('alert', 18),
          el('span', {
            text: error instanceof Error ? error.message : 'Kotak masuk gagal dimuat.',
          }),
        ]),
      );
    }
  };

  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    slot.replaceChildren(
      el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Memuat ulang…']),
    );
    void ensureLoaded().finally(() => {
      refreshButton.disabled = false;
    });
  });

  ctx.onCleanup(() => {
    disposed = true;
  });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Sosial',
      title: 'Kotak Masuk',
      subtitle: 'Rekomendasi akun untuk diikuti dan siapa saja yang baru mengikuti kamu.',
      actions: [refreshButton],
    }),
    el('section', { class: 'card inbox-card' }, [
      el('div', { class: 'inbox-tabs', attrs: { role: 'group', 'aria-label': 'Navigasi kotak masuk' } }, [
        activityTab,
        followersTab,
      ]),
      slot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'inbox', title: 'Kotak Masuk', content });
  renderBody();
  void ensureLoaded();
}

export { meta, render };
