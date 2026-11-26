export interface MapPoint {
  x: number;
  y: number;
}

export interface MapLayoutOptions {
  columns?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Serpentine layout: nodes fill a row, the next row climbs upward and runs the
 * other way. Rows compress when a level has many nodes so the whole map always
 * fits the logical canvas.
 */
export function computeMapPositions(
  count: number,
  options: MapLayoutOptions = {},
): MapPoint[] {
  if (count <= 0) return [];

  const columns = Math.max(1, Math.round(options.columns ?? 3));
  const left = options.left ?? 150;
  const right = options.right ?? 750;
  const top = options.top ?? 148;
  const bottom = options.bottom ?? 372;

  const xs =
    columns === 1
      ? [(left + right) / 2]
      : Array.from({ length: columns }, (_, column) =>
          Math.round(left + ((right - left) * column) / (columns - 1)),
        );

  const rows = Math.ceil(count / columns);
  const step = rows > 1 ? Math.min(118, (bottom - top) / (rows - 1)) : 0;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const columnInRow = index % columns;
    const forward = row % 2 === 0;
    const x = forward ? xs[columnInRow]! : xs[columns - 1 - columnInRow]!;

    return {
      x,
      y: bottom - row * step,
    };
  });
}
