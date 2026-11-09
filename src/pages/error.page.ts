import type { PageModule } from '../app/router';
import { kikoMarkup } from '../components/brandArt';
import { icon } from '../components/icons';
import { el } from '../utils/dom';

const meta = { title: 'Terjadi kesalahan' };

function render(ctx: Parameters<PageModule['render']>[0]): void {
  ctx.outlet.append(
    el('div', { class: 'state-page' }, [
      el('div', { class: 'state-card' }, [
        el('div', { class: 'state-card__icon' }, [icon('alert', 30)]),
        el('h1', { class: 'state-card__title', text: 'Ada yang tidak berjalan lancar' }),
        el('p', {
          class: 'state-card__body',
          text: 'Halaman ini gagal dimuat. Coba muat ulang; jika masih gagal, kembali ke beranda.',
        }),
        el('div', { class: 'state-card__actions' }, [
          el(
            'button',
            {
              class: 'btn',
              attrs: { type: 'button' },
              events: { click: () => window.location.reload() },
            },
            ['Muat ulang'],
          ),
          el('a', { class: 'btn btn--secondary', attrs: { href: '/' } }, ['Ke beranda']),
        ]),
        el('div', { style: { width: '120px', margin: '1.5rem auto 0', opacity: '0.8' }, html: kikoMarkup(120) }),
      ]),
    ]),
  );
}

export { meta, render };
