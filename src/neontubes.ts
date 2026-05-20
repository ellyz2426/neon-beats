// ============================================================
// Neon Beats VR — Neon Tube Decorations
// Animated neon tubes that frame the play area
// ============================================================

import {
  Group,
  Mesh,
  CylinderGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
} from '@iwsdk/core';
import { LANE_COLORS, HIT_ZONE_Z, LANE_LENGTH } from './environment';

export class NeonTubeSystem {
  private tubes: { mesh: Mesh; baseColor: Color; phase: number }[] = [];
  private container: Group;

  constructor(container: Group) {
    this.container = container;
    this.createTubes();
  }

  private createTubes() {
    // Vertical pillars along the sides
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 6; i++) {
        const z = HIT_ZONE_Z - i * 3.5;
        const color = LANE_COLORS[i % LANE_COLORS.length].clone();
        const tube = new Mesh(
          new CylinderGeometry(0.03, 0.03, 5, 6),
          new MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
        );
        tube.position.set(side * 5, 2.5, z);
        this.container.add(tube);
        this.tubes.push({ mesh: tube, baseColor: color, phase: i * 0.5 + (side > 0 ? 1 : 0) });
      }
    }

    // Horizontal beams at top
    for (let i = 0; i < 5; i++) {
      const z = HIT_ZONE_Z - i * 4 - 2;
      const color = LANE_COLORS[(i + 2) % LANE_COLORS.length].clone();
      const tube = new Mesh(
        new BoxGeometry(10, 0.04, 0.04),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })
      );
      tube.position.set(0, 5.5, z);
      this.container.add(tube);
      this.tubes.push({ mesh: tube, baseColor: color, phase: i * 0.3 + 2 });
    }

    // Floor accent lines
    for (let i = 0; i < 4; i++) {
      const z = HIT_ZONE_Z - i * 5 - 1;
      const color = new Color(0x00ffff);
      const line = new Mesh(
        new BoxGeometry(8, 0.01, 0.08),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
      );
      line.position.set(0, 0.01, z);
      this.container.add(line);
      this.tubes.push({ mesh: line, baseColor: color, phase: i * 0.7 });
    }
  }

  update(time: number, beatIntensity: number, comboMultiplier: number) {
    for (const tube of this.tubes) {
      const mat = tube.mesh.material as MeshBasicMaterial;
      const pulse = Math.sin(time * 2 + tube.phase) * 0.5 + 0.5;
      mat.opacity = 0.2 + pulse * 0.3 + beatIntensity * 0.3;

      // Color shift at high combos
      if (comboMultiplier > 2) {
        const shift = Math.sin(time * 3 + tube.phase) * 0.3;
        const hsl = { h: 0, s: 0, l: 0 };
        tube.baseColor.getHSL(hsl);
        mat.color.setHSL((hsl.h + shift) % 1, hsl.s, Math.min(1, hsl.l + beatIntensity * 0.2));
      } else {
        mat.color.copy(tube.baseColor);
      }
    }
  }

  clear() {
    for (const tube of this.tubes) {
      this.container.remove(tube.mesh);
    }
    this.tubes = [];
  }
}

// ---- Holodeck Horizon (distant glow) ----

export class HolodeckHorizon {
  private mesh: Mesh;

  constructor(container: Group) {
    this.mesh = new Mesh(
      new BoxGeometry(30, 10, 0.1),
      new MeshBasicMaterial({
        color: 0x000830,
        transparent: true,
        opacity: 0.5,
      })
    );
    this.mesh.position.set(0, 5, HIT_ZONE_Z - LANE_LENGTH - 5);
    container.add(this.mesh);
  }

  update(time: number, beatIntensity: number) {
    const mat = this.mesh.material as MeshBasicMaterial;
    const r = 0.02 + beatIntensity * 0.03;
    const g = 0.02 + beatIntensity * 0.02;
    const b = 0.1 + beatIntensity * 0.1;
    mat.color.setRGB(r, g, b);
    mat.opacity = 0.4 + beatIntensity * 0.2;
  }
}
