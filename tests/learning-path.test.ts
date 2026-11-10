import { describe, expect, it } from 'vitest';
import { resolveNodeStatuses } from '../src/services/learningPath';

describe('learning path node statuses', () => {
  it('opens only the first unfinished lesson', () => {
    expect(resolveNodeStatuses(['a', 'b', 'c'], new Set())).toEqual([
      'available',
      'locked',
      'locked',
    ]);
  });

  it('keeps completed lessons completed and unlocks the next one', () => {
    expect(resolveNodeStatuses(['a', 'b', 'c'], new Set(['a']))).toEqual([
      'completed',
      'available',
      'locked',
    ]);
  });

  it('marks the current lesson as in progress when an attempt exists', () => {
    expect(
      resolveNodeStatuses(['a', 'b', 'c'], new Set(['a']), {
        startedNodeIds: new Set(['b']),
      }),
    ).toEqual(['completed', 'in_progress', 'locked']);
  });

  it('never shows a started lesson as in progress behind a locked chain', () => {
    expect(
      resolveNodeStatuses(['a', 'b', 'c'], new Set(), {
        startedNodeIds: new Set(['b']),
      }),
    ).toEqual(['available', 'locked', 'locked']);
  });

  it('lets developers preview every unfinished lesson without changing progress', () => {
    expect(
      resolveNodeStatuses(['a', 'b', 'c'], new Set(['a']), { developerPreview: true }),
    ).toEqual(['completed', 'preview', 'preview']);
  });
});
