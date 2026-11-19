import { describe, expect, it } from 'vitest';
import type { PathLevel, PathNode } from '../src/services/curriculum.service';
import {
  activeJourneyIndex,
  buildJourneyStops,
  buildJourneyTimeline,
  cleanChapterName,
  journeyPathD,
  layoutJourney,
} from '../src/game/journey/model';

function makeNode(
  id: string,
  nodeType: string,
  options: Partial<PathNode> = {},
): PathNode {
  return {
    id,
    slug: id,
    title: id,
    description: '',
    nodeType,
    lessonId: nodeType === 'reward' ? null : `lesson-${id}`,
    lessonSlug: nodeType === 'reward' ? null : `lesson-${id}`,
    questionId: nodeType === 'reward' ? null : `question-${id}`,
    levelNumber: null,
    playable: nodeType !== 'reward',
    questionCount: nodeType === 'reward' ? 0 : 4,
    topics: [],
    questionTypes: [],
    estimatedMinutes: 5,
    xpReward: 10,
    coinReward: 5,
    rewardCoins: nodeType === 'reward' ? 20 : 0,
    rewardXp: nodeType === 'reward' ? 10 : 0,
    rewardClaimed: false,
    status: 'locked',
    ...options,
  };
}

function makeLevel(
  id: string,
  title: string,
  nodes: PathNode[],
): PathLevel {
  return {
    id,
    slug: id,
    title,
    description: '',
    difficulty: 'beginner',
    nodeCount: nodes.filter((node) => node.playable).length,
    completedCount: nodes.filter((node) => node.playable && node.status === 'completed').length,
    units: [
      {
        id: `unit-${id}`,
        slug: `unit-${id}`,
        title: `Unit ${id}`,
        description: '',
        objectives: [],
        nodes,
      },
    ],
  };
}

function chapter(id: string, title: string, statuses: PathNode['status'][]): PathLevel {
  return makeLevel(id, title, [
    makeNode(`${id}-lesson`, 'lesson', { status: statuses[0] }),
    makeNode(`${id}-review`, 'review', { status: statuses[1] }),
    makeNode(`${id}-challenge`, 'challenge', { status: statuses[2] }),
    makeNode(`${id}-reward`, 'reward', { status: statuses[3] }),
  ]);
}

const threeChapters = [
  chapter('one', 'Level 1 · Dasar HTML', ['completed', 'completed', 'completed', 'available']),
  chapter('two', 'Level 2 · CSS dan Layout', ['available', 'locked', 'locked', 'locked']),
  chapter('three', 'Level 3 · JavaScript dan DOM', ['locked', 'locked', 'locked', 'locked']),
];

describe('learning journey model', () => {
  it('flattens every playable level without making rewards map stops', () => {
    const stops = buildJourneyStops(threeChapters);

    expect(stops).toHaveLength(9);
    expect(stops.every((stop) => stop.kind === 'level')).toBe(true);
    expect(stops.map((stop) => stop.levelNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(stops.map((stop) => stop.node.id)).toEqual([
      'one-lesson',
      'one-review',
      'one-challenge',
      'two-lesson',
      'two-review',
      'two-challenge',
      'three-lesson',
      'three-review',
      'three-challenge',
    ]);
    expect(stops[0]!.chapterName).toBe('Dasar HTML');
    expect(stops[0]!.node.status).toBe('completed');
    expect(stops[8]!.node.status).toBe('locked');
  });

  it('leaves reward nodes and their claim state out of the map', () => {
    const stops = buildJourneyStops(threeChapters);

    expect(stops.some((stop) => stop.node.nodeType === 'reward')).toBe(false);
    expect(stops.every((stop) => stop.rewardNumber === 0)).toBe(true);
  });

  it('keeps growing for added levels instead of capping the map', () => {
    const chapters = Array.from({ length: 6 }, (_, index) =>
      chapter(`chapter-${index}`, `Level ${index + 1} · Bab ${index + 1}`, [
        'locked',
        'locked',
        'locked',
        'locked',
      ]),
    );
    const stops = buildJourneyStops(chapters);

    expect(stops).toHaveLength(18);
    expect(stops.at(-1)?.levelNumber).toBe(18);
    expect(stops.at(-1)?.rewardNumber).toBe(0);
  });

  it('winds levels continuously down the map', () => {
    const stops = buildJourneyStops(threeChapters);
    const layout = layoutJourney(stops);

    expect(layout.positions).toHaveLength(9);
    expect(layout.height).toBe(128 + 8 * 112 + 150);
    expect(layout.positions.map((position) => position.x)).toEqual([
      50, 30, 70, 40, 60, 50, 30, 70, 40,
    ]);
    expect(layout.positions.map((position) => position.y)).toEqual(
      Array.from({ length: 9 }, (_, index) => 128 + index * 112),
    );
  });

  it('picks the next playable node, then the final level', () => {
    expect(activeJourneyIndex(buildJourneyStops(threeChapters))).toBe(3);

    const completedChapter = buildJourneyStops([
      chapter('done', 'Level 1 · Selesai', ['completed', 'completed', 'completed', 'available']),
    ]);
    expect(activeJourneyIndex(completedChapter)).toBe(2);
  });

  it('builds a smooth path through every level stop', () => {
    const layout = layoutJourney(buildJourneyStops(threeChapters));
    const path = journeyPathD(layout.positions);

    expect(path.startsWith('M 500 128')).toBe(true);
    expect((path.match(/C/g) ?? []).length).toBe(8);
  });

  it('places material dividers before the starting level without renumbering stops', () => {
    const stops = buildJourneyStops(threeChapters);
    const timeline = buildJourneyTimeline(stops, [
      { id: 'a', title: 'Dasar', description: '', startLevel: 1, endLevel: 3 },
      { id: 'b', title: 'Lanjutan', description: '', startLevel: 4, endLevel: 9 },
      { id: 'c', title: 'Belum dipakai', description: '', startLevel: 99, endLevel: 120 },
    ]);

    const dividers = timeline.entries.filter((entry) => entry.kind === 'divider');
    expect(dividers.map((entry) => entry.section.title)).toEqual(['Dasar', 'Lanjutan']);
    expect(dividers.map((entry) => entry.y)).toEqual([132, 588]);

    // The first level still starts at the default top offset; only the divider
    // adds vertical space, so level numbers and stop order never change.
    expect(timeline.positions[0]!.y).toBe(248);
    expect(timeline.positions[4]!.y).toBe(816);
    expect(stops.slice(0, 5).map((stop) => stop.levelNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(timeline.height).toBe(1414);

    // The trail pauses at each divider instead of crossing its label.
    expect(timeline.groups.map((group) => group.length)).toEqual([3, 6]);
  });

  it('renders the same map when no dividers are configured', () => {
    const stops = buildJourneyStops(threeChapters);
    const plain = layoutJourney(stops);
    const timeline = buildJourneyTimeline(stops, []);

    expect(timeline.positions).toEqual(plain.positions);
    expect(timeline.height).toBe(plain.height);
    expect(timeline.entries.every((entry) => entry.kind === 'stop')).toBe(true);
    expect(timeline.groups).toHaveLength(1);
  });

  it('cleans chapter titles without depending on a subject', () => {
    expect(cleanChapterName('Level 2 · CSS dan Layout')).toBe('CSS dan Layout');
    expect(cleanChapterName('Level 3 - Teks')).toBe('Teks');
    expect(cleanChapterName('Kosakata')).toBe('Kosakata');
    expect(buildJourneyStops([])).toEqual([]);
  });
});
