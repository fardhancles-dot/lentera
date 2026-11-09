import type { PageModule } from '../app/router';
import { kikoMarkup, lampMarkup } from '../components/brandArt';
import { brand } from '../config/brand';
import { el } from '../utils/dom';

const meta = { title: 'Halaman tidak ditemukan' };

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const authenticated = Boolean(document.querySelector('.shell'));

  ctx.outlet.append(
    el('div', { class: 'state-page' }, [
      el('div', { class: 'state-card' }, [
        el('a', { class: 'brand', attrs: { href: '/' }, style: { justifyContent: 'center', marginBottom: '1.25rem' } }, [
          el('span', { class: 'brand__mark', html: lampMarkup(30) }),
          el('span', { class: 'brand__text' }, [
            el('span', { class: 'brand__name', text: brand.name }),
            el('span', { class: 'brand__tag', text: brand.tagline }),
          ]),
        ]),
        el('div', { style: { width: '150px', margin: '0 auto 0.5rem' }, html: kikoMarkup(150) }),
        el('p', { class: 'page-header__eyebrow', style: { justifyContent: 'center' } }, [
          'Error 404',
        ]),
        el('h1', { class: 'state-card__title', text: 'Kiko tersesat di jalur yang salah' }),
        el('p', {
          class: 'state-card__body',
          text: 'Halaman yang kamu cari tidak ditemukan. Mari kembali ke jalur petualangan.',
        }),
        el('div', { class: 'state-card__actions' }, [
          el('a', {
            class: 'btn',
            attrs: { href: authenticated ? '/app' : '/' },
          }, [authenticated ? 'Kembali ke beranda' : 'Kembali ke awal']),
          el(
            'button',
            {
              class: 'btn btn--secondary',
              attrs: { type: 'button' },
              events: { click: () => window.history.back() },
            },
            ['Halaman sebelumnya'],
          ),
        ]),
      ]),
    ]),
  );
}

export { meta, render };
