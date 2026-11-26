import { icon, iconName } from './icons';
import { el } from '../utils/dom';

export const RARITY_LABEL = {
  common: 'COMMON',
  rare: 'RARE',
  legendary: 'LEGENDARY',
} as const;

export interface ProductVisual {
  name: string;
  imageUrl: string | null;
  icon: string;
  rarity: keyof typeof RARITY_LABEL;
}

/**
 * One artwork implementation for every product card. Toko and Tas render the
 * same shop_items image (or the same fallback icon) so a purchased item never
 * changes appearance between the two pages.
 */
export function productArt(item: ProductVisual): HTMLElement {
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
