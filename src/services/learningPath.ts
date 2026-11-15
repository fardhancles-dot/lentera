import type { PathLevel, PathNode } from './curriculum.service';

export type LearningNodeStatus =
  | 'completed'
  | 'in_progress'
  | 'available'
  | 'locked'
  | 'preview';

export interface NodeStatusOptions {
  /**
   * Nodes that already have a saved attempt but were not passed. The first
   * unfinished node keeps that state on the map so the player can see where
   * they left off instead of every node looking untouched.
   */
  startedNodeIds?: ReadonlySet<string>;
  developerPreview?: boolean;
}

/**
 * Lessons unlock sequentially. Completed nodes stay completed, the first
 * unfinished node is available (or in progress when an attempt exists), and
 * everything after it stays locked until the previous lesson is finished.
 * Developers may preview every node for content inspection; progression
 * itself is still computed from real progress.
 */
export function resolveNodeStatuses(
  nodeIds: readonly string[],
  completedNodeIds: ReadonlySet<string>,
  options: NodeStatusOptions = {},
): LearningNodeStatus[] {
  const developerPreview = options.developerPreview ?? false;
  const startedNodeIds = options.startedNodeIds;
  let chainOpen = true;

  return nodeIds.map((nodeId) => {
    if (completedNodeIds.has(nodeId)) {
      return 'completed';
    }

    if (developerPreview) {
      return 'preview';
    }

    if (chainOpen) {
      chainOpen = false;
      return startedNodeIds?.has(nodeId) ? 'in_progress' : 'available';
    }

    return 'locked';
  });
}

export interface LevelNavigation {
  /** Next playable level in map order, across the whole subject. */
  nextLevel: PathNode | null;
  /** True when every other level is already complete, so passing this one finishes the subject. */
  allLevelsCompletedAfterPass: boolean;
}

/**
 * Reuses the journey order (level → unit → node) that the map renders. Reward
 * checkpoints and nodes without a question bank are not levels, so they are
 * skipped and "Lanjut" always opens something that can actually be played.
 */
export function resolveLevelNavigation(
  levels: readonly PathLevel[],
  currentNodeId: string,
): LevelNavigation {
  const playable = levels
    .flatMap((level) => level.units.flatMap((unit) => unit.nodes))
    .filter((node) => node.playable && node.questionCount > 0);
  const index = playable.findIndex((node) => node.id === currentNodeId);

  if (index < 0) {
    return { nextLevel: null, allLevelsCompletedAfterPass: false };
  }

  return {
    nextLevel: playable[index + 1] ?? null,
    allLevelsCompletedAfterPass: playable.every(
      (node) => node.id === currentNodeId || node.status === 'completed',
    ),
  };
}
