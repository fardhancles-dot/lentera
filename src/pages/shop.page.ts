import type { PageModule } from '../app/router';
import { icon, iconName } from '../components/icons';
import { storeNav } from '../components/storeNav';
import { showToast } from '../components/toast';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { rewardsStore } from '../stores/rewards.store';
import { sessionStore } from '../stores/session.store';
import type { ShopItem } from '../types/rewards';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Toko' };

function productArt(item: ShopItem): HTMLElement {
  const art = el('div', { class: 'shop-card__art' });
  const fallback = el('span', { class: 'shop-card__fallback' }, [
    icon(iconName(item.icon, 'bag'), 48),
  ]);
  art.append(fallback);

  if (item.imageUrl) {
    const image = el('img', {
      class: 'shop-card__image',
      attrs: { alt: item.name, loading: 'lazy', decoding: 'async' },
    });
    image.addEventListener('load', () => {
      art.classList.add('has-image');
    });
    image.addEventListener('error', () => {
      art.classList.remove('has-image');
      image.remove();
    });
    image.src = item.imageUrl;
    art.append(image);
  }

  return art;
}

const RARITY_LABEL = {
  common: 'COMMON',
  rare: 'RARE',
  legendary: 'LEGENDARY',
} as const;

function shopCard(item: ShopItem, onBuy: (item: ShopItem) => Promise<void>): HTMLElement {
  const full = item.owned >= item.maxStack;
  const buyLabel = full ? 'Stok penuh' : item.canBuy ? 'Beli' : 'Koin kurang';
  const buy = el('button', {
    class: 'btn btn--sm shop-card__buy',
    attrs: { type: 'button' },
  }, [buyLabel]);
  buy.disabled = full || !item.canBuy;

  buy.addEventListener('click', () => {
    if (buy.disabled) return;
    buy.disabled = true;
    buy.replaceChildren(el('span', { class: 'btn__spinner' }), 'Membeli…');
    void onBuy(item).catch(() => {
      buy.disabled = false;
      buy.replaceChildren(buyLabel);
    });
  });

  return el(
    'article',
    {
      class: `shop-card shop-card--${item.rarity}`,
      attrs: {
        'data-rarity': item.rarity,
        'aria-label': `${item.name}. ${item.description} Harga ${formatNumber(item.priceCoins)} Koin.`,
        title: item.description,
      },
    },
    [
      el('header', { class: 'shop-card__head' }, [
        el('h3', { class: 'shop-card__title', text: item.name }),
        el('span', { class: 'shop-card__rarity', text: RARITY_LABEL[item.rarity] }),
      ]),
      el('div', { class: 'shop-card__art-wrap' }, [
        productArt(item),
        el('span', { class: 'shop-card__limit', text: `Maks. ${item.maxStack}` }),
      ]),
      el('footer', { class: 'shop-card__footer' }, [
        el('p', { class: 'shop-card__price' }, [
          icon('coin', 15),
          el('strong', { text: formatNumber(item.priceCoins) }),
          el('span', { text: 'Koin' }),
        ]),
        buy,
      ]),
    ],
  );
}

function emptyState(): HTMLElement {
  return el('div', { class: 'card empty-state' }, [
    el('span', { class: 'empty-state__art' }, [icon('gift', 34)]),
    el('h2', { class: 'empty-state__title', text: 'Belum ada produk' }),
    el('p', {
      class: 'empty-state__body',
      text: 'Toko sedang kosong. Kembali lagi nanti untuk melihat item baru.',
    }),
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
  const coinValue = el('strong', { text: '—' });

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Toko Lentera',
      title: 'Toko',
      subtitle:
        'Pilih produk, periksa harga dan batas pembelian, lalu beli dengan Koin. Item yang berhasil dibeli otomatis masuk ke Tas.',
    }),
    storeNav('shop'),
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
        el('a', { class: 'btn btn--secondary', attrs: { href: '/inventory' } }, [
          icon('bag', 16),
          'Buka Tas',
        ]),
        el('a', { class: 'btn btn--ghost', attrs: { href: '/wallet' } }, [
          icon('coin', 16),
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
        el('h2', { class: 'rewards-section__title', text: 'Produk tersedia' }),
        el('span', { class: 'rewards-section__hint', text: 'Harga dari server' }),
      ]),
      shopSlot,
    ]),
  ]);

  renderAppLayout(ctx, { active: 'shop', title: 'Toko', content });

  const buy = async (item: ShopItem) => {
    try {
      const result = await rewardsStore.purchase(item.id);
      if (disposed) return;
      showToast(
        `${item.name} dibeli dan masuk ke Tas. Sisa ${formatNumber(result.coinBalance)} Koin.`,
        'success',
      );
      paintShop();
    } catch (error) {
      if (!disposed) {
        showToast(error instanceof Error ? error.message : 'Pembelian gagal.', 'error');
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
    if (state.shop.items.length === 0) {
      shopSlot.append(emptyState());
      return;
    }

    shopSlot.append(
      el(
        'div',
        { class: 'shop-product-grid' },
        state.shop.items.map((item) => shopCard(item, buy)),
      ),
    );
  };

  const load = async () => {
    shopSlot.replaceChildren(loading('Memuat toko…'));
    await rewardsStore.loadShop(true);
    if (disposed) return;
    paintShop();
  };

  paintShop();
  void load();
}

export { meta };
