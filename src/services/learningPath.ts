export type LearningNodeStatus = 'completed' | 'available' | 'locked' | 'preview';

/**
 * Lessons unlock sequentially. Completed nodes stay completed, the first
 * unfinished node is available, and everything after it stays locked until the
 * previous lesson is finished. Developers may preview every node for content
 * inspection; progression itself is still computed from real progress.
 */
export function resolveNodeStatuses(
  nodeIds: readonly string[],
  completedNodeIds: ReadonlySet<string>,
  options: { developerPreview?: boolean } = {},
): LearningNodeStatus[] {
  const developerPreview = options.developerPreview ?? false;
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
      return 'available';
    }

    return 'locked';
  });
}
