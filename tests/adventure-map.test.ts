import { describe, expect, it } from 'vitest';
import { computeMapPositions } from '../src/game/adventure/layout';
import {
  AREA_PALETTES,
  areaPaletteFor,
  MAP_HEIGHT,
  MAP_VIEWPORTS,
  MAP_WIDTH,
} from '../src/game/adventure/types';

describe('adventure map layout', () => {
  it('returns no positions for an empty level', () => {
    expect(computeMapPositions(0)).toEqual([]);
  });

  it('walks the first row left to right, then snakes back', () => {
    const positions = computeMapPositions(5);

    expect(positions.map((point) => point.x)).toEqual([150, 450, 750, 750, 450]);
    expect(positions[0]!.y).toBe(372);
    expect(positions[3]!.y).toBeLessThan(372);
    expect(positions[3]!.y).toBe(positions[4]!.y);
  });

  it('keeps every node inside the logical canvas', () => {
    for (const count of [1, 2, 3, 7, 12, 24]) {
      const positions = computeMapPositions(count);
      expect(positions).toHaveLength(count);

      for (const point of positions) {
        expect(point.x).toBeGreaterThan(0);
        expect(point.x).toBeLessThan(MAP_WIDTH);
        expect(point.y).toBeGreaterThan(0);
        expect(point.y).toBeLessThan(MAP_HEIGHT);
      }
    }
  });

  it('lays out the compact viewport with two readable columns', () => {
    const compact = MAP_VIEWPORTS.compact;
    const positions = computeMapPositions(6, compact);

    expect(positions.map((point) => point.x)).toEqual([
      compact.left,
      compact.right,
      compact.right,
      compact.left,
      compact.left,
      compact.right,
    ]);
    expect(positions[0]!.y).toBe(compact.bottom);
    expect(positions[2]!.y).toBeLessThan(compact.bottom);

    for (const point of positions) {
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(compact.width);
      expect(point.y).toBeGreaterThan(compact.top - 1);
      expect(point.y).toBeLessThan(compact.height);
    }
  });

  it('gives every chapter its own scenery palette and wraps for long courses', () => {
    expect(AREA_PALETTES.length).toBeGreaterThanOrEqual(4);
    expect(areaPaletteFor(0)).toBe(AREA_PALETTES[0]);
    expect(areaPaletteFor(1)).not.toBe(areaPaletteFor(0));
    expect(areaPaletteFor(1).sky).not.toBe(areaPaletteFor(0).sky);
    expect(areaPaletteFor(AREA_PALETTES.length)).toBe(AREA_PALETTES[0]);
    expect(areaPaletteFor(-3)).toBe(AREA_PALETTES[0]);
  });

  it('compresses rows instead of overflowing when a level is long', () => {
    const positions = computeMapPositions(30);
    const rows = positions.filter((point) => point.y === 372);
    const heights = new Set(positions.map((point) => point.y));

    expect(rows).toHaveLength(3);
    expect(heights.size).toBe(10);
    expect(Math.min(...positions.map((point) => point.y))).toBeCloseTo(148, 5);
  });
});
