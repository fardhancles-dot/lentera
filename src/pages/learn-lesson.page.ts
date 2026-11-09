import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type LessonDetail } from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Detail lesson' };

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Pemula',
  elementary: 'Dasar',
  intermediate: 'Menengah',
  upper_intermediate: 'Menengah atas',
  advanced: 'Mahir',
  expert: 'Ahli',
};

const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Pilihan ganda',
  word_bank: 'Susun kata',
  sentence_builder: 'Susun kalimat',
  listening: 'Menyimak',
  speaking: 'Berbicara',
  typing: 'Mengetik jawaban',
  matching_pairs: 'Mencocokkan pasangan',
  picture_identification: 'Identifikasi gambar',
  fill_blank: 'Melengkapi rumpang',
  translation: 'Menerjemahkan',
  conversation: 'Percakapan',
  story: 'Cerita',
};

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'stat' }, [
    el('span', { class: 'stat__value', text: value }),
    el('span', { class: 'stat__label', text: label }),
  ]);
}

function renderDetail(detail: LessonDetail): HTMLElement {
  const { subject, level, unit, node } = detail;
  const questionCount = node.questionCount;
  const lessonSlug = node.lessonSlug ?? '';

  const backLink = el('a', { class: 'back-link', attrs: { href: `/learn/${subject.slug}` } }, [
    icon('arrow-left', 16),
    subject.name,
  ]);

  const chips = el('div', { class: 'lesson-detail__badges' }, [
    el('span', { class: 'badge badge--muted', text: DIFFICULTY_LABEL[level.difficulty] ?? level.difficulty }),
    el('span', {
      class:
        node.status === 'completed'
          ? 'badge'
          : node.status === 'preview'
            ? 'badge badge--yellow'
            : node.status === 'locked'
              ? 'badge badge--muted'
              : 'badge badge--blue',
      text:
        node.status === 'completed'
          ? 'Selesai'
          : node.status === 'preview'
            ? 'Pratinjau developer'
            : node.status === 'locked'
              ? 'Terkunci'
              : 'Siap dimainkan',
    }),
  ]);

  const hero = el('section', { class: 'lesson-detail card' }, [
    el('p', { class: 'lesson-detail__eyebrow', text: `${level.title} · ${unit.title}` }),
    el('h1', { class: 'lesson-detail__title', text: node.title }),
    el('p', { class: 'lesson-detail__description', text: node.description }),
    chips,
    el('div', { class: 'lesson-detail__stats' }, [
      stat('Soal', formatNumber(questionCount)),
      stat('Perkiraan', `${node.estimatedMinutes} mnt`),
      stat('XP', String(node.xpReward)),
      stat('Koin', String(node.coinReward)),
    ]),
  ]);

  const topics =
    node.topics.length > 0
      ? el(
          'div',
          { class: 'topic-list' },
          node.topics.map((topic) => el('span', { class: 'topic-chip', text: topic })),
        )
      : el('p', {
          class: 'small muted',
          text: 'Topik soal belum tersedia karena bank soal lesson ini masih kosong.',
        });

  const types =
    node.questionTypes.length > 0
      ? el(
          'ul',
          { class: 'type-list' },
          node.questionTypes.map((type) =>
            el('li', {}, [
              icon('gamepad', 16),
              el('span', { text: QUESTION_TYPE_LABEL[type] ?? type }),
            ]),
          ),
        )
      : el('p', {
          class: 'small muted',
          text: 'Jenis soal akan muncul setelah bank soal diisi.',
        });

  const materialCard = el('section', { class: 'card card--padded' }, [
    el('h2', { class: 'card__title', text: 'Cakupan materi' }),
    el('p', {
      class: 'card__subtitle',
      text: 'Topik yang diuji pada lesson ini, diambil dari statistik bank soal di database.',
    }),
    el('div', { class: 'lesson-detail__section' }, [
      el('h3', { class: 'lesson-detail__section-title', text: 'Topik' }),
      topics,
    ]),
    el('div', { class: 'lesson-detail__section' }, [
      el('h3', { class: 'lesson-detail__section-title', text: 'Jenis soal' }),
      types,
    ]),
  ]);

  const objectivesCard = el('section', { class: 'card card--padded' }, [      el('h2', { class: 'card__title', text: 'Tujuan unit' }),
      el('p', { class: 'card__subtitle', text: unit.description }),
    unit.objectives.length > 0
      ? el(
          'ul',
          { class: 'objective-list' },
          unit.objectives.map((objective) =>
            el('li', {}, [
              el('span', { class: 'status-item__icon' }, [icon('check', 14)]),
              el('span', { text: objective }),
            ]),
          ),
        )
      : el('p', { class: 'small muted', text: 'Tujuan unit belum diisi.' }),
  ]);

  const locked = node.status === 'locked';
  const noQuestions = questionCount === 0;
  const canPlay = !locked && !noQuestions && node.playable;

  const startButton = canPlay
    ? el('a', { class: 'btn btn--block btn--lg', attrs: { href: `/learn/${subject.slug}/lesson/${lessonSlug}/play` } }, [
        icon('gamepad', 18),
        node.status === 'completed' ? 'Main lagi' : 'Mulai lesson',
      ])
    : el(
        'button',
        {
          class: 'btn btn--block',
          attrs: { type: 'button', disabled: true, 'aria-disabled': 'true' },
        },
        [icon(locked ? 'lock' : 'alert', 18), locked ? 'Terkunci' : 'Soal belum tersedia'],
      );

  const startCard = el('section', { class: 'card card--padded lesson-start' }, [
    el('h2', { class: 'card__title', text: 'Mulai lesson' }),
    locked
      ? el('div', { class: 'banner banner--warning', style: { marginTop: '0.75rem' } }, [
          icon('lock', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Lesson masih terkunci' }),
            el('p', {
              class: 'banner__body',
              text: 'Selesaikan lesson sebelumnya pada peta belajar. Progres dihitung di server dari data pemain yang tersimpan.',
            }),
          ]),
        ])
      : noQuestions
        ? el('div', { class: 'banner banner--warning', style: { marginTop: '0.75rem' } }, [
            icon('alert', 18),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Bank soal belum tersedia' }),
              el('p', {
                class: 'banner__body',
                text: 'Lesson ini sudah terdaftar, tetapi belum memiliki soal. Pemilik konten perlu mengisi bank soal sebelum lesson dapat dimainkan.',
              }),
            ]),
          ])
        : null,
    startButton,
    el('p', {
      class: 'small muted',
      text: canPlay
        ? 'Jawaban dinilai di server. XP dan Koin hanya diberikan sekali untuk penyelesaian pertama, dan progres tersimpan per mata pelajaran.'
        : 'Tombol mulai aktif setelah syarat di atas terpenuhi.',
    }),
  ]);

  const securityCard = el('div', { class: 'banner banner--info' }, [
    icon('shield', 18),
    el('div', {}, [
      el('p', { class: 'banner__title', text: 'Kunci jawaban tidak dikirim ke browser' }),
      el('p', {
        class: 'banner__body',
        text: 'Halaman ini hanya membaca statistik agregat. Soal, pilihan, dan jawaban benar tetap terlindungi RLS dan akan dinilai di server pada tahap gameplay.',
      }),
    ]),
  ]);

  const content = el('div', {}, [
    backLink,
    hero,
    node.status === 'preview'
      ? el('div', { class: 'banner banner--info', style: { marginTop: '1rem' } }, [
          icon('eye', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Dibuka dalam mode developer' }),
            el('p', {
              class: 'banner__body',
              text: 'Pratinjau ini tidak mengubah progres. Pemain biasa tetap harus menyelesaikan lesson secara berurutan.',
            }),
          ]),
        ])
      : null,
    el('div', { class: 'lesson-layout' }, [
      el('div', { class: 'lesson-layout__main' }, [
        materialCard,
        objectivesCard,
        securityCard,
      ]),
      el('div', { class: 'lesson-layout__aside' }, [startCard]),
    ]),
  ]);

  return content;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const subjectSlug = ctx.params.subject ?? '';
  const lessonSlug = ctx.params.lessonSlug ?? '';
  const host = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat lesson…' }),
  ]);

  const content = el('div', {}, [host]);
  renderAppLayout(ctx, { active: 'learn', title: 'Detail lesson', content });

  const load = () => {
    host.className = 'loading-screen';
    host.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat lesson…' }));

    void (async () => {
      try {
        const detail = await curriculumService.loadLessonDetail(subjectSlug, lessonSlug, user.id, {
          developerPreview: user.role === 'developer',
        });
        if (!host.isConnected) return;

        if (!detail) {
          host.className = '';
          host.append(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('book', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Lesson tidak ditemukan' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Lesson yang dibuka tidak ada di mata pelajaran ini, atau sudah tidak dipublikasikan.',
              }),
              el('a', { class: 'btn', attrs: { href: `/learn/${subjectSlug}` } }, [
                icon('arrow-left', 18),
                'Kembali ke peta belajar',
              ]),
            ]),
          );
          return;
        }

        host.className = '';
        host.replaceChildren(renderDetail(detail));
      } catch (error) {
        console.error('[learn] failed to load lesson', error);
        if (!host.isConnected) return;
        host.className = '';
        const message = error instanceof Error ? error.message : 'Lesson gagal dimuat.';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        host.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Lesson gagal dimuat' }),
            el('p', { class: 'empty-state__body', text: message }),
            retry,
          ]),
        );
      }
    })();
  };

  load();
}

export { meta, render };
