import type { PageModule } from '../app/router';
import { kikoMarkup, lampMarkup } from '../components/brandArt';
import { icon } from '../components/icons';
import { brand } from '../config/brand';
import { el } from '../utils/dom';

const meta = { title: 'Setup backend' };

function code(text: string): HTMLElement {
  return el('pre', { class: 'setup-code' }, [el('code', { text })]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const page = el('div', { class: 'state-page' }, [
    el('div', { class: 'state-card', style: { textAlign: 'left', maxWidth: '640px' } }, [
      el('div', { class: 'brand', style: { justifyContent: 'center', marginBottom: '1rem' } }, [
        el('span', { class: 'brand__mark', html: lampMarkup(30) }),
        el('span', { class: 'brand__text' }, [
          el('span', { class: 'brand__name', text: brand.name }),
          el('span', { class: 'brand__tag', text: 'Setup backend' }),
        ]),
      ]),
      el('div', { class: 'state-card__icon' }, [icon('settings', 30)]),
      el('h1', { class: 'state-card__title', text: 'Supabase belum tersambung' }),
      el('p', {
        class: 'state-card__body',
        text: 'Akun, profil, dan penyimpanan cloud membutuhkan project Supabase. Ikuti langkah berikut, lalu muat ulang halaman ini.',
      }),
      el('ol', { class: 'setup-list' }, [
        el('li', {}, [
          el('strong', { text: 'Buat project Supabase' }),
          el('p', {
            text: 'Pilih region terdekat untuk pemain Indonesia, misalnya Singapore (ap-southeast-1).',
          }),
        ]),
        el('li', {}, [
          el('strong', { text: 'Salin kredensial publik' }),
          el('p', {}, [
            'Buka Project Settings → API. Gunakan ',
            el('code', { class: 'code', text: 'anon' }),
            ' / ',
            el('code', { class: 'code', text: 'publishable' }),
            ' key. Jangan pernah menaruh ',
            el('code', { class: 'code', text: 'service_role' }),
            ' di frontend.',
          ]),
        ]),
        el('li', {}, [
          el('strong', { text: 'Isi file .env' }),
          code('cp .env.example .env'),
          code('VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOi...'),
        ]),
        el('li', {}, [
          el('strong', { text: 'Jalankan migrasi database' }),
          el('p', {
            text: 'Buka SQL Editor di dashboard Supabase, lalu jalankan isi file migrasi berikut secara berurutan.',
          }),
          code('supabase/migrations/20261108090000_identity.sql'),
        ]),
        el('li', {}, [
          el('strong', { text: 'Jadikan akunmu Developer' }),
          el('p', {
            text: 'Daftar lewat halaman Register, verifikasi email, lalu jalankan fungsi bootstrap di SQL Editor (lihat docs/SETUP.md).',
          }),
          code("select public.bootstrap_developer('email-kamu@contoh.com');"),
        ]),
        el('li', {}, [
          el('strong', { text: 'Mulai ulang server' }),
          code('npm run dev'),
        ]),
      ]),
      el('div', { class: 'state-card__actions' }, [
        el('a', { class: 'btn', attrs: { href: '/' } }, ['Kembali ke beranda']),
        el(
          'button',
          {
            class: 'btn btn--secondary',
            attrs: { type: 'button' },
            events: { click: () => window.location.reload() },
          },
          ['Muat ulang'],
        ),
      ]),
      el('div', { style: { marginTop: '1.5rem', textAlign: 'center' } }, [
        el('span', { html: kikoMarkup(96) }),
      ]),
    ]),
  ]);

  ctx.outlet.append(page);
}

export { meta, render };
