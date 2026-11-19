import { icon } from '../../components/icons';
import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminMusicTrack } from '../../types/music';
import { el } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import {
  askConfirm,
  badge,
  button,
  errorState,
  field,
  formatDate,
  input,
  loading,
  openDialog,
  panel,
} from './ui';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function statCard(
  label: string,
  value: string,
  note: string,
  iconName: 'volume' | 'check' | 'star' | 'globe',
): HTMLElement {
  return el('article', { class: 'admin-music-stat' }, [
    el('span', { class: 'admin-music-stat__icon' }, [icon(iconName, 18)]),
    el('span', { class: 'admin-music-stat__label', text: label }),
    el('strong', { class: 'admin-music-stat__value', text: value }),
    el('span', { class: 'admin-music-stat__note', text: note }),
  ]);
}

function openUpload(onDone: () => void): void {
  const title = input('title', '', 'text', {
    maxlength: '120',
    placeholder: 'Contoh: Lentera Pagi',
    required: true,
  });
  const file = el('input', {
    class: 'input admin-music-file',
    attrs: {
      type: 'file',
      name: 'file',
      accept: 'audio/mpeg,audio/ogg,audio/wav,audio/x-wav,.mp3,.ogg,.wav',
      required: true,
    },
  });
  const meta = el('p', {
    class: 'form-hint',
    text: 'MP3, OGG, atau WAV · maksimal 20 MB.',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });
  file.addEventListener('change', () => {
    const selected = file.files?.[0];
    if (!selected) return;
    meta.textContent = `${formatBytes(selected.size)} · ${selected.type || 'audio'} · siap diunggah`;
  });

  openDialog({
    title: 'Tambah musik',
    subtitle:
      'File disimpan permanen di storage content-media; metadata dan statusnya tersimpan di database.',
    content: el('div', {}, [
      field('Judul musik', title, 'Nama ini tampil di dashboard admin.'),
      field('File musik', file, 'MP3, OGG, atau WAV. Maksimal 20 MB.'),
      meta,
    ]),
    submitLabel: 'Unggah musik',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const selected = data.get('file');
      const cleanTitle = String(data.get('title') ?? '').trim();
      if (!(selected instanceof File) || selected.size === 0) {
        throw new Error('Pilih file musik terlebih dahulu.');
      }
      if (selected.size > MAX_FILE_BYTES) {
        throw new Error('Ukuran musik maksimal 20 MB.');
      }
      if (cleanTitle.length < 1 || cleanTitle.length > 120) {
        throw new Error('Judul musik harus 1–120 karakter.');
      }
      await adminService.uploadBackgroundMusic(selected, cleanTitle);
      showToast('Musik berhasil diunggah. Aktifkan dan jadikan musik utama.', 'success');
      onDone();
    },
  });
}

function musicCard(track: AdminMusicTrack, reload: () => void): HTMLElement {
  const preview = el('audio', {
    class: 'admin-music-preview',
    attrs: {
      controls: '',
      preload: 'none',
      src: track.url,
      'aria-label': `Preview ${track.title}`,
    },
  });

  const makePrimary = button(
    track.isPrimary ? 'Musik utama' : 'Jadikan utama',
    'star',
    () => {
      void adminService
        .setPrimaryBackgroundMusic(track.id, 'Tetapkan musik utama dari dashboard')
        .then(() => {
          showToast(`${track.title} menjadi musik utama.`, 'success');
          reload();
        })
        .catch((error: unknown) =>
          showToast(error instanceof Error ? error.message : 'Musik utama gagal diubah.', 'error'),
        );
    },
    'primary',
  );
  makePrimary.disabled = track.isPrimary || !track.isActive;

  const toggle = button(
    track.isActive ? 'Nonaktifkan' : 'Aktifkan',
    track.isActive ? 'close' : 'check',
    () => {
      void adminService
        .setBackgroundMusicActive(
          track.id,
          !track.isActive,
          track.isActive ? 'Nonaktifkan musik dari dashboard' : 'Aktifkan musik dari dashboard',
        )
        .then(() => {
          showToast(
            track.isActive
              ? `${track.title} dinonaktifkan.`
              : `${track.title} diaktifkan.`,
            'success',
          );
          reload();
        })
        .catch((error: unknown) =>
          showToast(error instanceof Error ? error.message : 'Status musik gagal diubah.', 'error'),
        );
    },
  );

  const remove = button('Hapus', 'close', () => {
    void askConfirm(
      'Hapus musik',
      track.isPrimary
        ? `"${track.title}" sedang menjadi musik utama. Setelah dihapus pengguna tidak lagi mendengar musik sampai admin menetapkan musik lain.`
        : `Hapus "${track.title}" dari database dan storage? Tindakan ini tidak dapat dibatalkan.`,
      'Hapus',
    ).then((confirmed) => {
      if (!confirmed) return;
      void adminService
        .deleteBackgroundMusic(track.id, 'Hapus musik dari dashboard')
        .then(() => {
          showToast(`${track.title} dihapus.`, 'success');
          reload();
        })
        .catch((error: unknown) =>
          showToast(error instanceof Error ? error.message : 'Musik gagal dihapus.', 'error'),
        );
    });
  }, 'danger');

  return el(
    'article',
    {
      class: `admin-music-card${track.isPrimary ? ' admin-music-card--primary' : ''}`,
      dataset: { musicId: track.id },
    },
    [
      el('div', { class: 'admin-music-card__head' }, [
        el('span', { class: 'admin-music-card__icon' }, [icon('volume', 18)]),
        el('div', { class: 'admin-music-card__identity' }, [
          el('strong', { text: track.title }),
          el('span', {
            class: 'admin-sub',
            text: `${track.format.toUpperCase()} · ${formatBytes(track.sizeBytes)} · diunggah ${formatDate(track.createdAt)}`,
          }),
        ]),
        el('div', { class: 'admin-music-card__badges' }, [
          track.isPrimary ? badge('Musik utama', 'ok') : null,
          badge(track.isActive ? 'Aktif' : 'Nonaktif', track.isActive ? 'ok' : 'muted'),
        ]),
      ]),
      preview,
      el('div', { class: 'admin-music-card__actions' }, [makePrimary, toggle, remove]),
    ],
  );
}

export async function renderMusic(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat pengaturan musik…'));
  try {
    const tracks = await adminService.listBackgroundMusic();
    const activeCount = tracks.filter((track) => track.isActive).length;
    const primary = tracks.find((track) => track.isPrimary) ?? null;
    const reload = () => void renderMusic(ctx);

    ctx.root.replaceChildren(
      el('p', {
        class: 'admin-music-intro',
        text: 'Kelola satu background music global untuk seluruh halaman pengguna. Musik diputar otomatis tanpa tombol di halaman pengguna, mengikuti kebijakan autoplay browser (Chrome Android dan Safari iOS memulai musik pada interaksi pertama bila autoplay diblokir).',
      }),
      el('div', { class: 'admin-music-stats' }, [
        statCard('Total musik', String(tracks.length), 'Seluruh file di library', 'volume'),
        statCard('Musik aktif', String(activeCount), 'Boleh dipilih sebagai musik utama', 'check'),
        statCard(
          'Musik utama',
          primary ? primary.title : 'Belum ada',
          primary ? 'Sedang diputar pengguna' : 'Pilih satu musik aktif',
          'star',
        ),
        statCard(
          'Status sistem',
          primary ? 'Berjalan' : 'Nonaktif',
          primary ? 'Pemutaran otomatis global' : 'Tambahkan dan tetapkan musik',
          'globe',
        ),
      ]),
      panel(
        'Daftar musik',
        'Preview di bawah hanya untuk admin dan tidak memengaruhi pemutaran pengguna.',
        [
          tracks.length === 0
            ? el('p', {
                class: 'form-hint',
                text: 'Belum ada musik. Unggah file MP3, OGG, atau WAV lalu jadikan musik utama.',
              })
            : el(
                'div',
                { class: 'admin-music-list' },
                tracks.map((track) => musicCard(track, reload)),
              ),
        ],
        [button('Tambah Musik', 'plus', () => openUpload(reload), 'primary', false)],
      ),
    );
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(
        error instanceof Error ? error.message : 'Pengaturan musik gagal dimuat.',
        () => void renderMusic(ctx),
      ),
    );
  }
}
