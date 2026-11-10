import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { subjectIconName } from '../components/subjectIcon';
import { showToast } from '../components/toast';
import {
  MAP_VIEWPORTS,
  type AdventureMapHandle,
  type AdventureMapNode,
  type AdventureNodeStatus,
  type MapViewport,
} from '../game/adventure/types';
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
  in_progress: 'Sedang dikerjakan',
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
  if (node.status === 'locked') return null;
  if (node.nodeType === 'reward') return `/learn/${subjectSlug}/reward/${node.slug}`;
  if (!node.playable || !node.lessonSlug) return null;
  return `/learn/${subjectSlug}/lesson/${node.lessonSlug}`;
}

function nodeMetaLabel(node: PathNode): string {
  if (node.nodeType === 'reward') {
    return `Hadiah level · +${node.rewardCoins} Koin · +${node.rewardXp} XP${
      node.rewardClaimed ? ' · sudah diklaim' : ''
    }`;
  }
  if (!node.playable) return `${NODE_TYPE_LABEL[node.nodeType] ?? 'Milestone'} · belum dapat dimainkan`;
  if (node.questionCount > 0) return `${node.questionCount} soal · ${node.estimatedMinutes} menit`;
  return 'Bank soal belum tersedia';
}

function toMapNode(subjectSlug: string, node: PathNode): AdventureMapNode {
  return {
    id: node.id,
    title: node.title,
    nodeType: node.nodeType,
    status: node.status,
    meta: nodeMetaLabel(node),
    href: nodeHref(subjectSlug, node),
  };
}

/** The level the player should look at: the first one with a playable node. */
function pickAdventureLevelIndex(levels: SubjectPath['levels']): number {
  const index = levels.findIndex((level) =>
    level.units.some((unit) =>
      unit.nodes.some((node) => node.status === 'available' || node.status === 'preview'),
    ),
  );
  return index >= 0 ? index : Math.max(levels.length - 1, 0);
}

function levelCountLabel(level: SubjectPath['levels'][number]): string {
  return `${level.completedCount}/${level.nodeCount} selesai`;
}

function legendItem(status: AdventureNodeStatus, label: string): HTMLElement {
  return el('li', { class: 'adventure-map__legend-item' }, [
    el('span', { class: `adventure-map__dot adventure-map__dot--${status}` }),
    el('span', { text: label }),
  ]);
}

function nodeMarker(status: LearningNodeStatus, index: number): HTMLElement {
  if (status === 'completed') return el('span', { class: 'path-node__marker' }, [icon('check', 20)]);
  if (status === 'in_progress') return el('span', { class: 'path-node__marker' }, [icon('clock', 20)]);
  if (status === 'locked') return el('span', { class: 'path-node__marker' }, [icon('lock', 18)]);
  if (status === 'preview') return el('span', { class: 'path-node__marker' }, [icon('eye', 18)]);
  return el('span', { class: 'path-node__marker', text: String(index) });
}

function renderNode(subjectSlug: string, node: PathNode, index: number): HTMLElement {
  const href = nodeHref(subjectSlug, node);
  const label =
    node.nodeType === 'reward'
      ? node.rewardClaimed
        ? 'Hadiah diterima'
        : node.status === 'locked'
          ? 'Terkunci'
          : 'Hadiah siap diambil'
      : STATUS_LABEL[node.status];

  const card = href
    ? el('a', { class: `path-node path-node--${node.status}`, attrs: { href } })
    : el('div', {
        class: `path-node path-node--${node.status} path-node--inactive`,
        attrs: { 'aria-disabled': 'true' },
      });

  const questionLabel = nodeMetaLabel(node);

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
    card.setAttribute(
      'title',
      node.nodeType === 'reward'
        ? 'Selesaikan semua lesson di level ini untuk membuka hadiah.'
        : 'Selesaikan lesson sebelumnya untuk membuka node ini.',
    );
  }

  return card;
}

interface SubjectPathView {
  element: HTMLElement;
  map: {
    host: HTMLElement;
    subjectLabel: string;
    subjectSlug: string;
    levels: SubjectPath['levels'];
    initialLevelIndex: number;
    applyLevel: (index: number) => void;
  } | null;
}

interface LevelPicker {
  element: HTMLElement;
  apply: (index: number) => void;
}

/**
 * Level chips live in the DOM (not on the canvas) so they are real buttons:
 * focusable, operable with Enter/Space, and announced with their pressed state.
 */
function renderLevelPicker(
  levels: SubjectPath['levels'],
  initialIndex: number,
  onSelect: (index: number) => void,
  titleEl: HTMLElement,
  countEl: HTMLElement,
  statusEl: HTMLElement,
  areaEl: HTMLElement,
): LevelPicker {
  const buttons = levels.map((level, index) =>
    el('button', {
      class: 'adventure-map__level',
      text: level.title,
      attrs: { type: 'button', 'aria-pressed': 'false' },
      events: { click: () => onSelect(index) },
    }),
  );

  const apply = (index: number): void => {
    const level = levels[index];
    if (!level) return;

    buttons.forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', buttonIndex === index ? 'true' : 'false');
    });
    titleEl.textContent = level.title;
    countEl.textContent = levelCountLabel(level);
    areaEl.textContent = `Area ${index + 1} dari ${levels.length}`;
    statusEl.textContent = `Area ${index + 1}, ${level.title}, dipilih. ${level.completedCount} dari ${level.nodeCount} lesson selesai.`;
  };

  apply(initialIndex);

  return {
    element: el(
      'div',
      { class: 'adventure-map__levels', attrs: { role: 'group', 'aria-label': 'Pilih level peta' } },
      buttons,
    ),
    apply,
  };
}

function renderAdventureCard(
  host: HTMLElement,
  picker: HTMLElement,
  titleEl: HTMLElement,
  countEl: HTMLElement,
  statusEl: HTMLElement,
  areaEl: HTMLElement,
): HTMLElement {
  return el('section', { class: 'card adventure-map' }, [
    el('div', { class: 'adventure-map__header' }, [
      el('div', {}, [
        el('div', { class: 'adventure-map__eyebrow-row' }, [
          el('span', { class: 'adventure-map__eyebrow', text: 'Peta petualangan' }),
          areaEl,
        ]),
        titleEl,        el('p', {
          class: 'adventure-map__subtitle',
          text: 'Pilih area dengan tombol di bawah, lalu ketuk node untuk berjalan ke lesson.',
        }),
      ]),
      countEl,
    ]),
    picker,
    host,
    statusEl,
    el('ul', { class: 'adventure-map__legend' }, [        legendItem('completed', 'Selesai'),
        legendItem('in_progress', 'Sedang dikerjakan'),
        legendItem('available', 'Siap dimainkan'),
        legendItem('locked', 'Terkunci'),
        legendItem('preview', 'Pratinjau'),
    ]),
    el('p', {
      class: 'adventure-map__note small muted',
      text: 'Gunakan daftar lesson di bawah peta untuk akses keyboard dan detail lengkap.',
    }),
  ]);
}

function renderPath(path: SubjectPath, onSelectLevel: (index: number) => void): SubjectPathView {
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

  const mapLevels =
    subject.status === 'development'
      ? []
      : path.levels.filter((level) => level.units.some((unit) => unit.nodes.length > 0));
  const initialLevelIndex = pickAdventureLevelIndex(mapLevels);
  const initialLevel = mapLevels[initialLevelIndex] ?? null;
  const mapHost = initialLevel
    ? el('div', {
        class: 'adventure-map__frame',
        attrs: { 'aria-hidden': 'true' },
        text: 'Menyiapkan peta…',
      })
    : null;
  const mapTitle = el('h2', { class: 'adventure-map__title' });
  const mapCount = el('span', { class: 'badge badge--muted' });
  const mapStatus = el('p', {
    class: 'sr-only',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });
  const mapArea = el('span', { class: 'adventure-map__area' });
  const picker =
    initialLevel && mapLevels.length > 1
      ? renderLevelPicker(
          mapLevels,
          initialLevelIndex,
          onSelectLevel,
          mapTitle,
          mapCount,
          mapStatus,
          mapArea,
        )
      : null;
  if (picker) {
    picker.apply(initialLevelIndex);
  } else if (initialLevel) {
    mapTitle.textContent = initialLevel.title;
    mapCount.textContent = levelCountLabel(initialLevel);
    mapArea.textContent = 'Area 1 dari 1';
    mapStatus.textContent = `Area 1, ${initialLevel.title}, dipilih. ${initialLevel.completedCount} dari ${initialLevel.nodeCount} lesson selesai.`;
  }

  if (initialLevel && mapHost) {
    blocks.push(
      renderAdventureCard(
        mapHost,
        picker?.element ?? el('div'),
        mapTitle,
        mapCount,
        mapStatus,
        mapArea,
      ),
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

  return {
    element: fragment,
    map:
      initialLevel && mapHost
        ? {
            host: mapHost,
            subjectLabel: subject.name,
            subjectSlug: subject.slug,
            levels: mapLevels,
            initialLevelIndex,
            applyLevel: (index) => picker?.apply(index),
          }
        : null,
  };
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

  let mapHandle: AdventureMapHandle | null = null;
  let pendingLevelIndex: number | null = null;
  let currentMapView: SubjectPathView | null = null;
  let mountedViewport: MapViewport | null = null;
  let resizeTimer: number | null = null;

  const selectMapLevel = (index: number): void => {
    if (mapHandle) mapHandle.setLevel(index);
    else pendingLevelIndex = index;
  };

  const viewportFor = (host: HTMLElement): MapViewport =>
    host.clientWidth > 0 && host.clientWidth < 560 ? MAP_VIEWPORTS.compact : MAP_VIEWPORTS.wide;

  const mountMap = (target: NonNullable<SubjectPathView['map']>): void => {
    const levels = target.levels.map((level) => ({
      id: level.id,
      title: level.title,
      nodes: level.units
        .flatMap((unit) => unit.nodes)
        .map((node) => toMapNode(target.subjectSlug, node)),
    }));

    if (levels.every((level) => level.nodes.length === 0)) {
      target.host.closest('.adventure-map')?.remove();
      return;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const viewport = viewportFor(target.host);
    target.host.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

    void import('../game/adventure/createAdventureMap')
      .then(({ createAdventureMap }) => {
        if (!target.host.isConnected) return;
        const handle = createAdventureMap(target.host, {
          subjectLabel: target.subjectLabel,
          levels,
          initialLevelIndex: target.initialLevelIndex,
          viewport,
          reducedMotion,
          onSelect: (node) => {
            if (node.href) ctx.navigate(node.href);
          },
          onLocked: () =>
            showToast('Selesaikan lesson sebelumnya untuk membuka node ini.', 'default'),
          onLevelChange: (_level, index) => target.applyLevel(index),
        });
        mapHandle = handle;
        mountedViewport = viewport;

        if (pendingLevelIndex !== null) {
          handle.setLevel(pendingLevelIndex);
          pendingLevelIndex = null;
        }
      })
      .catch((error) => {
        console.error('[learn] adventure map failed to load', error);
        target.host.textContent =
          'Peta 2D tidak tersedia. Daftar lesson di bawah tetap bisa dipakai.';
      });
  };

  const remountMap = (target: NonNullable<SubjectPathView['map']>): void => {
    mapHandle?.destroy();
    mapHandle = null;
    mountedViewport = null;
    mountMap(target);
  };

  const handleResize = (): void => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      const target = currentMapView?.map;
      if (!target || !target.host.isConnected) return;

      const next = viewportFor(target.host);
      if (mountedViewport && mountedViewport.key === next.key) return;
      remountMap(target);
    }, 250);
  };

  window.addEventListener('resize', handleResize);

  ctx.onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = null;
    mapHandle?.destroy();
    mapHandle = null;
    mountedViewport = null;
    pendingLevelIndex = null;
    currentMapView = null;
  });

  const load = () => {
    mapHandle?.destroy();
    mapHandle = null;
    mountedViewport = null;
    currentMapView = null;
    pendingLevelIndex = null;
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
        const view = renderPath(path, selectMapLevel);
        host.replaceChildren(view.element);
        currentMapView = view;
        if (view.map) mountMap(view.map);
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
