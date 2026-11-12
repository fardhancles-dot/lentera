import { brand } from '../config/brand';
import { contentService } from '../services/content.service';
import { brandMark } from '../components/brandMark';
import { el } from '../utils/dom';
import type { RouteContext } from '../app/router';

export async function renderAuthLayout(ctx: RouteContext, card: HTMLElement): Promise<void> {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const site = contentService.settings;

  const root = el('div', { class: 'auth-shell' }, [
    el('section', { class: 'auth-visual', attrs: { 'aria-hidden': 'true' } }, [
      el('span', { class: 'auth-visual__leaf auth-visual__leaf--a' }),
      el('span', { class: 'auth-visual__leaf auth-visual__leaf--b' }),
      el('div', { class: 'auth-visual__inner' }, [
        el('div', { class: 'brand' }, [
          brandMark(30),
          el('span', { class: 'brand__text' }, [
            el('span', { class: 'brand__name', text: site.siteName }),
            el('span', { class: 'brand__tag', text: site.tagline }),
          ]),
        ]),
        el('div', { class: 'auth-visual__copy' }, [
          el('h2', { text: 'Belajar terasa seperti bermain petualangan.' }),
          el('p', {
            text: 'Kiko menemanimu menjelajahi materi sekolah, satu langkah kecil setiap hari.',
          }),
        ]),
        el('div', { class: 'auth-visual__stage' }),
      ]),
      el('div', { class: 'auth-visual__ground' }),
    ]),
    el('section', { class: 'auth-panel' }, [
      el('div', { class: 'auth-panel__top' }, [
        el('a', { class: 'topbar__mobile-brand', attrs: { href: '/' } }, [
          brandMark(24),
          el('span', { text: site.siteName }),
        ]),
        el('a', { class: 'btn btn--ghost btn--sm', attrs: { href: '/' } }, ['Beranda']),
      ]),
      el('div', { class: 'auth-panel__body' }, [card]),
      el('p', {
        class: 'auth-panel__legal',
        text: site.copyright || `© ${new Date().getFullYear()} ${brand.copyrightName} · v${brand.version}`,
      }),
    ]),
  ]);

  ctx.outlet.append(root);

  let active = true;
  let stage: { destroy: () => void } | null = null;
  ctx.onCleanup(() => {
    active = false;
    stage?.destroy();
    stage = null;
  });

  const stageMount = root.querySelector<HTMLElement>('.auth-visual__stage');
  if (!stageMount) return;

  try {
    const { createMascotStage } = await import('../game/mascot/createMascotStage');
    if (!active) return;
    stage = createMascotStage(stageMount, { reducedMotion });
  } catch (error) {
    console.error('[auth] mascot stage failed to start', error);
  }
}
