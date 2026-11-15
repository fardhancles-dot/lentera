import { describe, expect, it } from 'vitest';
import type { PathLevel, PathNode } from '../src/services/curriculum.service';
import { resolveLevelNavigation } from '../src/services/learningPath';

function makeNode(
  id: string,
  options: Partial<PathNode> = {},
): PathNode {
  return {
    id,
    slug: id,
    title: id,
    description: '',
    nodeType: 'lesson',
    lessonId: `lesson-${id}`,
    lessonSlug: `lesson-${id}`,
    questionId: `question-${id}`,
    levelNumber: null,
    playable: true,
    questionCount: 1,
    topics: [],
    questionTypes: [],
    estimatedMinutes: 5,
    xpReward: 10,
    coinReward: 5,
    rewardCoins: 0,
    rewardXp: 0,
    rewardClaimed: false,
    status: 'locked',
    ...options,
  };
}

function makeLevel(id: string, nodes: PathNode[]): PathLevel {
  return {
    id,
    slug: id,
    title: id,
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

describe('level navigation', () => {
  it('points to the next playable level after a passed level', () => {
    const levels = [
      makeLevel('one', [
        makeNode('lv1', { status: 'completed' }),
        makeNode('lv2', { status: 'completed' }),
        makeNode('lv3', { status: 'available' }),
        makeNode('lv4', { status: 'locked' }),
      ]),
    ];

    const navigation = resolveLevelNavigation(levels, 'lv2');

    expect(navigation.nextLevel?.id).toBe('lv3');
    expect(navigation.allLevelsCompletedAfterPass).toBe(false);
  });

  it('has no next level and finishes the subject when the last level passes', () => {
    const levels = [
      makeLevel('one', [
        makeNode('lv1', { status: 'completed' }),
        makeNode('lv2', { status: 'completed' }),
      ]),
      makeLevel('two', [makeNode('lv3', { status: 'in_progress' })]),
    ];

    const navigation = resolveLevelNavigation(levels, 'lv3');

    expect(navigation.nextLevel).toBeNull();
    expect(navigation.allLevelsCompletedAfterPass).toBe(true);
  });

  it('skips rewards and levels that have no question bank', () => {
    const levels = [
      makeLevel('one', [
        makeNode('lv1', { status: 'completed' }),
        makeNode('chest', {
          nodeType: 'reward',
          playable: false,
          questionCount: 0,
          status: 'available',
        }),
        makeNode('empty', { status: 'locked', questionCount: 0 }),
        makeNode('lv2', { status: 'available' }),
      ]),
    ];

    const navigation = resolveLevelNavigation(levels, 'lv1');

    expect(navigation.nextLevel?.id).toBe('lv2');
  });

  it('keeps replaying a finished course on the final level', () => {
    const levels = [
      makeLevel('one', [
        makeNode('lv1', { status: 'completed' }),
        makeNode('lv2', { status: 'completed' }),
      ]),
    ];

    const navigation = resolveLevelNavigation(levels, 'lv2');

    expect(navigation.nextLevel).toBeNull();
    expect(navigation.allLevelsCompletedAfterPass).toBe(true);
  });

  it('does not claim completion while a developer preview leaves levels unplayed', () => {
    const levels = [
      makeLevel('one', [
        makeNode('lv1', { status: 'preview' }),
        makeNode('lv2', { status: 'preview' }),
      ]),
    ];

    const navigation = resolveLevelNavigation(levels, 'lv2');

    expect(navigation.nextLevel).toBeNull();
    expect(navigation.allLevelsCompletedAfterPass).toBe(false);
  });

  it('returns no navigation for an unknown node', () => {
    expect(resolveLevelNavigation([], 'missing')).toEqual({
      nextLevel: null,
      allLevelsCompletedAfterPass: false,
    });
  });
});
