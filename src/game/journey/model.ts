import type { PathLevel, PathNode } from '../../services/curriculum.service';

export type JourneyStopKind = 'level' | 'reward';

export interface JourneyStop {
  node: PathNode;
  kind: JourneyStopKind;
  /** 1-based position among playable learning nodes, across the whole subject. */
  levelNumber: number;
  /** 1-based position among reward nodes, across the whole subject. */
  rewardNumber: number;
  chapterIndex: number;
  chapterTitle: string;
  chapterName: string;
}

export interface JourneyPosition {
  x: number;
  y: number;
}

export interface JourneyLayoutOptions {
  step?: number;
  top?: number;
  bottom?: number;
}

export interface JourneyLayout {
  positions: JourneyPosition[];
  height: number;
}

/**
 * Flatten the curriculum the same way the lesson engine walks it: level → unit →
 * node. Playable nodes become journey levels and reward nodes become the chest
 * stops between them. Nothing is generated here, so every stop keeps its real
 * node id, status, URL, and reward claim state.
 */
export function buildJourneyStops(levels: readonly PathLevel[]): JourneyStop[] {
  const stops: JourneyStop[] = [];
  let levelNumber = 0;
  let rewardNumber = 0;

  levels.forEach((level, chapterIndex) => {
    const nodes = level.units.flatMap((unit) => unit.nodes);

    for (const node of nodes) {
      if (node.nodeType === 'reward') {
        rewardNumber += 1;
        stops.push({
          node,
          kind: 'reward',
          levelNumber,
          rewardNumber,
          chapterIndex,
          chapterTitle: level.title,
          chapterName: cleanChapterName(level.title),
        });
        continue;
      }

      if (!node.playable) continue;

      levelNumber += 1;
      stops.push({
        node,
        kind: 'level',
        levelNumber,
        rewardNumber,
        chapterIndex,
        chapterTitle: level.title,
        chapterName: cleanChapterName(level.title),
      });
    }
  });

  return stops;
}

export function cleanChapterName(title: string): string {
  return title.replace(/^Level\s*\d+\s*[·:–—-]\s*/i, '').trim() || title;
}

/**
 * The active stop is the first thing the player can actually do, in path order.
 * A reward waiting after three completed levels comes before the next chapter,
 * and a finished course lands on its final reward.
 */
export function activeJourneyIndex(stops: readonly JourneyStop[]): number {
  if (stops.length === 0) return -1;

  const actionable = stops.findIndex(
    (stop) =>
      stop.node.status === 'available' ||
      stop.node.status === 'in_progress' ||
      stop.node.status === 'preview',
  );
  return actionable >= 0 ? actionable : stops.length - 1;
}

/**
 * Nodes wind down the map in chapters. The direction flips after every reward
 * so consecutive chapters feel like a continuous journey rather than a column
 * of cards. Reward chests always sit on the centre line.
 */
export function layoutJourney(
  stops: readonly JourneyStop[],
  options: JourneyLayoutOptions = {},
): JourneyLayout {
  const step = options.step ?? 112;
  const top = options.top ?? 128;
  const bottom = options.bottom ?? 150;

  const positions: JourneyPosition[] = [];
  let chapterIndex = -1;
  let chapterStopIndex = 0;

  stops.forEach((stop, index) => {
    if (stop.chapterIndex !== chapterIndex) {
      chapterIndex = stop.chapterIndex;
      chapterStopIndex = 0;
    }

    const pattern =
      chapterIndex === 0
        ? [50, 30, 70]
        : chapterIndex % 2 === 1
          ? [30, 70, 50]
          : [70, 30, 50];
    const x = stop.kind === 'reward' ? 50 : pattern[chapterStopIndex++ % pattern.length]!;

    positions.push({
      x,
      y: top + index * step,
    });
  });

  return {
    positions,
    height: top + Math.max(0, stops.length - 1) * step + bottom,
  };
}

export function journeyPathD(points: readonly JourneyPosition[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  let d = `M ${first.x * 10} ${first.y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const middle = (previous.y + current.y) / 2;
    d += ` C ${previous.x * 10} ${middle}, ${current.x * 10} ${middle}, ${current.x * 10} ${current.y}`;
  }

  return d;
}

export function journeySegmentD(
  previous: JourneyPosition,
  current: JourneyPosition,
): string {
  const middle = (previous.y + current.y) / 2;
  return `M ${previous.x * 10} ${previous.y} C ${previous.x * 10} ${middle}, ${current.x * 10} ${middle}, ${current.x * 10} ${current.y}`;
}
