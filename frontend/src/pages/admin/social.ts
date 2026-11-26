import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminFriendQuest } from '../../types/admin';
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
  table,
} from './ui';

function openQuestEditor(quest: AdminFriendQuest, onDone: () => void): void {
  const content = el('div', {}, [
    el('p', { class: 'admin-dialog__message', text: `Ubah target dan hadiah “${quest.title}”. Quest yang sudah selesai terkunci.` }),
    field('Target XP', input('targetXp', quest.targetXp, 'number', { min: '20', max: '10000' })),
    field('Hadiah XP', input('rewardXp', quest.rewardXp, 'number', { min: '0', max: '1000' })),
    field('Hadiah Koin', input('rewardCoins', quest.rewardCoins, 'number', { min: '0', max: '1000' })),
    field('Alasan', input('reason', '', 'text', { minlength: '3', maxlength: '160' })),
  ]);
  openDialog({
    title: 'Kelola Friend Quest',
    content,
    submitLabel: 'Simpan',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reason = String(data.get('reason') ?? '').trim();
      if (reason.length < 3) throw new Error('Alasan minimal 3 karakter.');
      await adminService.updateFriendQuest(
        quest.id,
        Number(data.get('targetXp') ?? quest.targetXp),
        Number(data.get('rewardXp') ?? quest.rewardXp),
        Number(data.get('rewardCoins') ?? quest.rewardCoins),
        reason,
      );
      showToast('Friend Quest diperbarui.', 'success');
      onDone();
    },
  });
}

export async function renderSocial(ctx: AdminSectionContext): Promise<void> {
  const friendshipSlot = el('div', {});
  const questSlot = el('div', {});
  let search = '';
  let status = '';
  let page = 1;

  const loadFriendships = async (): Promise<void> => {
    friendshipSlot.replaceChildren(loading('Memuat pertemanan…'));
    try {
      const result = await adminService.listSocial(search, status, page, 25);
      friendshipSlot.replaceChildren(
        result.items.length === 0
          ? el('p', { class: 'form-hint', text: 'Tidak ada relasi pertemanan yang cocok.' })
          : table(['Requester', 'Addressee', 'Status', 'Dibuat', 'Aksi'], result.items.map((item) => [
              `${item.requesterName} (@${item.requesterUsername})`,
              `${item.addresseeName} (@${item.addresseeUsername})`,
              badge(item.status, item.status === 'accepted' ? 'ok' : item.status === 'pending' ? 'warn' : 'muted'),
              formatDate(item.createdAt, true),
              button('Hapus relasi', 'close', () => {
                void (async () => {
                  const reason = await askReason(
                    'Moderasi pertemanan',
                    `Hapus relasi antara @${item.requesterUsername} dan @${item.addresseeUsername}? Tindakan ini dicatat pada audit log.`,
                    'Hapus relasi',
                  );
                  if (!reason) return;
                  await adminService.removeFriendship(item.id, reason);
                  showToast('Relasi dihapus dan tercatat.', 'success');
                  await loadFriendships();
                })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Gagal menghapus relasi.', 'error'));
              }, 'danger'),
            ])),
      );
      const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
      friendshipSlot.append(
        el('div', { class: 'admin-pagination' }, [
          el('span', { text: `${result.total} relasi · halaman ${result.page}/${pages}` }),
          el('span', { class: 'admin-row-actions' }, [
            button('Sebelumnya', 'arrow-left', () => {
              if (page > 1) {
                page -= 1;
                void loadFriendships();
              }
            }),
            button('Berikutnya', 'arrow-right', () => {
              if (page < pages) {
                page += 1;
                void loadFriendships();
              }
            }),
          ]),
        ]),
      );
    } catch (error) {
      friendshipSlot.replaceChildren(errorState(error instanceof Error ? error.message : 'Pertemanan gagal dimuat.', () => void loadFriendships()));
    }
  };

  const loadQuests = async (): Promise<void> => {
    questSlot.replaceChildren(loading('Memuat Friend Quest…'));
    try {
      const quests = await adminService.listFriendQuests('');
      questSlot.replaceChildren(
        quests.length === 0
          ? el('p', { class: 'form-hint', text: 'Belum ada Friend Quest.' })
          : table(['Quest', 'Kode', 'Status', 'Progres', 'Hadiah', 'Aksi'], quests.map((quest) => [
              quest.title,
              quest.code,
              badge(quest.status, quest.status === 'completed' ? 'ok' : quest.status === 'active' ? 'warn' : 'muted'),
              `${quest.totalXp}/${quest.targetXp} XP · ${quest.memberCount} anggota`,
              `${quest.rewardXp} XP · ${quest.rewardCoins} Koin`,
              quest.status === 'active'
                ? button('Edit', 'settings', () => openQuestEditor(quest, () => void loadQuests()))
                : el('span', { class: 'admin-sub', text: 'Terkunci' }),
            ])),
      );
    } catch (error) {
      questSlot.replaceChildren(errorState(error instanceof Error ? error.message : 'Friend Quest gagal dimuat.', () => void loadQuests()));
    }
  };

  const searchInput = input('social-search', '', 'search', { placeholder: 'Cari username atau nama…' });
  const statusSelect = select('social-status', [
    { value: '', label: 'Semua status' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Diterima' },
    { value: 'declined', label: 'Ditolak' },
  ]);
  searchInput.addEventListener('input', () => {
    window.clearTimeout((searchInput as HTMLInputElement & { timer?: number }).timer);
    (searchInput as HTMLInputElement & { timer?: number }).timer = window.setTimeout(() => {
      search = searchInput.value.trim();
      page = 1;
      void loadFriendships();
    }, 250);
  });
  statusSelect.addEventListener('change', () => {
    status = statusSelect.value;
    page = 1;
    void loadFriendships();
  });

  ctx.root.replaceChildren(
    panel('Pertemanan', 'Moderasi relasi dengan alasan dan audit.', [
      el('div', { class: 'admin-filters' }, [searchInput, statusSelect]),
      friendshipSlot,
    ]),
    panel('Friend Quest', 'Target dan hadiah quest yang masih berjalan.', [questSlot]),
  );
  await Promise.all([loadFriendships(), loadQuests()]);
}
