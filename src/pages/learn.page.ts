import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { subjectIconName } from '../components/subjectIcon';
import {
  DEFAULT_SUBJECT_CATEGORY,
  SUBJECT_CATEGORIES,
  normalizeSubjectCategory,
  type SubjectCategoryKey,
} from '../config/subjectCategories';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type SubjectCard } from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Belajar' };

function subjectCard(subject: SubjectCard): HTMLElement {
  const isDevelopment = subject.status === 'development';
  const accent = subject.accent_color || '#58CC02';

  // "Dalam pengembangan" no longer blocks opening the map. Whether a level can
  // actually be played is decided by its own bank, not by the subject label.
  const root = el('a', {
    class: 'subject-card',
    attrs: { href: `/learn/${subject.slug}` },
  });

  root.style.setProperty('--subject-accent', accent);

  // An admin-uploaded image wins; otherwise the built-in icon for icon_key is
  // used, so a subject never shows a broken image.
  const fallbackIcon = (): SVGElement => icon(subjectIconName(subject.icon_key), 22);
  const image = subject.icon_url
    ? el('img', {
        attrs: {
          src: subject.icon_url,
          alt: '',
          loading: 'lazy',
          decoding: 'async',
        },
      })
    : null;
  // A removed or unreachable upload falls back to the built-in icon instead of
  // leaving an empty box in the list.
  image?.addEventListener('error', () => image.replaceWith(fallbackIcon()), { once: true });

  const iconBox = el('span', { class: 'subject-card__icon' }, [image ?? fallbackIcon()]);

  // Only subjects that cannot be played yet get a label; playable subjects
  // show nothing but their icon and name.
  const status =
    isDevelopment || subject.question_count === 0 ? 'Dalam pengembangan' : '';

  root.append(
    iconBox,
    el('div', { class: 'subject-card__body' }, [
      el('h2', { class: 'subject-card__title', text: subject.name }),
      status
        ? el('span', { class: 'subject-card__status', text: status })
        : null,
    ]),
  );

  return root;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

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
    listSlot,
  ]);

  renderAppLayout(ctx, { active: 'learn', title: 'Belajar', content });

  const load = () => {
    listSlot.className = 'loading-screen';
    listSlot.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat mata pelajaran…' }));

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

        // Exactly four fixed categories. Placement is admin-defined; nothing
        // is grouped by subject name, and a missing value falls back to Umum.
        const counts = new Map<SubjectCategoryKey, number>();
        for (const subject of subjects) {
          const key = normalizeSubjectCategory(subject.learn_category);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        let activeCategory: SubjectCategoryKey = DEFAULT_SUBJECT_CATEGORY;

        const tabs = SUBJECT_CATEGORIES.map((category) => {
          const tab = el(
            'button',
            {
              class: 'learn-category',
              attrs: {
                type: 'button',
                'data-category': category.key,
                'aria-pressed': 'false',
                title: category.description,
              },
            },
            [
              el('span', { class: 'learn-category__label', text: category.label }),
              el('span', {
                class: 'learn-category__count',
                text: String(counts.get(category.key) ?? 0),
              }),
            ],
          );
          tab.addEventListener('click', () => {
            if (activeCategory === category.key) return;
            activeCategory = category.key;
            paint();
          });
          return { category, tab };
        });

        const gridSlot = el('div', {});

        const paint = (): void => {
          for (const { category, tab } of tabs) {
            const selected = category.key === activeCategory;
            tab.classList.toggle('is-active', selected);
            tab.setAttribute('aria-pressed', String(selected));
          }

          const visible = subjects.filter(
            (subject) => normalizeSubjectCategory(subject.learn_category) === activeCategory,
          );
          if (visible.length === 0) {
            gridSlot.replaceChildren(
              el('div', { class: 'card empty-state' }, [
                el('span', { class: 'empty-state__art' }, [icon('book', 34)]),
                el('h2', { class: 'empty-state__title', text: 'Belum ada mata pelajaran' }),
                el('p', {
                  class: 'empty-state__body',
                  text: 'Belum ada mata pelajaran dalam kategori ini.',
                }),
              ]),
            );
            return;
          }

          gridSlot.replaceChildren(
            el(
              'div',
              { class: 'subject-grid' },
              visible.map((subject) => subjectCard(subject)),
            ),
          );
        };

        listSlot.className = '';
        listSlot.replaceChildren(
          el(
            'div',
            {
              class: 'learn-categories',
              attrs: { role: 'group', 'aria-label': 'Kategori mata pelajaran' },
            },
            tabs.map(({ tab }) => tab),
          ),
          gridSlot,
        );
        paint();
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
