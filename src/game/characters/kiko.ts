import Phaser from 'phaser';

/**
 * Kiko is drawn procedurally so every part can be animated without a sprite
 * sheet. The drawing code lives here only; the mascot landing stage and the
 * adventure map both build on this factory.
 */
export type KikoAnimation =
  | 'idle'
  | 'blink'
  | 'happy'
  | 'sad'
  | 'excited'
  | 'surprised'
  | 'thinking'
  | 'celebrating'
  | 'encouraging'
  | 'disappointed'
  | 'speaking'
  | 'jumping'
  | 'walking';

const COLORS = {
  body: 0x58cc02,
  dark: 0x2f8f24,
  belly: 0xfff8e6,
  ink: 0x303a32,
  blush: 0xf39a9a,
  lantern: 0xffc83d,
  frame: 0x8a6320,
} as const;

const EAR_LEFT_ROTATION = -0.42;
const EAR_RIGHT_ROTATION = 0.42;
const ARM_ROTATION = -0.55;

type FaceKind = 'neutral' | 'smile' | 'bigSmile' | 'frown' | 'open' | 'round' | 'flat';

export interface KikoOptions {
  reducedMotion?: boolean;
  scale?: number;
}

export interface KikoCharacter {
  /** Move and flip this container; the character animates its own rig inside. */
  root: Phaser.GameObjects.Container;
  scaleValue: number;
  setAnimation: (state: KikoAnimation) => void;
  setFacing: (direction: 1 | -1) => void;
  getAnimation: () => KikoAnimation;
  destroy: () => void;
}

export function createKiko(scene: Phaser.Scene, options: KikoOptions = {}): KikoCharacter {
  const scaleValue = options.scale ?? 0.3;
  const reducedMotion = options.reducedMotion ?? false;

  const root = scene.add.container(0, 0);
  root.setScale(scaleValue);
  root.setDepth(20);

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.dark, 0.16);
  shadow.fillEllipse(0, 118, 210, 30);
  root.add(shadow);

  const rig = scene.add.container(0, 0);
  root.add(rig);

  const leftEar = createEar(scene, -54, -104, EAR_LEFT_ROTATION);
  const rightEar = createEar(scene, 54, -104, EAR_RIGHT_ROTATION);
  rig.add([leftEar, rightEar]);

  const body = scene.add.graphics();
  body.fillStyle(COLORS.body, 1);
  body.fillEllipse(0, 0, 244, 230);
  rig.add(body);

  const belly = scene.add.graphics();
  belly.fillStyle(COLORS.belly, 1);
  belly.fillEllipse(0, 30, 136, 120);
  rig.add(belly);

  const shine = scene.add.graphics();
  shine.fillStyle(0xffffff, 0.16);
  shine.fillEllipse(-58, -66, 72, 46);
  rig.add(shine);

  const arm = createArm(scene, -124, 20);
  rig.add(arm);

  const leftEye = createEye(scene, -44, -22);
  const rightEye = createEye(scene, 44, -22);
  rig.add([leftEye.container, rightEye.container]);

  const brows = scene.add.graphics();
  rig.add(brows);

  const blush = scene.add.graphics();
  blush.fillStyle(COLORS.blush, 0.55);
  blush.fillEllipse(-74, -2, 24, 13);
  blush.fillEllipse(74, -2, 24, 13);
  rig.add(blush);

  const mouth = scene.add.graphics();
  rig.add(mouth);

  const leftFoot = createFoot(scene, -58, 110);
  const rightFoot = createFoot(scene, 58, 110);
  rig.add([leftFoot, rightFoot]);

  const lantern = createLantern(scene, 140, 40);
  rig.add(lantern);

  let current: KikoAnimation = 'idle';
  let destroyed = false;
  let blinkTimer: Phaser.Time.TimerEvent | null = null;
  let mouthTimer: Phaser.Time.TimerEvent | null = null;
  let sparkTimer: Phaser.Time.TimerEvent | null = null;
  const sparkles: Phaser.GameObjects.GameObject[] = [];

  const animatedTargets = [
    rig,
    leftEar,
    rightEar,
    arm,
    lantern,
    leftFoot,
    rightFoot,
    leftEye.container,
    rightEye.container,
    leftEye.pupil,
    rightEye.pupil,
  ];

  function stopAnimations(): void {
    scene.tweens.killTweensOf(animatedTargets);
    blinkTimer?.remove();
    blinkTimer = null;
    mouthTimer?.remove();
    mouthTimer = null;
    sparkTimer?.remove();
    sparkTimer = null;
    for (const spark of sparkles) spark.destroy();
    sparkles.length = 0;

    rig.setPosition(0, 0).setRotation(0).setScale(1);
    leftFoot.setY(110);
    rightFoot.setY(110);
    leftEar.setRotation(EAR_LEFT_ROTATION);
    rightEar.setRotation(EAR_RIGHT_ROTATION);
    arm.setRotation(ARM_ROTATION);
    lantern.setRotation(0);
    leftEye.container.setScale(1);
    rightEye.container.setScale(1);
    leftEye.pupil.setPosition(3, 3).setScale(1);
    rightEye.pupil.setPosition(3, 3).setScale(1);
    brows.clear();
    drawMouth('smile');
  }

  function drawMouth(kind: FaceKind): void {
    mouth.clear();

    switch (kind) {
      case 'bigSmile': {
        mouth.fillStyle(COLORS.ink, 1);
        mouth.beginPath();
        mouth.arc(0, 2, 26, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
        mouth.closePath();
        mouth.fillPath();
        break;
      }
      case 'smile':
        mouth.lineStyle(6, COLORS.ink, 1);
        mouth.beginPath();
        mouth.arc(0, 4, 18, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
        mouth.strokePath();
        break;
      case 'frown':
        mouth.lineStyle(6, COLORS.ink, 1);
        mouth.beginPath();
        mouth.arc(0, 24, 18, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
        mouth.strokePath();
        break;
      case 'open':
        mouth.fillStyle(COLORS.ink, 1);
        mouth.fillEllipse(0, 12, 30, 26);
        break;
      case 'round':
        mouth.lineStyle(6, COLORS.ink, 1);
        mouth.strokeCircle(0, 12, 12);
        break;
      case 'flat':
        mouth.lineStyle(6, COLORS.ink, 1);
        mouth.beginPath();
        mouth.moveTo(-16, 12);
        mouth.lineTo(16, 12);
        mouth.strokePath();
        break;
      case 'neutral':
      default:
        mouth.lineStyle(6, COLORS.ink, 1);
        mouth.beginPath();
        mouth.moveTo(-14, 10);
        mouth.lineTo(14, 10);
        mouth.strokePath();
        break;
    }
  }

  function drawBrows(kind: 'raised' | 'sad' | 'thinking' | 'none'): void {
    brows.clear();
    if (kind === 'none') return;

    brows.lineStyle(6, COLORS.dark, 0.85);
    const y = -64;
    const leftY = kind === 'sad' ? y + 8 : kind === 'thinking' ? y + 4 : y;
    const rightY = kind === 'sad' ? y - 2 : y - 6;

    brows.beginPath();
    brows.moveTo(-62, leftY + 8);
    brows.lineTo(-26, leftY);
    brows.moveTo(26, rightY);
    brows.lineTo(62, rightY + 8);
    brows.strokePath();
  }

  function resetFace(): void {
    brows.clear();
    leftEye.container.setScale(1);
    rightEye.container.setScale(1);
    leftEye.pupil.setPosition(3, 3);
    rightEye.pupil.setPosition(3, 3);
  }

  function scheduleBlink(): void {
    if (reducedMotion || destroyed) return;
    blinkTimer?.remove();
    blinkTimer = scene.time.delayedCall(Phaser.Math.Between(2400, 4800), () => {
      if (destroyed) return;
      scene.tweens.add({
        targets: [leftEye.container, rightEye.container],
        scaleY: 0.12,
        duration: 90,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
      scheduleBlink();
    });
  }

  function pulseEyes(): void {
    if (reducedMotion) return;
    scene.tweens.add({
      targets: [leftEye.container, rightEye.container],
      scaleY: 0.12,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  function spawnSparkles(count: number, color = COLORS.lantern): void {
    if (reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const spark = scene.add.circle(0, -40, 5, color, 1);
      root.add(spark);
      sparkles.push(spark);
      const angle = (Math.PI * 2 * i) / count;
      const distance = 150 + Math.random() * 80;
      scene.tweens.add({
        targets: spark,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40,
        alpha: 0,
        scale: 0.2,
        duration: 720,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  function idleLoop(): void {
    resetFace();
    drawMouth('smile');
    if (reducedMotion) return;

    scene.tweens.add({
      targets: rig,
      y: -6,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: lantern,
      rotation: 0.09,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: [leftEar, rightEar],
      rotation: '+=0.09',
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });
    scene.tweens.add({
      targets: arm,
      rotation: -0.38,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scheduleBlink();
  }

  function walkingLoop(): void {
    resetFace();
    drawMouth('smile');
    if (reducedMotion) return;

    scene.tweens.add({
      targets: rig,
      y: -4,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: rig,
      rotation: 0.035,
      duration: 440,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: leftFoot,
      y: 100,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: rightFoot,
      y: 100,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 220,
    });
    scene.tweens.add({
      targets: lantern,
      rotation: 0.16,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scheduleBlink();
  }

  function setAnimation(state: KikoAnimation): void {
    if (destroyed || current === state) return;
    current = state;
    stopAnimations();

    switch (state) {
      case 'idle':
        idleLoop();
        break;

      case 'blink':
        drawMouth('smile');
        pulseEyes();
        scheduleBlink();
        break;

      case 'happy':
        resetFace();
        drawMouth('bigSmile');
        scene.tweens.add({
          targets: rig,
          y: -22,
          duration: 200,
          yoyo: true,
          ease: 'Quad.easeOut',
          onComplete: () => state === current && setAnimation('idle'),
        });
        scheduleBlink();
        break;

      case 'sad':
        brows.clear();
        drawBrows('sad');
        leftEye.container.setScale(1, 0.6);
        rightEye.container.setScale(1, 0.6);
        leftEye.pupil.setPosition(1, 8);
        rightEye.pupil.setPosition(5, 8);
        drawMouth('frown');
        leftEar.setRotation(EAR_LEFT_ROTATION - 0.22);
        rightEar.setRotation(EAR_RIGHT_ROTATION + 0.22);
        rig.setY(8);
        break;

      case 'excited':
        resetFace();
        drawMouth('bigSmile');
        scheduleBlink();
        scene.tweens.add({
          targets: rig,
          y: -18,
          duration: 150,
          yoyo: true,
          repeat: 3,
          ease: 'Quad.easeOut',
        });
        scene.tweens.add({
          targets: arm,
          rotation: -1.9,
          duration: 180,
          yoyo: true,
          repeat: 3,
          ease: 'Quad.easeOut',
        });
        break;

      case 'surprised':
        brows.clear();
        drawBrows('raised');
        leftEye.container.setScale(1.16);
        rightEye.container.setScale(1.16);
        leftEye.pupil.setScale(0.7);
        rightEye.pupil.setScale(0.7);
        drawMouth('round');
        rig.setScale(1.06);
        scene.tweens.add({
          targets: rig,
          y: -14,
          duration: 140,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        break;

      case 'thinking':
        brows.clear();
        drawBrows('thinking');
        leftEye.pupil.setPosition(8, -6);
        rightEye.pupil.setPosition(10, -6);
        drawMouth('flat');
        rig.setRotation(-0.06);
        arm.setRotation(-1.25);
        if (!reducedMotion) {
          scene.tweens.add({
            targets: rig,
            y: -3,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          scheduleBlink();
        }
        break;

      case 'celebrating':
        resetFace();
        drawMouth('bigSmile');
        scheduleBlink();
        spawnSparkles(10);
        if (!reducedMotion) {
          scene.tweens.add({
            targets: rig,
            y: -34,
            duration: 260,
            yoyo: true,
            repeat: 3,
            ease: 'Quad.easeOut',
          });
          scene.tweens.add({
            targets: rig,
            rotation: { from: -0.08, to: 0.08 },
            duration: 260,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
          });
          scene.tweens.add({
            targets: [leftEar, rightEar],
            rotation: '+=0.16',
            duration: 260,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
          });
        }
        break;

      case 'encouraging':
        resetFace();
        drawMouth('bigSmile');
        scheduleBlink();
        if (!reducedMotion) {
          scene.tweens.add({
            targets: arm,
            rotation: -2.1,
            duration: 260,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
          });
          scene.tweens.add({
            targets: rig,
            y: -10,
            duration: 520,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
          });
        }
        break;

      case 'disappointed':
        brows.clear();
        drawBrows('sad');
        leftEye.container.setScale(1, 0.7);
        rightEye.container.setScale(1, 0.7);
        leftEye.pupil.setPosition(2, 6);
        rightEye.pupil.setPosition(4, 6);
        drawMouth('frown');
        rig.setY(6);
        if (!reducedMotion) {
          scene.tweens.add({
            targets: rig,
            rotation: { from: -0.05, to: 0.05 },
            duration: 220,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
          });
        }
        break;

      case 'speaking':
        resetFace();
        drawMouth('smile');
        scheduleBlink();
        if (!reducedMotion) {
          let open = false;
          mouthTimer = scene.time.addEvent({
            delay: 180,
            loop: true,
            callback: () => {
              open = !open;
              drawMouth(open ? 'open' : 'smile');
            },
          });
          scene.tweens.add({
            targets: rig,
            y: -5,
            duration: 360,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else {
          drawMouth('open');
        }
        break;

      case 'jumping':
        resetFace();
        drawMouth('bigSmile');
        scheduleBlink();
        if (!reducedMotion) {
          scene.tweens.add({
            targets: rig,
            y: -52,
            scaleY: 0.94,
            duration: 260,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => state === current && setAnimation('idle'),
          });
        }
        break;

      case 'walking':
        walkingLoop();
        break;
    }
  }

  function setFacing(direction: 1 | -1): void {
    root.setScale(direction * scaleValue, scaleValue);
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    stopAnimations();
    root.destroy(true);
  }

  // Start in the idle pose; idleLoop registers its own loops.
  idleLoop();

  return {
    root,
    scaleValue,
    setAnimation,
    setFacing,
    getAnimation: () => current,
    destroy,
  };
}

function createEar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  rotation: number,
): Phaser.GameObjects.Container {
  const ear = scene.add.container(x, y);
  ear.setRotation(rotation);
  const shape = scene.add.graphics();
  shape.fillStyle(COLORS.dark, 1);
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

function createArm(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const arm = scene.add.container(x, y);
  arm.setRotation(ARM_ROTATION);
  const shape = scene.add.graphics();
  shape.fillStyle(COLORS.dark, 1);
  shape.fillRoundedRect(-12, -14, 96, 28, 14);
  arm.add(shape);
  return arm;
}

function createFoot(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const foot = scene.add.container(x, y);
  const shape = scene.add.graphics();
  shape.fillStyle(COLORS.dark, 1);
  shape.fillEllipse(0, 0, 62, 26);
  foot.add(shape);
  return foot;
}

function createEye(
  scene: Phaser.Scene,
  x: number,
  y: number,
): { container: Phaser.GameObjects.Container; pupil: Phaser.GameObjects.Container } {
  const container = scene.add.container(x, y);
  const white = scene.add.graphics();
  white.fillStyle(0xffffff, 1);
  white.fillEllipse(0, 0, 46, 54);

  const pupil = scene.add.container(3, 3);
  const pupilShape = scene.add.graphics();
  pupilShape.fillStyle(COLORS.ink, 1);
  pupilShape.fillCircle(0, 0, 11);
  pupilShape.fillStyle(0xffffff, 1);
  pupilShape.fillCircle(3.5, -4, 3.6);
  pupil.add(pupilShape);

  container.add([white, pupil]);
  return { container, pupil };
}

function createLantern(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const lantern = scene.add.container(x, y);

  const glow = scene.add.graphics();
  glow.fillStyle(COLORS.lantern, 0.18);
  glow.fillCircle(24, 32, 50);
  glow.fillCircle(24, 32, 34);

  const frame = scene.add.graphics();
  frame.lineStyle(3, COLORS.frame, 1);
  frame.beginPath();
  frame.arc(24, 4, 11, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
  frame.strokePath();
  frame.fillStyle(COLORS.lantern, 1);
  frame.fillRoundedRect(4, 4, 40, 56, 12);
  frame.lineStyle(3, COLORS.frame, 1);
  frame.strokeRoundedRect(4, 4, 40, 56, 12);

  const bars = scene.add.graphics();
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
