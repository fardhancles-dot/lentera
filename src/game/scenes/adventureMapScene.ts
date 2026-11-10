import Phaser from 'phaser';
import { computeMapPositions, type MapPoint } from '../adventure/layout';
import { preloadSceneAssets } from '../assets/load';
import {
  areaPaletteFor,
  MAP_VIEWPORTS,
  type AdventureMapLevel,
  type AdventureMapNode,
  type AdventureMapOptions,
  type AreaPalette,
  type MapViewport,
} from '../adventure/types';
import { audioEngine } from '../audio/audioEngine';
import { createKiko, type KikoCharacter } from '../characters/kiko';

const NODE_COLOR: Record<AdventureMapNode['status'], number> = {
  completed: 0x58cc02,
  in_progress: 0xff9f43,
  available: 0xffc83d,
  locked: 0xd8e2d5,
  preview: 0x4ca8e8,
};

const LABEL_COLOR: Record<AdventureMapNode['status'], string> = {
  completed: '#2F8F24',
  in_progress: '#A85B00',
  available: '#303A32',
  locked: '#89928A',
  preview: '#2C7CB8',
};

const TYPE_LABEL: Record<string, string> = {
  lesson: 'Lesson',
  practice: 'Latihan',
  review: 'Review',
  challenge: 'Tantangan',
  legendary: 'Legendary',
  checkpoint: 'Checkpoint',
  reward: 'Hadiah',
};

const WALK_DURATION = 320;
const CHARACTER_OFFSET = { x: 58, y: -10 };

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

/** Deterministic decorations: the same level always looks the same. */
function createRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

class AdventureMapScene extends Phaser.Scene {
  private readonly options: AdventureMapOptions;
  private kiko!: KikoCharacter;
  private playerMarker!: Phaser.GameObjects.Container;
  private levelLayer!: Phaser.GameObjects.Container;
  private sceneryLayer!: Phaser.GameObjects.Container;
  private palette: AreaPalette = areaPaletteFor(0);
  private ready = false;
  private pendingLevelIndex: number | null = null;
  private levelIndex = 0;
  private positions: MapPoint[] = [];
  private nodeViews: Phaser.GameObjects.Container[] = [];
  private levelTweens: Phaser.Tweens.Tween[] = [];
  private currentIndex = 0;
  private busy = false;
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;

  constructor(options: AdventureMapOptions) {
    super({ key: 'adventure-map' });
    this.options = options;
  }

  preload(): void {
    preloadSceneAssets(this, 'adventure-map');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#F7FAF5');

    this.levelIndex = this.clampLevelIndex(this.options.initialLevelIndex ?? 0);

    this.sceneryLayer = this.add.container(0, 0).setDepth(0);
    this.levelLayer = this.add.container(0, 0).setDepth(5);

    this.kiko = createKiko(this, {
      reducedMotion: this.options.reducedMotion,
      scale: 0.32,
    });
    this.playerMarker = this.createPlayerMarker();

    this.buildLevel(this.levelIndex, true);
    this.ready = true;

    const pending = this.pendingLevelIndex;
    this.pendingLevelIndex = null;
    if (pending !== null && pending !== this.levelIndex) {
      this.switchLevel(pending);
    } else {
      this.intro();
    }

    this.options.onReady?.();
  }

  /** Switches the drawn level; safe to call before the scene has booted. */
  selectLevel(index: number): void {
    if (!this.ready) {
      this.pendingLevelIndex = this.clampLevelIndex(index);
      return;
    }
    this.switchLevel(index);
  }

  getLevelIndex(): number {
    return this.levelIndex;
  }

  private clampLevelIndex(index: number): number {
    return Phaser.Math.Clamp(index, 0, Math.max(this.options.levels.length - 1, 0));
  }

  private get activeLevel(): AdventureMapLevel | undefined {
    return this.options.levels[this.levelIndex];
  }

  update(): void {
    if (!this.kiko || !this.playerMarker) return;
    this.playerMarker.setPosition(this.kiko.root.x, this.kiko.root.y - 52);
  }

  private createPlayerMarker(): Phaser.GameObjects.Container {
    const width = 52;
    const height = 20;
    const background = this.add.graphics();
    background.fillStyle(0xffffff, 0.96);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    background.lineStyle(2, 0x58cc02, 0.9);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    const label = this.add
      .text(0, 0, 'Kamu', {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#2F8F24',
      })
      .setOrigin(0.5);

    return this.add.container(0, 0, [background, label]).setDepth(25);
  }

  private get viewport(): MapViewport {
    return this.options.viewport ?? MAP_VIEWPORTS.wide;
  }

  private buildLevel(index: number, initial: boolean): void {
    this.clearLevel();
    const level = this.options.levels[index];
    if (!level) return;

    this.levelIndex = index;
    this.busy = false;
    this.currentIndex = 0;

    // The compact logical canvas is narrower than the wide one; using its own
    // columns keeps every node and label inside the visible frame on phones.
    this.positions = computeMapPositions(level.nodes.length, this.viewport);
    this.paintScenery(level, index);
    this.drawDecor(level);
    this.drawPath();

    level.nodes.forEach((node, nodeIndex) => {
      this.nodeViews.push(this.createNode(node, nodeIndex));
    });

    this.currentIndex = this.resolveStartIndex();
    const start = this.kikoPoint(this.currentIndex);
    this.kiko.root.setPosition(start.x, start.y);

    if (!initial) this.options.onLevelChange?.(level, index);
  }

  private clearLevel(): void {
    this.hideBubble();

    for (const tween of this.levelTweens) tween.remove();
    this.levelTweens = [];

    this.nodeViews = [];
    this.positions = [];
    this.levelLayer.removeAll(true);
  }

  private addLevelTween(config: Phaser.Types.Tweens.TweenBuilderConfig): void {
    this.levelTweens.push(this.tweens.add(config));
  }

  private resolveStartIndex(): number {
    const nodes = this.activeLevel?.nodes ?? [];

    const firstAvailable = nodes.findIndex((node) => node.status === 'available');
    if (firstAvailable >= 0) return firstAvailable;

    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      if (nodes[index]!.status === 'completed') return index;
    }

    return 0;
  }

  private kikoPoint(index: number): MapPoint {
    const vp = this.viewport;
    const point = this.positions[index] ?? { x: vp.width / 2, y: vp.bottom };
    return { x: point.x + CHARACTER_OFFSET.x, y: point.y + CHARACTER_OFFSET.y };
  }

  private switchLevel(index: number): void {
    const target = this.clampLevelIndex(index);
    if (target === this.levelIndex || this.busy) return;
    const level = this.options.levels[target];
    if (!level) return;

    audioEngine.play('click');
    this.buildLevel(target, false);
    this.kiko.setAnimation('encouraging');

    if (!this.options.reducedMotion) {
      this.levelLayer.setAlpha(0);
      this.sceneryLayer.setAlpha(0.2);
      this.tweens.add({ targets: this.levelLayer, alpha: 1, duration: 220, ease: 'Sine.easeOut' });
      this.tweens.add({
        targets: this.sceneryLayer,
        alpha: 1,
        duration: 320,
        ease: 'Sine.easeOut',
      });
    }
    this.showBubble(level.title, 1800);
    this.time.delayedCall(1500, () => {
      if (this.kiko.getAnimation() === 'encouraging') this.kiko.setAnimation('idle');
    });
  }

  // --- Scenery -----------------------------------------------------------

  /** Repaints the sky, hills and ground for one chapter of the adventure. */
  private paintScenery(level: AdventureMapLevel, index: number): void {
    const palette = areaPaletteFor(index);
    this.palette = palette;
    this.sceneryLayer.removeAll(true);
    this.drawBackground(level, index, palette);
  }

  private drawBackground(level: AdventureMapLevel, index: number, palette: AreaPalette): void {
    const vp = this.viewport;
    const random = createRandom(hashString(level.id));
    const width = vp.width;
    const height = vp.height;
    const horizon = height * 0.65;

    const sky = this.add.graphics();
    sky.fillStyle(palette.sky, 1);
    sky.fillRect(0, 0, width, height);
    sky.fillStyle(palette.skyTop, 1);
    sky.fillRect(0, 0, width, horizon * 0.5);

    sky.fillStyle(palette.sun, 0.85);
    sky.fillCircle(width * 0.87, height * 0.16, 44);
    sky.fillStyle(palette.sunGlow, 0.5);
    sky.fillCircle(width * 0.87, height * 0.16, 60);

    for (let i = 0; i < 3; i += 1) {
      const cx = width * (0.12 + i * 0.29) + random() * 40;
      const cy = height * 0.12 + random() * height * 0.06;
      sky.fillStyle(0xffffff, 0.95);
      sky.fillEllipse(cx, cy, 120, 42);
      sky.fillEllipse(cx + 34, cy - 16, 78, 42);
      sky.fillEllipse(cx - 30, cy + 4, 66, 32);
    }

    const hills = this.add.graphics();
    hills.fillStyle(palette.hill, 1);
    hills.fillEllipse(width * 0.2, horizon * 0.78, width * 0.62, height * 0.5);
    hills.fillEllipse(width * 0.72, horizon * 0.82, width * 0.68, height * 0.52);
    hills.fillStyle(palette.hillDark, 1);
    hills.fillEllipse(width * 0.5, horizon, width * 1.05, height * 0.56);

    const ground = this.add.graphics();
    ground.fillStyle(palette.ground, 1);
    ground.fillRect(0, horizon, width, height - horizon);
    ground.fillStyle(palette.groundShade, 1);
    ground.fillEllipse(width / 2, height + 30, width * 1.15, 140);

    const subjectLabel = this.add
      .text(24, 20, this.options.subjectLabel, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: `${vp.titleSize}px`,
        color: '#2F8F24',
        fontStyle: 'bold',
      })
      .setAlpha(0.9);

    const areaText = `Area ${index + 1} · ${palette.name}`;
    const areaLabel = this.add
      .text(vp.width - 24, 22, areaText, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: `${vp.key === 'compact' ? 13 : 12}px`,
        color: '#5A665B',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.sceneryLayer.add([sky, hills, ground, subjectLabel, areaLabel]);
    this.sceneryLayer.setAlpha(1);
  }

  private drawDecor(level: AdventureMapLevel): void {
    const vp = this.viewport;
    const random = createRandom(hashString(level.id));
    const groundStart = vp.height * 0.64;

    for (let i = 0; i < 5; i += 1) {
      const x = 24 + random() * (vp.width - 48);
      const y = groundStart + random() * (vp.height * 0.05);
      this.levelLayer.add(this.drawTree(x, y, 0.7 + random() * 0.5));
    }

    const decor = this.add.graphics();
    for (let i = 0; i < 14; i += 1) {
      const x = 20 + random() * (vp.width - 40);
      const y = groundStart + vp.height * 0.05 + random() * (vp.height * 0.26);
      decor.fillStyle(0x8fd46a, 0.9);
      decor.fillCircle(x, y, 3 + random() * 2);
      if (random() > 0.55) {
        decor.fillStyle(0xffc83d, 0.9);
        decor.fillCircle(x + 8, y + 4, 2.6);
      }
    }
    this.levelLayer.add(decor);
  }

  private drawTree(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const tree = this.add.container(x, y).setScale(scale);
    const trunk = this.add.graphics();
    trunk.fillStyle(0xb2825a, 1);
    trunk.fillRoundedRect(-7, -10, 14, 44, 6);

    const leaves = this.add.graphics();
    leaves.fillStyle(0x8fd46a, 1);
    leaves.fillCircle(0, -34, 34);
    leaves.fillCircle(-22, -18, 24);
    leaves.fillCircle(22, -18, 24);
    leaves.fillStyle(0x74c24f, 1);
    leaves.fillCircle(0, -46, 20);

    tree.add([trunk, leaves]);
    return tree;
  }

  private drawPath(): void {
    if (this.positions.length < 2) return;

    const width = Math.max(26, Math.round(this.viewport.nodeRadius * 0.85));
    const path = this.add.graphics();
    path.lineStyle(width, this.palette.path, 1);
    path.beginPath();
    path.moveTo(this.positions[0]!.x, this.positions[0]!.y);
    for (const point of this.positions.slice(1)) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();

    for (const point of this.positions) {
      path.fillStyle(this.palette.path, 1);
      path.fillCircle(point.x, point.y, width / 2);
    }
    this.levelLayer.add(path);

    const dots = this.add.graphics();
    dots.fillStyle(this.palette.pathDot, 0.9);
    for (let index = 0; index < this.positions.length - 1; index += 1) {
      const from = this.positions[index]!;
      const to = this.positions[index + 1]!;
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.max(1, Math.floor(distance / 26));
      for (let step = 1; step < steps; step += 1) {
        dots.fillCircle(
          Phaser.Math.Linear(from.x, to.x, step / steps),
          Phaser.Math.Linear(from.y, to.y, step / steps),
          3.4,
        );
      }
    }
    this.levelLayer.add(dots);
  }

  private createNode(node: AdventureMapNode, index: number): Phaser.GameObjects.Container {
    const vp = this.viewport;
    const radius = vp.nodeRadius;
    const point = this.positions[index] ?? { x: vp.width / 2, y: vp.height * 0.6 };
    const container = this.add.container(point.x, point.y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x2f8f24, 0.14);
    shadow.fillEllipse(0, radius * 0.85, radius * 2.3, 22);
    container.add(shadow);

    const plate = this.add.graphics();
    plate.fillStyle(0xffffff, 1);
    plate.fillCircle(0, 0, radius);
    plate.fillStyle(NODE_COLOR[node.status], 1);
    plate.fillCircle(0, 0, radius - 7);
    container.add(plate);

    container.add(this.createNodeIcon(node));

    if (node.status === 'available' && !this.options.reducedMotion) {
      const pulse = this.add.graphics();
      pulse.lineStyle(4, 0xffc83d, 0.8);
      pulse.strokeCircle(0, 0, radius + 4);
      container.add(pulse);
      this.addLevelTween({
        targets: pulse,
        scale: 1.3,
        alpha: 0,
        duration: 1500,
        repeat: -1,
        ease: 'Sine.easeOut',
      });
    }

    if (node.nodeType === 'reward') {
      const badge = this.add.graphics();
      badge.fillStyle(0xffc83d, 1);
      badge.fillCircle(28, -28, 15);
      badge.lineStyle(3, 0xffffff, 1);
      badge.strokeCircle(28, -28, 15);
      badge.fillStyle(0x8a6320, 1);
      badge.beginPath();
      badge.moveTo(28, -35);
      badge.lineTo(30.5, -30.5);
      badge.lineTo(35, -28);
      badge.lineTo(30.5, -25.5);
      badge.lineTo(28, -21);
      badge.lineTo(25.5, -25.5);
      badge.lineTo(21, -28);
      badge.lineTo(25.5, -30.5);
      badge.closePath();
      badge.fillPath();
      container.add(badge);
    }

    const label = this.add
      .text(0, radius + 12, node.title, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: `${vp.labelSize}px`,
        color: LABEL_COLOR[node.status],
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.round((vp.width / vp.columns) * 0.72) },
      })
      .setOrigin(0.5, 0);
    container.add(label);

    const zoneSize = radius * 2 + 6;
    const zone = this.add
      .zone(0, 0, zoneSize, zoneSize)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: node.status !== 'locked' });
    container.add(zone);

    zone.on('pointerover', () => {
      this.addLevelTween({ targets: container, scale: 1.06, duration: 140, ease: 'Sine.easeOut' });
      this.showBubble(
        `${TYPE_LABEL[node.nodeType] ?? 'Node'} · ${node.title}\n${node.meta}`,
        6000,
        false,
      );
    });

    zone.on('pointerout', () => {
      this.addLevelTween({ targets: container, scale: 1, duration: 140, ease: 'Sine.easeOut' });
      this.hideBubble();
    });

    zone.on('pointerdown', () => this.handleNodeSelection(node, index));

    this.levelLayer.add(container);
    return container;
  }

  private createNodeIcon(node: AdventureMapNode): Phaser.GameObjects.GameObject {
    const icon = this.add.graphics();

    if (node.status === 'completed') {
      icon.lineStyle(7, 0xffffff, 1);
      icon.beginPath();
      icon.moveTo(-13, 2);
      icon.lineTo(-4, 12);
      icon.lineTo(15, -11);
      icon.strokePath();
      return icon;
    }

    if (node.status === 'locked') {
      icon.fillStyle(0x9aa79a, 1);
      icon.fillRoundedRect(-12, -2, 24, 20, 5);
      icon.lineStyle(4, 0x9aa79a, 1);
      icon.beginPath();
      icon.arc(0, -2, 9, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
      icon.strokePath();
      return icon;
    }

    if (node.status === 'in_progress') {
      icon.lineStyle(5, 0xffffff, 1);
      icon.strokeCircle(0, 0, 12);
      icon.beginPath();
      icon.moveTo(0, 0);
      icon.lineTo(0, -7);
      icon.moveTo(0, 0);
      icon.lineTo(6, 2);
      icon.strokePath();
      return icon;
    }

    if (node.nodeType === 'reward') {
      icon.fillStyle(0xffffff, 1);
      icon.fillRoundedRect(-13, -6, 26, 18, 4);
      icon.fillRect(-15, -12, 30, 7);
      icon.fillStyle(0xffc83d, 1);
      icon.fillRect(-3, -12, 6, 24);
      return icon;
    }

    if (node.status === 'preview') {
      icon.fillStyle(0xffffff, 1);
      icon.fillEllipse(0, 0, 30, 18);
      icon.fillStyle(0x2c7cb8, 1);
      icon.fillCircle(0, 0, 6);
      return icon;
    }

    icon.fillStyle(0xffffff, 1);
    icon.fillTriangle(-8, -11, -8, 13, 14, 1);
    return icon;
  }

  private intro(): void {
    const level = this.activeLevel;
    const next = level?.nodes[this.currentIndex];
    if (!level || !next) return;

    this.showBubble(
      next.status === 'in_progress'
        ? `Lanjutkan: ${next.title}`
        : next.status === 'available'
          ? `Ayo lanjut: ${next.title}`
          : `Ketuk node untuk mulai belajar, ${next.title}`,
      2800,
    );
    this.kiko.setAnimation('encouraging');
    this.time.delayedCall(1400, () => {
      if (this.kiko.getAnimation() === 'encouraging') this.kiko.setAnimation('idle');
    });
  }

  private handleNodeSelection(node: AdventureMapNode, index: number): void {
    if (this.busy) return;

    if (node.status === 'locked') {
      audioEngine.play('locked');
      this.kiko.setAnimation('disappointed');
      this.showBubble('Masih terkunci. Selesaikan lesson di node sebelumnya dulu ya.', 3000);
      this.options.onLocked(node);
      this.time.delayedCall(1500, () => {
        if (this.kiko.getAnimation() === 'disappointed') this.kiko.setAnimation('idle');
      });
      return;
    }

    if (!node.href) {
      this.kiko.setAnimation('thinking');
      this.showBubble('Node ini belum punya lesson yang bisa dimainkan.', 3000);
      this.time.delayedCall(1800, () => {
        if (this.kiko.getAnimation() === 'thinking') this.kiko.setAnimation('idle');
      });
      return;
    }

    this.busy = true;
    audioEngine.play('step');
    this.kiko.setAnimation('walking');

    this.walkTo(index, () => {
      this.kiko.setAnimation(node.status === 'completed' ? 'celebrating' : 'excited');
      this.showBubble(
        node.status === 'completed' ? `${node.title} sudah selesai. Mau ulangi?` : `Membuka ${node.title}…`,
        2000,
      );
      this.time.delayedCall(this.options.reducedMotion ? 150 : 650, () => {
        this.options.onSelect(node);
      });
      // If navigation is a no-op (for example the same URL), unlock input again.
      this.time.delayedCall(2500, () => {
        this.busy = false;
      });
    });
  }

  private walkTo(targetIndex: number, done: () => void): void {
    const clamped = Phaser.Math.Clamp(targetIndex, 0, this.positions.length - 1);
    if (this.options.reducedMotion || clamped === this.currentIndex) {
      const target = this.kikoPoint(clamped);
      this.kiko.root.setPosition(target.x, target.y);
      this.currentIndex = clamped;
      done();
      return;
    }

    const step = clamped > this.currentIndex ? 1 : -1;
    const waypoints: MapPoint[] = [];
    for (let index = this.currentIndex + step; index !== clamped; index += step) {
      waypoints.push(this.kikoPoint(index));
    }
    waypoints.push(this.kikoPoint(clamped));

    let cursor = 0;
    const walkNext = () => {
      const waypoint = waypoints[cursor];
      if (!waypoint) {
        this.currentIndex = clamped;
        done();
        return;
      }

      this.kiko.setFacing(waypoint.x >= this.kiko.root.x ? 1 : -1);
      cursor += 1;
      this.tweens.add({
        targets: this.kiko.root,
        x: waypoint.x,
        y: waypoint.y,
        duration: WALK_DURATION,
        ease: 'Sine.easeInOut',
        onComplete: walkNext,
      });
    };

    walkNext();
  }

  private showBubble(text: string, holdMs: number, autoHide = true): void {
    this.hideBubble();

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: '15px',
      color: '#303A32',
      align: 'center',
      wordWrap: { width: Math.max(180, Math.min(260, this.viewport.width - 80)) },
    });
    label.setOrigin(0.5);

    const width = label.width + 30;
    const height = label.height + 22;
    const background = this.add.graphics();
    background.fillStyle(0xffffff, 0.98);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    background.lineStyle(2, 0xe5ebe2, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);

    // Keep the bubble above Kiko's head when the row has room; otherwise place
    // it below him so the top row of a tall phone map never clips the text.
    const aboveY = this.kiko.root.y - 96 - height / 2;
    const showAbove = aboveY > 12;
    const bubbleY = showAbove ? aboveY : this.kiko.root.y + 82 + height / 2;
    background.fillStyle(0xffffff, 0.98);
    if (showAbove) {
      background.fillTriangle(-9, height / 2, 9, height / 2, 0, height / 2 + 11);
    } else {
      background.fillTriangle(-9, -height / 2, 9, -height / 2, 0, -height / 2 - 11);
    }

    // The map is narrow on phones, so a long bubble next to the right column
    // must stay inside the canvas instead of being cut by the frame.
    const vp = this.viewport;
    const bubbleX = Phaser.Math.Clamp(
      this.kiko.root.x,
      width / 2 + 8,
      Math.max(width / 2 + 8, vp.width - width / 2 - 8),
    );

    const bubble = this.add.container(bubbleX, bubbleY, [background, label]).setDepth(60);
    bubble.setAlpha(0);
    this.tweens.add({ targets: bubble, alpha: 1, y: bubble.y - 6, duration: 160, ease: 'Sine.easeOut' });
    this.bubble = bubble;

    if (autoHide && holdMs > 0) {
      this.bubbleTimer = this.time.delayedCall(holdMs, () => this.hideBubble());
    }
  }

  private hideBubble(): void {
    this.bubbleTimer?.remove();
    this.bubbleTimer = null;

    if (!this.bubble) return;
    const bubble = this.bubble;
    this.bubble = null;
    this.tweens.add({
      targets: bubble,
      alpha: 0,
      duration: 140,
      onComplete: () => bubble.destroy(),
    });
  }
}

export interface AdventureStage {
  game: Phaser.Game;
  setLevel: (index: number) => void;
  getLevelIndex: () => number;
}

export function startAdventureMap(
  parent: HTMLElement,
  options: AdventureMapOptions,
): AdventureStage {
  parent.replaceChildren();

  const scene = new AdventureMapScene(options);
  const viewport = options.viewport ?? MAP_VIEWPORTS.wide;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: viewport.width,
    height: viewport.height,
    transparent: true,
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: viewport.width,
      height: viewport.height,
    },
    scene: [scene],
  });

  return {
    game,
    setLevel: (index) => scene.selectLevel(index),
    getLevelIndex: () => scene.getLevelIndex(),
  };
}
