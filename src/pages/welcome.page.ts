import type { PageModule } from '../app/router';
import { lampMarkup } from '../components/brandArt';
import { icon, type IconName } from '../components/icons';
import { brand } from '../config/brand';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Belajar sambil bermain' };

const FEATURES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'map',
    title: 'Peta petualangan',
    body: 'Materi tersusun sebagai jalur perjalanan 2D dengan node lesson, review, dan tantangan.',
  },
  {
    icon: 'gamepad',
    title: 'Banyak cara bermain',
    body: 'Dua puluh tipe mini-game: menyusun kalimat, mendengar, mencocokkan, dan lainnya.',
  },
  {
    icon: 'gift',
    title: 'Hadiah setiap hari',
    body: 'XP, Koin, quest, dan pencapaian membuat kebiasaan belajar terasa ringan.',
  },
  {
    icon: 'shield',
    title: 'Progres aman di cloud',
    body: 'Akun tersimpan di server, jadi progres tetap ada saat berganti perangkat.',
  },
];

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const state = sessionStore.getState();
  const signedIn = state.status === 'authenticated';

  const navActions = signedIn
    ? [
        el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/app' } }, [
          'Lanjut belajar',
        ]),
      ]
    : [
        el('a', { class: 'btn btn--ghost btn--sm', attrs: { href: '/login' } }, ['Masuk']),
        el('a', { class: 'btn btn--sm', attrs: { href: '/register' } }, ['Daftar gratis']),
      ];

  const stageLabel = el('span', { text: 'Kiko siap menemanimu' });

  const stage = el('div', { class: 'mascot-stage' });

  const heroArt = el('div', { class: 'hero__art' }, [
    stage,
    el('div', { class: 'hero__art-label' }, [
      el('span', { class: 'dot' }),
      stageLabel,
    ]),
  ]);

  const page = el('div', { class: 'landing' }, [
    el('header', { class: 'landing__nav' }, [
      el('a', { class: 'brand', attrs: { href: '/' } }, [
        el('span', { class: 'brand__mark', html: lampMarkup(30) }),
        el('span', { class: 'brand__text' }, [
          el('span', { class: 'brand__name', text: brand.name }),
          el('span', { class: 'brand__tag', text: brand.tagline }),
        ]),
      ]),
      el('div', { class: 'landing__nav-actions' }, navActions),
    ]),

    el('main', { class: 'landing__main', attrs: { id: 'main' } }, [
      el('section', { class: 'hero' }, [
        el('div', {}, [
          el('span', { class: 'hero__eyebrow' }, [
            el('span', { class: 'dot' }),
            el('span', { text: 'Game edukasi 2D untuk SMA/SMK' }),
          ]),
          el('h1', { class: 'hero__title' }, [
            'Belajar sambil ',
            el('em', { text: 'menjelajah' }),
            ' petualangan.',
          ]),
          el('p', {
            class: 'hero__lede',
            text: 'Lentera mengubah materi sekolah menjadi perjalanan yang seru. Selesaikan lesson, kumpulkan XP dan Koin, lalu jaga semangat belajarmu setiap hari.',
          }),
          el('div', { class: 'hero__actions' }, [
            signedIn
              ? el('a', { class: 'btn btn--lg', attrs: { href: '/app' } }, [
                  'Buka beranda',
                  icon('arrow-right', 20),
                ])
              : el('a', { class: 'btn btn--lg', attrs: { href: '/register' } }, [
                  'Mulai gratis',
                  icon('arrow-right', 20),
                ]),
            el('a', {
              class: 'btn btn--secondary btn--lg',
              attrs: { href: signedIn ? '/profile' : '/login' },
            }, [signedIn ? 'Lihat profil' : 'Sudah punya akun']),
          ]),
          el('div', { class: 'hero__trust' }, [
            el('span', { class: 'hero__trust-item' }, [
              icon('check', 18),
              'Gratis untuk mulai',
            ]),
            el('span', { class: 'hero__trust-item' }, [
              icon('shield', 18),
              'Progres tersimpan di cloud',
            ]),
            el('span', { class: 'hero__trust-item' }, [
              icon('globe', 18),
              'Desktop, tablet, dan ponsel',
            ]),
          ]),
        ]),
        heroArt,
      ]),

      el('section', { attrs: { 'aria-labelledby': 'features-title' } }, [
        el('span', { class: 'page-header__eyebrow' }, ['Visi permainan']),
        el('h2', { class: 'landing-section__title', attrs: { id: 'features-title' } }, [
          'Satu ekosistem, banyak cara belajar',
        ]),
        el('p', {
          class: 'landing-section__lede',
          text: 'Setiap bagian dirancang saling terhubung: materi, permainan, hadiah, dan komunitas.',
        }),
        el(
          'div',
          { class: 'feature-grid' },
          FEATURES.map((feature) =>
            el('article', { class: 'feature' }, [
              el('span', { class: 'feature__icon' }, [icon(feature.icon, 22)]),
              el('h3', { class: 'feature__title', text: feature.title }),
              el('p', { class: 'feature__body', text: feature.body }),
            ]),
          ),
        ),
      ]),
    ]),

    el('footer', { class: 'landing__footer' }, [
      el('span', { text: brand.copyright }),
      el('span', { text: `Versi ${brand.version} · dibangun bertahap` }),
    ]),
  ]);

  ctx.outlet.append(page);

  let active = true;
  let mascotStage: { destroy: () => void } | null = null;

  ctx.onCleanup(() => {
    active = false;
    mascotStage?.destroy();
    mascotStage = null;
  });

  void (async () => {
    try {
      const { createMascotStage } = await import('../game/mascot/createMascotStage');
      if (!active) return;
      mascotStage = createMascotStage(stage, {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onInteract: () => {
          const messages = [
            'Semangat! Satu langkah kecil hari ini.',
            'Ketuk terus, aku suka petualangan!',
            'Belajar itu seru, percaya padaku.',
            'Ayo mulai dari hal kecil.',
          ];
          stageLabel.textContent = messages[Math.floor(Math.random() * messages.length)]!;
        },
      });
    } catch (error) {
      console.error('[welcome] mascot stage failed to start', error);
      stage.remove();
    }
  })();
}

export { meta, render };
