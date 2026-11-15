import { avatar } from './avatar';
import { icon } from './icons';
import { showToast } from './toast';
import { socialService } from '../services/social.service';
import type { FollowActionResult, FollowListPayload, FollowUserSummary } from '../types/social';
import { el } from '../utils/dom';

export interface FollowButtonOptions {
  userId: string;
  username: string;
  isFollowing: boolean;
  followLabel?: string;
  onChange?: (result: FollowActionResult) => void;
}

/**
 * One toggle for both states. The server decides the real counts and mutual
 * friend state; the button only reflects the result it receives.
 */
export function createFollowButton(options: FollowButtonOptions): HTMLButtonElement {
  let following = options.isFollowing;
  let busy = false;

  const button = el('button', {
    class: `btn btn--sm ${following ? 'btn--secondary' : ''}`,
    attrs: { type: 'button', 'aria-pressed': String(following) },
  });

  const paint = () => {
    button.replaceChildren(
      icon(following ? 'check' : 'plus', 15),
      document.createTextNode(following ? 'Following' : options.followLabel ?? 'Follow'),
    );
    button.setAttribute('aria-pressed', String(following));
    button.classList.toggle('btn--secondary', following);
  };
  paint();

  button.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    button.disabled = true;

    const request = following
      ? socialService.unfollowPlayer(options.userId)
      : socialService.followPlayer(options.username);

    void request
      .then((result) => {
        following = result.isFollowing;
        paint();
        options.onChange?.(result);
        showToast(
          result.isFollowing
            ? result.isFriend
              ? `Kamu dan ${result.username} sekarang berteman.`
              : `Kamu mengikuti @${result.username}.`
            : `Kamu berhenti mengikuti @${result.username}.`,
          result.isFollowing ? 'success' : 'default',
        );
      })
      .catch((error: unknown) => {
        showToast(error instanceof Error ? error.message : 'Aksi follow gagal.', 'error');
      })
      .finally(() => {
        busy = false;
        button.disabled = false;
      });
  });

  return button;
}

export function followRow(user: FollowUserSummary): HTMLElement {
  const badges = el('span', { class: 'follow-row__badges' });
  if (user.isFriend) badges.append(el('span', { class: 'badge', text: 'Teman' }));
  else if (user.isFollowing) {
    badges.append(el('span', { class: 'badge badge--muted', text: 'Following' }));
  }

  return el('li', { class: 'follow-row' }, [
    el('a', { class: 'follow-row__avatar', attrs: { href: `/players/${encodeURIComponent(user.username)}` } }, [
      avatar(user.avatarKey, 'sm', user.avatarUrl),
    ]),
    el('span', { class: 'follow-row__meta' }, [
      el('a', {
        class: 'follow-row__name',
        attrs: { href: `/players/${encodeURIComponent(user.username)}` },
        text: user.displayName,
      }),
      el('span', { class: 'follow-row__handle', text: `@${user.username}` }),
    ]),
    badges,
  ]);
}

export interface FollowPanelHandle {
  element: HTMLElement;
  load: () => void;
  destroy: () => void;
}

/**
 * Followers/Following list for a profile. Following privacy is enforced by the
 * RPC, so a private list arrives as an empty payload with `private: true`.
 */
export function createFollowPanel(options: { username: string }): FollowPanelHandle {
  let disposed = false;
  let active: 'followers' | 'following' = 'followers';
  let followers: FollowListPayload | null = null;
  let following: FollowListPayload | null = null;

  const followersTab = el('button', {
    class: 'follow-tabs__tab',
    attrs: { type: 'button', 'aria-pressed': 'true' },
  });
  const followingTab = el('button', {
    class: 'follow-tabs__tab',
    attrs: { type: 'button', 'aria-pressed': 'false' },
  });
  const listSlot = el('div', { class: 'follow-panel__body' });

  const paintTabs = () => {
    followersTab.textContent = `Followers ${followers ? followers.followersCount : '…'}`;
    followingTab.textContent = `Following ${following ? following.followingCount : '…'}`;
    followersTab.setAttribute('aria-pressed', String(active === 'followers'));
    followingTab.setAttribute('aria-pressed', String(active === 'following'));
  };

  const paint = () => {
    paintTabs();
    const data = active === 'followers' ? followers : following;

    if (!data) {
      listSlot.replaceChildren(
        el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Memuat…']),
      );
      return;
    }

    if (data.private) {
      listSlot.replaceChildren(
        el('div', { class: 'follow-panel__locked' }, [
          icon('lock', 22),
          el('p', { text: 'Daftar Following akun ini bersifat privat.' }),
        ]),
      );
      return;
    }

    if (data.items.length === 0) {
      listSlot.replaceChildren(
        el('p', { class: 'follow-panel__empty', text: active === 'followers' ? 'Belum ada followers.' : 'Belum mengikuti siapa pun.' }),
      );
      return;
    }

    listSlot.replaceChildren(
      el('ul', { class: 'follow-list' }, data.items.map(followRow)),
    );
  };

  const choose = (tab: 'followers' | 'following') => {
    active = tab;
    paint();
  };

  followersTab.addEventListener('click', () => choose('followers'));
  followingTab.addEventListener('click', () => choose('following'));

  const element = el('section', { class: 'card follow-panel' }, [
    el('div', { class: 'follow-panel__head' }, [
      el('h2', { class: 'card__title', text: 'Jejaring' }),
      el('p', { class: 'card__subtitle', text: 'Followers dan akun yang diikuti.' }),
    ]),
    el('div', { class: 'follow-tabs', attrs: { role: 'group', 'aria-label': 'Daftar jejaring' } }, [
      followersTab,
      followingTab,
    ]),
    listSlot,
  ]);

  const load = () => {
    followers = null;
    following = null;
    paint();

    void Promise.all([
      socialService.getFollowers(options.username),
      socialService.getFollowing(options.username),
    ])
      .then(([followerData, followingData]) => {
        if (disposed) return;
        followers = followerData;
        following = followingData;
        paint();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        listSlot.replaceChildren(
          el('div', { class: 'banner banner--error' }, [
            icon('alert', 18),
            el('span', {
              text: error instanceof Error ? error.message : 'Jejaring gagal dimuat.',
            }),
          ]),
        );
      });
  };

  paint();
  load();

  return {
    element,
    load,
    destroy: () => {
      disposed = true;
    },
  };
}
