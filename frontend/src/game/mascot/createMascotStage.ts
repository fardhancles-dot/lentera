import Phaser from 'phaser';
import { audioEngine } from '../audio/audioEngine';
import { createKiko, type KikoCharacter } from '../characters/kiko';

const DESIGN_SIZE = 400;
const STAGE_CENTER = { x: 200, y: 232 };
const CELEBRATE_MS = 1300;

export type MascotAnimation = 'idle' | 'celebrating' | 'sad';

export interface MascotStageOptions {
  reducedMotion?: boolean;
  animation?: MascotAnimation;
  onInteract?: () => void;
}

class MascotScene extends Phaser.Scene {
  private readonly options: MascotStageOptions;
  private kiko!: KikoCharacter;
  private resetTimer: Phaser.Time.TimerEvent | null = null;

  constructor(options: MascotStageOptions) {
    super({ key: 'mascot' });
    this.options = options;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    const glow = this.add.graphics();
    for (let i = 6; i >= 1; i -= 1) {
      glow.fillStyle(0xffe9a8, 0.035);
      glow.fillCircle(200, 225, 70 + i * 22);
    }

    this.kiko = createKiko(this, {
      reducedMotion: this.options.reducedMotion,
      scale: 1,
    });
    this.kiko.root.setPosition(STAGE_CENTER.x, STAGE_CENTER.y);

    const animation = this.options.animation ?? 'idle';
    if (animation !== 'idle') {
      this.kiko.setAnimation(animation);
      if (animation === 'celebrating') this.scheduleReset();
    }

    this.input.on('pointerdown', () => this.celebrate());
  }

  private celebrate(): void {
    this.options.onInteract?.();
    audioEngine.play('reward');
    this.kiko.setAnimation('celebrating');
    this.scheduleReset();
  }

  private scheduleReset(): void {
    this.resetTimer?.remove();
    this.resetTimer = this.time.delayedCall(CELEBRATE_MS, () => {
      this.kiko.setAnimation('idle');
    });
  }

  shutdown(): void {
    this.resetTimer?.remove();
    this.resetTimer = null;
    this.tweens.killAll();
  }
}

export interface MascotStageHandle {
  destroy: () => void;
}

export function createMascotStage(
  parent: HTMLElement,
  options: MascotStageOptions = {},
): MascotStageHandle {
  parent.innerHTML = '';

  const scene = new MascotScene(options);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DESIGN_SIZE,
    height: DESIGN_SIZE,
    transparent: true,
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_SIZE,
      height: DESIGN_SIZE,
    },
    scene: [scene],
  });

  return {
    destroy: () => {
      game.destroy(true);
      parent.innerHTML = '';
    },
  };
}
