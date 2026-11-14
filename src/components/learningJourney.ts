import { icon, type IconName } from './icons';
import { subjectIconName } from './subjectIcon';
import type { PathSection, SubjectPath } from '../services/curriculum.service';
import { el, formatNumber } from '../utils/dom';
import {
  activeJourneyIndex,
  buildJourneyStops,
  buildJourneyTimeline,
  journeyPathD,
  journeySegmentD,
  type JourneyPosition,
  type JourneyStop,
} from '../game/journey/model';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface LearningJourneyOptions {
  reducedMotion?: boolean;
  onLocked?: (stop: JourneyStop) => void;
}

export interface LearningJourneyHandle {
  element: HTMLElement;
  destroy: () => void;
}

type StopState = 'completed' | 'active' | 'locked';

function stopState(stop: JourneyStop): StopState {
  if (stop.node.status === 'completed') return 'completed';
  if (stop.kind === 'level' && stop.node.questionCount === 0) return 'locked';
  if (stop.node.status === 'locked') return 'locked';
  return 'active';
}

function stopHref(subjectSlug: string, stop: JourneyStop): string | null {
  if (stop.kind === 'level' && stop.node.questionCount === 0) return null;
  if (stop.node.status === 'locked') return null;
  if (stop.kind === 'reward') {
    return `/learn/${subjectSlug}/reward/${stop.node.slug}`;
  }
  if (!stop.node.playable || !stop.node.lessonSlug) return null;
  // One-level-one-question flow: a level click goes straight into the game.
  return `/learn/${subjectSlug}/lesson/${stop.node.lessonSlug}/play`;
}

function stopLabel(stop: JourneyStop): string {
  if (stop.kind === 'reward') {
    if (stop.node.rewardClaimed) return 'Sudah diterima';
    if (stop.node.status === 'locked') return 'Terkunci';
    return `+${formatNumber(stop.node.rewardCoins)} Koin · +${stop.node.rewardXp} XP`;
  }
  if (stop.kind === 'level' && stop.node.questionCount === 0) return 'Belum ada soal';
  return stop.node.title;
}

function stopAriaLabel(stop: JourneyStop): string {
  if (stop.kind === 'reward') {
    return `Hadiah ${stop.rewardNumber}. ${stopLabel(stop)}.`;
  }

  const status =
    stop.kind === 'level' && stop.node.questionCount === 0
      ? 'belum ada soal'
      : stop.node.status === 'completed'
        ? 'selesai, buka untuk mengulang'
        : stop.node.status === 'locked'
          ? 'terkunci'
          : 'aktif, buka untuk bermain';
  return `Level ${stop.levelNumber}, ${stop.node.title}, ${status}.`;
}

function stopIcon(stop: JourneyStop, state: StopState): IconName {
  if (stop.kind === 'reward') return 'gift';
  if (state === 'completed') return 'check';
  if (state === 'locked') return 'lock';
  return 'star';
}

function createBackdrop(): HTMLElement {
  const backdrop = el('div', {
    class: 'journey-map__backdrop',
    attrs: { 'aria-hidden': 'true' },
  });

  backdrop.append(
    el('span', { class: 'journey-map__sun' }),
    el('span', { class: 'journey-map__cloud journey-map__cloud--a' }),
    el('span', { class: 'journey-map__cloud journey-map__cloud--b' }),
    el('span', { class: 'journey-map__cloud journey-map__cloud--c' }),
    el('span', { class: 'journey-map__hill journey-map__hill--far' }),
    el('span', { class: 'journey-map__hill journey-map__hill--middle' }),
    el('span', { class: 'journey-map__hill journey-map__hill--near' }),
  );

  const trees: Array<{ className: string; style: Record<string, string> }> = [
    { className: 'journey-map__tree--a', style: { left: '3%', bottom: '160px', transform: 'scale(0.85)' } },
    { className: 'journey-map__tree--b', style: { left: '13%', bottom: '108px', transform: 'scale(1.15)' } },
    { className: 'journey-map__tree--c', style: { right: '7%', bottom: '132px', transform: 'scale(1.05)' } },
    { className: 'journey-map__tree--d', style: { right: '21%', bottom: '92px', transform: 'scale(0.75)' } },
    { className: 'journey-map__tree--e', style: { left: '30%', bottom: '72px', transform: 'scale(0.62)' } },
  ];

  for (const tree of trees) {
    const node = el('span', {
      class: `journey-map__tree ${tree.className}`,
      style: tree.style,
    });
    backdrop.append(node);
  }

  const bushes: Array<Record<string, string>> = [
    { left: '7%', bottom: '72px' },
    { right: '14%', bottom: '58px' },
    { left: '43%', bottom: '44px' },
    { right: '4%', bottom: '34px' },
  ];
  for (const style of bushes) {
    backdrop.append(el('span', { class: 'journey-map__bush', style }));
  }

  const flowers: Array<Record<string, string>> = [
    { left: '22%', bottom: '50px' },
    { left: '58%', bottom: '36px' },
    { right: '27%', bottom: '30px' },
    { left: '48%', bottom: '78px' },
  ];
  for (const style of flowers) {
    backdrop.append(el('span', { class: 'journey-map__flower', style }));
  }

  return backdrop;
}

function appendTrail(
  svg: SVGSVGElement,
  stops: readonly JourneyStop[],
  positions: readonly JourneyPosition[],
  groups: readonly number[][],
  height: number,
): void {
  svg.setAttribute('viewBox', `0 0 1000 ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('journey-map__trail');

  if (positions.length === 0) return;

  // The trail pauses at every material divider, so a section label never sits
  // on top of the connecting line.
  const trailGroups: readonly number[][] =
    groups.length > 0 ? groups : [positions.map((_, index) => index)];

  for (const group of trailGroups) {
    if (group.length === 0) continue;
    const groupPositions = group.map((index) => positions[index]!);

    if (groupPositions.length > 1) {
      const base = document.createElementNS(SVG_NS, 'path');
      base.setAttribute('d', journeyPathD(groupPositions));
      base.setAttribute('class', 'journey-map__trail-base');
      base.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(base);
    }

    for (let index = 1; index < group.length; index += 1) {
      const segment = document.createElementNS(SVG_NS, 'path');
      const state = stopState(stops[group[index]!]!);
      segment.setAttribute(
        'd',
        journeySegmentD(positions[group[index - 1]!]!, positions[group[index]!]!),
      );
      segment.setAttribute(
        'class',
        `journey-map__trail-piece journey-map__trail-piece--${state}`,
      );
      segment.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(segment);
    }
  }
}

function createSectionDivider(section: PathSection, top: number): HTMLElement {
  const element = el(
    'h2',
    {
      class: 'journey-section',
      attrs: {
        'data-section-id': section.id,
        'aria-label': `Materi: ${section.title}`,
      },
    },
    [el('span', { class: 'journey-section__title', text: section.title })],
  );
  element.style.top = `${top}px`;
  return element;
}

function createStop(
  stop: JourneyStop,
  position: JourneyPosition,
  activeIndex: number,
  stopIndex: number,
  subjectSlug: string,
  onLocked: (stop: JourneyStop) => void,
  saveScroll: () => void,
): HTMLElement {
  const state = stopState(stop);
  const href = stopHref(subjectSlug, stop);
  const isActive = stopIndex === activeIndex && state === 'active';
  const label = stopLabel(stop);
  const className = [
    'journey-stop',
    `journey-stop--${stop.kind}`,
    `journey-stop--${state}`,
    isActive ? 'journey-stop--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const element = href
    ? el('a', {
        class: className,
        attrs: {
          href,
          'aria-label': stopAriaLabel(stop),
          'data-node-id': stop.node.id,
        },
      })
    : el('button', {
        class: className,
        attrs: {
          type: 'button',
          'aria-label': stopAriaLabel(stop),
          'data-node-id': stop.node.id,
          'aria-disabled': 'true',
        },
      });

  element.style.left = `${position.x}%`;
  element.style.top = `${position.y}px`;
  element.style.setProperty('--stop-order', String(stopIndex));
  element.dataset.status = stop.node.status;
  element.dataset.kind = stop.kind;
  if (isActive) element.setAttribute('aria-current', 'step');
  if (state === 'locked') {
    element.setAttribute(
      'title',
      stop.kind === 'level' && stop.node.questionCount === 0
        ? 'Bank soal level ini belum tersedia.'
        : stop.kind === 'reward'
          ? 'Selesaikan level sebelumnya untuk membuka hadiah.'
          : 'Selesaikan level sebelumnya untuk membuka level ini.',
    );
  }

  if (!href) {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      saveScroll();
      onLocked(stop);
    });
  } else {
    element.addEventListener('click', saveScroll);
  }

  const orb = el('span', { class: 'journey-stop__orb' }, [icon(stopIcon(stop, state), 30)]);
  if (isActive) {
    orb.append(el('span', { class: 'journey-stop__pulse' }));
  }
  if (stop.kind === 'reward' && stop.node.rewardClaimed) {
    orb.append(el('span', { class: 'journey-stop__receipt' }, [icon('check', 12)]));
  }

  element.append(
    orb,
    el('span', { class: 'journey-stop__label' }, [
      el('span', {
        class: 'journey-stop__eyebrow',
        text: stop.kind === 'reward' ? `Hadiah ${stop.rewardNumber}` : `Level ${stop.levelNumber}`,
      }),
      el('span', { class: 'journey-stop__name', text: label }),
    ]),
  );

  return element;
}

function percentComplete(path: SubjectPath): number {
  return path.totalNodes > 0
    ? Math.min(100, Math.round((path.completedNodes / path.totalNodes) * 100))
    : 0;
}

export function createLearningJourney(
  path: SubjectPath,
  options: LearningJourneyOptions = {},
): LearningJourneyHandle {
  const subject = path.subject;
  const stops = buildJourneyStops(path.levels);
  const timeline = buildJourneyTimeline(stops, path.sections ?? []);
  const activeIndex = activeJourneyIndex(stops);
  const reducedMotion = options.reducedMotion ?? false;
  const onLocked = options.onLocked ?? (() => undefined);
  const storageKey = `lentera.journey.scroll.${subject.slug}`;

  const root = el('section', {
    class: 'journey-map',
    attrs: {
      'aria-label': `Peta perjalanan ${subject.name}`,
      'data-reduced-motion': String(reducedMotion),
    },
  });
  root.style.setProperty('--journey-accent', subject.accent_color || '#58CC02');

  const back = el(
    'a',
    {
      class: 'journey-map__back',
      attrs: { href: '/learn', 'aria-label': 'Kembali ke semua mata pelajaran' },
    },
    [icon('arrow-left', 20)],
  );

  const fallbackIcon = (): SVGElement => icon(subjectIconName(subject.icon_key), 22);
  const subjectImage =
    typeof subject.icon_url === 'string' && subject.icon_url
      ? el('img', {
          attrs: {
            src: subject.icon_url,
            alt: '',
            decoding: 'async',
          },
        })
      : null;
  subjectImage?.addEventListener('error', () => subjectImage.replaceWith(fallbackIcon()), {
    once: true,
  });
  const subjectBadge = el('span', { class: 'journey-map__subject-icon' }, [
    subjectImage ?? fallbackIcon(),
  ]);

  const identity = el('div', { class: 'journey-map__identity' }, [
    el('span', {
      class: 'journey-map__eyebrow',
      text:
        subject.status === 'development'
          ? 'Peta belajar · Dalam pengembangan'
          : 'Peta belajar',
    }),
    el('h1', { class: 'journey-map__title', text: subject.name }),
    el('span', {
      class: 'journey-map__meta',
      text: `${stops.filter((stop) => stop.kind === 'level').length} Level · ${formatNumber(path.questionCount)} Soal`,
      attrs: { 'data-journey-meta': 'levels-questions' },
    }),
  ]);

  const percent = percentComplete(path);
  const progress = el('div', { class: 'journey-map__progress' }, [
    el('span', { class: 'journey-map__progress-copy' }, [
      el('strong', { text: `${percent}%` }),
      el('span', { text: `${path.completedNodes}/${path.totalNodes} level` }),
    ]),
    el('span', { class: 'journey-map__progress-track' }, [
      el('span', {
        class: 'journey-map__progress-fill',
        style: { width: `${percent}%` },
      }),
    ]),
  ]);

  const hud = el('header', { class: 'journey-map__hud' }, [
    back,
    subjectBadge,
    identity,
    progress,
  ]);

  if (path.developerPreview) {
    hud.append(el('span', { class: 'journey-map__dev-badge', text: 'Pratinjau developer' }));
  }

  const scroll = el('div', {
    class: 'journey-map__scroll',
    attrs: {
      tabindex: '0',
      role: 'region',
      'aria-label': `Peta perjalanan ${subject.name}. Gulir ke bawah untuk level berikutnya.`,
    },
  });

  const track = el('div', { class: 'journey-map__track' });
  track.style.height = `${timeline.height}px`;

  const svg = document.createElementNS(SVG_NS, 'svg');
  appendTrail(svg, stops, timeline.positions, timeline.groups, timeline.height);
  track.append(svg);

  const stopElements: HTMLElement[] = [];
  let saveTimer: number | null = null;
  let restoreFrame = 0;

  const saveScroll = (): void => {
    try {
      window.sessionStorage.setItem(storageKey, String(scroll.scrollTop));
    } catch {
      // Session storage can be unavailable in private browsing; the map still works.
    }
  };

  const queueSave = (): void => {
    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      saveScroll();
    }, 120);
  };

  for (const entry of timeline.entries) {
    if (entry.kind === 'divider') {
      track.append(createSectionDivider(entry.section, entry.y));
      continue;
    }

    const element = createStop(
      entry.stop,
      entry.position,
      activeIndex,
      entry.stopIndex,
      subject.slug,
      onLocked,
      saveScroll,
    );
    stopElements[entry.stopIndex] = element;
    track.append(element);
  }

  const activeStop = activeIndex >= 0 ? stops[activeIndex] : null;
  const live = el('p', {
    class: 'sr-only',
    attrs: { role: 'status', 'aria-live': 'polite' },
    text: activeStop
      ? `Level aktif: ${activeStop.levelNumber}, ${activeStop.node.title}.`
      : 'Semua level sudah selesai.',
  });

  scroll.append(track);
  const backdrop = createBackdrop();
  root.append(backdrop, hud, scroll, live);

  const scrollToActive = (smooth: boolean): void => {
    const activeElement = activeIndex >= 0 ? stopElements[activeIndex] : null;
    if (!activeElement) return;

    const target = Math.max(0, activeElement.offsetTop - scroll.clientHeight * 0.44);
    if (smooth && !reducedMotion && typeof scroll.scrollTo === 'function') {
      scroll.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      scroll.scrollTop = target;
    }
  };

  const restoreOrFocus = (): void => {
    if (!root.isConnected) return;

    let saved: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) saved = Math.max(0, parsed);
      }
    } catch {
      saved = null;
    }

    if (saved !== null) {
      scroll.scrollTop = saved;
    } else {
      scrollToActive(true);
    }
  };

  scroll.addEventListener('scroll', queueSave, { passive: true });
  restoreFrame = window.requestAnimationFrame(() => {
    restoreFrame = window.requestAnimationFrame(restoreOrFocus);
  });

  const destroy = (): void => {
    window.cancelAnimationFrame(restoreFrame);
    if (saveTimer !== null) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
    saveScroll();
    scroll.removeEventListener('scroll', queueSave);
  };

  return { element: root, destroy };
}
