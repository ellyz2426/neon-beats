// ============================================================
// Neon Beats VR — Visual Effects
// Particles, flashes, screen shake, combo popups
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  Vector3,
  AdditiveBlending,
} from '@iwsdk/core';
import { LANE_COLORS, HIT_ZONE_Z, LANE_SPACING } from './environment';

// ---- Particle System ----

interface Particle {
  mesh: Mesh;
  material: MeshBasicMaterial;
  velocity: Vector3;
  life: number;
  maxLife: number;
  gravity: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private container: Group;
  private pool: Mesh[] = [];

  constructor(container: Group) {
    this.container = container;
    // Pre-create pool
    for (let i = 0; i < 300; i++) {
      const mesh = new Mesh(
        new BoxGeometry(0.05, 0.05, 0.05),
        new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
      );
      mesh.visible = false;
      container.add(mesh);
      this.pool.push(mesh);
    }
  }

  emit(position: Vector3, color: Color, count: number, spread: number = 3, life: number = 0.8) {
    for (let i = 0; i < count; i++) {
      const mesh = this.pool.find(m => !m.visible);
      if (!mesh) break;

      mesh.visible = true;
      mesh.position.copy(position);
      (mesh.material as MeshBasicMaterial).color.copy(color);
      (mesh.material as MeshBasicMaterial).opacity = 1;
      const scale = 0.03 + Math.random() * 0.06;
      mesh.scale.setScalar(scale);

      this.particles.push({
        mesh,
        material: mesh.material as MeshBasicMaterial,
        velocity: new Vector3(
          (Math.random() - 0.5) * spread,
          Math.random() * spread * 0.8 + 0.5,
          (Math.random() - 0.5) * spread
        ),
        life: life + Math.random() * life * 0.5,
        maxLife: life + Math.random() * life * 0.5,
        gravity: -5,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += p.gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      const t = p.life / p.maxLife;
      (p.material as any); // type guard
      (p.mesh.material as MeshBasicMaterial).opacity = t;
      p.mesh.scale.setScalar(p.mesh.scale.x * (0.98 + t * 0.02));
    }
  }

  clear() {
    for (const p of this.particles) {
      p.mesh.visible = false;
    }
    this.particles = [];
  }
}

// ---- Hit Flash Effect ----

export class HitFlashManager {
  private flashes: { mesh: Mesh; life: number }[] = [];
  private container: Group;

  constructor(container: Group) {
    this.container = container;
  }

  flash(position: Vector3, color: Color, quality: 'perfect' | 'great' | 'good') {
    const size = quality === 'perfect' ? 1.2 : quality === 'great' ? 0.9 : 0.6;
    const mesh = new Mesh(
      new SphereGeometry(size, 8, 8),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      })
    );
    mesh.position.copy(position);
    this.container.add(mesh);
    this.flashes.push({ mesh, life: 0.3 });
  }

  update(dt: number) {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.container.remove(f.mesh);
        this.flashes.splice(i, 1);
        continue;
      }
      const t = f.life / 0.3;
      (f.mesh.material as MeshBasicMaterial).opacity = t * 0.8;
      f.mesh.scale.setScalar(1 + (1 - t) * 2);
    }
  }

  clear() {
    for (const f of this.flashes) {
      this.container.remove(f.mesh);
    }
    this.flashes = [];
  }
}

// ---- Screen Shake ----

export class ScreenShake {
  private intensity = 0;
  private decay = 8;
  offset = new Vector3();

  trigger(amount: number) {
    this.intensity = Math.max(this.intensity, amount);
  }

  update(dt: number) {
    if (this.intensity > 0.001) {
      this.offset.set(
        (Math.random() - 0.5) * this.intensity * 0.1,
        (Math.random() - 0.5) * this.intensity * 0.05,
        0
      );
      this.intensity *= Math.exp(-this.decay * dt);
    } else {
      this.offset.set(0, 0, 0);
      this.intensity = 0;
    }
  }
}

// ---- Combo Text Popup ----

interface TextPopup {
  element: HTMLDivElement;
  life: number;
  y: number;
}

export class ComboPopupManager {
  private popups: TextPopup[] = [];
  private overlayContainer: HTMLDivElement;

  constructor() {
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100; overflow: hidden;
    `;
    document.body.appendChild(this.overlayContainer);
  }

  show(text: string, color: string, x: number = 50, y: number = 40) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: absolute; left: ${x}%; top: ${y}%;
      transform: translate(-50%, -50%);
      font-family: 'Courier New', monospace;
      font-size: 32px; font-weight: bold;
      color: ${color}; text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
      pointer-events: none; transition: none;
    `;
    this.overlayContainer.appendChild(el);
    this.popups.push({ element: el, life: 0.8, y: y });
  }

  update(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.y -= dt * 20;
      if (p.life <= 0) {
        p.element.remove();
        this.popups.splice(i, 1);
        continue;
      }
      const t = p.life / 0.8;
      p.element.style.opacity = String(t);
      p.element.style.top = `${p.y}%`;
      p.element.style.transform = `translate(-50%, -50%) scale(${1 + (1 - t) * 0.5})`;
    }
  }

  clear() {
    for (const p of this.popups) {
      p.element.remove();
    }
    this.popups = [];
  }
}

// ---- Background Pulse ----

export class BackgroundPulse {
  private overlay: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 1; background: transparent;
      transition: background 0.05s;
    `;
    document.body.appendChild(this.overlay);
  }

  pulse(color: string, intensity: number) {
    const alpha = Math.min(0.15, intensity * 0.1);
    this.overlay.style.background = `radial-gradient(ellipse at center, ${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`;
    setTimeout(() => {
      this.overlay.style.background = 'transparent';
    }, 100);
  }
}

// ---- Lane Flash (3D) ----

export function createLaneFlashEffect(lane: number, numLanes: number, color: Color): { mesh: Mesh; update: (dt: number) => boolean } {
  const totalWidth = (numLanes - 1) * LANE_SPACING;
  const x = -totalWidth / 2 + lane * LANE_SPACING;

  const mesh = new Mesh(
    new BoxGeometry(0.6, 0.02, 2),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    })
  );
  mesh.position.set(x, 0.03, HIT_ZONE_Z - 0.5);

  let life = 0.3;
  return {
    mesh,
    update(dt: number): boolean {
      life -= dt;
      if (life <= 0) return false;
      (mesh.material as MeshBasicMaterial).opacity = (life / 0.3) * 0.6;
      mesh.scale.z = 1 + (1 - life / 0.3) * 2;
      return true;
    }
  };
}
