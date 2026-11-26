import { avatar } from '../../components/avatar';
import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import { developerService } from '../../services/developer.service';
import type { AdminUser, AdminUserDetail } from '../../types/admin';
import type { AppRole } from '../../types/database';
import { el, formatNumber } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import {
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
  table,
  textarea,
} from './ui';

function roleLabel(role: AppRole): string {
  return role === 'developer' ? 'Developer' : role === 'admin' ? 'Admin' : 'Pemain';
}

function openRoleDialog(user: AdminUser, onDone: () => void): void {
  const content = el('div', {}, [
    el('p', { class: 'admin-dialog__message', text: `Ubah role @${user.username}. Perubahan role tercatat di audit log.` }),
    field('Role baru', select('role', [
      { value: 'player', label: 'Pemain' },
      { value: 'admin', label: 'Admin' },
      { value: 'developer', label: 'Developer' },
    ], user.role)),
    field('Alasan', textarea('reason', '', 3, { maxlength: '160', placeholder: 'Alasan perubahan role' }), '3–160 karakter.'),
  ]);
  openDialog({
    title: 'Ubah role pengguna',
    content,
    submitLabel: 'Simpan role',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const role = String(data.get('role') ?? 'player') as AppRole;
      const reason = String(data.get('reason') ?? '').trim();
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      await adminService.setUserRole(user.userId, role, reason);
      showToast('Role pengguna diperbarui.', 'success');
      onDone();
    },
  });
}

function openRewardDialog(user: AdminUser, onDone: () => void): void {
  const content = el('div', {}, [
    el('p', { class: 'admin-dialog__message', text: `Kirim hadiah ke @${user.username}. Saldo masuk ledger transaksi.` }),
    field('Koin', input('coins', 0, 'number', { min: '0', max: '10000' })),
    field('XP', input('xp', 0, 'number', { min: '0', max: '100000' })),
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160', placeholder: 'Contoh: hadiah acara komunitas' })),
  ]);
  openDialog({
    title: 'Reward Center',
    content,
    submitLabel: 'Kirim hadiah',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const coins = Number(data.get('coins') ?? 0) || 0;
      const xp = Number(data.get('xp') ?? 0) || 0;
      const reason = String(data.get('reason') ?? '').trim();
      await developerService.grantReward(user.userId, coins, xp, reason);
      showToast('Hadiah terkirim dan tercatat.', 'success');
      onDone();
    },
  });
}

function detailView(detail: AdminUserDetail, canManage: boolean): HTMLElement {
  return el('div', { class: 'admin-user-detail' }, [
    el('div', { class: 'admin-user-detail__head' }, [
      avatar(detail.avatarKey, 'md'),
      el('div', {}, [
        el('h2', { text: detail.displayName }),
        el('p', { class: 'admin-sub', text: `@${detail.username} · ${detail.email}` }),
        el('div', { class: 'admin-row-actions' }, [
          badge(roleLabel(detail.role), detail.role === 'player' ? 'muted' : 'ok'),
          badge(detail.onboardingCompleted ? 'Onboarded' : 'Belum onboarding', detail.onboardingCompleted ? 'ok' : 'warn'),
          el('span', { class: 'admin-sub', text: `Bergabung ${formatDate(detail.joinedAt)}` }),
        ]),
      ]),
      el('div', { class: 'admin-row-actions' }, [
        canManage ? button('Ubah role', 'shield', () => {
          openRoleDialog(detail, () => window.location.reload());
        }) : null,
        button('Kirim hadiah', 'gift', () => {
          openRewardDialog(detail, () => window.location.reload());
        }, 'primary'),
      ]),
    ]),
    el('div', { class: 'admin-metrics admin-metrics--compact' }, [
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Total XP' }), el('strong', { text: formatNumber(detail.totalXp) })]),
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Koin' }), el('strong', { text: formatNumber(detail.coins) })]),
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Heart' }), el('strong', { text: `${detail.hearts}/${detail.maxHearts}` })]),
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Streak' }), el('strong', { text: `${detail.streak} hari` })]),
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Lesson selesai' }), el('strong', { text: formatNumber(detail.lessonsCompleted) })]),
      el('div', { class: 'admin-mini' }, [el('span', { text: 'Soal dikerjakan' }), el('strong', { text: formatNumber(detail.questionsAnswered) })]),
    ]),
    el('div', { class: 'admin-grid admin-grid--2' }, [
      el('section', { class: 'card admin-panel' }, [
        el('h3', { class: 'card__title', text: 'Riwayat XP terbaru' }),
        detail.recentXp.length === 0
          ? el('p', { class: 'form-hint', text: 'Belum ada riwayat XP.' })
          : table(['Sumber', 'Jumlah', 'Waktu'], detail.recentXp.map((entry) => [
              entry.source,
              `+${formatNumber(entry.amount)}`,
              formatDate(entry.createdAt, true),
            ])),
      ]),
      el('section', { class: 'card admin-panel' }, [
        el('h3', { class: 'card__title', text: 'Riwayat Koin terbaru' }),
        detail.recentCoins.length === 0
          ? el('p', { class: 'form-hint', text: 'Belum ada riwayat Koin.' })
          : table(['Sumber', 'Jumlah', 'Waktu'], detail.recentCoins.map((entry) => [
              entry.source,
              `${entry.amount > 0 ? '+' : ''}${formatNumber(entry.amount)}`,
              formatDate(entry.createdAt, true),
            ])),
      ]),
    ]),
    el('p', {
      class: 'form-hint',
      text: 'Suspend akun dan reset password memerlukan Supabase Admin API melalui Edge Function. Fitur itu belum dibuat, jadi dashboard tidak menampilkan tombol palsu.',
    }),
  ]);
}

export async function renderUsers(ctx: AdminSectionContext): Promise<void> {
  const listSlot = el('div', {});
  const detailSlot = el('div', { class: 'admin-empty' }, [el('p', { text: 'Pilih pengguna untuk melihat detail aktivitas.' })]);
  let search = '';
  let role = '';
  let page = 1;
  const canManage = ctx.permissions.includes('users.manage');

  const load = async (): Promise<void> => {
    listSlot.replaceChildren(loading('Memuat pengguna…'));
    try {
      const result = await adminService.listUsers(search, role, page, 20);
      if (result.items.length === 0) {
        listSlot.replaceChildren(el('p', { class: 'form-hint', text: 'Tidak ada pengguna yang cocok.' }));
      } else {
        listSlot.replaceChildren(
          table(['Pengguna', 'Email', 'Role', 'XP / Koin', 'Onboarding', 'Bergabung', 'Aksi'], result.items.map((user) => [
            el('span', { class: 'admin-user-cell' }, [avatar(user.avatarKey, 'xs'), el('span', {}, [
              el('strong', { text: user.displayName }),
              el('span', { class: 'admin-sub', text: ` @${user.username}` }),
            ])]),
            user.email,
            badge(roleLabel(user.role), user.role === 'player' ? 'muted' : 'ok'),
            `${formatNumber(user.totalXp)} XP · ${formatNumber(user.coins)} K`,
            user.onboardingCompleted ? 'Ya' : 'Belum',
            formatDate(user.joinedAt),
            button('Detail', 'eye', () => {
              detailSlot.replaceChildren(loading('Memuat detail pengguna…'));
              void adminService.getUserDetail(user.userId)
                .then((detail) => detailSlot.replaceChildren(detailView(detail, canManage)))
                .catch((error: unknown) => detailSlot.replaceChildren(errorState(error instanceof Error ? error.message : 'Detail gagal dimuat.')));
            }),
          ])),
        );
      }
      const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
      listSlot.append(
        el('div', { class: 'admin-pagination' }, [
          el('span', { text: `${result.total} pengguna · halaman ${result.page}/${pages}` }),
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
      listSlot.replaceChildren(errorState(error instanceof Error ? error.message : 'Pengguna gagal dimuat.', () => void load()));
    }
  };

  const searchInput = input('user-search', '', 'search', { placeholder: 'Cari email, username, atau nama…' });
  const roleSelect = select('user-role', [
    { value: '', label: 'Semua role' },
    { value: 'player', label: 'Pemain' },
    { value: 'admin', label: 'Admin' },
    { value: 'developer', label: 'Developer' },
  ]);
  searchInput.addEventListener('input', () => {
    window.clearTimeout((searchInput as HTMLInputElement & { timer?: number }).timer);
    (searchInput as HTMLInputElement & { timer?: number }).timer = window.setTimeout(() => {
      search = searchInput.value.trim();
      page = 1;
      void load();
    }, 250);
  });
  roleSelect.addEventListener('change', () => {
    role = roleSelect.value;
    page = 1;
    void load();
  });

  ctx.root.replaceChildren(
    panel('Pengguna', 'Direktori pengguna, role, dan reward. Data sensitif hanya lewat RPC staff.', [
      el('div', { class: 'admin-filters' }, [searchInput, roleSelect]),
      listSlot,
    ]),
    detailSlot,
  );
  await load();
}
