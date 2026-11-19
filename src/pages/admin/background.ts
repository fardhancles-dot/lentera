import { icon } from '../../components/icons';
import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import { contentService } from '../../services/content.service';
import type { AdminSiteSettings } from '../../types/admin';
import type { Json } from '../../types/database';
import { el } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import { button, errorState, loading } from './ui';

type BackgroundSlot = 'desktop' | 'mobile';

interface SlotConfig {
  slot: BackgroundSlot;
  title: string;
  description: string;
  hint: string;
  field: 'backgroundDesktopUrl' | 'backgroundMobileUrl';
  previewClass: string;
}

const SLOTS: SlotConfig[] = [
  {
    slot: 'desktop',
    title: 'Background Desktop',
    description:
      'Dipakai peta belajar di komputer dan laptop untuk seluruh mata pelajaran.',
    hint: 'Gunakan gambar landscape, disarankan 1920×1080 atau lebih (rasio 16:9), JPG/PNG/WebP maksimal 10 MB.',
    field: 'backgroundDesktopUrl',
    previewClass: 'admin-bg-preview--desktop',
  },
  {
    slot: 'mobile',
    title: 'Background Mobile',
    description:
      'Dipakai peta belajar di smartphone untuk seluruh mata pelajaran.',
    hint: 'Gunakan gambar portrait, disarankan 1080×1920 atau lebih (rasio 9:16), JPG/PNG/WebP maksimal 10 MB.',
    field: 'backgroundMobileUrl',
    previewClass: 'admin-bg-preview--mobile',
  },
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function backgroundCard(config: SlotConfig, settings: AdminSiteSettings): HTMLElement {
  let savedUrl = settings[config.field];
  let pendingFile: File | null = null;
  let pendingPreview: string | null = null;

  const image = el('img', { class: 'admin-bg-preview__image', attrs: { alt: '' } });
  const empty = el('div', { class: 'admin-bg-preview__empty' }, [
    icon(config.slot === 'desktop' ? 'globe' : 'phone', 26),
    el('span', { text: 'Belum ada background khusus' }),
    el('small', { text: 'Peta belajar memakai ilustrasi bawaan.' }),
  ]);
  const preview = el('div', { class: `admin-bg-preview ${config.previewClass}` }, [
    image,
    empty,
  ]);

  const status = el('p', {
    class: 'form-hint admin-bg-status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });

  const file = el('input', {
    class: 'admin-bg-file',
    attrs: { type: 'file', accept: 'image/jpeg,image/png,image/webp' },
  });

  const choose = button(
    'Pilih gambar',
    'plus',
    () => file.click(),
    'secondary',
    false,
  );
  const save = button(
    `Simpan background ${config.slot}`,
    'check',
    () => void persist(),
    'primary',
    false,
  );
  save.disabled = true;

  const paint = (url: string, pending: boolean): void => {
    if (url) {
      image.src = url;
      image.style.display = '';
      empty.style.display = 'none';
      status.textContent = pending
        ? 'Pratinjau gambar baru. Klik Simpan untuk menerapkannya ke semua peta belajar.'
        : 'Background ini sedang dipakai di seluruh peta belajar.';
      return;
    }
    image.removeAttribute('src');
    image.style.display = 'none';
    empty.style.display = '';
    status.textContent =
      'Belum ada background. Peta belajar memakai ilustrasi bawaan.';
  };

  image.addEventListener('error', () => {
    image.removeAttribute('src');
    image.style.display = 'none';
    empty.style.display = '';
    status.textContent = 'Gambar tidak dapat dimuat. Pilih file baru untuk menggantinya.';
  });

  const persist = async (): Promise<void> => {
    if (!pendingFile) return;
    const selected = pendingFile;
    const label = save.textContent ?? `Simpan background ${config.slot}`;
    save.disabled = true;
    choose.disabled = true;
    save.textContent = 'Mengunggah…';
    try {
      const uploaded = await adminService.uploadJourneyBackground(selected, config.slot);
      const payload: Record<string, unknown> = {
        siteName: settings.siteName,
        [config.field]: uploaded.url,
      };
      await adminService.saveSiteSettings(
        payload as Json,
        `Perbarui background ${config.slot} peta belajar`,
      );

      savedUrl = uploaded.url;
      pendingFile = null;
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
        pendingPreview = null;
      }
      file.value = '';
      paint(savedUrl, false);
      choose.textContent = 'Ganti gambar';
      showToast(
        `Background ${config.slot} berhasil diperbarui untuk semua mata pelajaran.`,
        'success',
      );
      // Keep the shared public settings in sync so the map uses the new image
      // without a full page reload.
      await contentService.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Background gagal disimpan.',
        'error',
      );
      save.disabled = false;
    } finally {
      choose.disabled = false;
      save.textContent = label;
    }
  };

  file.addEventListener('change', () => {
    const selected = file.files?.[0];
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type.toLowerCase())) {
      showToast('Format background harus JPG, PNG, atau WebP.', 'error');
      file.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      showToast('Ukuran gambar background maksimal 10 MB.', 'error');
      file.value = '';
      return;
    }

    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    pendingFile = selected;
    pendingPreview = URL.createObjectURL(selected);
    paint(pendingPreview, true);
    save.disabled = false;
    choose.textContent = 'Ganti pilihan';
  });

  paint(savedUrl, false);

  return el('section', { class: 'card admin-panel admin-bg-card' }, [
    el('div', { class: 'admin-bg-card__head' }, [
      el('span', { class: 'admin-bg-card__icon' }, [
        icon(config.slot === 'desktop' ? 'globe' : 'phone', 20),
      ]),
      el('div', {}, [
        el('h2', { class: 'card__title', text: config.title }),
        el('p', { class: 'card__subtitle', text: config.description }),
      ]),
    ]),
    preview,
    el('div', { class: 'admin-bg-card__actions' }, [choose, save, file]),
    el('p', { class: 'form-hint', text: config.hint }),
    status,
  ]);
}

export async function renderBackground(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat pengaturan background…'));
  try {
    const settings = await adminService.getSiteSettings();
    ctx.root.replaceChildren(
      el('p', {
        class: 'admin-bg-intro',
        text: 'Kelola tampilan background peta belajar untuk seluruh mata pelajaran. Pengaturan ini global: gambar desktop dan gambar mobile yang tersimpan di sini dipakai semua mata pelajaran, termasuk mata pelajaran yang ditambahkan nanti.',
      }),
      el('div', { class: 'admin-bg-grid' }, [
        backgroundCard(SLOTS[0]!, settings),
        backgroundCard(SLOTS[1]!, settings),
      ]),
      el('p', {
        class: 'form-hint',
        text: 'Gambar disimpan di bucket content-media dan URL-nya tersimpan di site_settings, sehingga tetap ada setelah halaman dimuat ulang maupun setelah login kembali.',
      }),
    );
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(
        error instanceof Error ? error.message : 'Pengaturan background gagal dimuat.',
        () => void renderBackground(ctx),
      ),
    );
  }
}
