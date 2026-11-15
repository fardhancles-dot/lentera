import { icon, iconName } from '../../components/icons';
import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminGamification } from '../../types/admin';
import type { Json } from '../../types/database';
import { el, formatNumber } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import {
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
  numOf,
} from './ui';

type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'datetime';
interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
  required?: boolean;
}
interface CatalogConfig {
  kind: string;
  label: string;
  fields: FieldDef[];
  columns: Array<{ key: string; label: string; render?: (value: unknown, item: Record<string, unknown>) => string }>;
}

const CONFIGS: CatalogConfig[] = [
  {
    kind: 'quest',
    label: 'Quest & Misi',
    fields: [
      { key: 'code', label: 'Kode unik', type: 'text', required: true },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'cadence', label: 'Jadwal', type: 'select', options: [
        { value: 'daily', label: 'Harian' }, { value: 'weekly', label: 'Mingguan' },
      ] },
      { key: 'metric', label: 'Metric', type: 'select', options: [
        { value: 'xp', label: 'XP' }, { value: 'lesson', label: 'Lesson selesai' },
        { value: 'practice', label: 'Latihan selesai' },
      ], hint: 'Hanya metric yang dihitung mesin quest.' },
      { key: 'target', label: 'Target', type: 'number' },
      { key: 'rewardCoins', label: 'Hadiah Koin', type: 'number' },
      { key: 'icon', label: 'Ikon', type: 'text' },
      { key: 'sortOrder', label: 'Urutan', type: 'number' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'isActive', label: 'Aktif', type: 'boolean' },
    ],
    columns: [
      { key: 'title', label: 'Misi' }, { key: 'cadence', label: 'Jadwal' },
      { key: 'metric', label: 'Metric' }, { key: 'target', label: 'Target' },
      { key: 'rewardCoins', label: 'Koin' }, { key: 'claims', label: 'Klaim' },
      { key: 'isActive', label: 'Status' },
    ],
  },
  {
    kind: 'achievement',
    label: 'Achievement',
    fields: [
      { key: 'code', label: 'Kode unik', type: 'text', required: true },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'metric', label: 'Metric', type: 'select', options: [
        { value: 'xp', label: 'XP' }, { value: 'lesson', label: 'Lesson' },
        { value: 'practice', label: 'Latihan' }, { value: 'streak', label: 'Streak' },
        { value: 'level', label: 'Level' },
      ] },
      { key: 'target', label: 'Target', type: 'number' },
      { key: 'icon', label: 'Ikon', type: 'text' },
      { key: 'sortOrder', label: 'Urutan', type: 'number' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'isActive', label: 'Aktif', type: 'boolean' },
    ],
    columns: [
      { key: 'title', label: 'Achievement' }, { key: 'metric', label: 'Metric' },
      { key: 'target', label: 'Target' }, { key: 'unlocked', label: 'Dibuka' },
      { key: 'isActive', label: 'Status' },
    ],
  },
  {
    kind: 'shop_item',
    label: 'Toko',
    fields: [
      { key: 'slug', label: 'Slug unik', type: 'text', required: true },
      { key: 'name', label: 'Nama item', type: 'text', required: true },
      { key: 'kind', label: 'Jenis', type: 'select', options: [
        { value: 'heart_potion', label: 'Heart potion' }, { value: 'streak_freeze', label: 'Streak freeze' },
      ] },
      { key: 'priceCoins', label: 'Harga Koin', type: 'number' },
      { key: 'maxStack', label: 'Batas tumpuk', type: 'number' },
      { key: 'icon', label: 'Ikon', type: 'text' },
      { key: 'sortOrder', label: 'Urutan', type: 'number' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'isActive', label: 'Tersedia', type: 'boolean' },
    ],
    columns: [
      { key: 'name', label: 'Item' },
      { key: 'rarity', label: 'Rarity', render: (value) => String(value ?? 'common').toUpperCase() },
      { key: 'imageUrl', label: 'Foto', render: (value) => (value ? 'Foto produk' : 'Ikon bawaan') },
      { key: 'kind', label: 'Jenis' },
      { key: 'priceCoins', label: 'Harga' }, { key: 'maxStack', label: 'Stack' },
      { key: 'purchases', label: 'Pembelian' }, { key: 'isActive', label: 'Status' },
    ],
  },
  {
    kind: 'player_level',
    label: 'Level Pemain',
    fields: [
      { key: 'level', label: 'Level', type: 'number', hint: '1–30. Level 1 wajib 0 XP.' },
      { key: 'title', label: 'Nama level', type: 'text', required: true },
      { key: 'xpRequired', label: 'Ambang XP', type: 'number' },
      { key: 'rewardCoins', label: 'Hadiah Koin', type: 'number' },
    ],
    columns: [
      { key: 'level', label: 'Level' }, { key: 'title', label: 'Nama' },
      { key: 'xpRequired', label: 'Ambang XP' }, { key: 'rewardCoins', label: 'Koin' },
    ],
  },
  {
    kind: 'streak_milestone',
    label: 'Streak',
    fields: [
      { key: 'days', label: 'Hari', type: 'number' },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'rewardCoins', label: 'Hadiah Koin', type: 'number' },
      { key: 'icon', label: 'Ikon', type: 'text' },
      { key: 'sortOrder', label: 'Urutan', type: 'number' },
    ],
    columns: [
      { key: 'days', label: 'Hari' }, { key: 'title', label: 'Milestone' },
      { key: 'rewardCoins', label: 'Koin' }, { key: 'icon', label: 'Ikon' },
    ],
  },
  {
    kind: 'league_tier',
    label: 'Liga',
    fields: [
      { key: 'tier', label: 'Tier', type: 'number', hint: '1–10.' },
      { key: 'name', label: 'Nama liga', type: 'text', required: true },
      { key: 'accent', label: 'Warna aksen', type: 'text', hint: 'Format #RRGGBB.' },
      { key: 'sortOrder', label: 'Urutan', type: 'number' },
    ],
    columns: [
      { key: 'tier', label: 'Tier' }, { key: 'name', label: 'Nama' },
      { key: 'accent', label: 'Aksen' }, { key: 'sortOrder', label: 'Urutan' },
    ],
  },
  {
    kind: 'event',
    label: 'Event',
    fields: [
      { key: 'weekStart', label: 'Minggu mulai', type: 'date', required: true },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'targetXp', label: 'Target XP', type: 'number' },
      { key: 'rewardCoins', label: 'Hadiah Koin', type: 'number' },
      { key: 'rewardXp', label: 'Hadiah XP', type: 'number' },
      { key: 'startsAt', label: 'Mulai', type: 'datetime' },
      { key: 'endsAt', label: 'Selesai', type: 'datetime' },
      { key: 'isActive', label: 'Aktif', type: 'boolean' },
    ],
    columns: [
      { key: 'weekStart', label: 'Minggu' }, { key: 'title', label: 'Event' },
      { key: 'targetXp', label: 'Target' }, { key: 'rewardCoins', label: 'Koin' },
      { key: 'isActive', label: 'Status' }, { key: 'claims', label: 'Klaim' },
    ],
  },
];

let lastCatalogKind = CONFIGS[0]!.kind;

function text(value: unknown): string {
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'Aktif' : 'Nonaktif';
  return typeof value === 'string' ? value : '—';
}

function adminFormField(label: string, control: HTMLElement, hint?: string): HTMLElement {
  return el('div', { class: 'admin-field' }, [
    el('span', { class: 'admin-field__label', text: label }),
    control,
    hint ? el('span', { class: 'form-hint', text: hint }) : null,
  ]);
}

function rarityPicker(current: unknown): HTMLElement {
  const selected = current === 'rare' || current === 'legendary' ? current : 'common';
  const grid = el('div', {
    class: 'admin-rarity-grid',
    attrs: { role: 'radiogroup', 'aria-label': 'Kategori Rarity Produk' },
  });

  for (const option of [
    { value: 'common', label: 'COMMON', note: 'Silver' },
    { value: 'rare', label: 'RARE', note: 'Ungu' },
    { value: 'legendary', label: 'LEGENDARY', note: 'Emas' },
  ]) {
    const radio = input('rarity', option.value, 'radio');
    radio.className = 'admin-rarity-card__radio';
    radio.checked = option.value === selected;
    grid.append(
      el('label', { class: `admin-rarity-card admin-rarity-card--${option.value}` }, [
        radio,
        el('span', { class: 'admin-rarity-card__swatch' }),
        el('strong', { class: 'admin-rarity-card__label', text: option.label }),
        el('span', { class: 'admin-rarity-card__note', text: option.note }),
      ]),
    );
  }

  return grid;
}

interface ProductPhotoField {
  element: HTMLElement;
  getSelection: () => { file: File | null; removed: boolean };
}

function productPhotoField(currentUrl: string, iconKey: string): ProductPhotoField {
  let selectedFile: File | null = null;
  let removed = false;
  let objectUrl: string | null = null;

  const preview = el('span', { class: 'admin-product-photo__preview' });
  const status = el('span', { class: 'form-hint', text: currentUrl ? 'Foto tersimpan.' : 'Belum ada foto produk.' });
  const fileInput = input('productPhoto', '', 'file', {
    accept: 'image/jpeg,image/png,image/webp',
  });
  fileInput.className = 'admin-product-photo__input';
  fileInput.hidden = true;

  const choose = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('plus', 16),
    currentUrl ? 'Ganti Foto' : 'Upload Foto',
  ]);
  const remove = el('button', { class: 'btn btn--ghost btn--sm', attrs: { type: 'button' } }, [
    'Hapus Foto',
  ]);
  remove.disabled = !currentUrl;

  const paint = (url: string | null): void => {
    const fallback = el('span', { class: 'admin-product-photo__fallback' }, [
      icon(iconName(iconKey, 'bag'), 30),
    ]);
    const nodes: Node[] = [fallback];
    if (url) {
      const image = el('img', { attrs: { src: url, alt: 'Pratinjau foto produk' } });
      image.addEventListener('load', () => preview.classList.add('has-image'));
      image.addEventListener('error', () => {
        preview.classList.remove('has-image');
        image.remove();
      });
      nodes.push(image);
    } else {
      preview.classList.remove('has-image');
    }
    preview.replaceChildren(...nodes);
  };

  paint(currentUrl || null);

  choose.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] ?? null;
    if (!file) return;
    selectedFile = file;
    removed = false;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    paint(objectUrl);
    status.textContent = `${file.name} · akan disimpan saat produk disimpan.`;
    choose.replaceChildren(icon('refresh', 16), 'Ganti Foto');
    remove.disabled = false;
  });
  remove.addEventListener('click', () => {
    selectedFile = null;
    removed = true;
    fileInput.value = '';
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    paint(null);
    status.textContent = 'Foto akan dihapus saat produk disimpan.';
    choose.replaceChildren(icon('plus', 16), 'Upload Foto');
    remove.disabled = true;
  });

  return {
    element: adminFormField(
      'Foto Produk',
      el('div', { class: 'admin-product-photo' }, [
        preview,
        el('div', { class: 'admin-product-photo__body' }, [
          el('div', { class: 'admin-product-photo__actions' }, [choose, remove, fileInput]),
          status,
        ]),
      ]),
      'JPG, JPEG, PNG, atau WebP maksimal 5 MB. Tanpa foto, ikon produk dipakai otomatis.',
    ),
    getSelection: () => ({ file: selectedFile, removed }),
  };
}

function openShopItemEditor(
  item: Record<string, unknown> | null,
  onDone: () => void,
): void {
  const currentUrl = typeof item?.imageUrl === 'string' ? item.imageUrl : '';
  const currentPath = typeof item?.imagePath === 'string' ? item.imagePath : '';
  const photo = productPhotoField(currentUrl, String(item?.icon ?? 'bag'));

  const content = el('div', {}, [
    item?.id ? el('input', { attrs: { type: 'hidden', name: 'id', value: String(item.id) } }) : null,
    formGrid([
      field('Slug unik', input('slug', text(item?.slug), 'text', { required: true, maxlength: '60' })),
      field('Nama item', input('name', text(item?.name), 'text', { required: true, maxlength: '80' })),
      field('Jenis', select('kind', [
        { value: 'heart_potion', label: 'Heart potion' },
        { value: 'streak_freeze', label: 'Streak freeze' },
      ], text(item?.kind))),
      field('Harga Koin', input('priceCoins', typeof item?.priceCoins === 'number' ? item.priceCoins : 0, 'number', { min: '0' })),
      field('Batas tumpuk', input('maxStack', typeof item?.maxStack === 'number' ? item.maxStack : 1, 'number', { min: '1', max: '20' })),
      field('Ikon bawaan', input('icon', text(item?.icon) || 'bag'), 'Dipakai bila foto tidak ada atau gagal dimuat.'),
      field('Urutan', input('sortOrder', typeof item?.sortOrder === 'number' ? item.sortOrder : 0, 'number', { min: '0' })),
      field('Deskripsi', textarea('description', text(item?.description), 3)),
      checkbox('isActive', typeof item?.isActive === 'boolean' ? item.isActive : true, 'Tersedia di toko'),
    ]),
    adminFormField('Kategori Rarity Produk', rarityPicker(item?.rarity), 'Warna card mengikuti kategori ini secara otomatis.'),
    photo.element,
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160', placeholder: 'Alasan perubahan' }), 'Wajib untuk audit log.'),
  ]);

  openDialog({
    title: `${item ? 'Edit' : 'Tambah'} Toko`,
    subtitle: 'Rarity mengatur tampilan card. Foto disimpan permanen dan dipakai di halaman Toko.',
    content,
    submitLabel: 'Simpan',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reason = valueOf(data, 'reason');
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      const selection = photo.getSelection();

      let uploaded: { url: string; path: string } | null = null;
      if (selection.file) {
        uploaded = await adminService.uploadProductImage(selection.file);
      }

      const payload: Record<string, unknown> = {
        ...(item?.id ? { id: item.id } : {}),
        slug: valueOf(data, 'slug'),
        name: valueOf(data, 'name'),
        kind: valueOf(data, 'kind'),
        priceCoins: numOf(data, 'priceCoins'),
        maxStack: numOf(data, 'maxStack'),
        icon: valueOf(data, 'icon'),
        sortOrder: numOf(data, 'sortOrder'),
        description: valueOf(data, 'description'),
        isActive: boolOf(data, 'isActive'),
        rarity: valueOf(data, 'rarity'),
        imageUrl: uploaded?.url ?? currentUrl,
        imagePath: uploaded?.path ?? currentPath,
      };
      if (selection.removed && !uploaded) {
        payload.imageUrl = '';
        payload.imagePath = '';
      }

      try {
        await adminService.saveShopItem(payload as Json, reason);
      } catch (error) {
        if (uploaded) {
          await adminService.removeProductImage(uploaded.path).catch(() => undefined);
        }
        throw error;
      }

      const nextPath = String(payload.imagePath ?? '');
      if (currentPath && currentPath !== nextPath) {
        await adminService.removeProductImage(currentPath).catch(() => undefined);
      }
      showToast('Item toko tersimpan.', 'success');
      onDone();
    },
  });
}

function openCatalogEditor(
  config: CatalogConfig,
  item: Record<string, unknown> | null,
  onDone: () => void,
): void {
  const fields: HTMLElement[] = [];
  for (const definition of config.fields) {
    const raw = item?.[definition.key];
    if (definition.type === 'boolean') {
      fields.push(checkbox(definition.key, typeof raw === 'boolean' ? raw : true, definition.label));
    } else if (definition.type === 'select') {
      fields.push(field(definition.label, select(definition.key, definition.options ?? [], text(raw)), definition.hint));
    } else if (definition.type === 'textarea') {
      fields.push(field(definition.label, textarea(definition.key, typeof raw === 'string' ? raw : '', 3)));
    } else if (definition.type === 'datetime') {
      fields.push(field(definition.label, input(definition.key, toLocalInput(typeof raw === 'string' ? raw : ''), 'datetime-local')));
    } else {
      const type = definition.type === 'number' ? 'number' : definition.type === 'date' ? 'date' : 'text';
      const value = raw === null || raw === undefined ? '' : String(raw);
      fields.push(field(definition.label, input(definition.key, value, type, { required: definition.required ?? false }), definition.hint));
    }
  }
  const content = el('div', {}, [
    item?.id ? el('input', { attrs: { type: 'hidden', name: 'id', value: String(item.id) } }) : null,
    config.kind === 'player_level' || config.kind === 'streak_milestone' || config.kind === 'league_tier'
      ? el('p', { class: 'form-hint', text: 'Baris ini memakai kunci alami (level/hari/tier). Edit nilai yang sudah ada atau tambahkan kunci baru.' })
      : null,
    formGrid(fields),
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160', placeholder: 'Alasan perubahan' }), 'Wajib untuk audit log.'),
  ]);

  openDialog({
    title: `${item ? 'Edit' : 'Tambah'} ${config.label}`,
    subtitle: 'Perubahan langsung dibaca gameplay; transaksi lama tidak diubah.',
    content,
    submitLabel: 'Simpan',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reason = valueOf(data, 'reason');
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      const payload: Record<string, unknown> = {};
      if (item?.id) payload.id = item.id;
      for (const definition of config.fields) {
        if (definition.type === 'boolean') payload[definition.key] = boolOf(data, definition.key);
        else if (definition.type === 'number') payload[definition.key] = numOf(data, definition.key);
        else if (definition.type === 'datetime') payload[definition.key] = new Date(valueOf(data, definition.key)).toISOString();
        else payload[definition.key] = valueOf(data, definition.key);
      }
      await adminService.saveGameCatalog(config.kind, payload as Json, reason);
      showToast('Katalog gamifikasi tersimpan.', 'success');
      onDone();
    },
  });
}

function catalogTable(config: CatalogConfig, items: Record<string, unknown>[], onDone: () => void): HTMLElement {
  if (items.length === 0) return el('p', { class: 'form-hint', text: 'Belum ada data pada katalog ini.' });
  return table(
    [...config.columns.map((column) => column.label), 'Aksi'],
    items.map((item) => [
      ...config.columns.map((column) => {
        const value = item[column.key];
        if (column.key === 'isActive') return badge(text(value), value ? 'ok' : 'muted');
        if (column.key === 'accent') {
          return el('span', { class: 'admin-color' }, [
            el('span', { class: 'admin-color__dot', attrs: { style: `background:${String(value ?? '#ccc')}` } }),
            String(value ?? ''),
          ]);
        }
        return column.render ? column.render(value, item) : text(value);
      }),
      button('Edit', 'settings', () =>
        config.kind === 'shop_item'
          ? openShopItemEditor(item, onDone)
          : openCatalogEditor(config, item, onDone),
      ),
    ]),
  );
}

export async function renderGamification(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat katalog gamifikasi…'));
  try {
    const data = await adminService.getGamification();
    const slot = el('div', {});
    const tabs = el('div', { class: 'admin-tabs' });
    let active = CONFIGS.find((candidate) => candidate.kind === lastCatalogKind)?.kind ?? CONFIGS[0]!.kind;

    const paint = () => {
      const config = CONFIGS.find((candidate) => candidate.kind === active) ?? CONFIGS[0]!;
      lastCatalogKind = config.kind;
      for (const buttonElement of tabs.querySelectorAll('button')) {
        buttonElement.classList.toggle('is-active', buttonElement.dataset.kind === active);
      }
      const items = (data[`${config.kind === 'shop_item' ? 'shopItems' : config.kind === 'player_level' ? 'playerLevels' : config.kind === 'streak_milestone' ? 'streakMilestones' : config.kind === 'league_tier' ? 'leagueTiers' : `${config.kind}s`}` as keyof AdminGamification] ?? []) as unknown;
      const rows = Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
      slot.replaceChildren(
        panel(config.label, 'Katalog yang dibaca langsung oleh mesin game.', [
          catalogTable(config, rows, () => void renderGamification(ctx)),
        ], [
          button('Tambah', 'plus', () =>
            config.kind === 'shop_item'
              ? openShopItemEditor(null, () => void renderGamification(ctx))
              : openCatalogEditor(config, null, () => void renderGamification(ctx)),
          'primary'),
        ]),
      );
    };

    for (const config of CONFIGS) {
      tabs.append(
        el('button', {
          class: 'admin-tab',
          attrs: { type: 'button' },
          dataset: { kind: config.kind },
          text: config.label,
          events: {
            click: () => {
              active = config.kind;
              paint();
            },
          },
        }),
      );
    }

    ctx.root.replaceChildren(
      tabs,
      slot,
      panel('Heart / Nyawa', 'Nilai aktual server. Belum dapat diubah dari dashboard.', [
        el('div', { class: 'admin-metrics admin-metrics--compact' }, [
          el('div', { class: 'admin-mini' }, [el('span', { text: 'Heart maksimal' }), el('strong', { text: String(data.heartSettings.maxHearts ?? '—') })]),
          el('div', { class: 'admin-mini' }, [el('span', { text: 'Regenerasi' }), el('strong', { text: `${String(data.heartSettings.regenerationMinutes ?? '—')} menit` })]),
          el('div', { class: 'admin-mini' }, [el('span', { text: 'Biaya isi ulang' }), el('strong', { text: `${String(data.heartSettings.refillCostCoins ?? '—')} Koin/Heart` })]),
          el('div', { class: 'admin-mini' }, [el('span', { text: 'Jawaban salah' }), el('strong', { text: `${String(data.heartSettings.wrongAnswerCost ?? '—')} Heart` })]),
        ]),
        el('p', { class: 'form-hint', text: String(data.heartSettings.note ?? '') }),
      ]),
    );
    paint();
  } catch (error) {
    ctx.root.replaceChildren(errorState(error instanceof Error ? error.message : 'Gamifikasi gagal dimuat.', () => void renderGamification(ctx)));
  }
}
