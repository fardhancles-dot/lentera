import type { PathLevel, PathNode, PathSection } from '../../services/curriculum.service';

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

export interface JourneyDividerEntry {
  kind: 'divider';
  section: PathSection;
  /** Vertical centre of the divider label, in track pixels. */
  y: number;
}

export interface JourneyStopEntry {
  kind: 'stop';
  stop: JourneyStop;
  /** Index of this stop among all stops, not among map entries. */
  stopIndex: number;
  position: JourneyPosition;
}

export type JourneyEntry = JourneyDividerEntry | JourneyStopEntry;

export interface JourneyTimeline extends JourneyLayout {
  entries: JourneyEntry[];
  /** Consecutive stop indexes between dividers, so the trail can pause there. */
  groups: number[][];
}

export interface JourneyTimelineOptions extends JourneyLayoutOptions {
  dividerGap?: number;
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

      // Level numbers come from the database so archiving a level never
      // renumbers the levels after it.
      levelNumber = node.levelNumber ?? levelNumber + 1;
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
  const pattern = [50, 30, 70, 40, 60];

  stops.forEach((stop, index) => {
    const x = stop.kind === 'reward' ? 50 : pattern[index % pattern.length]!;

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

/**
 * Places section dividers just before the level their range starts at. Dividers
 * only consume vertical space, so level numbers, unlock order, and stop ids stay
 * exactly as the database produced them. Sections that start past the last
 * level are ignored rather than inventing a stop.
 */
export function buildJourneyTimeline(
  stops: readonly JourneyStop[],
  sections: readonly PathSection[] = [],
  options: JourneyTimelineOptions = {},
): JourneyTimeline {
  const step = options.step ?? 112;
  const top = options.top ?? 128;
  const bottom = options.bottom ?? 150;
  const dividerGap = options.dividerGap ?? 120;
  const pattern = [50, 30, 70, 40, 60];

  const pending = [...sections]
    .filter(
      (section) =>
        Number.isFinite(section.startLevel) &&
        Number.isFinite(section.endLevel) &&
        section.startLevel >= 1 &&
        section.endLevel >= section.startLevel,
    )
    .sort((a, b) => a.startLevel - b.startLevel);

  const entries: JourneyEntry[] = [];
  const positions: JourneyPosition[] = [];
  const groups: number[][] = [];
  let group: number[] = [];
  let cursor = top;
  let pendingIndex = 0;
  let stopIndex = 0;

  for (const stop of stops) {
    // A divider opens a new material block, so it is placed before a level
    // stop and always breaks the trail instead of crossing the label.
    if (stop.kind === 'level') {
      while (
        pendingIndex < pending.length &&
        pending[pendingIndex]!.startLevel <= stop.levelNumber
      ) {
        const section = pending[pendingIndex]!;
        pendingIndex += 1;
        if (group.length > 0) {
          groups.push(group);
          group = [];
        }
        // Centre the bare title in the free space between the previous level
        // label (~66px below its centre) and the next level button, so the text
        // never sits underneath an orb or the connecting trail.
        entries.push({
          kind: 'divider',
          section,
          y: cursor + dividerGap / 2 - 56,
        });
        cursor += dividerGap;
      }
    }

    const position: JourneyPosition = {
      x: stop.kind === 'reward' ? 50 : pattern[stopIndex % pattern.length]!,
      y: cursor,
    };

    positions.push(position);
    entries.push({ kind: 'stop', stop, stopIndex, position });
    group.push(stopIndex);
    stopIndex += 1;
    cursor += step;
  }

  if (group.length > 0) groups.push(group);

  return {
    entries,
    positions,
    groups,
    height: stops.length === 0 ? top + bottom : cursor - step + bottom,
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
