import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import {
  createLearningJourney,
  type LearningJourneyHandle,
} from '../components/learningJourney';
import { showToast } from '../components/toast';
import { renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type SubjectPath } from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Peta belajar' };

function hasJourneyStops(path: SubjectPath): boolean {
  return path.levels.some((level) =>
    level.units.some((unit) =>
      unit.nodes.some((node) => node.playable || node.nodeType === 'reward'),
    ),
  );
}

function backLink(): HTMLElement {
  return el('a', { class: 'back-link', attrs: { href: '/learn' } }, [
    icon('arrow-left', 16),
    'Semua mata pelajaran',
  ]);
}

function renderUnavailable(path: SubjectPath | null, message: string): HTMLElement {
  return el('div', { class: 'journey-empty' }, [
    el('div', { class: 'journey-empty__card' }, [
      backLink(),
      el('span', { class: 'journey-empty__art' }, [icon('map', 38)]),
      el('h1', {
        class: 'journey-empty__title',
        text: path?.subject.name ?? 'Peta belajar',
      }),
      el('p', { class: 'journey-empty__body', text: message }),
      el('a', { class: 'btn', attrs: { href: '/learn' } }, [
        icon('arrow-left', 18),
        'Kembali ke daftar mapel',
      ]),
    ]),
  ]);
}

function renderError(message: string, retry: () => void): HTMLElement {
  const button = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
    icon('refresh', 18),
    'Coba lagi',
  ]);
  button.addEventListener('click', retry);

  return el('div', { class: 'journey-empty' }, [
    el('div', { class: 'journey-empty__card' }, [
      backLink(),
      el('span', { class: 'journey-empty__art' }, [icon('alert', 38)]),
      el('h1', { class: 'journey-empty__title', text: 'Peta belajar gagal dimuat' }),
      el('p', { class: 'journey-empty__body', text: message }),
      button,
    ]),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const subjectSlug = ctx.params.subject ?? '';
  const host = el('div', { class: 'journey-loading' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat peta belajar…' }),
  ]);
  const content = el('div', { class: 'journey-page' }, [host]);
  renderAppLayout(ctx, { active: 'learn', title: 'Peta belajar', content });

  const shellMain = content.closest('.shell__main');
  shellMain?.classList.add('shell__main--journey');

  let journey: LearningJourneyHandle | null = null;
  let disposed = false;

  const disposeJourney = (): void => {
    journey?.destroy();
    journey = null;
  };

  const load = (): void => {
    disposeJourney();
    host.className = 'journey-loading';
    host.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat peta belajar…' }),
    );

    void (async () => {
      try {
        const path = await curriculumService.loadSubjectPath(subjectSlug, user.id, {
          developerPreview: user.role === 'developer',
        });
        if (disposed || !host.isConnected) return;

        if (!path) {
          host.className = '';
          host.replaceChildren(
            renderUnavailable(
              null,
              'Alamat yang dibuka tidak cocok dengan mata pelajaran yang tersedia.',
            ),
          );
          return;
        }

        if (!hasJourneyStops(path)) {
          host.className = '';
          host.replaceChildren(
            renderUnavailable(
              path,
              path.subject.status === 'development'
                ? 'Mata pelajaran ini sedang dikembangkan. Level pertama akan muncul otomatis di peta setelah kontennya ditambahkan.'
                : 'Level dan soal untuk mata pelajaran ini belum tersedia di database.',
            ),
          );
          return;
        }

        const prefersReducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        const reducedMotion = Boolean(
          sessionStore.getState().user?.settings.reduced_motion || prefersReducedMotion,
        );

        journey = createLearningJourney(path, {
          reducedMotion,
          onLocked: (stop) =>
            showToast(
              stop.kind === 'reward'
                ? 'Selesaikan level sebelumnya untuk membuka hadiah.'
                : stop.node.questionCount === 0
                  ? 'Bank soal level ini belum tersedia di database.'
                  : 'Selesaikan level sebelumnya untuk membuka level ini.',
              'default',
            ),
        });

        host.className = '';
        host.replaceChildren(journey.element);
      } catch (error) {
        console.error('[learn] failed to load subject path', error);
        if (disposed || !host.isConnected) return;
        host.className = '';
        const message = error instanceof Error ? error.message : 'Peta belajar gagal dimuat.';
        host.replaceChildren(renderError(message, load));
      }
    })();
  };

  ctx.onCleanup(() => {
    disposed = true;
    disposeJourney();
    if (shellMain?.querySelector('.journey-page') === content) {
      shellMain.classList.remove('shell__main--journey');
    }
  });

  load();
}

export { meta, render };
