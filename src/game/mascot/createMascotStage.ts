import Phaser from 'phaser';

const DESIGN_SIZE = 400;

export interface MascotStageOptions {
  reducedMotion?: boolean;
  onInteract?: () => void;
}

class MascotScene extends Phaser.Scene {
  private readonly options: MascotStageOptions;
  private body!: Phaser.GameObjects.Container;
  private leftEye!: Phaser.GameObjects.Container;
  private rightEye!: Phaser.GameObjects.Container;
  private leftArm!: Phaser.GameObjects.Container;
  private lantern!: Phaser.GameObjects.Container;
  private leftEar!: Phaser.GameObjects.Container;
  private rightEar!: Phaser.GameObjects.Container;
  private blinkTimer?: Phaser.Time.TimerEvent;

  constructor(options: MascotStageOptions) {
    super({ key: 'mascot' });
    this.options = options;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.drawScene();

    if (!this.options.reducedMotion) {
      this.startIdleAnimations();
    }

    this.input.on('pointerdown', () => this.celebrate());
  }

  private drawScene(): void {
    const scene = this;

    const glow = this.add.graphics();
    for (let i = 6; i >= 1; i -= 1) {
      glow.fillStyle(0xffe9a8, 0.035);
      glow.fillCircle(200, 225, 70 + i * 22);
    }

    const shadow = this.add.graphics();
    shadow.fillStyle(0x2f8f24, 0.14);
    shadow.fillEllipse(200, 340, 190, 30);

    this.leftEar = this.createEar(146, 132, -0.42);
    this.rightEar = this.createEar(254, 132, 0.42);

    this.body = this.add.container(200, 232);

    const bodyShape = this.add.graphics();
    bodyShape.fillStyle(0x58cc02, 1);
    bodyShape.fillEllipse(0, 0, 244, 230);

    const belly = this.add.graphics();
    belly.fillStyle(0xfff8e6, 1);
    belly.fillEllipse(0, 30, 136, 120);

    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.16);
    shine.fillEllipse(-58, -66, 72, 46);

    this.leftArm = this.createArm(-124, 20, -0.55);
    this.body.add(this.leftArm);
    this.body.add(bodyShape);
    this.body.add(belly);
    this.body.add(shine);

    this.leftEye = this.createEye(-44, -22);
    this.rightEye = this.createEye(44, -22);
    this.body.add(this.leftEye);
    this.body.add(this.rightEye);

    const blush = this.add.graphics();
    blush.fillStyle(0xf39a9a, 0.55);
    blush.fillEllipse(-74, -2, 24, 13);
    blush.fillEllipse(74, -2, 24, 13);
    this.body.add(blush);

    const mouth = this.add.graphics();
    mouth.lineStyle(6, 0x303a32, 1);
    mouth.beginPath();
    mouth.arc(0, 8, 18, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    mouth.strokePath();
    this.body.add(mouth);

    const feet = this.add.graphics();
    feet.fillStyle(0x2f8f24, 1);
    feet.fillEllipse(-58, 110, 62, 26);
    feet.fillEllipse(58, 110, 62, 26);
    this.body.add(feet);

    this.lantern = this.createLantern(140, 40);
    this.body.add(this.lantern);

    this.add.existing(this.body);

    if (!scene.options.reducedMotion) {
      this.tweens.add({
        targets: this.body,
        y: 226,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createEye(x: number, y: number): Phaser.GameObjects.Container {
    const eye = this.add.container(x, y);
    const white = this.add.graphics();
    white.fillStyle(0xffffff, 1);
    white.fillEllipse(0, 0, 46, 54);
    const pupil = this.add.graphics();
    pupil.fillStyle(0x303a32, 1);
    pupil.fillCircle(3, 3, 11);
    pupil.fillStyle(0xffffff, 1);
    pupil.fillCircle(6.5, -1, 3.6);
    eye.add([white, pupil]);
    return eye;
  }

  private createEar(x: number, y: number, rotation: number): Phaser.GameObjects.Container {
    const ear = this.add.container(x, y);
    ear.setRotation(rotation);
    const shape = this.add.graphics();
    shape.fillStyle(0x2f8f24, 1);
    shape.beginPath();
    shape.moveTo(0, 42);
    shape.lineTo(-24, -20);
    shape.lineTo(4, -54);
    shape.lineTo(28, -6);
    shape.closePath();
    shape.fillPath();
    ear.add(shape);
    return ear;
  }

  private createArm(x: number, y: number, rotation: number): Phaser.GameObjects.Container {
    const arm = this.add.container(x, y);
    arm.setRotation(rotation);
    const shape = this.add.graphics();
    shape.fillStyle(0x2f8f24, 1);
    shape.fillRoundedRect(-12, -14, 96, 28, 14);
    arm.add(shape);
    return arm;
  }

  private createLantern(x: number, y: number): Phaser.GameObjects.Container {
    const lantern = this.add.container(x, y);

    const glow = this.add.graphics();
    glow.fillStyle(0xffc83d, 0.18);
    glow.fillCircle(24, 32, 50);
    glow.fillStyle(0xffc83d, 0.18);
    glow.fillCircle(24, 32, 34);

    const frame = this.add.graphics();
    frame.lineStyle(3, 0x8a6320, 1);
    frame.beginPath();
    frame.arc(24, 4, 11, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    frame.strokePath();

    frame.fillStyle(0xffc83d, 1);
    frame.fillRoundedRect(4, 4, 40, 56, 12);
    frame.lineStyle(3, 0x8a6320, 1);
    frame.strokeRoundedRect(4, 4, 40, 56, 12);

    const bars = this.add.graphics();
    bars.lineStyle(3, 0xfff6d9, 0.9);
    bars.beginPath();
    bars.moveTo(15, 20);
    bars.lineTo(15, 46);
    bars.moveTo(24, 15);
    bars.lineTo(24, 50);
    bars.moveTo(33, 20);
    bars.lineTo(33, 46);
    bars.strokePath();

    lantern.add([glow, frame, bars]);
    return lantern;
  }

  private startIdleAnimations(): void {
    this.tweens.add({
      targets: this.lantern,
      rotation: 0.08,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: [this.leftEar, this.rightEar],
      rotation: '+=0.1',
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });

    this.tweens.add({
      targets: this.leftArm,
      rotation: -0.38,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.scheduleBlink();
  }

  private scheduleBlink(): void {
    const delay = Phaser.Math.Between(2200, 4400);
    this.blinkTimer = this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: [this.leftEye, this.rightEye],
        scaleY: 0.12,
        duration: 90,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
      this.scheduleBlink();
    });
  }

  private celebrate(): void {
    this.options.onInteract?.();

    if (!this.options.reducedMotion) {
      this.tweens.add({
        targets: this.body,
        y: 206,
        duration: 220,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      this.tweens.add({
        targets: [this.leftEar, this.rightEar],
        rotation: '-=0.22',
        duration: 260,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    const colors = [0xffc83d, 0x58cc02, 0x4ca8e8, 0xff9f45];
    for (let i = 0; i < 8; i += 1) {
      const spark = this.add.circle(200, 200, 5, colors[i % colors.length], 1);
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 130 + Math.random() * 50;
      this.tweens.add({
        targets: spark,
        x: 200 + Math.cos(angle) * distance,
        y: 200 + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  shutdown(): void {
    this.blinkTimer?.remove();
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
