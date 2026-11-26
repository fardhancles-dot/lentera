import type { PageModule } from '../app/router';
import { followRow } from '../components/follow';
import { icon } from '../components/icons';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Jejaring' };

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const profile = sessionStore.getState().user?.profile;
  if (!profile) return;

  const kind = ctx.path.endsWith('/following') ? 'following' : 'followers';
  const label = kind === 'followers' ? 'Followers' : 'Following';
  const username = profile.username;

  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const count = el('span', { class: 'badge badge--muted', text: 'Memuat…' });
  const listSlot = el('div', { class: 'follow-page__body', attrs: { 'aria-live': 'polite' } });

  const loading = () =>
    el('div', { class: 'inline-loading' }, [el('span', { class: 'spinner' }), 'Memuat akun…']);

  const load = () => {
    listSlot.replaceChildren(loading());
    count.textContent = 'Memuat…';

    const request =
      kind === 'followers'
        ? socialService.getFollowers(username)
        : socialService.getFollowing(username);

    void request
      .then((data) => {
        if (disposed) return;
        const total = kind === 'followers' ? data.followersCount : data.followingCount;
        count.textContent = `${total} akun`;

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
            el('p', {
              class: 'follow-panel__empty',
              text:
                kind === 'followers'
                  ? 'Belum ada followers. Bagikan profilmu agar pemain lain menemukanmu.'
                  : 'Belum mengikuti siapa pun. Cari pemain lewat halaman Teman.',
            }),
          );
          return;
        }

        listSlot.replaceChildren(
          el('ul', { class: 'follow-list follow-list--page' }, data.items.map(followRow)),
        );
      })
      .catch((error: unknown) => {
        if (disposed) return;
        count.textContent = '—';
        const retry = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
          icon('refresh', 16),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        listSlot.replaceChildren(
          el('div', { class: 'follow-page__error' }, [
            el('div', { class: 'banner banner--error' }, [
              icon('alert', 18),
              el('span', {
                text: error instanceof Error ? error.message : `Daftar ${label} gagal dimuat.`,
              }),
            ]),
            retry,
          ]),
        );
      });
  };

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Jejaring',
      title: label,
      subtitle:
        kind === 'followers'
          ? `Akun yang mengikuti @${username}.`
          : `Akun yang diikuti oleh @${username}.`,
    }),
    el('a', { class: 'back-link', attrs: { href: '/profile' } }, [
      icon('arrow-left', 16),
      'Kembali ke Profil',
    ]),
    el('section', { class: 'card follow-page' }, [
      el('div', { class: 'follow-page__head' }, [
        el('h2', { class: 'card__title', text: `Daftar ${label}` }),
        count,
      ]),
      listSlot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'profile', title: label, content });
  load();
}

export { meta, render };
