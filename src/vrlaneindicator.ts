// ============================================================
// Neon Beats VR — VR Lane Aiming Indicator
// Shows a beam from controller to the aimed lane
// Highlights the target lane on the play field
// ============================================================

import {
  Group,
  Mesh,
  CylinderGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  BoxGeometry,
  Vector3,
} from '@iwsdk/core';
import type { World } from '@iwsdk/core';

const BEAM_OPACITY = 0.15;
const HIGHLIGHT_OPACITY = 0.3;

// ---- Lane Highlight ----

class LaneHighlight {
  readonly mesh: Mesh;
  private mat: MeshBasicMaterial;
  private targetOpacity = 0;
  private currentOpacity = 0;
  private color = new Color(0x00ffff);

  constructor(laneWidth: number, depth: number) {
    const geo = new BoxGeometry(laneWidth * 0.8, 0.01, depth);
    this.mat = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.mat);
    this.mesh.position.y = 0.005;  // just above floor
  }

  setActive(active: boolean, color?: Color) {
    this.targetOpacity = active ? HIGHLIGHT_OPACITY : 0;
    if (color) {
      this.color.copy(color);
      this.mat.color.copy(color);
    }
  }

  update(dt: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * Math.min(1, dt * 12);
    this.mat.opacity = this.currentOpacity;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ---- VR Aim Indicator Manager ----

export class VRAimIndicator {
  private group: Group;
  private highlights: LaneHighlight[] = [];
  private world: World | null = null;
  private active = false;

  constructor() {
    this.group = new Group();
  }

  init(world: World, numLanes: number, laneSpacing: number, hitZoneZ: number, laneColors: Color[]) {
    this.world = world;
    world.scene.add(this.group);

    const totalWidth = (numLanes - 1) * laneSpacing;
    const startX = -totalWidth / 2;
    const depth = Math.abs(hitZoneZ) + 2;  // cover the full play area

    for (let i = 0; i < numLanes; i++) {
      const highlight = new LaneHighlight(laneSpacing, depth);
      highlight.mesh.position.x = startX + i * laneSpacing;
      highlight.mesh.position.z = hitZoneZ / 2;
      this.group.add(highlight.mesh);
      this.highlights.push(highlight);
    }
  }

  setLaneColors(colors: Color[]) {
    // Colors are applied when lanes become active
  }

  /**
   * Update which lanes are being aimed at by controllers
   */
  updateAimedLanes(leftLane: number, rightLane: number, laneColors: Color[]) {
    for (let i = 0; i < this.highlights.length; i++) {
      const aimedByLeft = leftLane === i;
      const aimedByRight = rightLane === i;
      const aimed = aimedByLeft || aimedByRight;
      const color = i < laneColors.length ? laneColors[i] : undefined;
      this.highlights[i].setActive(aimed, color);
    }
  }

  update(dt: number) {
    for (const h of this.highlights) {
      h.update(dt);
    }
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
    this.active = visible;
  }

  dispose() {
    for (const h of this.highlights) {
      h.dispose();
    }
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}
