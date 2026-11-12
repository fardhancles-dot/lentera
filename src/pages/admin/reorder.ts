import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import { el } from '../../utils/dom';

export type ReorderEntity = 'subject' | 'course' | 'level' | 'unit' | 'lesson' | 'node' | 'question';

/**
 * Up/down controls for a sibling list. The whole ordered id list is sent to the
 * admin_reorder RPC, which rewrites sort_order as 0..n-1 within that list.
 */
export function reorderControls(
  entity: ReorderEntity,
  ids: string[],
  index: number,
  onDone: () => void,
): HTMLElement {
  const move = (delta: number): void => {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    void adminService
      .reorder(entity, next, `Ubah urutan ${entity} dari dashboard`)
      .then(() => {
        showToast('Urutan diperbarui.', 'success');
        onDone();
      })
      .catch((error: unknown) => {
        showToast(error instanceof Error ? error.message : 'Urutan gagal diubah.', 'error');
      });
  };

  const step = (label: string, delta: number, disabled: boolean): HTMLButtonElement =>
    el('button', {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': label, title: label, disabled },
      events: { click: () => move(delta) },
    }, [el('span', { attrs: { 'aria-hidden': 'true' }, text: delta < 0 ? '↑' : '↓' })]);

  return el('span', { class: 'admin-row-actions' }, [
    step('Naikkan urutan', -1, index === 0),
    step('Turunkan urutan', 1, index === ids.length - 1),
  ]);
}
