import Phaser from 'phaser';
import { fileAssetsFor } from './manifest';

/**
 * Queues the manifest's file assets for a scene. A failed file never blocks the
 * scene: the error is logged and the caller keeps its procedural fallback.
 */
export function preloadSceneAssets(scene: Phaser.Scene, sceneKey: string): void {
  const assets = fileAssetsFor(sceneKey);
  if (assets.length === 0) return;

  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: { key?: string; src?: string }) => {
    console.error('[assets] failed to load', file?.key ?? 'unknown', file?.src ?? '');
  });

  for (const asset of assets) {
    if (scene.textures.exists(asset.key)) continue;
    if (asset.kind === 'audio') scene.load.audio(asset.key, asset.path);
    else if (asset.kind === 'spritesheet') {
      scene.load.spritesheet(asset.key, asset.path, { frameWidth: 1, frameHeight: 1 });
    } else scene.load.image(asset.key, asset.path);
  }
}
