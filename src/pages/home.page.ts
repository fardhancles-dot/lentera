import type { PageModule } from '../app/router';
import { kikoMarkup } from '../components/brandArt';
import { icon } from '../components/icons';
import { renderAppLayout } from '../layouts/appLayout';
import { studyService } from '../services/study.service';
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

function formatStudyDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes} menit ${rest} detik` : `${minutes} menit`;
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

  const goalPercent = el('div', { class: 'goal-ring__inner', text: '0%' });
  const goalRing = el(
    'div',
    {
      class: 'goal-ring',
      attrs: {
        role: 'progressbar',
        'aria-label': 'Progres target harian',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': '0',
      },
    },
    [goalPercent],
  );
  goalRing.style.setProperty('--pct', '0');

  const goalBadge = el('span', { class: 'badge' }, [`${goal} menit`]);
  const goalHeadline = el('p', {
    class: 'goal-card__headline',
    text: 'Belum ada sesi belajar hari ini',
  });
  const goalDetail = el('p', {
    class: 'small muted goal-card__detail',
    text: 'Mulai lesson untuk mulai mencatat durasi belajar.',
  });

  const goalCard = el('section', { class: 'card card--padded goal-card' }, [
    el('div', { class: 'goal-card__top' }, [
      el('div', {}, [
        el('h2', { class: 'card__title', text: 'Target harian' }),
        el('p', {
          class: 'card__subtitle',
          text: 'Dihitung dari durasi belajar yang benar-benar tercatat di database.',
        }),
      ]),
      goalBadge,
    ]),
    el('div', { class: 'goal-card__progress' }, [
      goalRing,
      el('div', { class: 'goal-card__progress-copy' }, [goalHeadline, goalDetail]),
    ]),
    el('div', { class: 'goal-card__footer' }, [
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
      el('div', { class: 'dashboard-main' }, [goalCard, roadmapCard]),
      el('div', { class: 'dashboard-aside' }, [accountCard, statusCard, tipCard]),
    ]),
  ]);

  renderAppLayout(ctx, { active: 'home', title: 'Beranda', content });

  void studyService
    .loadDailyGoal()
    .then((progress) => {
      if (!goalCard.isConnected) return;

      goalBadge.textContent = `${progress.goalMinutes} menit`;
      goalRing.style.setProperty('--pct', String(progress.percent));
      goalRing.setAttribute('aria-valuenow', String(progress.percent));
      goalRing.setAttribute(
        'aria-valuetext',
        `${formatStudyDuration(progress.studiedSeconds)} dari ${progress.goalMinutes} menit`,
      );
      goalPercent.textContent = `${progress.percent}%`;

      if (progress.sessionCount === 0) {
        goalHeadline.textContent = 'Belum ada sesi belajar hari ini';
        goalDetail.textContent = 'Mulai lesson untuk mulai mencatat durasi belajar.';
        return;
      }

      goalHeadline.textContent = `${formatStudyDuration(progress.studiedSeconds)} dari ${progress.goalMinutes} menit`;
      goalDetail.textContent =
        progress.percent >= 100
          ? 'Target hari ini sudah tercapai. Kerja bagus!'
          : `${progress.sessionCount} sesi belajar hari ini · sisa ${formatStudyDuration(progress.remainingSeconds)}`;
    })
    .catch((error) => {
      if (!goalCard.isConnected) return;
      console.error('[home] failed to load daily goal', error);
      goalDetail.textContent = 'Progres belajar hari ini belum bisa dimuat. Coba muat ulang halaman.';
    });
}

function statusItem(text: string): HTMLElement {
  return el('div', { class: 'status-item' }, [
    el('span', { class: 'status-item__icon' }, [icon('check', 14)]),
    el('span', { text }),
  ]);
}

export { meta, render };
