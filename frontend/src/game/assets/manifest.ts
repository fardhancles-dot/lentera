/**
 * Single source of truth for game assets. Lentera currently draws its character
 * and map with Phaser vector commands and synthesizes every sound, so no binary
 * file is required for those. File assets (currently the question illustrations)
 * are declared here with their licence, and `preloadSceneAssets` only loads the
 * records a scene asks for.
 */
export interface AssetRecord {
  key: string;
  scenes: readonly string[];
  kind: 'image' | 'audio' | 'spritesheet';
  source:
    | { type: 'file'; path: string }
    | { type: 'procedural'; note: string };
  /** Human-readable provenance and licence. */
  license: string;
}

export const ASSET_MANIFEST: readonly AssetRecord[] = [
  {
    key: 'kiko-character',
    scenes: ['mascot', 'adventure-map', 'lesson-result'],
    kind: 'spritesheet',
    source: {
      type: 'procedural',
      note: 'Drawn in src/game/characters/kiko.ts with Phaser graphics; 13 animation states.',
    },
    license: 'Original artwork created for Lentera. All rights reserved by the project.',
  },
  {
    key: 'adventure-map-art',
    scenes: ['adventure-map'],
    kind: 'image',
    source: {
      type: 'procedural',
      note: 'Sky, hills, path, trees and nodes are generated per level in adventureMapScene.ts.',
    },
    license: 'Original artwork created for Lentera. All rights reserved by the project.',
  },
  {
    key: 'audio-sfx',
    scenes: ['mascot', 'adventure-map', 'lesson-result'],
    kind: 'audio',
    source: {
      type: 'procedural',
      note: 'Web Audio oscillators in src/game/audio/patterns.ts; no samples are downloaded.',
    },
    license: 'Original synthesized audio created for Lentera. No third-party samples.',
  },
  {
    key: 'picture-book',
    scenes: ['lesson'],
    kind: 'image',
    source: { type: 'file', path: '/assets/pictures/book.svg' },
    license: 'Original SVG created for Lentera.',
  },
  {
    key: 'picture-globe',
    scenes: ['lesson'],
    kind: 'image',
    source: { type: 'file', path: '/assets/pictures/globe.svg' },
    license: 'Original SVG created for Lentera.',
  },
  {
    key: 'picture-laptop',
    scenes: ['lesson'],
    kind: 'image',
    source: { type: 'file', path: '/assets/pictures/laptop.svg' },
    license: 'Original SVG created for Lentera.',
  },
];

export interface FileAsset {
  key: string;
  kind: AssetRecord['kind'];
  path: string;
}

export function fileAssetsFor(sceneKey: string): FileAsset[] {
  return ASSET_MANIFEST.filter(
    (record) => record.scenes.includes(sceneKey) && record.source.type === 'file',
  ).map((record) => ({
    key: record.key,
    kind: record.kind,
    path: record.source.type === 'file' ? record.source.path : '',
  }));
}
