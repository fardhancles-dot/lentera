import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { socialService } from '../services/social.service';
import { notificationIndicatorsStore } from '../stores/notificationIndicators.store';
import type { NotificationItem } from '../types/social';
import { el, formatDate } from '../utils/dom';

const meta = { title: 'Notifikasi' };

function notificationRow(
  item: NotificationItem,
  onRead: (item: NotificationItem) => void,
  onDelete: (item: NotificationItem) => Promise<void>,
): HTMLElement {
  const mark = el('button', {
    class: 'btn btn--ghost btn--sm',
    attrs: { type: 'button' },
    text: item.read ? 'Dibaca' : 'Tandai dibaca',
  });
  mark.disabled = item.read;

  const actions = el('span', { class: 'notification__actions' });
  actions.append(mark);

  // Only read notifications can be deleted; the database enforces the same
  // rule, so hiding the button is not the protection itself.
  if (item.read) {
    const remove = el('button', {
      class: 'icon-btn notification__delete',
      attrs: {
        type: 'button',
        'aria-label': `Hapus notifikasi ${item.title}`,
        title: 'Hapus notifikasi',
      },
    }, [icon('close', 16)]);
    remove.addEventListener('click', () => {
      remove.disabled = true;
      void onDelete(item).catch(() => {
        remove.disabled = false;
      });
    });
    actions.append(remove);
  }

  const body = el('div', { class: 'notification__body' }, [
    el('p', { class: 'notification__title', text: item.title }),
    item.body ? el('p', { class: 'notification__text', text: item.body }) : null,
    el('span', { class: 'notification__time', text: formatDate(item.createdAt) }),
  ]);

  const content = item.link
    ? el('a', {
        class: 'notification__content',
        attrs: { href: item.link },
        events: { click: () => onRead(item) },
      }, [body])
    : el('div', { class: 'notification__content' }, [body]);

  mark.addEventListener('click', () => onRead(item));

  return el(
    'li',
    { class: `notification${item.read ? '' : ' notification--unread'}` },
    [
      el('span', { class: 'notification__icon' }, [
        icon(
          item.kind === 'league_result'
            ? 'trophy'
            : item.kind.startsWith('friend') || item.kind.startsWith('follow')
              ? 'users'
              : 'bell',
          18,
        ),
      ]),
      content,
      actions,
    ],
  );
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const slot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat notifikasi…' }),
  ]);
  const markAll = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('check', 16),
    'Tandai semua dibaca',
  ]);
  const deleteRead = el('button', { class: 'btn btn--ghost btn--sm', attrs: { type: 'button' } }, [
    icon('close', 16),
    'Hapus semua yang dibaca',
  ]);
  deleteRead.disabled = true;

  const removeOne = async (item: NotificationItem): Promise<void> => {
    try {
      const deleted = await socialService.deleteNotification(item.id);
      if (!deleted) {
        showToast('Notifikasi tidak ditemukan atau belum dibaca.', 'default');
        load();
        return;
      }
      showToast('Notifikasi dihapus.', 'success');
      void notificationIndicatorsStore.refresh();
      load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Notifikasi gagal dihapus.', 'error');
      throw error;
    }
  };

  const removeRead = (): void => {
    if (
      !window.confirm(
        'Hapus semua notifikasi yang sudah dibaca? Notifikasi yang belum dibaca tidak ikut terhapus.',
      )
    ) {
      return;
    }
    deleteRead.disabled = true;
    void socialService
      .deleteReadNotifications()
      .then((deleted) => {
        showToast(
          deleted > 0
            ? `${deleted} notifikasi dibaca dihapus.`
            : 'Tidak ada notifikasi dibaca untuk dihapus.',
          deleted > 0 ? 'success' : 'default',
        );
        void notificationIndicatorsStore.refresh();
        load();
      })
      .catch((error: unknown) => {
        deleteRead.disabled = false;
        showToast(
          error instanceof Error ? error.message : 'Notifikasi gagal dihapus.',
          'error',
        );
      });
  };

  const load = () => {
    slot.className = 'loading-screen';
    slot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat notifikasi…' }),
    );
    void socialService
      .getNotifications()
      .then((payload) => {
        if (disposed || !slot.isConnected) return;
        slot.className = '';
        markAll.disabled = payload.unreadCount === 0;
        deleteRead.disabled = payload.items.every((item) => !item.read);
        if (payload.items.length === 0) {
          slot.replaceChildren(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('bell', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Belum ada notifikasi' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Permintaan teman, hasil liga, dan kabar penting akan muncul di sini.',
              }),
            ]),
          );
          return;
        }

        const onRead = (item: NotificationItem) => {
          if (item.read) return;
          void socialService
            .markNotificationsRead(item.id)
            .then(() => {
              void notificationIndicatorsStore.refresh();
              if (!disposed) load();
            })
            .catch((error: unknown) => {
              showToast(
                error instanceof Error ? error.message : 'Notifikasi gagal ditandai.',
                'error',
              );
            });
        };

        slot.replaceChildren(
          el(
            'ul',
            { class: 'notification-list' },
            payload.items.map((item) => notificationRow(item, onRead, removeOne)),
          ),
        );
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
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Notifikasi gagal dimuat' }),
            el('p', {
              class: 'empty-state__body',
              text: error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
            }),
            retry,
          ]),
        );
      });
  };

  markAll.addEventListener('click', () => {
    markAll.disabled = true;
    void socialService
      .markNotificationsRead()
      .then(() => {
        showToast('Semua notifikasi ditandai dibaca.', 'success');
        void notificationIndicatorsStore.refresh();
        load();
      })
      .catch((error: unknown) => {
        markAll.disabled = false;
        showToast(
          error instanceof Error ? error.message : 'Notifikasi gagal ditandai.',
          'error',
        );
      });
  });

  deleteRead.addEventListener('click', removeRead);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Tahap 7 · sosial',
      title: 'Notifikasi',
      subtitle: 'Permintaan teman, hasil liga, dan kabar penting dari Lentera.',
      actions: [markAll, deleteRead],
    }),
    slot,
  ]);

  renderAppLayout(ctx, { active: 'notifications', title: 'Notifikasi', content });
  load();
}

export { meta, render };
