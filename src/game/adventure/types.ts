export type AdventureNodeStatus = 'completed' | 'available' | 'locked' | 'preview';

export interface AdventureMapNode {
  id: string;
  title: string;
  nodeType: string;
  status: AdventureNodeStatus;
  meta: string;
  href: string | null;
}

export interface AdventureMapLevel {
  id: string;
  title: string;
  nodes: AdventureMapNode[];
}

export interface MapViewport {
  key: 'wide' | 'compact';
  width: number;
  height: number;
  columns: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  nodeRadius: number;
  labelSize: number;
  titleSize: number;
}

export interface AdventureMapOptions {
  /** Shown in the canvas header, for example the subject name. */
  subjectLabel: string;
  levels: AdventureMapLevel[];
  initialLevelIndex?: number;
  viewport?: MapViewport;
  reducedMotion?: boolean;
  onSelect: (node: AdventureMapNode) => void;
  onLocked: (node: AdventureMapNode) => void;
  onLevelChange?: (level: AdventureMapLevel, index: number) => void;
  onReady?: () => void;
}

export interface AdventureMapHandle {
  destroy: () => void;
  /** Selects a level without remounting the canvas. */
  setLevel: (index: number) => void;
  getLevelIndex: () => number;
}

/** Logical canvas size of the wide map. Tests and layout presets rely on it. */
export const MAP_WIDTH = 900;
export const MAP_HEIGHT = 460;

/**
 * Two logical canvases keep node labels readable instead of shrinking a 900px
 * map into a phone. The compact map is taller, so the page frame aspect ratio
 * changes with it.
 */
export const MAP_VIEWPORTS: Record<MapViewport['key'], MapViewport> = {
  wide: {
    key: 'wide',
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    columns: 3,
    left: 150,
    right: 750,
    top: 148,
    bottom: 372,
    nodeRadius: 40,
    labelSize: 13,
    titleSize: 16,
  },
  compact: {
    key: 'compact',
    width: 420,
    height: 620,
    columns: 2,
    left: 110,
    right: 310,
    top: 120,
    bottom: 540,
    nodeRadius: 40,
    labelSize: 15,
    titleSize: 17,
  },
};
