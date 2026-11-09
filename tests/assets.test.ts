import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, fileAssetsFor } from '../src/game/assets/manifest';

const projectRoot = process.cwd();

describe('asset manifest', () => {
  it('uses unique keys and always records a licence', () => {
    const keys = ASSET_MANIFEST.map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);

    for (const asset of ASSET_MANIFEST) {
      expect(asset.license.trim().length, asset.key).toBeGreaterThan(0);
      expect(asset.scenes.length, asset.key).toBeGreaterThan(0);
    }
  });

  it('points every file asset at a real public path', () => {
    const fileAssets = ASSET_MANIFEST.flatMap((asset) =>
      asset.source.type === 'file' ? [asset.source.path] : [],
    );

    expect(fileAssets.length).toBeGreaterThan(0);
    for (const assetPath of fileAssets) {
      expect(assetPath.startsWith('/assets/'), assetPath).toBe(true);
      expect(existsSync(join(projectRoot, 'public', assetPath)), assetPath).toBe(true);
    }
  });

  it('only returns file assets for the requested scene', () => {
    const lessonAssets = fileAssetsFor('lesson');
    const adventureAssets = fileAssetsFor('adventure-map');

    expect(lessonAssets.length).toBeGreaterThan(0);
    expect(lessonAssets.every((asset) => asset.path.startsWith('/assets/'))).toBe(true);
    expect(adventureAssets).toEqual([]);
  });
});
