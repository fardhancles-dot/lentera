import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { RARITY_LABEL, productArt } from '../components/productArt';
import { storeNav } from '../components/storeNav';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { rewardsStore } from '../stores/rewards.store';
import { sessionStore } from '../stores/session.store';
import type { Inventory, InventoryItem } from '../types/rewards';
import { groupInventoryItems, inventoryTotal } from '../utils/inventory';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Tas' };

function inventoryCard(
  item: InventoryItem,
  activeFreezes: number,
  onUse: (item: InventoryItem) => Promise<void>,
): HTMLElement {
  const freezeFull = item.kind === 'streak_freeze' && activeFreezes >= 2;
  const status = freezeFull
    ? 'Perisai aktif maksimal'
    : item.kind === 'heart_potion'
      ? 'Siap digunakan'
      : 'Siap diaktifkan';
  const label = freezeFull
    ? 'Maksimal'
    : item.kind === 'heart_potion'
      ? 'Gunakan'
      : 'Aktifkan';

  const use = el('button', { class: 'btn btn--secondary btn--block', attrs: { type: 'button' } }, [
    icon(item.kind === 'heart_potion' ? 'heart' : 'shield', 18),
    label,
  ]);
  use.disabled = item.quantity <= 0 || freezeFull;

  use.addEventListener('click', () => {
    if (use.disabled) return;
    use.disabled = true;
    use.replaceChildren(el('span', { class: 'btn__spinner' }), 'Menggunakan…');
    void onUse(item).catch(() => {
      use.disabled = false;
      use.replaceChildren(
        icon(item.kind === 'heart_potion' ? 'heart' : 'shield', 18),
        label,
      );
    });
  });

  return el(
    'article',
    {
      class: `card inventory-card shop-card--${item.rarity}`,
      dataset: { kind: item.kind },
      attrs: { 'aria-label': `${item.name}, ${RARITY_LABEL[item.rarity]}, jumlah ${item.quantity}` },
    },
    [
      el('div', { class: 'inventory-card__art' }, [productArt(item)]),
      el('div', { class: 'inventory-card__top' }, [
        el('span', { class: 'badge inventory-card__rarity', text: RARITY_LABEL[item.rarity] }),
        el('span', { class: 'badge inventory-card__qty', text: `${item.quantity}×` }),
      ]),
      el('span', { class: `inventory-card__status${freezeFull ? ' inventory-card__status--muted' : ''}` }, [
        icon(freezeFull ? 'shield' : 'check', 12),
        status,
      ]),
      el('h3', { class: 'inventory-card__title', text: item.name }),
      el('p', { class: 'inventory-card__body', text: item.description }),
      el('p', { class: 'inventory-card__meta', text: `Maks. ${item.maxStack} di tas` }),
      use,
    ],
  );
}

function emptyState(): HTMLElement {
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon('bag', 34)]),
    el('h2', { class: 'empty-state__title', text: 'Tas kamu masih kosong' }),
    el('p', {
      class: 'empty-state__body',
      text: 'Kunjungi Toko untuk mendapatkan item pertama kamu.',
    }),
    el('a', { class: 'btn btn--secondary', attrs: { href: '/shop' } }, [
      icon('gift', 18),
      'Buka Toko',
    ]),
  ]);
}

function errorCard(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary btn--sm', attrs: { type: 'button' } }, [
    icon('refresh', 16),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);

  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
    el('h2', { class: 'empty-state__title', text: 'Tas gagal dimuat' }),
    el('p', { class: 'empty-state__body', text: message }),
    button,
  ]);
}

function loading(message: string): HTMLElement {
  return el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: message }),
  ]);
}

function groupSection(
  group: ReturnType<typeof groupInventoryItems>[number],
  activeFreezes: number,
  onUse: (item: InventoryItem) => Promise<void>,
): HTMLElement {
  const quantity = inventoryTotal(group.items);

  return el('section', { class: 'inventory-group' }, [
    el('div', { class: 'inventory-group__head' }, [
      el('div', {}, [
        el('h3', { class: 'inventory-group__title', text: group.title }),
        el('p', { class: 'inventory-group__note', text: group.note }),
      ]),
      el('span', { class: 'inventory-group__count', text: `${quantity} item` }),
    ]),
    el(
      'div',
      { class: 'inventory-grid' },
      group.items.map((item) => inventoryCard(item, activeFreezes, onUse)),
    ),
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const host = el('div', {});
  const itemCountValue = el('strong', { text: '—' });
  const freezeValue = el('strong', { text: '—' });
  const coinValue = el('strong', { text: '—' });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Tas Lentera',
      title: 'Tas',
      subtitle: 'Semua item yang kamu miliki, siap dilihat dan digunakan dari satu tempat.',
    }),
    storeNav('inventory'),
    el('div', { class: 'shop-hero inventory-hero' }, [
      el('div', {}, [
        el('span', { class: 'shop-hero__eyebrow' }, [icon('bag', 16), 'Isi tas kamu']),
        el('p', { class: 'shop-hero__value' }, [
          itemCountValue,
          el('span', { class: 'inventory-hero__unit', text: ' item' }),
        ]),
        el('p', { class: 'shop-hero__hint' }, [
          freezeValue,
          ' perisai aktif · ',
          coinValue,
          ' Koin tersedia.',
        ]),
      ]),
      el('div', { class: 'shop-hero__actions' }, [
        el('a', { class: 'btn btn--secondary', attrs: { href: '/shop' } }, [
          icon('gift', 16),
          'Kunjungi Toko',
        ]),
      ]),
    ]),
    host,
  ]);

  renderAppLayout(ctx, { active: 'inventory', title: 'Tas', content });

  const use = async (item: InventoryItem) => {
    try {
      const result = await rewardsStore.useItem(item.id);
      if (disposed) return;
      if (result.effect === 'hearts') {
        showToast(`${formatNumber(result.restored)} Hearts dipulihkan.`, 'success');
      } else {
        showToast(`Perisai Streak aktif. Total perisai: ${result.freezes}.`, 'success');
      }
      paint();
    } catch (error) {
      if (!disposed) {
        showToast(error instanceof Error ? error.message : 'Item gagal digunakan.', 'error');
      }
      throw error;
    }
  };

  const paintInventory = (inventory: Inventory) => {
    itemCountValue.textContent = formatNumber(inventoryTotal(inventory.items));
    freezeValue.textContent = `${inventory.streakFreezes}/2`;
    coinValue.textContent = formatNumber(inventory.coins);

    if (inventory.items.length === 0) {
      host.replaceChildren(emptyState());
      return;
    }

    const groups = groupInventoryItems(inventory.items);
    host.replaceChildren(
      el('section', { class: 'rewards-section' }, [
        el('div', { class: 'rewards-section__head' }, [
          el('h2', { class: 'rewards-section__title', text: 'Barang di tas' }),
          el('span', {
            class: 'rewards-section__hint',
            text: `${formatNumber(inventoryTotal(inventory.items))} item dari server`,
          }),
        ]),
        el(
          'div',
          { class: 'inventory-groups' },
          groups.map((group) => groupSection(group, inventory.streakFreezes, use)),
        ),
      ]),
    );
  };

  const paint = () => {
    const state = rewardsStore.getState();
    host.replaceChildren();

    if (state.inventoryStatus === 'error') {
      host.append(errorCard(state.inventoryError ?? 'Tas gagal dimuat.', load));
      return;
    }

    if (!state.inventory) {
      host.append(loading('Memuat tas…'));
      return;
    }

    paintInventory(state.inventory);
  };

  const load = async () => {
    host.replaceChildren(loading('Memuat tas…'));
    await rewardsStore.loadInventory(true);
    if (disposed) return;
    paint();
  };

  paint();
  void load();
}

export { meta };
