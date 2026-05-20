// ============================================================
// Neon Beats VR — VR Saber Visuals
// Glowing neon sabers attached to each controller
// Change color based on which lane they're pointing at
// Emit particles on swing, pulse on beat
// ============================================================

import {
  Group,
  Mesh,
  CylinderGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  Color,
  AdditiveBlending,
} from '@iwsdk/core';
import type { World } from '@iwsdk/core';

// ---- Constants ----

const SABER_LENGTH = 0.6;
const SABER_RADIUS = 0.012;
const SABER_GLOW_RADIUS = 0.025;
const DEFAULT_COLOR = 0x00ffff;
const MISS_COLOR = 0xff0044;

// ---- Saber Class ----

export class VRSaber {
  readonly group: Group;
  private bladeMat: MeshBasicMaterial;
  private glowMat: MeshBasicMaterial;
  private tipMat: MeshBasicMaterial;
  private currentColor = new Color(DEFAULT_COLOR);
  private targetColor = new Color(DEFAULT_COLOR);
  private pulseIntensity = 0;

  constructor() {
    this.group = new Group();

    const bladeGeo = new CylinderGeometry(SABER_RADIUS, SABER_RADIUS, SABER_LENGTH, 8, 1);
    bladeGeo.translate(0, SABER_LENGTH / 2 + 0.05, 0);
    this.bladeMat = new MeshBasicMaterial({ color: DEFAULT_COLOR, transparent: true, opacity: 0.95 });
    this.group.add(new Mesh(bladeGeo, this.bladeMat));

    const glowGeo = new CylinderGeometry(SABER_GLOW_RADIUS, SABER_GLOW_RADIUS, SABER_LENGTH * 0.95, 8, 1);
    glowGeo.translate(0, SABER_LENGTH / 2 + 0.05, 0);
    this.glowMat = new MeshBasicMaterial({
      color: DEFAULT_COLOR, transparent: true, opacity: 0.25,
      blending: AdditiveBlending,
    });
    this.group.add(new Mesh(glowGeo, this.glowMat));

    const tipGeo = new SphereGeometry(SABER_RADIUS * 1.5, 8, 8);
    tipGeo.translate(0, SABER_LENGTH + 0.05, 0);
    this.tipMat = new MeshBasicMaterial({ color: DEFAULT_COLOR, transparent: true, opacity: 0.8 });
    this.group.add(new Mesh(tipGeo, this.tipMat));

    // Point forward (-Z is controller forward)
    this.group.rotation.x = -Math.PI / 2;
  }

  setColorFromLane(laneColors: Color[], lane: number) {
    if (lane >= 0 && lane < laneColors.length) {
      this.targetColor.copy(laneColors[lane]);
    } else {
      this.targetColor.set(DEFAULT_COLOR);
    }
  }

  flashMiss() {
    this.currentColor.set(MISS_COLOR);
    this.bladeMat.color.copy(this.currentColor);
    this.glowMat.color.copy(this.currentColor);
    this.tipMat.color.copy(this.currentColor);
    this.pulseIntensity = 1;
  }

  pulse(intensity: number = 0.8) {
    this.pulseIntensity = Math.max(this.pulseIntensity, intensity);
  }

  update(dt: number) {
    this.currentColor.lerp(this.targetColor, Math.min(1, dt * 12));
    this.bladeMat.color.copy(this.currentColor);
    this.glowMat.color.copy(this.currentColor);
    this.tipMat.color.copy(this.currentColor);

    if (this.pulseIntensity > 0) {
      this.glowMat.opacity = 0.25 + this.pulseIntensity * 0.5;
      this.bladeMat.opacity = 0.95 + this.pulseIntensity * 0.05;
      this.pulseIntensity = Math.max(0, this.pulseIntensity - dt * 4);
    } else {
      this.glowMat.opacity = 0.25;
      this.bladeMat.opacity = 0.95;
    }
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }
}

// ---- VR Saber Manager ----

export class VRSaberManager {
  private world: World | null = null;
  private leftSaber: VRSaber;
  private rightSaber: VRSaber;
  private attached = false;

  constructor() {
    this.leftSaber = new VRSaber();
    this.rightSaber = new VRSaber();
    this.leftSaber.hide();
    this.rightSaber.hide();
  }

  init(world: World) { this.world = world; }
  getLeftSaber(): VRSaber { return this.leftSaber; }
  getRightSaber(): VRSaber { return this.rightSaber; }

  attachToControllers() {
    if (!this.world || this.attached) return;

    const player = this.world.player;
    if (!player) return;

    const leftGrip = player.gripSpaces?.left;
    const rightGrip = player.gripSpaces?.right;

    if (leftGrip) {
      leftGrip.add(this.leftSaber.group);
      this.leftSaber.show();
    }
    if (rightGrip) {
      rightGrip.add(this.rightSaber.group);
      this.rightSaber.show();
    }

    this.attached = true;
  }

  detach() {
    if (this.leftSaber.group.parent) {
      this.leftSaber.group.parent.remove(this.leftSaber.group);
    }
    if (this.rightSaber.group.parent) {
      this.rightSaber.group.parent.remove(this.rightSaber.group);
    }
    this.leftSaber.hide();
    this.rightSaber.hide();
    this.attached = false;
  }

  updateLaneColors(laneColors: Color[], leftLane: number, rightLane: number) {
    this.leftSaber.setColorFromLane(laneColors, leftLane);
    this.rightSaber.setColorFromLane(laneColors, rightLane);
  }

  pulseBeat(intensity: number = 0.3) {
    this.leftSaber.pulse(intensity);
    this.rightSaber.pulse(intensity);
  }

  flashMiss(hand: 'left' | 'right' | 'both') {
    if (hand === 'left' || hand === 'both') this.leftSaber.flashMiss();
    if (hand === 'right' || hand === 'both') this.rightSaber.flashMiss();
  }

  update(dt: number) {
    if (!this.world) return;

    const inXR = !!(this.world as any).session;

    if (inXR && !this.attached) {
      this.attachToControllers();
    } else if (!inXR && this.attached) {
      this.detach();
    }

    if (this.attached) {
      this.leftSaber.update(dt);
      this.rightSaber.update(dt);
    }
  }
}
