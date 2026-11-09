import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { subjectIconName } from '../components/subjectIcon';
import { renderAppLayout } from '../layouts/appLayout';
import {
  curriculumService,
  type LearningNodeStatus,
  type PathNode,
  type SubjectPath,
} from '../services/curriculum.service';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Peta belajar' };

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Pemula',
  elementary: 'Dasar',
  intermediate: 'Menengah',
  upper_intermediate: 'Menengah atas',
  advanced: 'Mahir',
  expert: 'Ahli',
};

const STATUS_LABEL: Record<LearningNodeStatus, string> = {
  completed: 'Selesai',
  available: 'Siap dimainkan',
  locked: 'Terkunci',
  preview: 'Pratinjau developer',
};

const NODE_TYPE_LABEL: Record<string, string> = {
  lesson: 'Lesson',
  practice: 'Latihan',
  review: 'Review',
  challenge: 'Tantangan',
  legendary: 'Legendary',
  checkpoint: 'Checkpoint',
  reward: 'Hadiah',
};

function nodeHref(subjectSlug: string, node: PathNode): string | null {
  if (!node.playable || !node.lessonSlug || node.status === 'locked') return null;
  return `/learn/${subjectSlug}/lesson/${node.lessonSlug}`;
}

function nodeMarker(status: LearningNodeStatus, index: number): HTMLElement {
  if (status === 'completed') return el('span', { class: 'path-node__marker' }, [icon('check', 20)]);
  if (status === 'locked') return el('span', { class: 'path-node__marker' }, [icon('lock', 18)]);
  if (status === 'preview') return el('span', { class: 'path-node__marker' }, [icon('eye', 18)]);
  return el('span', { class: 'path-node__marker', text: String(index) });
}

function renderNode(subjectSlug: string, node: PathNode, index: number): HTMLElement {
  const href = nodeHref(subjectSlug, node);
  const label = STATUS_LABEL[node.status];

  const card = href
    ? el('a', { class: `path-node path-node--${node.status}`, attrs: { href } })
    : el('div', {
        class: `path-node path-node--${node.status} path-node--inactive`,
        attrs: { 'aria-disabled': 'true' },
      });

  const questionLabel = !node.playable
    ? `${NODE_TYPE_LABEL[node.nodeType] ?? 'Milestone'} · belum dapat dimainkan`
    : node.questionCount > 0
      ? `${node.questionCount} soal · ${node.estimatedMinutes} menit`
      : 'Bank soal belum tersedia';

  card.append(
    nodeMarker(node.status, index),
    el('div', { class: 'path-node__body' }, [
      el('div', { class: 'path-node__heading' }, [
        el('h3', { class: 'path-node__title', text: node.title }),
        node.playable
          ? el('span', { class: 'badge badge--muted', text: NODE_TYPE_LABEL[node.nodeType] ?? 'Lesson' })
          : el('span', { class: 'badge badge--yellow', text: NODE_TYPE_LABEL[node.nodeType] ?? 'Milestone' }),
        el('span', {
          class: `badge path-node__status path-node__status--${node.status}`,
          text: label,
        }),
      ]),
      el('p', { class: 'path-node__meta', text: questionLabel }),
      node.topics.length > 0
        ? el('p', {
            class: 'path-node__topics',
            text: `Topik: ${node.topics.slice(0, 3).join(', ')}`,
          })
        : null,
    ]),
  );

  if (node.status === 'locked') {
    card.setAttribute('title', 'Selesaikan lesson sebelumnya untuk membuka node ini.');
  }

  return card;
}

function renderPath(path: SubjectPath): HTMLElement {
  const subject = path.subject;
  const percent =
    path.totalNodes > 0 ? Math.round((path.completedNodes / path.totalNodes) * 100) : 0;

  const hero = el('section', { class: 'subject-hero card' });
  hero.style.setProperty('--subject-accent', subject.accent_color || '#58CC02');

  const progress = el('div', {
    class: 'progress',
    attrs: {
      role: 'progressbar',
      'aria-label': `Progres ${subject.name}`,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(percent),
    },
  });
  const bar = el('span', { class: 'progress__bar' });
  bar.style.width = `${percent}%`;
  progress.append(bar);

  hero.append(
    el('div', { class: 'subject-hero__top' }, [
      el('span', { class: 'subject-hero__icon' }, [icon(subjectIconName(subject.icon_key), 30)]),
      el('div', { class: 'subject-hero__identity' }, [
        el('div', { class: 'subject-hero__badges' }, [
          subject.status === 'development'
            ? el('span', { class: 'badge badge--muted' }, ['Dalam pengembangan'])
            : el('span', { class: 'badge' }, ['Aktif']),
          path.developerPreview
            ? el('span', { class: 'badge badge--yellow' }, ['Mode developer'])
            : null,
        ]),
        el('h1', { class: 'subject-hero__title', text: subject.name }),
        el('p', { class: 'subject-hero__description', text: subject.description }),
      ]),
    ]),
    el('div', { class: 'subject-hero__stats' }, [
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat__value', text: String(path.levels.length) }),
        el('span', { class: 'stat__label', text: 'Level' }),
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat__value', text: String(path.totalNodes) }),
        el('span', { class: 'stat__label', text: 'Lesson' }),
      ]),
      el('div', { class: 'stat' }, [
        el('span', { class: 'stat__value', text: formatNumber(path.questionCount) }),
        el('span', { class: 'stat__label', text: 'Soal' }),
      ]),
    ]),
    el('div', { class: 'subject-hero__progress' }, [
      progress,
      el('span', {
        class: 'subject-hero__progress-label',
        text:
          path.totalNodes > 0
            ? `${path.completedNodes}/${path.totalNodes} lesson selesai`
            : 'Belum ada lesson',
      }),
    ]),
  );

  const blocks: HTMLElement[] = [];

  if (path.developerPreview) {
    blocks.push(
      el('div', { class: 'banner banner--info' }, [
        icon('eye', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Pratinjau developer aktif' }),
          el('p', {
            class: 'banner__body',
            text: 'Semua node terbuka untuk inspeksi konten. Status progres asli tetap dihitung dari data pemain.',
          }),
        ]),
      ]),
    );
  }

  if (subject.status === 'development') {
    blocks.push(
      el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', {
            class: 'banner__title',
            text: 'Fitur bahasa daerah ini sedang dikembangkan oleh developer.',
          }),
          el('p', {
            class: 'banner__body',
            text: 'Belum ada level, lesson, atau soal yang dapat dimainkan untuk mata pelajaran ini.',
          }),
        ]),
      ]),
    );
  } else if (path.levels.length === 0) {
    blocks.push(
      el('div', { class: 'card empty-state' }, [
        el('span', { class: 'empty-state__art' }, [icon('map', 34)]),
        el('h2', { class: 'empty-state__title', text: 'Struktur kurikulum belum tersedia' }),
        el('p', {
          class: 'empty-state__body',
          text: 'Mata pelajaran ini aktif, tetapi level dan lesson belum diisi di database.',
        }),
      ]),
    );
  }

  for (const level of path.levels) {
    let nodeIndex = 0;

    const levelHeader = el('div', { class: 'path-level__header' }, [
      el('div', {}, [
        el('div', { class: 'path-level__eyebrow' }, [
          el('span', { class: 'badge badge--muted', text: DIFFICULTY_LABEL[level.difficulty] ?? level.difficulty }),
          el('span', { class: 'path-level__count', text: `${level.nodeCount} lesson` }),
        ]),
        el('h2', { class: 'path-level__title', text: level.title }),
        el('p', { class: 'path-level__description', text: level.description }),
      ]),
      el('span', {
        class: 'path-level__progress',
        text: `${level.completedCount}/${level.nodeCount}`,
      }),
    ]);

    const unitBlocks = level.units.map((unit) => {
      const nodes = unit.nodes.map((node) => {
        nodeIndex += 1;
        return el('li', { class: 'path__step' }, [renderNode(subject.slug, node, nodeIndex)]);
      });

      return el('section', { class: 'path-unit' }, [
        el('div', { class: 'path-unit__header' }, [
          el('h3', { class: 'path-unit__title', text: unit.title }),
          el('p', { class: 'path-unit__description', text: unit.description }),
          unit.objectives.length > 0
            ? el(
                'ul',
                { class: 'path-unit__objectives' },
                unit.objectives.map((objective) =>
                  el('li', {}, [icon('check', 14), el('span', { text: objective })]),
                ),
              )
            : null,
        ]),
        el('ol', { class: 'path', attrs: { 'aria-label': `Lesson unit ${unit.title}` } }, nodes),
      ]);
    });

    blocks.push(
      el('section', { class: 'card path-level' }, [
        levelHeader,
        el('div', { class: 'path-level__body' }, unitBlocks),
      ]),
    );
  }

  if (path.levels.length > 0) {
    blocks.push(
      el('div', { class: 'banner banner--info' }, [
        icon('shield', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Penilaian berjalan di server' }),
          el('p', {
            class: 'banner__body',
            text: 'Kunci jawaban tidak pernah dikirim ke browser. Progres, XP, dan Koin ditulis oleh database setelah lesson selesai.',
          }),
        ]),
      ]),
      el('p', {
        class: 'small muted path-note',
        text: 'Skema mendukung enam tingkat kesulitan. Konten awal saat ini tersedia untuk tingkat Pemula, Dasar, dan Menengah; tingkat lain akan diisi bertahap.',
      }),
    );
  }

  const fragment = el('div', { class: 'subject-path' }, [
    el('a', { class: 'back-link', attrs: { href: '/learn' } }, [
      icon('arrow-left', 16),
      'Semua mata pelajaran',
    ]),
    hero,
    ...blocks,
  ]);

  return fragment;
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const subjectSlug = ctx.params.subject ?? '';
  const host = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat peta belajar…' }),
  ]);

  const content = el('div', {}, [host]);
  renderAppLayout(ctx, { active: 'learn', title: 'Peta belajar', content });

  const load = () => {
    host.className = 'loading-screen';
    host.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Memuat peta belajar…' }));

    void (async () => {
      try {
        const path = await curriculumService.loadSubjectPath(subjectSlug, user.id, {
          developerPreview: user.role === 'developer',
        });
        if (!host.isConnected) return;

        if (!path) {
          host.className = '';
          host.append(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('map', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Mata pelajaran tidak ditemukan' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Alamat yang dibuka tidak cocok dengan mata pelajaran yang tersedia.',
              }),
              el('a', { class: 'btn', attrs: { href: '/learn' } }, [
                icon('arrow-left', 18),
                'Kembali ke daftar',
              ]),
            ]),
          );
          return;
        }

        host.className = '';
        host.replaceChildren(renderPath(path));
      } catch (error) {
        console.error('[learn] failed to load subject path', error);
        if (!host.isConnected) return;
        host.className = '';
        const message = error instanceof Error ? error.message : 'Peta belajar gagal dimuat.';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        host.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Peta belajar gagal dimuat' }),
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
