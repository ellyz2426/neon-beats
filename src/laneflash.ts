// ============================================================
// Neon Beats VR — Lane Flash & Approach Beam System
// Visual feedback that lights up lanes on hit and shows
// approaching beats with glowing lane beams
// ============================================================

import {
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
} from '@iwsdk/core';

// ---- Lane Colors ----
const DEFAULT_LANE_COLORS = [
  new Color(0xff0044), // Red
  new Color(0x00ff88), // Green
  new Color(0x0088ff), // Blue
  new Color(0xff8800), // Orange
  new Color(0xff00ff), // Magenta
  new Color(0x00ffff), // Cyan
];

// ---- Lane Flash ----

interface LaneFlashState {
  mesh: Mesh;
  material: MeshBasicMaterial;
  intensity: number;
  color: Color;
  flashDuration: number;
}

export class LaneFlashSystem {
  private group: Group;
  private lanes: LaneFlashState[] = [];
  private numLanes: number;
  private laneSpacing: number;
  private hitZoneZ: number;

  constructor(numLanes: number = 4, laneSpacing: number = 0.4, hitZoneZ: number = -3) {
    this.group = new Group();
    this.numLanes = numLanes;
    this.laneSpacing = laneSpacing;
    this.hitZoneZ = hitZoneZ;
    this.createLanes();
  }

  private createLanes() {
    const totalWidth = (this.numLanes - 1) * this.laneSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < this.numLanes; i++) {
      // Lane flash plane — wide vertical strip at the hit zone
      const geo = new PlaneGeometry(this.laneSpacing * 0.8, 3);
      const mat = new MeshBasicMaterial({
        color: DEFAULT_LANE_COLORS[i % DEFAULT_LANE_COLORS.length],
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        side: DoubleSide,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(startX + i * this.laneSpacing, 1.2, this.hitZoneZ);
      this.group.add(mesh);

      // Floor beam — glowing strip along the lane
      const beamGeo = new BoxGeometry(this.laneSpacing * 0.3, 0.01, 2);
      const beamMat = new MeshBasicMaterial({
        color: DEFAULT_LANE_COLORS[i % DEFAULT_LANE_COLORS.length],
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const beam = new Mesh(beamGeo, beamMat);
      beam.position.set(startX + i * this.laneSpacing, 0.005, this.hitZoneZ);
      this.group.add(beam);

      this.lanes.push({
        mesh,
        material: mat,
        intensity: 0,
        color: DEFAULT_LANE_COLORS[i % DEFAULT_LANE_COLORS.length].clone(),
        flashDuration: 0,
      });
    }
  }

  getGroup(): Group { return this.group; }

  /**
   * Trigger a flash on a specific lane
   */
  flash(lane: number, quality: 'perfect' | 'great' | 'good' | 'miss', color?: Color) {
    if (lane < 0 || lane >= this.lanes.length) return;
    const state = this.lanes[lane];

    const intensityMap = {
      perfect: 1.0,
      great: 0.7,
      good: 0.4,
      miss: 0.15,
    };

    const durationMap = {
      perfect: 0.4,
      great: 0.3,
      good: 0.2,
      miss: 0.1,
    };

    state.intensity = intensityMap[quality];
    state.flashDuration = durationMap[quality];

    if (color) {
      state.color.copy(color);
      state.material.color.copy(color);
    }

    // For perfect hits, make a brief white flash
    if (quality === 'perfect') {
      state.material.color.set(0xffffff);
    }
  }

  update(dt: number) {
    for (const lane of this.lanes) {
      if (lane.intensity > 0) {
        lane.intensity = Math.max(0, lane.intensity - dt / lane.flashDuration);
        lane.material.opacity = lane.intensity * 0.6;

        // Fade from white back to lane color for perfect hits
        if (lane.material.color.r > lane.color.r + 0.01) {
          lane.material.color.lerp(lane.color, dt * 8);
        }

        // Scale pulse effect
        const pulse = 1 + lane.intensity * 0.15;
        lane.mesh.scale.set(pulse, 1 + lane.intensity * 0.1, 1);
      } else {
        lane.material.opacity = 0;
      }
    }
  }

  setLaneColor(lane: number, color: Color) {
    if (lane < 0 || lane >= this.lanes.length) return;
    this.lanes[lane].color.copy(color);
    this.lanes[lane].material.color.copy(color);
  }
}

// ---- Approach Beam System ----
// Shows glowing beams that intensify as blocks get closer

interface ApproachBeamState {
  mesh: Mesh;
  material: MeshBasicMaterial;
  targetIntensity: number;
}

export class ApproachBeamSystem {
  private group: Group;
  private beams: ApproachBeamState[] = [];
  private numLanes: number;
  private laneSpacing: number;

  constructor(numLanes: number = 4, laneSpacing: number = 0.4, hitZoneZ: number = -3, depth: number = 10) {
    this.group = new Group();
    this.numLanes = numLanes;
    this.laneSpacing = laneSpacing;

    const totalWidth = (numLanes - 1) * laneSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < numLanes; i++) {
      // Long thin beam stretching back from hit zone
      const geo = new BoxGeometry(0.02, 0.02, depth);
      const mat = new MeshBasicMaterial({
        color: DEFAULT_LANE_COLORS[i % DEFAULT_LANE_COLORS.length],
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(startX + i * laneSpacing, 0.5, hitZoneZ - depth / 2);
      this.group.add(mesh);

      this.beams.push({
        mesh,
        material: mat,
        targetIntensity: 0,
      });
    }
  }

  getGroup(): Group { return this.group; }

  /**
   * Set beam intensity for a lane based on approaching blocks
   * @param lane Lane index
   * @param intensity 0-1 based on how close the nearest block is
   */
  setLaneActivity(lane: number, intensity: number) {
    if (lane < 0 || lane >= this.beams.length) return;
    this.beams[lane].targetIntensity = Math.min(1, intensity);
  }

  update(dt: number) {
    for (const beam of this.beams) {
      const current = beam.material.opacity;
      const target = beam.targetIntensity * 0.15;
      beam.material.opacity += (target - current) * Math.min(1, dt * 10);

      // Reset for next frame
      beam.targetIntensity = 0;
    }
  }
}

// ---- Hit Zone Ring ----
// A glowing ring at the hit zone that pulses on beat

export class HitZoneRing {
  private group: Group;
  private rings: Mesh[] = [];
  private materials: MeshBasicMaterial[] = [];
  private pulseIntensity = 0;
  private baseColor = new Color(0x00ffff);

  constructor(numLanes: number = 4, laneSpacing: number = 0.4, hitZoneZ: number = -3) {
    this.group = new Group();

    const totalWidth = (numLanes - 1) * laneSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < numLanes; i++) {
      const geo = new CylinderGeometry(0.18, 0.22, 0.02, 12);
      const mat = new MeshBasicMaterial({
        color: DEFAULT_LANE_COLORS[i % DEFAULT_LANE_COLORS.length],
        transparent: true,
        opacity: 0.15,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const ring = new Mesh(geo, mat);
      ring.position.set(startX + i * laneSpacing, 0.5, hitZoneZ);
      ring.rotation.x = Math.PI / 2;
      this.group.add(ring);
      this.rings.push(ring);
      this.materials.push(mat);
    }
  }

  getGroup(): Group { return this.group; }

  pulse(intensity: number = 0.5) {
    this.pulseIntensity = Math.max(this.pulseIntensity, intensity);
  }

  setColor(color: Color) {
    this.baseColor.copy(color);
  }

  update(dt: number, beatIntensity: number) {
    this.pulseIntensity = Math.max(0, this.pulseIntensity - dt * 4);
    const totalPulse = Math.min(1, this.pulseIntensity + beatIntensity * 0.3);

    for (let i = 0; i < this.rings.length; i++) {
      this.materials[i].opacity = 0.1 + totalPulse * 0.35;
      const scale = 1 + totalPulse * 0.2;
      this.rings[i].scale.set(scale, scale, 1);
    }
  }
}
