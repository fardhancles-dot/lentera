import type { PageModule } from '../app/router';
import { kikoMarkup } from '../components/brandArt';
import { icon } from '../components/icons';
import {
  playerProgressError,
  playerProgressPanel,
  playerProgressSkeleton,
} from '../components/playerSummary';
import { renderAppLayout } from '../layouts/appLayout';
import { playerStore, type PlayerStoreState } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatDate } from '../utils/dom';

const meta = { title: 'Beranda' };

const ROADMAP: Array<{ title: string; meta: string; state: 'done' | 'active' | 'todo' }> = [
  {
    title: 'Fondasi HTML5, Phaser, TypeScript, Supabase',
    meta: 'Selesai — Vite, design system, router, Supabase client',
    state: 'done',
  },
  {
    title: 'Akun, login, profil, penyimpanan cloud',
    meta: 'Aktif — register, reset password, profil, pengaturan, RLS',
    state: 'done',
  },
  {
    title: 'Mata pelajaran, level, unit, learning path, bank soal',
    meta: 'Selesai — 10 mapel, 22 level, 57 lesson, 231 soal, 6 jenis node',
    state: 'done',
  },
  {
    title: 'Gameplay dan 20 mini-game',
    meta: 'Selesai — lesson engine server-side, 20 mini-game, 12 tipe soal',
    state: 'done',
  },
  {
    title: 'XP, Koin, Hearts, Streak, dan wallet',
    meta: 'Selesai — Hearts, Streak, level akun, quest, achievement, toko, dan riwayat wallet',
    state: 'done',
  },
  {
    title: 'Karakter, animasi, audio, adventure map',
    meta: 'Selesai — peta Phaser, Kiko 13 state, audio sintetis, dan pipeline aset',
    state: 'done',
  },
  {
    title: 'Leaderboard, teman, Quest, sistem sosial',
    meta: 'Selesai — Friends Quest, pertemanan, liga, leaderboard, event, dan notifikasi',
    state: 'done',
  },
  {
    title: 'Developer Dashboard dan administrasi',
    meta: 'Dashboard, Reward Center, broadcast, dan audit log selesai; CRUD konten berikutnya',
    state: 'done',
  },
];

const ROLE_LABEL = {
  player: 'Pemain',
  admin: 'Admin',
  developer: 'Developer',
} as const;

function greetingForHour(hour: number): string {
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function summaryRow(label: string, value: Node | string): HTMLElement {
  return el('div', { class: 'summary-list__row' }, [
    el('span', { class: 'summary-list__label', text: label }),
    el('span', { class: 'summary-list__value' }, [value]),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const { profile, settings, role, email } = user;
  const displayName = profile.display_name || profile.username;
  const goal = settings.daily_goal_minutes;

  const greetingCard = el('section', { class: 'greeting-card' }, [
    el('div', { class: 'greeting-card__content' }, [
      el('span', { class: 'greeting-card__eyebrow' }, [
        icon('sparkles', 14),
        'Beranda',
      ]),
      el('h1', { text: `${greetingForHour(new Date().getHours())}, ${displayName}!` }),
      el('p', {
        text: 'Pilih mata pelajaran, ikuti alur lesson, dan lihat bank soal yang sudah tersimpan di database.',
      }),
      el('div', { class: 'greeting-card__actions' }, [
        el('a', { class: 'btn', attrs: { href: '/learn' } }, [
          icon('map', 18),
          'Buka peta belajar',
        ]),
        el('a', { class: 'btn btn--secondary', attrs: { href: '/profile' } }, [
          profile.bio ? 'Lihat profil' : 'Lengkapi profil',
          icon('arrow-right', 18),
        ]),
      ]),
    ]),
    el('div', { class: 'greeting-card__mascot', html: kikoMarkup(200) }),
  ]);

  const progressionBody = el('div');
  const progressionCard = el('section', { class: 'card card--padded' }, [
    el('div', { class: 'card__header' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Progres akun' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Level, Koin, Hearts, dan Streak dihitung di server.',
        }),
      ]),
      el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/wallet' } }, [
        icon('bag', 16),
        'Buka wallet',
      ]),
    ]),
    progressionBody,
  ]);

  const paintProgression = (state: PlayerStoreState) => {
    if (state.data) {
      progressionBody.replaceChildren(playerProgressPanel(state.data));
    } else if (state.status === 'error') {
      progressionBody.replaceChildren(
        playerProgressError(state.error ?? 'Progres gagal dimuat.', () => {
          void playerStore.load(true);
        }),
      );
    } else {
      progressionBody.replaceChildren(playerProgressSkeleton());
    }
  };

  ctx.onCleanup(playerStore.subscribe(paintProgression));
  paintProgression(playerStore.getState());
  void playerStore.load();

  const goalCard = el('section', { class: 'card card--padded goal-card' }, [
    el('div', { class: 'goal-card__top' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Target harian' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Target yang kamu pilih saat mendaftar.',
        }),
      ]),
      el('span', { class: 'badge' }, [`${goal} menit`]),
    ]),
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem' } }, [
      el('div', { class: 'goal-ring', attrs: { style: '--pct: 0' } }, [
        el('div', { class: 'goal-ring__inner', text: '0%' }),
      ]),
      el('div', {}, [
        el('p', { style: { fontWeight: '800' }, text: 'Belum ada sesi belajar hari ini' }),
        el('p', {
          class: 'small muted',
          text: 'Durasi belajar per sesi belum dicatat; target ini masih menjadi pengingat harian.',
        }),
      ]),
    ]),
    el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [
      el('a', { class: 'small', attrs: { href: '/settings' } }, ['Ubah target harian']),
    ]),
  ]);

  const roadmapCard = el('section', { class: 'card card--padded' }, [
    el('div', { class: 'card__header' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Peta pembangunan' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Ditampilkan terbuka supaya tidak ada fitur yang diklaim selesai sebelum benar-benar bekerja.',
        }),
      ]),
    ]),
    el(
      'ol',
      { class: 'roadmap' },
      ROADMAP.map((item, index) =>
        el('li', { class: 'roadmap__item', dataset: { state: item.state } }, [
          el(
            'span',
            { class: 'roadmap__marker' },
            [item.state === 'done' ? icon('check', 15) : String(index + 1)],
          ),
          el('div', {}, [
            el('p', { class: 'roadmap__title', text: item.title }),
            el('p', { class: 'roadmap__meta', text: item.meta }),
          ]),
        ]),
      ),
    ),
  ]);

  const communityCard = el('section', { class: 'card card--padded' }, [
    el('div', { class: 'card__header' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Komunitas' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Naik liga, berteman, dan ikuti event mingguan.',
        }),
      ]),
    ]),
    el('div', { class: 'social-shortcuts' }, [
      socialShortcut('/leaderboard', 'trophy', 'Liga & Peringkat', 'XP mingguan dan hadiah periode'),
      socialShortcut('/friends', 'users', 'Teman', 'Cari pemain dan lihat aktivitas'),
      socialShortcut('/notifications', 'bell', 'Notifikasi', 'Permintaan teman dan hasil liga'),
    ]),
  ]);

  const accountCard = el('section', { class: 'card card--padded' }, [
    el('div', { class: 'card__header' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Akunmu' }),
        el('p', { class: 'card__subtitle', text: 'Tersimpan di database, bukan hanya di browser.' }),
      ]),
    ]),
    el('div', { class: 'summary-list' }, [
      summaryRow('Username', `@${profile.username}`),
      summaryRow('Email', email),
      summaryRow('Peran', el('span', { class: 'badge badge--muted', text: ROLE_LABEL[role] })),
      summaryRow('Bergabung', formatDate(profile.created_at)),
    ]),
  ]);

  const statusCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Status sistem' }),
    el('p', { class: 'card__subtitle', text: 'Yang sudah aktif untuk akunmu saat ini.' }),
    el('div', { class: 'status-list' }, [
      statusItem('Sesi aman dengan Supabase Auth'),
      statusItem('Profil & pengaturan tersimpan di cloud'),
      statusItem('Row Level Security aktif di database'),
      statusItem('Kurikulum dan bank soal tersimpan di database'),
      statusItem('Lesson dinilai di server; XP & Koin tercatat'),
      statusItem('Hearts, Streak, level, dan wallet dihitung server'),
      statusItem('Developer Dashboard dan audit log staff-only aktif'),
    ]),
  ]);

  const tipCard = el('section', { class: 'card card--padded', style: { background: 'linear-gradient(150deg,#f4fcef,#e9f9dc)' } }, [
    el('div', { style: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' } }, [
      el('span', { html: kikoMarkup(64), style: { width: '64px', flex: '0 0 auto' } }),
      el('div', {}, [
        el('p', { style: { fontWeight: '800' }, text: 'Kiko berkata' }),
        el('p', {
          class: 'small',
          style: { color: '#4e6b45', fontWeight: '600' },
          text: 'Konsistensi mengalahkan intensitas. Sepuluh menit setiap hari sudah cukup untuk memulai.',
        }),
      ]),
    ]),
  ]);

  const content = el('div', {}, [
    greetingCard,
    el('div', { class: 'dashboard-grid', style: { marginTop: '1.25rem' } }, [
      el('div', { class: 'dashboard-main' }, [progressionCard, goalCard, communityCard, roadmapCard]),
      el('div', { class: 'dashboard-aside' }, [accountCard, statusCard, tipCard]),
    ]),
  ]);

  renderAppLayout(ctx, { active: 'home', title: 'Beranda', content });
}

function socialShortcut(
  href: string,
  iconName: Parameters<typeof icon>[0],
  title: string,
  body: string,
): HTMLElement {
  return el('a', { class: 'social-shortcut', attrs: { href } }, [
    el('span', { class: 'social-shortcut__icon' }, [icon(iconName, 20)]),
    el('span', { class: 'social-shortcut__copy' }, [
      el('strong', { text: title }),
      el('span', { text: body }),
    ]),
    icon('chevron-right', 18),
  ]);
}

function statusItem(text: string): HTMLElement {
  return el('div', { class: 'status-item' }, [
    el('span', { class: 'status-item__icon' }, [icon('check', 14)]),
    el('span', { text }),
  ]);
}

export { meta, render };
