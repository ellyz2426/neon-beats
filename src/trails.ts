// ============================================================
// Neon Beats VR — Trail & Beam Effects
// Visual trails on blocks as they approach
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  AdditiveBlending,
} from '@iwsdk/core';
import { LANE_COLORS, LANE_SPACING, HIT_ZONE_Z } from './environment';

// ---- Speed Lines (rushing toward the player) ----

interface SpeedLine {
  mesh: Mesh;
  z: number;
  speed: number;
  lane: number;
}

export class SpeedLineManager {
  private lines: SpeedLine[] = [];
  private container: Group;
  private active = false;

  constructor(container: Group) {
    this.container = container;
  }

  setActive(active: boolean) { this.active = active; }

  update(dt: number, intensity: number) {
    if (!this.active) return;

    // Spawn new lines based on intensity
    if (Math.random() < intensity * 0.3) {
      this.spawnLine();
    }

    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];
      line.z += line.speed * dt;
      line.mesh.position.z = line.z;

      if (line.z > HIT_ZONE_Z + 2) {
        this.container.remove(line.mesh);
        this.lines.splice(i, 1);
      }
    }
  }

  private spawnLine() {
    const lane = Math.floor(Math.random() * 4);
    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const length = 0.5 + Math.random() * 1.5;
    const mesh = new Mesh(
      new BoxGeometry(0.02, 0.02, length),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.3 + Math.random() * 0.3 })
    );
    const x = (Math.random() - 0.5) * 6;
    const y = Math.random() * 4;
    const z = HIT_ZONE_Z - 15 - Math.random() * 10;
    mesh.position.set(x, y, z);
    this.container.add(mesh);
    this.lines.push({ mesh, z, speed: 8 + Math.random() * 6, lane });
  }

  clear() {
    for (const line of this.lines) {
      this.container.remove(line.mesh);
    }
    this.lines = [];
  }
}

// ---- Beat Pulse Rings (expand outward on beat) ----

interface PulseRing {
  mesh: Mesh;
  life: number;
}

export class BeatPulseManager {
  private rings: PulseRing[] = [];
  private container: Group;

  constructor(container: Group) {
    this.container = container;
  }

  pulse(color: Color) {
    const mesh = new Mesh(
      new CylinderGeometry(0.5, 0.5, 0.02, 32, 1, true),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: 2 })
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(0, 0.5, HIT_ZONE_Z);
    this.container.add(mesh);
    this.rings.push({ mesh, life: 0.6 });
  }

  update(dt: number) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.life -= dt;
      if (ring.life <= 0) {
        this.container.remove(ring.mesh);
        this.rings.splice(i, 1);
        continue;
      }
      const t = 1 - ring.life / 0.6;
      const scale = 1 + t * 8;
      ring.mesh.scale.set(scale, 1, scale);
      (ring.mesh.material as MeshBasicMaterial).opacity = (1 - t) * 0.4;
    }
  }

  clear() {
    for (const ring of this.rings) {
      this.container.remove(ring.mesh);
    }
    this.rings = [];
  }
}

// ---- Streak Fire (combo flames) ----

export class StreakFire {
  private particles: { mesh: Mesh; vy: number; life: number }[] = [];
  private container: Group;

  constructor(container: Group) {
    this.container = container;
  }

  emit(x: number, color: Color) {
    for (let i = 0; i < 3; i++) {
      const size = 0.04 + Math.random() * 0.06;
      const mesh = new Mesh(
        new BoxGeometry(size, size, size),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );
      mesh.position.set(x + (Math.random() - 0.5) * 0.3, 0.1, HIT_ZONE_Z);
      this.container.add(mesh);
      this.particles.push({ mesh, vy: 1 + Math.random() * 2, life: 0.4 + Math.random() * 0.3 });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.container.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.y += p.vy * dt;
      p.vy *= 0.95;
      (p.mesh.material as MeshBasicMaterial).opacity = p.life * 1.5;
      p.mesh.scale.multiplyScalar(0.97);
    }
  }

  clear() {
    for (const p of this.particles) {
      this.container.remove(p.mesh);
    }
    this.particles = [];
  }
}
