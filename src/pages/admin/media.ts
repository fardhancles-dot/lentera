import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminMediaItem } from '../../types/admin';
import { el } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import {
  askReason,
  badge,
  button,
  errorState,
  field,
  formatDate,
  input,
  loading,
  openDialog,
  panel,
  select,
} from './ui';

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function openUpload(onDone: () => void): void {
  const file = el('input', {
    class: 'input',
    attrs: { type: 'file', name: 'file', accept: 'image/*,audio/*,video/*', required: true },
  });
  const alt = input('alt', '', 'text', { maxlength: '200' });
  const content = el('div', {}, [
    field('File', file, 'Gambar, audio, atau video. Maksimal 20 MB. SVG/HTML/JS ditolak server.'),
    field('Alt text / transkrip', alt, 'Wajib untuk gambar Serta berguna sebagai transkrip audio/video.'),
  ]);

  openDialog({
    title: 'Unggah media',
    subtitle: 'File masuk ke bucket content-media lalu metadata dicatat di media_assets.',
    content,
    submitLabel: 'Unggah',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const selected = data.get('file');
      if (!(selected instanceof File) || selected.size === 0) {
        throw new Error('Pilih file terlebih dahulu.');
      }
      if (selected.size > 20 * 1024 * 1024) throw new Error('Ukuran file maksimal 20 MB.');
      const altText = String(data.get('alt') ?? '').trim();
      if (selected.type.startsWith('image/') && altText.length < 2) {
        throw new Error('Alt text wajib untuk gambar.');
      }
      let width: number | null = null;
      let height: number | null = null;
      if (selected.type.startsWith('image/')) {
        try {
          const bitmap = await createImageBitmap(selected);
          width = bitmap.width;
          height = bitmap.height;
          bitmap.close();
        } catch {
          width = null;
          height = null;
        }
      }
      await adminService.uploadMedia(selected, altText, width, height);
      showToast('Media terunggah dan tercatat.', 'success');
      onDone();
    },
  });
}

export async function renderMedia(ctx: AdminSectionContext): Promise<void> {
  const slot = el('div', {});
  let search = '';
  let kind = '';
  let page = 1;

  const load = async (): Promise<void> => {
    slot.replaceChildren(loading('Memuat media…'));
    try {
      const result = await adminService.listMedia(search, kind, page, 24);
      if (result.items.length === 0) {
        slot.replaceChildren(el('p', { class: 'form-hint', text: 'Belum ada media yang cocok.' }));
      } else {
        slot.replaceChildren(
          el('div', { class: 'admin-media-grid' }, result.items.map((item) => mediaCard(item, () => void load()))),
        );
      }
      const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
      slot.append(
        el('div', { class: 'admin-pagination' }, [
          el('span', { text: `${result.total} media · halaman ${result.page}/${pages}` }),
          el('span', { class: 'admin-row-actions' }, [
            button('Sebelumnya', 'arrow-left', () => {
              if (page > 1) {
                page -= 1;
                void load();
              }
            }),
            button('Berikutnya', 'arrow-right', () => {
              if (page < pages) {
                page += 1;
                void load();
              }
            }),
          ]),
        ]),
      );
    } catch (error) {
      slot.replaceChildren(errorState(error instanceof Error ? error.message : 'Media gagal dimuat.', () => void load()));
    }
  };

  const searchInput = input('media-search', '', 'search', { placeholder: 'Cari nama file atau alt…' });
  const kindSelect = select('media-kind', [
    { value: '', label: 'Semua jenis' },
    { value: 'image', label: 'Gambar' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
  ]);
  searchInput.addEventListener('input', () => {
    window.clearTimeout((searchInput as HTMLInputElement & { timer?: number }).timer);
    (searchInput as HTMLInputElement & { timer?: number }).timer = window.setTimeout(() => {
      search = searchInput.value.trim();
      page = 1;
      void load();
    }, 250);
  });
  kindSelect.addEventListener('change', () => {
    kind = kindSelect.value;
    page = 1;
    void load();
  });

  ctx.root.replaceChildren(
    panel('Media library', 'Aset konten CMS. Aset game yang di-bundle tetap dikelola source code.', [
      el('div', { class: 'admin-filters' }, [searchInput, kindSelect]),
      slot,
    ], [
      button('Unggah media', 'plus', () => openUpload(() => void load()), 'primary', false),
    ]),
  );
  await load();
}

export function pickMedia(
  kind: 'image' | 'audio' | 'video' | 'all',
  onPick: (item: AdminMediaItem) => void,
): void {
  const grid = el('div', { class: 'admin-media-grid' });
  const status = el('p', { class: 'form-hint', text: 'Memuat media…' });
  const search = input('picker-search', '', 'search', { placeholder: 'Cari nama file atau alt…' });

  const close = (): void => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  const load = async (term: string): Promise<void> => {
    status.textContent = 'Memuat media…';
    try {
      const result = await adminService.listMedia(term, kind === 'all' ? '' : kind, 1, 24);
      status.textContent = result.items.length === 0
        ? 'Belum ada media yang cocok. Unggah lewat menu Media.'
        : `${result.total} media · klik untuk memilih`;
      grid.replaceChildren(
        ...result.items.map((item) => {
          const preview = item.kind === 'image'
            ? el('img', { class: 'admin-media-grid__preview', attrs: { src: item.url, alt: item.altText, loading: 'lazy' } })
            : el('div', { class: 'admin-media-grid__preview admin-media-grid__preview--file', text: item.kind.toUpperCase() });
          return el('button', {
            class: 'admin-media-card admin-media-card--pick',
            attrs: { type: 'button' },
            events: {
              click: () => {
                onPick(item);
                close();
              },
            },
          }, [
            preview,
            el('div', { class: 'admin-media-card__body' }, [
              badge(item.kind, 'ok'),
              el('strong', { text: item.storagePath.split('/').pop() ?? item.storagePath }),
              el('span', { class: 'admin-sub', text: item.altText || 'Tanpa alt text' }),
            ]),
          ]);
        }),
      );
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Media gagal dimuat.';
    }
  };

  const overlay = el('div', { class: 'admin-dialog' }, [
    el('div', {
      class: 'admin-dialog__backdrop',
      attrs: { 'aria-hidden': 'true' },
      events: { click: close },
    }),
    el('div', {
      class: 'admin-dialog__panel',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pilih media' },
    }, [
      el('div', { class: 'admin-dialog__head' }, [
        el('div', {}, [
          el('h2', { class: 'admin-dialog__title', text: 'Pilih media' }),
          el('p', { class: 'card__subtitle', text: 'Media dari library content-media. Alt text ikut terisi.' }),
        ]),
        el('button', {
          class: 'icon-btn',
          attrs: { type: 'button', 'aria-label': 'Tutup' },
          events: { click: close },
        }, [el('span', { attrs: { 'aria-hidden': 'true' }, text: '×' })]),
      ]),
      el('div', { class: 'admin-filters' }, [search]),
      status,
      grid,
    ]),
  ]);

  search.addEventListener('input', () => {
    window.clearTimeout((search as HTMLInputElement & { timer?: number }).timer);
    (search as HTMLInputElement & { timer?: number }).timer = window.setTimeout(() => {
      void load(search.value.trim());
    }, 250);
  });
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  search.focus();
  void load('');
}

function mediaCard(item: AdminMediaItem, onDone: () => void): HTMLElement {
  const preview = item.kind === 'image'
    ? el('img', { class: 'admin-media-grid__preview', attrs: { src: item.url, alt: item.altText, loading: 'lazy' } })
    : el('div', { class: 'admin-media-grid__preview admin-media-grid__preview--file', text: item.kind.toUpperCase() });
  return el('article', { class: 'admin-media-card' }, [
    preview,
    el('div', { class: 'admin-media-card__body' }, [
      el('div', { class: 'admin-row-actions' }, [
        badge(item.kind, item.status === 'active' ? 'ok' : 'muted'),
        item.width && item.height ? el('span', { class: 'admin-sub', text: `${item.width}×${item.height}` }) : null,
      ]),
      el('strong', { text: item.storagePath.split('/').pop() ?? item.storagePath }),
      el('span', { class: 'admin-sub', text: `${bytes(item.sizeBytes)} · ${item.mimeType}` }),
      el('span', { class: 'admin-sub', text: item.altText || 'Tanpa alt text' }),
      el('span', { class: 'admin-sub', text: formatDate(item.createdAt, true) }),
      el('div', { class: 'admin-row-actions' }, [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: item.url, target: '_blank', rel: 'noopener' }, text: 'Buka' }),
        button('Arsipkan', 'close', () => {
          void (async () => {
            const reason = await askReason('Arsipkan media', 'Media tidak dihapus dari storage; metadata ditandai arsip dan tidak ditawarkan lagi.', 'Arsipkan');
            if (!reason) return;
            await adminService.archiveMedia(item.id, reason);
            showToast('Media diarsipkan.', 'success');
            onDone();
          })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Media gagal diarsipkan.', 'error'));
        }, 'danger'),
      ]),
    ]),
  ]);
}
