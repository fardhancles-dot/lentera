import { startAdventureMap, type AdventureStage } from '../scenes/adventureMapScene';
import type { AdventureMapHandle, AdventureMapOptions } from './types';

/**
 * Mounts the Phaser map in a DOM container. The returned handle is safe to call
 * multiple times and always disposes the canvas and its tweens.
 */
export function createAdventureMap(
  parent: HTMLElement,
  options: AdventureMapOptions,
): AdventureMapHandle {
  let disposed = false;
  let stage: AdventureStage | null = null;

  try {
    stage = startAdventureMap(parent, options);
  } catch (error) {
    console.error('[adventure] map failed to start', error);
    parent.textContent = 'Peta 2D gagal dimuat di perangkat ini. Daftar lesson di bawah tetap bisa dipakai.';
  }

  return {
    setLevel: (index: number) => {
      if (disposed) return;
      stage?.setLevel(index);
    },
    getLevelIndex: () => stage?.getLevelIndex() ?? options.initialLevelIndex ?? 0,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      stage?.game.destroy(true);
      stage = null;
      parent.replaceChildren();
    },
  };
}
