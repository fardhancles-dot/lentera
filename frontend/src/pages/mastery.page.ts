import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { masteryService } from '../services/mastery.service';
import { sessionStore } from '../stores/session.store';
import type { CourseMastery, MasteryBoard } from '../types/mastery';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Penguasaan' };

function summaryStat(label: string, value: string, hint: string): HTMLElement {
  return el('div', { class: 'mastery-stat' }, [
    el('span', { class: 'mastery-stat__value', text: value }),
    el('span', { class: 'mastery-stat__label', text: label }),
    el('span', { class: 'mastery-stat__hint', text: hint }),
  ]);
}

function courseCard(course: CourseMastery): HTMLElement {
  const bar = el('span', { class: 'progress__bar' });
  bar.style.width = `${course.masteryPercent}%`;

  const reviewHref = `/practice/play?${new URLSearchParams({
    mode: 'scheduled_review',
    course: course.courseId,
    subject: course.subjectSlug,
  }).toString()}`;

  const review = course.due > 0
    ? el('a', { class: 'btn btn--sm', attrs: { href: reviewHref } }, [
        icon('clock', 16),
        `Review ${course.due} soal`,
      ])
    : el(
        'button',
        { class: 'btn btn--sm', attrs: { type: 'button', disabled: true } },
        [icon('clock', 16), 'Belum ada jatuh tempo'],
      );

  return el('article', { class: 'card mastery-course' }, [
    el('div', { class: 'mastery-course__top' }, [
      el('div', {}, [
        el('div', { class: 'mastery-course__badges' }, [
          el('h2', { class: 'mastery-course__title', text: course.subjectName }),
          course.due > 0
            ? el('span', { class: 'badge badge--yellow', text: `${course.due} jatuh tempo` })
            : null,
        ]),
        el('p', {
          class: 'mastery-course__body',
          text: `${formatNumber(course.tracked)} dari ${formatNumber(
            course.totalQuestions,
          )} soal pernah dikerjakan.`,
        }),
      ]),
      el('span', { class: 'mastery-course__percent', text: `${course.masteryPercent}%` }),
    ]),
    el(
      'div',
      {
        class: 'progress',
        attrs: {
          role: 'progressbar',
          'aria-label': `Penguasaan ${course.subjectName}`,
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-valuenow': String(course.masteryPercent),
        },
      },
      [bar],
    ),
    el('div', { class: 'mastery-course__stats' }, [
      el('span', { class: 'mastery-course__stat' }, [
        icon('check', 14),
        `${course.mastered} dikuasai`,
      ]),
      el('span', { class: 'mastery-course__stat' }, [
        icon('target', 14),
        `Akurasi ${course.accuracy}%`,
      ]),
      el('span', { class: 'mastery-course__stat' }, [
        icon('clock', 14),
        `${course.due} jatuh tempo`,
      ]),
    ]),
    el('div', { class: 'mastery-course__actions' }, [
      review,
      el('a', { class: 'btn btn--ghost btn--sm', attrs: { href: `/learn/${course.subjectSlug}` } }, [
        icon('map', 16),
        'Peta belajar',
      ]),
    ]),
  ]);
}

function buildBoard(board: MasteryBoard): HTMLElement {
  const { summary, courses } = board;
  const trackedPercent =
    summary.totalQuestions > 0
      ? Math.round((summary.tracked / summary.totalQuestions) * 100)
      : 0;

  const cards = courses.filter((course) => course.totalQuestions > 0);

  return el('div', {}, [
    el('div', { class: 'mastery-summary-grid' }, [
      summaryStat(
        'Soal terlacak',
        formatNumber(summary.tracked),
        `${trackedPercent}% dari ${formatNumber(summary.totalQuestions)} soal`,
      ),
      summaryStat('Dikuasai', formatNumber(summary.mastered), 'Level penguasaan tertinggi'),
      summaryStat('Jatuh tempo', formatNumber(summary.due), 'Siap masuk review hari ini'),
      summaryStat('Akurasi', `${summary.accuracy}%`, 'Dari seluruh jawaban tercatat'),
    ]),
    cards.length === 0
      ? el('div', { class: 'card empty-state' }, [
          el('span', { class: 'empty-state__art' }, [icon('target', 34)]),
          el('h2', { class: 'empty-state__title', text: 'Belum ada riwayat jawaban' }),
          el('p', {
            class: 'empty-state__body',
            text: 'Kerjakan lesson atau latihan dulu. Setiap jawaban akan membentuk jadwal review per soal.',
          }),
          el('a', { class: 'btn', attrs: { href: '/learn' } }, [
            icon('map', 18),
            'Mulai belajar',
          ]),
        ])
      : el('div', { class: 'mastery-course-list' }, cards.map(courseCard)),
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const host = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat penguasaan…' }),
  ]);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Penguasaan',
      title: 'Mastery & Review',
      subtitle:
        'Setiap soal punya level penguasaan dan jadwal ulang sendiri. Jawaban salah membuat soal kembali lebih cepat.',
    }),
    el('div', { class: 'banner banner--info' }, [
      icon('clock', 18),
      el('div', {}, [
        el('p', { class: 'banner__title', text: 'Jadwal dihitung server' }),
        el('p', {
          class: 'banner__body',
          text: 'Jawaban benar menaikkan interval review 1, 3, 7, 14, lalu 30 hari. Jawaban salah menurunkan level dan menjadwalkan ulang sekitar sepuluh menit kemudian.',
        }),
      ]),
    ]),
    host,
  ]);

  renderAppLayout(ctx, { active: 'practice', title: 'Penguasaan', content });

  const load = () => {
    host.className = 'loading-screen';
    host.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat penguasaan…' }));

    void masteryService
      .load()
      .then((board) => {
        if (!host.isConnected) return;
        host.className = '';
        host.replaceChildren(buildBoard(board));
      })
      .catch((error: unknown) => {
        if (!host.isConnected) return;
        host.className = '';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        host.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Penguasaan gagal dimuat' }),
            el('p', {
              class: 'empty-state__body',
              text: error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
            }),
            retry,
          ]),
        );
      });
  };

  load();
}

export { meta };
