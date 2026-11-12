import { describe, expect, it } from 'vitest';
import type { PathLevel, PathNode } from '../src/services/curriculum.service';
import {
  activeJourneyIndex,
  buildJourneyStops,
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
  it('flattens every playable level and reward without inventing stops', () => {
    const stops = buildJourneyStops(threeChapters);

    expect(stops).toHaveLength(12);
    expect(stops.filter((stop) => stop.kind === 'level')).toHaveLength(9);
    expect(stops.filter((stop) => stop.kind === 'reward')).toHaveLength(3);
    expect(
      stops.filter((stop) => stop.kind === 'level').map((stop) => stop.levelNumber),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(stops.filter((stop) => stop.kind === 'reward').map((stop) => stop.rewardNumber)).toEqual([
      1, 2, 3,
    ]);
    expect(stops.map((stop) => stop.node.id)).toEqual([
      'one-lesson',
      'one-review',
      'one-challenge',
      'one-reward',
      'two-lesson',
      'two-review',
      'two-challenge',
      'two-reward',
      'three-lesson',
      'three-review',
      'three-challenge',
      'three-reward',
    ]);
    expect(stops[0]!.chapterName).toBe('Dasar HTML');
    expect(stops[0]!.node.status).toBe('completed');
    expect(stops[8]!.node.status).toBe('locked');
  });

  it('adds rewards only from database nodes, in their real order', () => {
    const stops = buildJourneyStops(threeChapters);
    const rewardIndexes = stops
      .map((stop, index) => (stop.kind === 'reward' ? index : -1))
      .filter((index) => index >= 0);

    expect(rewardIndexes).toEqual([3, 7, 11]);
    expect(stops[3]!.node.rewardCoins).toBe(20);
    expect(stops[3]!.node.rewardClaimed).toBe(false);
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

    expect(stops).toHaveLength(24);
    expect(stops.filter((stop) => stop.kind === 'reward')).toHaveLength(6);
    expect(stops.at(-1)?.levelNumber).toBe(18);
    expect(stops.at(-1)?.rewardNumber).toBe(6);
  });

  it('winds nodes down the map and keeps reward chests centred', () => {
    const stops = buildJourneyStops(threeChapters);
    const layout = layoutJourney(stops);

    expect(layout.positions).toHaveLength(12);
    expect(layout.height).toBe(128 + 11 * 112 + 150);
    expect(layout.positions.map((position) => position.x)).toEqual([
      50, 30, 70, 50, 30, 70, 50, 50, 70, 30, 50, 50,
    ]);
    expect(layout.positions.map((position) => position.y)).toEqual(
      Array.from({ length: 12 }, (_, index) => 128 + index * 112),
    );

    for (const index of [3, 7, 11]) {
      expect(layout.positions[index]!.x).toBe(50);
    }
  });

  it('picks the next playable node, then a waiting reward, then the final stop', () => {
    expect(activeJourneyIndex(buildJourneyStops(threeChapters))).toBe(3);

    const waitingReward = buildJourneyStops([
      chapter('done', 'Level 1 · Selesai', ['completed', 'completed', 'completed', 'available']),
    ]);
    expect(activeJourneyIndex(waitingReward)).toBe(3);

    const finished = buildJourneyStops([
      chapter('done', 'Level 1 · Selesai', ['completed', 'completed', 'completed', 'completed']),
    ]);
    expect(activeJourneyIndex(finished)).toBe(3);
  });

  it('builds a smooth path through every stop', () => {
    const layout = layoutJourney(buildJourneyStops(threeChapters));
    const path = journeyPathD(layout.positions);

    expect(path.startsWith('M 500 128')).toBe(true);
    expect((path.match(/C/g) ?? []).length).toBe(11);
  });

  it('cleans chapter titles without depending on a subject', () => {
    expect(cleanChapterName('Level 2 · CSS dan Layout')).toBe('CSS dan Layout');
    expect(cleanChapterName('Level 3 - Teks')).toBe('Teks');
    expect(cleanChapterName('Kosakata')).toBe('Kosakata');
    expect(buildJourneyStops([])).toEqual([]);
  });
});
