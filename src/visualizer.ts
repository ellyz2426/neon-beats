// ============================================================
// Neon Beats VR — Waveform Visualizer
// Audio-reactive waveform that decorates the environment
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
} from '@iwsdk/core';
import { LANE_COLORS, HIT_ZONE_Z } from './environment';

export class WaveformVisualizer {
  private bars: Mesh[] = [];
  private container: Group;
  private barCount: number;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private side: 'left' | 'right' | 'back';

  constructor(container: Group, side: 'left' | 'right' | 'back', barCount: number = 32) {
    this.container = container;
    this.barCount = barCount;
    this.side = side;
    this.createBars();
  }

  private createBars() {
    const spacing = 0.3;
    for (let i = 0; i < this.barCount; i++) {
      const color = LANE_COLORS[i % LANE_COLORS.length].clone();
      color.multiplyScalar(0.5);
      const mesh = new Mesh(
        new BoxGeometry(0.15, 0.1, 0.15),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
      );

      if (this.side === 'left') {
        mesh.position.set(-4.5, 0.1, HIT_ZONE_Z - i * spacing);
      } else if (this.side === 'right') {
        mesh.position.set(4.5, 0.1, HIT_ZONE_Z - i * spacing);
      } else {
        mesh.position.set(-this.barCount * spacing / 2 + i * spacing, 0.1, HIT_ZONE_Z - 20);
      }

      this.container.add(mesh);
      this.bars.push(mesh);
    }
  }

  connectAnalyser(ctx: AudioContext, sourceNode: AudioNode) {
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64;
    sourceNode.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  update(dt: number, beatIntensity: number, songTime: number) {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
    }

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      let height: number;

      if (this.dataArray && this.analyser) {
        const idx = Math.floor(i / this.barCount * this.dataArray.length);
        height = (this.dataArray[idx] / 255) * 3 + 0.1;
      } else {
        // Fallback: procedural animation
        const t = songTime * 2 + i * 0.3;
        height = (Math.sin(t) * 0.5 + 0.5) * beatIntensity * 2 + 0.1;
      }

      bar.scale.y = height;
      bar.position.y = height * 0.05;

      const mat = bar.material as MeshBasicMaterial;
      mat.opacity = 0.3 + Math.min(0.5, height * 0.15);
    }
  }

  setColor(color: Color) {
    for (const bar of this.bars) {
      (bar.material as MeshBasicMaterial).color.copy(color);
    }
  }

  clear() {
    for (const bar of this.bars) {
      this.container.remove(bar);
    }
    this.bars = [];
  }
}

// ---- Tunnel Rings (neon rings that rush toward the player) ----

interface TunnelRing {
  mesh: Mesh;
  z: number;
  speed: number;
}

export class TunnelRingManager {
  private rings: TunnelRing[] = [];
  private container: Group;
  private active = false;

  constructor(container: Group) {
    this.container = container;
  }

  setActive(active: boolean) { this.active = active; }

  spawnRing(color: Color, speed: number = 8) {
    const size = 3 + Math.random() * 2;
    // Create a thin hollow box as a ring approximation
    const mesh = new Mesh(
      new BoxGeometry(size, size, 0.05),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.3, wireframe: true })
    );
    const z = HIT_ZONE_Z - 22;
    mesh.position.set(0, 2.5, z);
    this.container.add(mesh);
    this.rings.push({ mesh, z, speed });
  }

  update(dt: number, beatIntensity: number) {
    if (!this.active) return;

    // Spawn on beat
    if (beatIntensity > 0.5 && Math.random() < 0.3) {
      const color = LANE_COLORS[Math.floor(Math.random() * LANE_COLORS.length)];
      this.spawnRing(color);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.z += ring.speed * dt;
      ring.mesh.position.z = ring.z;

      const t = (ring.z - (HIT_ZONE_Z - 22)) / 24;
      ring.mesh.scale.setScalar(1 + t * 2);
      (ring.mesh.material as MeshBasicMaterial).opacity = Math.max(0, 0.3 - t * 0.4);

      if (ring.z > HIT_ZONE_Z + 3) {
        this.container.remove(ring.mesh);
        this.rings.splice(i, 1);
      }
    }
  }

  clear() {
    for (const ring of this.rings) {
      this.container.remove(ring.mesh);
    }
    this.rings = [];
  }
}
