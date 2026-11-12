import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminAnnouncement, AdminContentPage, AdminSiteSettings } from '../../types/admin';
import type { Json } from '../../types/database';
import { el } from '../../utils/dom';
import { pickMedia } from './media';
import type { AdminSectionContext } from './ui';
import {
  askConfirm,
  badge,
  button,
  checkbox,
  errorState,
  field,
  formGrid,
  input,
  loading,
  openDialog,
  panel,
  select,
  table,
  textarea,
  toLocalInput,
  valueOf,
  boolOf,
} from './ui';

function settingsForm(settings: AdminSiteSettings, onSaved: () => void): HTMLElement {
  const content = el('div', {}, [
    formGrid([
      field('Nama website', input('siteName', settings.siteName, 'text', { required: true })),
      field('Tagline', input('tagline', settings.tagline)),
      field('Deskripsi', textarea('description', settings.description, 2)),
      field('Copyright', input('copyright', settings.copyright)),
      field('URL dukungan', input('supportUrl', settings.supportUrl)),
      field('Warna brand', input('primaryColor', settings.primaryColor, 'text', { pattern: '#[0-9A-Fa-f]{6}' })),
      field('Favicon URL', input('faviconUrl', settings.faviconUrl)),
      field('Logo URL', input('logoUrl', settings.logoUrl)),
      field('Judul hero', input('heroTitle', settings.heroTitle)),
      field('Deskripsi hero', textarea('heroDescription', settings.heroDescription, 2)),
      field('Label CTA', input('heroCtaLabel', settings.heroCtaLabel)),
      field('Tautan CTA', input('heroCtaHref', settings.heroCtaHref)),
      field('Footer', textarea('footerText', settings.footerText, 2)),
    ]),
    checkbox('registrationEnabled', settings.registrationEnabled, 'Izinkan registrasi akun baru'),
    checkbox('maintenanceMode', settings.maintenanceMode, 'Aktifkan maintenance mode'),
    el('p', {
      class: 'form-hint',
      text: 'Saat aktif, trigger database menolak semua aksi tulis pemain. Staff tetap dapat mengelola data dan mematikan mode ini.',
    }),
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160' })),
    el('button', { class: 'btn', attrs: { type: 'submit' }, text: 'Simpan pengaturan' }),
  ]);
  const form = el('form', { class: 'admin-form' }, [content]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const reason = valueOf(data, 'reason');
    if (reason.length < 3) {
      showToast('Alasan minimal 3 karakter.', 'error');
      return;
    }
    const payload: Record<string, unknown> = {
      siteName: valueOf(data, 'siteName'),
      tagline: valueOf(data, 'tagline'),
      description: valueOf(data, 'description'),
      copyright: valueOf(data, 'copyright'),
      supportUrl: valueOf(data, 'supportUrl'),
      primaryColor: valueOf(data, 'primaryColor'),
      faviconUrl: valueOf(data, 'faviconUrl'),
      logoUrl: valueOf(data, 'logoUrl'),
      heroTitle: valueOf(data, 'heroTitle'),
      heroDescription: valueOf(data, 'heroDescription'),
      heroCtaLabel: valueOf(data, 'heroCtaLabel'),
      heroCtaHref: valueOf(data, 'heroCtaHref'),
      footerText: valueOf(data, 'footerText'),
      registrationEnabled: boolOf(data, 'registrationEnabled'),
      maintenanceMode: boolOf(data, 'maintenanceMode'),
    };
    const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    submit.disabled = true;
    void adminService.saveSiteSettings(payload as Json, reason)
      .then(() => {
        showToast('Pengaturan website disimpan.', 'success');
        onSaved();
      })
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Gagal menyimpan.', 'error'))
      .finally(() => {
        submit.disabled = false;
      });
  });
  return form;
}

const BLOCK_TYPES = [
  { value: 'heading', label: 'Heading' },
  { value: 'paragraph', label: 'Paragraf' },
  { value: 'list', label: 'Daftar' },
  { value: 'image', label: 'Gambar' },
  { value: 'callout', label: 'Callout' },
  { value: 'faq', label: 'FAQ' },
];

function blockFields(type: string, block: Record<string, unknown>): HTMLElement {
  if (type === 'image') {
    const url = input('blockUrl', String(block.url ?? ''));
    const alt = input('blockAlt', String(block.alt ?? ''));
    const library = el('button', {
      class: 'btn btn--secondary btn--sm',
      attrs: { type: 'button' },
      text: 'Pilih dari library',
      events: {
        click: () =>
          pickMedia('image', (item) => {
            url.value = item.url;
            alt.value = item.altText;
          }),
      },
    });
    return formGrid([
      field('URL gambar', url),
      field('Alt text', alt),
      field('Caption', input('blockCaption', String(block.caption ?? ''))),
      library,
    ]);
  }
  if (type === 'faq') {
    return formGrid([
      field('Pertanyaan', input('blockQuestion', String(block.question ?? ''))),
      field('Jawaban', textarea('blockAnswer', String(block.answer ?? ''), 3)),
    ]);
  }
  if (type === 'list') {
    return field('Item daftar', textarea('blockItems', Array.isArray(block.items) ? block.items.join('\n') : '', 4), 'Satu item per baris.');
  }
  return field(type === 'heading' ? 'Teks heading' : 'Teks', textarea('blockText', String(block.text ?? ''), type === 'paragraph' ? 3 : 2));
}

function blockRow(block: Record<string, unknown> = {}): HTMLElement {
  const initialType = String(block.type ?? 'paragraph');
  const row = el('div', { class: 'admin-block', dataset: { type: initialType } });
  const fields = el('div', { class: 'admin-block__fields' });
  const draw = (type: string) => {
    row.dataset.type = type;
    fields.replaceChildren(blockFields(type, block));
  };
  const typeSelect = select('blockType', BLOCK_TYPES, initialType);
  typeSelect.addEventListener('change', () => {
    draw(typeSelect.value);
  });
  row.append(
    el('div', { class: 'admin-block__head' }, [
      typeSelect,
      button('Hapus blok', 'close', () => row.remove(), 'danger'),
    ]),
    fields,
  );
  draw(initialType);
  return row;
}

function openPageEditor(page: AdminContentPage | null, onDone: () => void): void {
  const blocks = el('div', { class: 'admin-blocks' });
  for (const block of page?.blocks ?? []) blocks.append(blockRow(block));
  const content = el('div', {}, [
    page?.id ? el('input', { attrs: { type: 'hidden', name: 'id', value: page.id } }) : null,
    formGrid([
      field('Judul halaman', input('title', page?.title ?? '', 'text', { required: true })),
      field('Slug', input('slug', page?.slug ?? '', 'text', { required: true })),
      field('Status', select('status', [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Terbit' },
        { value: 'archived', label: 'Arsip' },
      ], page?.status ?? 'draft')),
      field('Ringkasan', textarea('summary', page?.summary ?? '', 2)),
      field('Meta title', input('metaTitle', page?.metaTitle ?? '')),
      field('Meta description', textarea('metaDescription', page?.metaDescription ?? '', 2)),
    ]),
    el('div', { class: 'admin-subhead-row' }, [
      el('h3', { class: 'admin-subhead', text: 'Blok konten' }),
      button('Tambah blok', 'plus', () => blocks.append(blockRow())),
    ]),
    el('p', { class: 'form-hint', text: 'Konten disimpan sebagai blok terstruktur, bukan HTML bebas.' }),
    blocks,
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160' })),
  ]);

  openDialog({
    title: page ? 'Edit halaman' : 'Halaman baru',
    subtitle: 'Draft tidak tampil ke pemain. Publikasikan setelah selesai.',
    content,
    submitLabel: 'Simpan halaman',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reason = valueOf(data, 'reason');
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      const blockValues = Array.from(form.querySelectorAll<HTMLElement>('.admin-block')).map((row) => {
        const type = row.dataset.type ?? 'paragraph';
        const get = (name: string) => row.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name=${name}]`)?.value.trim() ?? '';
        if (type === 'list') {
          return { type, items: get('blockItems').split('\n').map((line) => line.trim()).filter(Boolean) };
        }
        if (type === 'image') {
          return { type, url: get('blockUrl'), alt: get('blockAlt'), caption: get('blockCaption') };
        }
        if (type === 'faq') {
          return { type, question: get('blockQuestion'), answer: get('blockAnswer') };
        }
        return { type, text: get('blockText') };
      });
      const payload: Record<string, unknown> = {
        ...(page?.id ? { id: page.id } : {}),
        title: valueOf(data, 'title'),
        slug: valueOf(data, 'slug'),
        status: valueOf(data, 'status'),
        summary: valueOf(data, 'summary'),
        metaTitle: valueOf(data, 'metaTitle'),
        metaDescription: valueOf(data, 'metaDescription'),
        blocks: blockValues,
      };
      await adminService.savePage(payload as Json, reason);
      showToast('Halaman tersimpan.', 'success');
      onDone();
    },
  });
}

function openAnnouncementEditor(item: AdminAnnouncement | null, onDone: () => void): void {
  const content = el('div', {}, [
    item?.id ? el('input', { attrs: { type: 'hidden', name: 'id', value: item.id } }) : null,
    field('Judul', input('title', item?.title ?? '', 'text', { required: true, maxlength: '120' })),
    field('Isi', textarea('body', item?.body ?? '', 3, { maxlength: '1000' })),
    field('Tautan internal', input('link', item?.link ?? '', 'text', { placeholder: '/app' })),
    field('Audiens', select('audience', [
      { value: 'all', label: 'Semua pengguna' },
      { value: 'onboarded', label: 'Sudah onboarding' },
      { value: 'staff', label: 'Staff saja' },
    ], item?.audience ?? 'all')),
    formGrid([
      field('Mulai', input('startsAt', toLocalInput(item?.startsAt ?? new Date().toISOString()), 'datetime-local')),
      field('Berakhir', input('endsAt', toLocalInput(item?.endsAt), 'datetime-local')),
    ]),
    checkbox('isActive', item?.isActive ?? true, 'Aktif'),
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160' })),
  ]);
  openDialog({
    title: item ? 'Edit pengumuman' : 'Pengumuman baru',
    subtitle: 'Banner pengumuman berbeda dari inbox notifikasi.',
    content,
    submitLabel: 'Simpan',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reason = valueOf(data, 'reason');
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      const payload: Record<string, unknown> = {
        ...(item?.id ? { id: item.id } : {}),
        title: valueOf(data, 'title'),
        body: valueOf(data, 'body'),
        link: valueOf(data, 'link'),
        audience: valueOf(data, 'audience'),
        startsAt: valueOf(data, 'startsAt') ? new Date(valueOf(data, 'startsAt')).toISOString() : new Date().toISOString(),
        endsAt: valueOf(data, 'endsAt') ? new Date(valueOf(data, 'endsAt')).toISOString() : '',
        isActive: boolOf(data, 'isActive'),
      };
      await adminService.saveAnnouncement(payload as Json, reason);
      showToast('Pengumuman tersimpan.', 'success');
      onDone();
    },
  });
}

async function renderSettings(ctx: AdminSectionContext): Promise<void> {
  const settings = await adminService.getSiteSettings();
  ctx.root.replaceChildren(
    panel('Identitas website', 'Brand dan pengaturan global. Maintenance ditegakkan trigger database.', [
      settingsForm(settings, () => void renderSettings(ctx)),
    ]),
  );
}

async function renderPages(ctx: AdminSectionContext): Promise<void> {
  const load = async (): Promise<void> => {
    const pages = await adminService.listPages();
    const slot = el('div', {}, [
      pages.length === 0
        ? el('p', { class: 'form-hint', text: 'Belum ada halaman informasi.' })
        : table(['Judul', 'Slug', 'Status', 'Diperbarui', 'Aksi'], pages.map((page) => [
            page.title,
            `/${page.slug}`,
            badge(page.status, page.status === 'published' ? 'ok' : page.status === 'draft' ? 'warn' : 'muted'),
            page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('id-ID') : '—',
            button('Edit', 'settings', () => {
              void adminService.getPage(page.id)
                .then((full) => openPageEditor(full, () => void load()))
                .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Halaman gagal dimuat.', 'error'));
            }),
          ])),
    ]);
    ctx.root.replaceChildren(
      panel('Halaman informasi', 'Tentang, FAQ, kebijakan, dan halaman lain memakai blok terstruktur.', [slot], [
        button('Halaman baru', 'plus', () => openPageEditor(null, () => void load()), 'primary'),
      ]),
    );
  };
  await load();
}

async function renderAnnouncements(ctx: AdminSectionContext): Promise<void> {
  const audience = select('broadcast-audience', [
    { value: 'onboarded', label: 'Sudah onboarding' },
    { value: 'all', label: 'Semua pengguna' },
    { value: 'staff', label: 'Staff saja' },
  ]);
  const estimate = el('p', { class: 'form-hint', text: 'Perkiraan penerima belum dihitung.' });
  const title = input('broadcast-title', '', 'text', { minlength: '3', maxlength: '80', placeholder: 'Judul notifikasi' });
  const body = input('broadcast-body', '', 'text', { maxlength: '300', placeholder: 'Isi notifikasi' });
  const link = input('broadcast-link', '/app', 'text');
  const reason = input('broadcast-reason', '', 'text', { minlength: '3', maxlength: '160', placeholder: 'Alasan pengiriman' });
  const estimateButton = button('Hitung penerima', 'users', () => {
    void adminService.estimateAudience(audience.value)
      .then((count) => {
        estimate.textContent = `Perkiraan ${count} penerima. Pengiriman dibatasi 500 penerima per aksi.`;
      })
      .catch((error: unknown) => {
        estimate.textContent = error instanceof Error ? error.message : 'Gagal menghitung audiens.';
      });
  });
  const sendButton = button('Kirim notifikasi', 'bell', () => {
    void (async () => {
      if (title.value.trim().length < 3) {
        showToast('Judul minimal 3 karakter.', 'error');
        return;
      }
      const count = await adminService.estimateAudience(audience.value);
      const confirmed = await askConfirm(
        'Kirim notifikasi',
        `Kirim ke sekitar ${count} pengguna (${audience.value})? Tindakan ini menulis inbox dan audit log.`,
        'Kirim',
      );
      if (!confirmed) return;
      const result = await adminService.sendNotification(
        title.value.trim(),
        body.value.trim(),
        link.value.trim(),
        audience.value,
        reason.value.trim() || 'Broadcast dari dashboard admin',
      );
      showToast(`Notifikasi terkirim ke ${String(result.recipients ?? 0)} pengguna.`, 'success');
    })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Broadcast gagal.', 'error'));
  }, 'primary');

  const load = async (): Promise<void> => {
    const items = await adminService.listAnnouncements();
    const list = items.length === 0
      ? el('p', { class: 'form-hint', text: 'Belum ada pengumuman.' })
      : table(['Judul', 'Audiens', 'Jadwal', 'Status', 'Aksi'], items.map((item) => [
          item.title,
          item.audience,
          `${item.startsAt ? new Date(item.startsAt).toLocaleDateString('id-ID') : '—'}${item.endsAt ? ` → ${new Date(item.endsAt).toLocaleDateString('id-ID')}` : ''}`,
          badge(item.isActive ? 'Aktif' : 'Nonaktif', item.isActive ? 'ok' : 'muted'),
          button('Edit', 'settings', () => openAnnouncementEditor(item, () => void load())),
        ]));
    ctx.root.replaceChildren(
      panel('Pengumuman', 'Banner website terjadwal. Pisahkan dari inbox notifikasi.', [list], [
        button('Pengumuman baru', 'plus', () => openAnnouncementEditor(null, () => void load()), 'primary'),
      ]),
      panel('Kirim notifikasi', 'Broadcast inbox dengan estimasi audiens dan konfirmasi.', [
        el('div', { class: 'admin-form' }, [
          formGrid([field('Judul', title), field('Tautan', link)]),
          field('Isi', body),
          field('Audiens', audience),
          field('Alasan', reason),
          el('div', { class: 'admin-row-actions' }, [estimateButton, sendButton]),
          estimate,
        ]),
      ]),
    );
  };
  await load();
}

export async function renderWebsite(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat konten website…'));
  try {
    const tabs = el('div', { class: 'admin-tabs' }, [
      el('button', { class: 'admin-tab is-active', attrs: { type: 'button' }, dataset: { tab: 'settings' }, text: 'Identitas', events: { click: () => selectTab('settings') } }),
      el('button', { class: 'admin-tab', attrs: { type: 'button' }, dataset: { tab: 'pages' }, text: 'Halaman', events: { click: () => selectTab('pages') } }),
      el('button', { class: 'admin-tab', attrs: { type: 'button' }, dataset: { tab: 'announcements' }, text: 'Pengumuman', events: { click: () => selectTab('announcements') } }),
    ]);
    const slot = el('div', {});
    let active = 'settings';

    const selectTab = (tab: string) => {
      active = tab;
      for (const tabButton of tabs.querySelectorAll<HTMLButtonElement>('.admin-tab')) {
        tabButton.classList.toggle('is-active', tabButton.dataset.tab === tab);
      }
      const target = el('div', {});
      slot.replaceChildren(target);
      const localCtx: AdminSectionContext = { ...ctx, root: target, reload: () => selectTab(active) };
      const task = tab === 'pages' ? renderPages : tab === 'announcements' ? renderAnnouncements : renderSettings;
      void task(localCtx).catch((error: unknown) => target.replaceChildren(
        errorState(error instanceof Error ? error.message : 'Konten gagal dimuat.', () => selectTab(active)),
      ));
    };

    ctx.root.replaceChildren(tabs, slot);
    selectTab(active);
  } catch (error) {
    ctx.root.replaceChildren(errorState(error instanceof Error ? error.message : 'Konten website gagal dimuat.', () => void renderWebsite(ctx)));
  }
}
