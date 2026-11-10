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
