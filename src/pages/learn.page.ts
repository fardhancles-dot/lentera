import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { subjectIconName } from '../components/subjectIcon';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type SubjectCard } from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Belajar' };

function subjectCard(subject: SubjectCard): HTMLElement {
  const isDevelopment = subject.status === 'development';
  const hasContent = subject.level_count > 0 || subject.question_count > 0;
  const accent = subject.accent_color || '#58CC02';

  // "Dalam pengembangan" no longer blocks opening the map. Whether a level can
  // actually be played is decided by its own bank, not by the subject label.
  const root = el('a', {
    class: `subject-card${isDevelopment && !hasContent ? ' subject-card--muted' : ''}`,
    attrs: { href: `/learn/${subject.slug}` },
  });

  root.style.setProperty('--subject-accent', accent);

  const iconBox = el('span', { class: 'subject-card__icon' }, [
    icon(subjectIconName(subject.icon_key), 24),
  ]);

  const badge = isDevelopment
    ? el('span', { class: 'badge badge--muted' }, ['Dalam pengembangan'])
    : subject.question_count === 0
      ? el('span', { class: 'badge badge--yellow' }, ['Bank soal menyusul'])
      : el('span', { class: 'badge' }, ['Aktif']);

  const metaRow = el('div', { class: 'subject-card__meta' }, [
    el('span', {
      text: hasContent
        ? `${subject.level_count} level · ${formatNumber(subject.question_count)} soal`
        : 'Belum ada level dan soal',
    }),
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
    ...(hasContent
      ? [
          el('div', { class: 'subject-card__progress' }, [
            progress,
            el('span', {
              class: 'subject-card__progress-label',
              text:
                subject.completedLevels > 0
                  ? `${subject.completedLevels}/${subject.level_count} level selesai`
                  : 'Belum dimulai',
            }),
          ]),
        ]
      : []),
    el('span', { class: 'subject-card__cta' }, [
      hasContent ? 'Buka peta belajar' : 'Lihat peta belajar',
      icon('arrow-right', 16),
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
          listSlot.replaceChildren(
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
        const levels = active.reduce((sum, subject) => sum + subject.level_count, 0);
        const questions = active.reduce((sum, subject) => sum + subject.question_count, 0);

        summarySlot.append(
          el('div', { class: 'learn-summary' }, [
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: String(active.length) }),
              el('span', { class: 'stat__label', text: 'Mapel aktif' }),
            ]),
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: formatNumber(levels) }),
              el('span', { class: 'stat__label', text: 'Level' }),
            ]),
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: formatNumber(questions) }),
              el('span', { class: 'stat__label', text: 'Soal' }),
            ]),
          ]),
        );

        listSlot.className = '';
        listSlot.replaceChildren(
          el('div', { class: 'subject-grid' }, subjects.map((subject) => subjectCard(subject))),
          el('div', { class: 'banner banner--warning', style: { marginTop: '1.25rem' } }, [
            icon('info', 18),
            el('div', {}, [
              el('p', { class: 'banner__title', text: 'Tentang ketersediaan konten' }),
              el('p', {
                class: 'banner__body',
                text: `${primary} mata pelajaran inti aktif dengan ${formatNumber(levels)} level dan ${formatNumber(questions)} soal. Bahasa Sambas aktif dan siap diisi pemilik konten; bahasa daerah lain menunggu pengembangan developer.`,
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
        listSlot.replaceChildren(
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
