// ============================================================
// Neon Beats VR — Audio Visualization Enhancements
// Spectrum analyzer visualization
// Beat-reactive ring pulses
// Bass-reactive floor glow
// ============================================================

import {
  Group, Mesh, BoxGeometry, MeshBasicMaterial,
  RingGeometry, Color, AdditiveBlending, DoubleSide,
} from '@iwsdk/core';
import { initAudio } from './audio';

// ---- Spectrum Analyzer Bars ----

export class SpectrumAnalyzer {
  private group: Group;
  private bars: Mesh[] = [];
  private materials: MeshBasicMaterial[] = [];
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private barCount: number;

  constructor(barCount: number = 32, width: number = 4, height: number = 2) {
    this.group = new Group();
    this.barCount = barCount;
    const barWidth = width / barCount;
    const startX = -width / 2;

    const geo = new BoxGeometry(barWidth * 0.7, 1, 0.02);

    for (let i = 0; i < barCount; i++) {
      const hue = i / barCount;
      const color = new Color().setHSL(hue, 0.8, 0.5);
      const mat = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
      });
      const bar = new Mesh(geo, mat);
      bar.position.set(startX + i * barWidth + barWidth / 2, 0, 0);
      bar.scale.y = 0.01;
      this.group.add(bar);
      this.bars.push(bar);
      this.materials.push(mat);
    }

    this.group.position.set(0, 3, -8);  // behind play area
  }

  getGroup(): Group { return this.group; }

  connectAudio() {
    try {
      const ctx = initAudio();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect to destination for monitoring
      const src = ctx.createMediaElementSource?.(document.querySelector('audio') as HTMLAudioElement);
      if (src) src.connect(this.analyser);
    } catch {
      // Audio not available yet, will visualize with fake data
    }
  }

  update(dt: number, beatIntensity: number) {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      for (let i = 0; i < this.barCount && i < this.dataArray.length; i++) {
        const val = this.dataArray[i] / 255;
        const targetH = val * 2;
        this.bars[i].scale.y += (targetH - this.bars[i].scale.y) * Math.min(1, dt * 15);
        this.materials[i].opacity = 0.2 + val * 0.5;
      }
    } else {
      // Fake visualization from beat intensity
      for (let i = 0; i < this.barCount; i++) {
        const phase = (Date.now() / 200 + i * 0.5) % (Math.PI * 2);
        const val = (Math.sin(phase) * 0.5 + 0.5) * beatIntensity;
        const targetH = 0.05 + val * 1.5;
        this.bars[i].scale.y += (targetH - this.bars[i].scale.y) * Math.min(1, dt * 12);
        this.materials[i].opacity = 0.15 + val * 0.4;
      }
    }
  }
}

// ---- Beat Ring Pulses ----

interface RingPulse {
  mesh: Mesh;
  life: number;
  maxLife: number;
  active: boolean;
}

export class BeatRingPulser {
  private group: Group;
  private pool: RingPulse[] = [];
  private geo: RingGeometry;
  private poolSize = 10;

  constructor() {
    this.group = new Group();
    this.geo = new RingGeometry(0.3, 0.35, 32);

    for (let i = 0; i < this.poolSize; i++) {
      const mat = new MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        side: DoubleSide,
      });
      const mesh = new Mesh(this.geo, mat);
      mesh.visible = false;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.01;
      this.group.add(mesh);

      this.pool.push({
        mesh,
        life: 0,
        maxLife: 0.8,
        active: false,
      });
    }
  }

  getGroup(): Group { return this.group; }

  /**
   * Spawn a ring pulse at the hit zone
   */
  pulse(x: number, z: number, color: Color) {
    const ring = this.pool.find(r => !r.active);
    if (!ring) return;

    ring.active = true;
    ring.mesh.visible = true;
    ring.mesh.position.set(x, 0.01, z);
    ring.mesh.scale.set(0.5, 0.5, 0.5);
    (ring.mesh.material as MeshBasicMaterial).color.copy(color);
    (ring.mesh.material as MeshBasicMaterial).opacity = 0.6;
    ring.life = 0;
  }

  update(dt: number) {
    for (const ring of this.pool) {
      if (!ring.active) continue;

      ring.life += dt;
      if (ring.life >= ring.maxLife) {
        ring.active = false;
        ring.mesh.visible = false;
        continue;
      }

      const t = ring.life / ring.maxLife;
      const scale = 0.5 + t * 4;  // expand outward
      ring.mesh.scale.set(scale, scale, scale);
      (ring.mesh.material as MeshBasicMaterial).opacity = 0.6 * (1 - t);
    }
  }
}

// ---- Bass Floor Glow ----

export class BassFloorGlow {
  private mesh: Mesh;
  private material: MeshBasicMaterial;
  private intensity = 0;
  private color = new Color(0x00ffff);

  constructor(size: number = 10) {
    const geo = new BoxGeometry(size, 0.001, size);
    this.material = new MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.material);
    this.mesh.position.y = 0.002;
  }

  getMesh(): Mesh { return this.mesh; }

  setBeat(intensity: number) {
    this.intensity = intensity;
  }

  setColor(color: Color) {
    this.color.copy(color);
  }

  update(dt: number) {
    this.material.color.copy(this.color);
    this.material.opacity = this.intensity * 0.08;
    this.intensity *= Math.max(0, 1 - dt * 8);
  }
}
