import type { PageModule } from '../app/router';
import { icon, iconName } from '../components/icons';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { rewardsStore } from '../stores/rewards.store';
import { sessionStore } from '../stores/session.store';
import type { InventoryItem, ShopItem } from '../types/rewards';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Toko & Tas' };

function effectLabel(kind: ShopItem['kind']): string {
  return kind === 'heart_potion' ? 'Memulihkan hingga 3 Hearts' : 'Melindungi Streak 1 hari';
}

function shopCard(item: ShopItem, onBuy: (item: ShopItem) => Promise<void>): HTMLElement {
  const full = item.owned >= item.maxStack;
  const buy = el('button', { class: 'btn btn--block', attrs: { type: 'button' } }, [
    icon('coin', 18),
    full
      ? 'Stok penuh'
      : item.canBuy
        ? `Beli · ${formatNumber(item.priceCoins)} Koin`
        : 'Koin belum cukup',
  ]);
  buy.disabled = full || !item.canBuy;

  buy.addEventListener('click', () => {
    if (buy.disabled) return;
    buy.disabled = true;
    buy.replaceChildren(el('span', { class: 'btn__spinner' }), 'Membeli…');
    void onBuy(item).catch(() => {
      buy.disabled = false;
      buy.replaceChildren(icon('coin', 18), `Beli · ${formatNumber(item.priceCoins)} Koin`);
    });
  });

  return el('article', { class: 'card shop-card' }, [
    el('div', { class: 'shop-card__top' }, [
      el('span', { class: 'shop-card__icon' }, [icon(iconName(item.icon, 'bag'), 24)]),
      el('span', { class: 'badge badge--muted', text: `${item.owned}/${item.maxStack} dimiliki` }),
    ]),
    el('h3', { class: 'shop-card__title', text: item.name }),
    el('p', { class: 'shop-card__body', text: item.description }),
    el('p', { class: 'shop-card__effect', text: effectLabel(item.kind) }),
    buy,
  ]);
}

function inventoryCard(
  item: InventoryItem,
  onUse: (item: InventoryItem) => Promise<void>,
): HTMLElement {
  const use = el('button', { class: 'btn btn--secondary btn--block', attrs: { type: 'button' } }, [
    icon(item.kind === 'heart_potion' ? 'heart' : 'shield', 18),
    item.kind === 'heart_potion' ? 'Gunakan ramuan' : 'Aktifkan perisai',
  ]);
  use.disabled = item.quantity <= 0;

  use.addEventListener('click', () => {
    if (use.disabled) return;
    use.disabled = true;
    use.replaceChildren(el('span', { class: 'btn__spinner' }), 'Menggunakan…');
    void onUse(item).catch(() => {
      use.disabled = false;
      use.replaceChildren(
        icon(item.kind === 'heart_potion' ? 'heart' : 'shield', 18),
        item.kind === 'heart_potion' ? 'Gunakan ramuan' : 'Aktifkan perisai',
      );
    });
  });

  return el('article', { class: 'card inventory-card' }, [
    el('div', { class: 'inventory-card__top' }, [
      el('span', { class: 'inventory-card__icon' }, [icon(iconName(item.icon, 'bag'), 22)]),
      el('span', { class: 'badge', text: `${item.quantity}×` }),
    ]),
    el('h3', { class: 'inventory-card__title', text: item.name }),
    el('p', { class: 'inventory-card__body', text: item.description }),
    use,
  ]);
}

function emptyState(title: string, body: string, iconNameFallback: 'bag' | 'gift'): HTMLElement {
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon(iconNameFallback, 34)]),
    el('h2', { class: 'empty-state__title', text: title }),
    el('p', { class: 'empty-state__body', text: body }),
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
    el('h2', { class: 'empty-state__title', text: 'Toko gagal dimuat' }),
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

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  let disposed = false;
  ctx.onCleanup(() => {
    disposed = true;
  });

  const shopSlot = el('div', {});
  const inventorySlot = el('div', {});
  const coinValue = el('strong', { text: '—' });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Toko Lentera',
      title: 'Toko & Tas',
      subtitle:
        'Harga, saldo, dan isi tas dihitung server. Item yang kamu beli bisa langsung dipakai dari tas.',
    }),
    el('div', { class: 'shop-hero' }, [
      el('div', {}, [
        el('span', { class: 'shop-hero__eyebrow' }, [icon('coin', 16), 'Koin kamu']),
        el('p', { class: 'shop-hero__value' }, [coinValue]),
        el('p', {
          class: 'shop-hero__hint',
          text: 'Koin didapat dari lesson, latihan, misi, dan hadiah level.',
        }),
      ]),
      el('div', { class: 'shop-hero__actions' }, [
        el('a', { class: 'btn btn--secondary', attrs: { href: '/wallet' } }, [
          icon('bag', 16),
          'Wallet',
        ]),
        el('a', { class: 'btn btn--ghost', attrs: { href: '/quests' } }, [
          icon('flag', 16),
          'Cari misi',
        ]),
      ]),
    ]),
    el('section', { class: 'rewards-section' }, [
      el('div', { class: 'rewards-section__head' }, [
        el('h2', { class: 'rewards-section__title', text: 'Toko' }),
        el('span', { class: 'rewards-section__hint', text: 'Harga dari server' }),
      ]),
      shopSlot,
    ]),
    el('section', { class: 'rewards-section' }, [
      el('div', { class: 'rewards-section__head' }, [
        el('h2', { class: 'rewards-section__title', text: 'Tas' }),
        el('span', { class: 'rewards-section__hint', text: 'Gunakan item kapan saja' }),
      ]),
      inventorySlot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'shop', title: 'Toko', content });

  const buy = async (item: ShopItem) => {
    try {
      const result = await rewardsStore.purchase(item.id);
      if (disposed) return;
      showToast(
        `${item.name} dibeli. Sisa ${formatNumber(result.coinBalance)} Koin.`,
        'success',
      );
      await load();
    } catch (error) {
      if (!disposed) {
        showToast(error instanceof Error ? error.message : 'Pembelian gagal.', 'error');
      }
      throw error;
    }
  };

  const use = async (item: InventoryItem) => {
    try {
      const result = await rewardsStore.useItem(item.id);
      if (disposed) return;
      if (result.effect === 'hearts') {
        showToast(`${formatNumber(result.restored)} Hearts dipulihkan.`, 'success');
      } else {
        showToast(`Perisai Streak aktif. Total perisai: ${result.freezes}.`, 'success');
      }
      await load();
    } catch (error) {
      if (!disposed) {
        showToast(error instanceof Error ? error.message : 'Item gagal digunakan.', 'error');
      }
      throw error;
    }
  };

  const paintShop = () => {
    const state = rewardsStore.getState();
    shopSlot.replaceChildren();

    if (state.shopStatus === 'error') {
      shopSlot.append(errorCard(state.shopError ?? 'Toko gagal dimuat.', load));
      return;
    }

    if (!state.shop) {
      shopSlot.append(loading('Memuat toko…'));
      return;
    }

    coinValue.textContent = formatNumber(state.shop.coins);
    shopSlot.append(
      el(
        'div',
        { class: 'shop-grid' },
        state.shop.items.map((item) => shopCard(item, buy)),
      ),
    );
  };

  const paintInventory = () => {
    const state = rewardsStore.getState();
    inventorySlot.replaceChildren();

    if (state.inventoryStatus === 'error') {
      inventorySlot.append(
        errorCard(state.inventoryError ?? 'Tas gagal dimuat.', load),
      );
      return;
    }

    if (!state.inventory) {
      inventorySlot.append(loading('Memuat tas…'));
      return;
    }

    if (state.inventory.items.length === 0) {
      inventorySlot.append(
        emptyState(
          'Tasmu masih kosong',
          'Beli Ramuan Hati atau Perisai Streak dari toko. Item yang dibeli muncul di sini.',
          'bag',
        ),
      );
      return;
    }

    inventorySlot.append(
      el('p', { class: 'inventory-summary' }, [
        icon('shield', 16),
        `${state.inventory.streakFreezes}/2 perisai Streak siap dipakai`,
      ]),
      el(
        'div',
        { class: 'shop-grid' },
        state.inventory.items.map((item) => inventoryCard(item, use)),
      ),
    );
  };

  const load = async () => {
    shopSlot.replaceChildren(loading('Memuat toko…'));
    inventorySlot.replaceChildren(loading('Memuat tas…'));
    await Promise.all([rewardsStore.loadShop(true), rewardsStore.loadInventory(true)]);
    if (disposed) return;
    paintShop();
    paintInventory();
  };

  paintShop();
  paintInventory();
  void load();
}

export { meta };
