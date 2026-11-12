import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminAuditEntry, AdminContentHealth } from '../../types/admin';
import { el } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import {
  badge,
  button,
  errorState,
  formatDate,
  loading,
  panel,
  table,
} from './ui';

function healthList(health: AdminContentHealth): HTMLElement {
  const issues: Array<[string, Array<{ id: string; title: string }>]> = [
    ['Lesson terbit tanpa soal', health.publishedLessonsWithoutQuestions],
    ['Node non-reward tanpa lesson', health.nodesWithoutLesson],
    ['Node reward tanpa nilai', health.rewardNodesWithoutValue],
    ['Level terbit tanpa unit', health.levelsWithoutUnits],
  ];
  return el('div', { class: 'admin-health' }, [
    ...issues.map(([label, items]) => el('div', { class: 'admin-health__row' }, [
      el('span', { text: label }),
      badge(String(items.length), items.length === 0 ? 'ok' : 'warn'),
      items.length > 0
        ? el('span', { class: 'admin-sub', text: items.slice(0, 4).map((item) => item.title).join(', ') })
        : null,
    ])),
    el('div', { class: 'admin-health__row' }, [
      el('span', { text: 'Soal diarsipkan' }),
      badge(String(health.archivedQuestions), 'muted'),
    ]),
    el('div', { class: 'admin-health__row' }, [
      el('span', { text: 'Media diarsipkan' }),
      badge(String(health.archivedMedia), 'muted'),
    ]),
  ]);
}

function auditTable(entries: AdminAuditEntry[]): HTMLElement {
  if (entries.length === 0) return el('p', { class: 'form-hint', text: 'Belum ada audit entry.' });
  return table(['Aksi', 'Aktor', 'Target', 'Waktu'], entries.map((entry) => [
    el('span', {}, [
      el('strong', { text: entry.action.replaceAll('_', ' ') }),
      el('span', { class: 'admin-sub', text: ` ${entry.targetType}${entry.targetId ? ` ${entry.targetId.slice(0, 8)}…` : ''}` }),
    ]),
    `${entry.actorName}${entry.actorUsername ? ` (@${entry.actorUsername})` : ''}`,
    entry.targetType,
    formatDate(entry.createdAt, true),
  ]));
}

export async function renderSystem(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat audit dan izin…'));
  try {
    const [audits, context, rolePermissions, health] = await Promise.all([
      adminService.getAuditLogs(60),
      adminService.getContext(),
      adminService.getRolePermissions(),
      adminService.getContentHealth(),
    ]);
    const canManageRoles = ctx.permissions.includes('roles.manage');
    const matrixSlot = el('div', {});
    let adminPermissions = new Set(
      rolePermissions.filter((row) => row.role === 'admin').map((row) => row.permission),
    );

    const paintMatrix = (): void => {
      const rows = context.catalog.map((permission) => {
        const checkbox = el('input', {
          attrs: { type: 'checkbox', 'aria-label': `Izin admin ${permission.label}` },
        });
        checkbox.checked = adminPermissions.has(permission.code);
        checkbox.disabled = !canManageRoles;
        checkbox.addEventListener('change', () => {
          const next = checkbox.checked;
          checkbox.disabled = true;
          void adminService
            .setRolePermission('admin', permission.code, next, 'Ubah matriks izin dari dashboard')
            .then(() => {
              if (next) adminPermissions.add(permission.code);
              else adminPermissions.delete(permission.code);
              showToast('Izin admin diperbarui.', 'success');
            })
            .catch((error: unknown) => {
              checkbox.checked = !next;
              showToast(error instanceof Error ? error.message : 'Gagal mengubah izin.', 'error');
            })
            .finally(() => {
              checkbox.disabled = !canManageRoles;
            });
        });
        return {
          group: permission.group,
          row: [
            el('span', {}, [
              el('strong', { text: permission.label }),
              el('span', { class: 'admin-sub', text: ` ${permission.code}` }),
            ]),
            el('span', { class: 'admin-check' }, [checkbox]),
            el('span', { class: 'admin-check' }, [
              el('input', { attrs: { type: 'checkbox', checked: true, disabled: true } }),
            ]),
          ],
        };
      });
      const grouped = new Map<string, Array<Array<Node | string | null>>>();
      for (const entry of rows) {
        const list = grouped.get(entry.group) ?? [];
        list.push(entry.row);
        grouped.set(entry.group, list);
      }
      matrixSlot.replaceChildren(
        ...[...grouped.entries()].map(([group, groupRows]) =>
          panel(group, null, [table(['Permission', 'Admin', 'Developer'], groupRows)]),
        ),
        el('p', {
          class: 'form-hint',
          text: canManageRoles
            ? 'Developer selalu memiliki semua izin. Perubahan izin admin langsung dipakai RPC.'
            : 'Role kamu tidak memiliki roles.manage, jadi matriks bersifat baca saja.',
        }),
      );
    };
    paintMatrix();

    ctx.root.replaceChildren(
      panel('Matriks izin', 'Izin granular tersimpan di database dan diperiksa ulang oleh setiap RPC.', [matrixSlot]),
      panel('Kesehatan konten', 'Konten yang belum siap dimainkan pemain.', [healthList(health)]),
      panel('Audit log', 'Append-only. Admin biasa tidak dapat mengubah atau menghapus entri.', [
        auditTable(audits),
      ], [
        button('Muat ulang', 'refresh', () => void renderSystem(ctx)),
      ]),
      el('div', { class: 'banner banner--warning' }, [
        el('span', {
          text: 'Backup/restore belum disediakan: Supabase backup tidak dapat diverifikasi dari dashboard ini, jadi tidak ada tombol palsu.',
        }),
      ]),
    );
  } catch (error) {
    ctx.root.replaceChildren(errorState(error instanceof Error ? error.message : 'Sistem gagal dimuat.', () => void renderSystem(ctx)));
  }
}
