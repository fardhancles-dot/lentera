import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { subjectIconName } from '../components/subjectIcon';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type SubjectCard } from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber, trapFocus } from '../utils/dom';

const meta = { title: 'Belajar' };

function openDevelopmentDialog(ctx: Parameters<PageModule['render']>[0], subjectName: string): void {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown);
    releaseFocus();
    backdrop.remove();
    previousFocus?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const closeButton = el(
    'button',
    { class: 'icon-btn', attrs: { type: 'button', 'aria-label': 'Tutup dialog' } },
    [icon('close', 20)],
  );
  closeButton.addEventListener('click', close);

  const dialog = el(
    'div',
    {
      class: 'dialog',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'development-dialog-title',
        'aria-describedby': 'development-dialog-body',
      },
    },
    [
      el('div', { class: 'dialog__top' }, [
        el('span', { class: 'dialog__eyebrow' }, [icon('sparkles', 14), 'Dalam pengembangan']),
        closeButton,
      ]),
      el('h2', { class: 'dialog__title', attrs: { id: 'development-dialog-title' } }, [
        subjectName,
      ]),
      el('p', { class: 'dialog__body', attrs: { id: 'development-dialog-body' } }, [
        'Fitur bahasa daerah ini sedang dikembangkan oleh developer.',
      ]),
      el('div', { class: 'dialog__actions' }, [
        el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, ['Mengerti']),
      ]),
    ],
  );

  const confirm = dialog.querySelector<HTMLButtonElement>('.dialog__actions .btn');
  confirm?.addEventListener('click', close);

  const backdrop = el('div', { class: 'dialog-backdrop' }, [dialog]);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });

  const releaseFocus = trapFocus(dialog);

  document.addEventListener('keydown', onKeyDown);
  document.body.append(backdrop);
  ctx.onCleanup(close);
  closeButton.focus();
}

function subjectCard(ctx: Parameters<PageModule['render']>[0], subject: SubjectCard): HTMLElement {
  const isDevelopment = subject.status === 'development';
  const accent = subject.accent_color || '#58CC02';

  const root = isDevelopment
    ? el('button', {
        class: 'subject-card subject-card--muted',
        attrs: { type: 'button', 'aria-haspopup': 'dialog' },
      })
    : el('a', {
        class: 'subject-card',
        attrs: { href: `/learn/${subject.slug}` },
      });

  root.style.setProperty('--subject-accent', accent);

  if (isDevelopment) {
    root.addEventListener('click', () => openDevelopmentDialog(ctx, subject.name));
  }

  const iconBox = el('span', { class: 'subject-card__icon' }, [
    icon(subjectIconName(subject.icon_key), 24),
  ]);

  const badge = isDevelopment
    ? el('span', { class: 'badge badge--muted' }, ['Dalam pengembangan'])
    : subject.question_count === 0
      ? el('span', { class: 'badge badge--yellow' }, ['Bank soal menyusul'])
      : el('span', { class: 'badge' }, ['Aktif']);

  const metaRow = el('div', { class: 'subject-card__meta' }, [
    isDevelopment
      ? el('span', { text: 'Belum ada level dan soal' })
      : el('span', { text: `${subject.level_count} level · ${subject.lesson_count} lesson` }),
    isDevelopment
      ? null
      : el('span', { text: `${formatNumber(subject.question_count)} soal` }),
  ]);

  const progress = el('div', {
    class: 'progress progress--thin',
    attrs: {
      role: 'progressbar',
      'aria-label': `Progres ${subject.name}`,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(subject.progressPercent),
    },
  });
  const bar = el('span', { class: 'progress__bar' });
  bar.style.width = `${subject.progressPercent}%`;
  progress.append(bar);

  root.append(
    el('div', { class: 'subject-card__top' }, [
      iconBox,
      badge,
    ]),
    el('h2', { class: 'subject-card__title', text: subject.name }),
    el('p', { class: 'subject-card__description', text: subject.description }),
    metaRow,
    isDevelopment
      ? el('span', { class: 'subject-card__cta' }, [
          'Lihat status',
          icon('chevron-right', 16),
        ])
      : el('div', { class: 'subject-card__progress' }, [
          progress,
          el('span', {
            class: 'subject-card__progress-label',
            text:
              subject.completedLessons > 0
                ? `${subject.completedLessons}/${subject.lesson_count} lesson selesai`
                : 'Belum dimulai',
          }),
        ]),
    ...(isDevelopment
      ? []
      : [
          el('span', { class: 'subject-card__cta' }, [
            'Buka peta belajar',
            icon('arrow-right', 16),
          ]),
        ]),
  );

  return root;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const summarySlot = el('div');
  const listSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat mata pelajaran…' }),
  ]);

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Kurikulum',
      title: 'Belajar',
      subtitle:
        'Pilih mata pelajaran, naiki level, dan ikuti alur lesson yang tersusun dari bank soal di database.',
    }),
    el('div', { class: 'learn-intro' }, [
      el('div', { class: 'banner banner--info' }, [
        icon('shield', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Bank soal aman' }),
          el('p', {
            class: 'banner__body',
            text: 'Soal dan kunci jawaban tidak dikirim ke browser. Halaman ini hanya menampilkan struktur dan statistik soal.',
          }),
        ]),
      ]),
    ]),
    summarySlot,
    listSlot,
  ]);

  renderAppLayout(ctx, { active: 'learn', title: 'Belajar', content });

  const load = () => {
    listSlot.className = 'loading-screen';
    listSlot.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat mata pelajaran…' }));
    summarySlot.replaceChildren();

    void (async () => {
      try {
        const subjects = await curriculumService.loadCatalog(user.id);
        if (!listSlot.isConnected) return;

        if (subjects.length === 0) {
          listSlot.className = '';
          listSlot.append(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('book', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Kurikulum belum tersedia' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Migration kurikulum belum dijalankan di database. Jalankan migration lalu muat ulang halaman ini.',
              }),
            ]),
          );
          return;
        }

        const active = subjects.filter((subject) => subject.status === 'active');
        const primary = active.filter((subject) => subject.is_primary).length;
        const lessons = active.reduce((sum, subject) => sum + subject.lesson_count, 0);
        const questions = active.reduce((sum, subject) => sum + subject.question_count, 0);

        summarySlot.append(
          el('div', { class: 'learn-summary' }, [
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: String(active.length) }),
              el('span', { class: 'stat__label', text: 'Mapel aktif' }),
            ]),
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: String(lessons) }),
              el('span', { class: 'stat__label', text: 'Lesson' }),
            ]),
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: formatNumber(questions) }),
              el('span', { class: 'stat__label', text: 'Soal tersimpan' }),
            ]),
          ]),
        );

        listSlot.className = '';
        listSlot.append(
          el('div', { class: 'subject-grid' }, subjects.map((subject) => subjectCard(ctx, subject))),
          el('div', { class: 'banner banner--warning', style: { marginTop: '1.25rem' } }, [
            icon('info', 18),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Tentang ketersediaan konten' }),
              el('p', {
                class: 'banner__body',
                text: `${primary} mata pelajaran inti aktif dengan ${formatNumber(questions)} soal tersimpan. Bahasa Sambas aktif dan siap diisi pemilik konten; bahasa daerah lain menunggu pengembangan developer.`,
              }),
            ]),
          ]),
        );
      } catch (error) {
        console.error('[learn] failed to load subjects', error);
        if (!listSlot.isConnected) return;
        listSlot.className = '';
        const message = error instanceof Error ? error.message : 'Mata pelajaran gagal dimuat.';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        listSlot.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Mata pelajaran gagal dimuat' }),
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
