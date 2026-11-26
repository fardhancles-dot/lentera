export type AdventureNodeStatus =
  | 'completed'
  | 'in_progress'
  | 'available'
  | 'locked'
  | 'preview';

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
export interface AreaPalette {
  name: string;
  sky: number;
  skyTop: number;
  hill: number;
  hillDark: number;
  ground: number;
  groundShade: number;
  path: number;
  pathDot: number;
  sun: number;
  sunGlow: number;
}

/**
 * Every level is an area of the adventure. The palette cycles with the level
 * order so browsing chapters changes the scenery instead of only the node
 * labels, while the art style itself stays consistent.
 */
export const AREA_PALETTES: readonly AreaPalette[] = [
  {
    name: 'Padang Hijau',
    sky: 0xf3faee,
    skyTop: 0xe8f6ff,
    hill: 0xd9efc4,
    hillDark: 0xc7e8ac,
    ground: 0xe9f7dc,
    groundShade: 0xdff2cc,
    path: 0xdff0cc,
    pathDot: 0xffffff,
    sun: 0xfff1c2,
    sunGlow: 0xffe08a,
  },
  {
    name: 'Senja Jingga',
    sky: 0xfff6ea,
    skyTop: 0xffe9d2,
    hill: 0xf6ddb4,
    hillDark: 0xefcf9b,
    ground: 0xfdf1de,
    groundShade: 0xf8e5c9,
    path: 0xf5e3c6,
    pathDot: 0xfffaf0,
    sun: 0xffd08a,
    sunGlow: 0xffb367,
  },
  {
    name: 'Teluk Biru',
    sky: 0xecf8ff,
    skyTop: 0xdff1ff,
    hill: 0xc9e8f5,
    hillDark: 0xb3dcee,
    ground: 0xe4f4fa,
    groundShade: 0xd6edf6,
    path: 0xd3eaf4,
    pathDot: 0xffffff,
    sun: 0xfff4c9,
    sunGlow: 0xffe9a3,
  },
  {
    name: 'Lembah Ungu',
    sky: 0xf4f1ff,
    skyTop: 0xe9e4ff,
    hill: 0xd8d1f5,
    hillDark: 0xc9c0ef,
    ground: 0xeeebfb,
    groundShade: 0xe3def7,
    path: 0xded8f4,
    pathDot: 0xffffff,
    sun: 0xfff0c4,
    sunGlow: 0xffe2a0,
  },
  {
    name: 'Taman Rosa',
    sky: 0xfff3f7,
    skyTop: 0xffe8f0,
    hill: 0xf7d6e2,
    hillDark: 0xf0c3d4,
    ground: 0xfcedf2,
    groundShade: 0xf8dfe8,
    path: 0xf6dae4,
    pathDot: 0xffffff,
    sun: 0xfff2c8,
    sunGlow: 0xffe4a0,
  },
];

export function areaPaletteFor(index: number): AreaPalette {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.trunc(index)) : 0;
  return AREA_PALETTES[safeIndex % AREA_PALETTES.length]!;
}

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
    // Leaves room under the last row so word-wrapped node labels are never
    // cut off by the bottom of the phone frame.
    top: 120,
    bottom: 500,
    nodeRadius: 40,
    labelSize: 16,
    titleSize: 18,
  },
};
