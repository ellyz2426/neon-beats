// ============================================================
// Neon Beats VR — Combo Visualizer System
// Visual effects that intensify with combo progression
// Combo trail, multiplier ring, beat graph, lane aura
// ============================================================

import {
  Group,
  Mesh,
  RingGeometry,
  PlaneGeometry,
  BoxGeometry,
  CylinderGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  DoubleSide,
} from '@iwsdk/core';

// ---- Combo Trail ----
// Leaves a trail of particles behind blocks as combo increases

export class ComboTrail {
  private container: Group;
  private trails: { mesh: Mesh; life: number; maxLife: number }[] = [];

  constructor(container: Group) {
    this.container = container;
  }

  emit(x: number, y: number, z: number, color: Color, comboLevel: number) {
    const count = Math.min(5, 1 + Math.floor(comboLevel / 2));
    for (let i = 0; i < count; i++) {
      const size = 0.05 + Math.random() * 0.08;
      const mesh = new Mesh(
        new BoxGeometry(size, size, size),
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.4 + comboLevel * 0.05,
          blending: AdditiveBlending,
        })
      );
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.3,
        y + (Math.random() - 0.5) * 0.3,
        z + (Math.random() - 0.5) * 0.2
      );
      this.container.add(mesh);
      const life = 0.3 + Math.random() * 0.5;
      this.trails.push({ mesh, life, maxLife: life });
    }
  }

  update(dt: number) {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.container.remove(t.mesh);
        this.trails.splice(i, 1);
      } else {
        const alpha = t.life / t.maxLife;
        (t.mesh.material as MeshBasicMaterial).opacity = alpha * 0.5;
        t.mesh.scale.multiplyScalar(0.97);
        t.mesh.position.y += dt * 0.5;
      }
    }
  }

  clear() {
    for (const t of this.trails) this.container.remove(t.mesh);
    this.trails = [];
  }
}

// ---- Multiplier Ring ----
// Glowing ring around the hit zone that grows with multiplier

export class MultiplierRing {
  private ring: Mesh;
  private targetScale = 1;
  private currentScale = 1;
  private pulsePhase = 0;
  private baseColor: Color;

  constructor(container: Group, y: number, z: number) {
    this.baseColor = new Color('#00ffff');
    this.ring = new Mesh(
      new RingGeometry(1.8, 2.0, 32),
      new MeshBasicMaterial({
        color: this.baseColor,
        transparent: true,
        opacity: 0.15,
        side: DoubleSide,
        blending: AdditiveBlending,
      })
    );
    this.ring.position.set(0, y, z);
    this.ring.rotation.x = -Math.PI / 2;
    container.add(this.ring);
  }

  setMultiplier(multiplier: number, color: Color) {
    this.targetScale = 0.8 + multiplier * 0.15;
    this.baseColor.copy(color);
    (this.ring.material as MeshBasicMaterial).color.copy(color);
  }

  pulse() {
    this.pulsePhase = 1.0;
  }

  update(dt: number) {
    this.currentScale += (this.targetScale - this.currentScale) * dt * 5;
    this.ring.scale.setScalar(this.currentScale);

    this.pulsePhase = Math.max(0, this.pulsePhase - dt * 3);
    const opacity = 0.15 + this.pulsePhase * 0.4;
    (this.ring.material as MeshBasicMaterial).opacity = opacity;

    this.ring.rotation.z += dt * 0.5;
  }
}

// ---- Beat Graph ----
// Shows recent hit quality as a scrolling graph

export class BeatGraph {
  private element: HTMLDivElement;
  private hits: { quality: string; time: number }[] = [];
  private maxHits = 40;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'beatGraph';
    this.element.style.cssText = `
      position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%);
      width: 300px; height: 30px; z-index: 130; pointer-events: none;
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.element);
  }

  addHit(quality: string) {
    this.hits.push({ quality, time: performance.now() });
    if (this.hits.length > this.maxHits) this.hits.shift();
    this.render();
  }

  private render() {
    const bars = this.hits.map(h => {
      let color: string, height: number;
      switch (h.quality) {
        case 'perfect': color = '#00ffff'; height = 100; break;
        case 'great': color = '#00ff88'; height = 75; break;
        case 'good': color = '#ffcc00'; height = 50; break;
        default: color = '#ff0044'; height = 20; break;
      }
      const age = (performance.now() - h.time) / 5000;
      const opacity = Math.max(0.2, 1 - age);
      return `<div style="
        width: ${300 / this.maxHits - 1}px; height: ${height}%;
        background: ${color}; opacity: ${opacity};
        border-radius: 1px;
      "></div>`;
    }).join('');

    this.element.innerHTML = `
      <div style="display: flex; align-items: flex-end; height: 100%; gap: 1px; justify-content: flex-end;">
        ${bars}
      </div>
    `;
  }

  show() { this.element.style.display = 'block'; }
  hide() { this.element.style.display = 'none'; }

  clear() {
    this.hits = [];
    this.element.innerHTML = '';
  }

  destroy() {
    this.element.remove();
  }
}

// ---- Lane Aura ----
// Colored aura around lanes that intensifies with recent hits

export class LaneAura {
  private auras: Mesh[] = [];
  private intensities: number[] = [];
  private container: Group;

  constructor(container: Group, numLanes: number, spacing: number, hitZoneZ: number) {
    this.container = container;
    const totalWidth = (numLanes - 1) * spacing;

    for (let i = 0; i < numLanes; i++) {
      const color = new Color().setHex(
        i === 0 ? 0xff0066 : i === 1 ? 0x00ffff : i === 2 ? 0xff6600 : 0x9933ff
      );
      const aura = new Mesh(
        new PlaneGeometry(spacing * 0.8, 1.5),
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          side: DoubleSide,
          blending: AdditiveBlending,
        })
      );
      const x = -totalWidth / 2 + i * spacing;
      aura.position.set(x, 0.01, hitZoneZ);
      aura.rotation.x = -Math.PI / 2;
      container.add(aura);
      this.auras.push(aura);
      this.intensities.push(0);
    }
  }

  flash(lane: number) {
    if (lane >= 0 && lane < this.intensities.length) {
      this.intensities[lane] = 1.0;
    }
  }

  update(dt: number) {
    for (let i = 0; i < this.auras.length; i++) {
      this.intensities[i] = Math.max(0, this.intensities[i] - dt * 3);
      (this.auras[i].material as MeshBasicMaterial).opacity = this.intensities[i] * 0.4;
    }
  }

  clear() {
    for (let i = 0; i < this.intensities.length; i++) this.intensities[i] = 0;
  }
}

// ---- Score Popup Pool ----
// Efficient popup system for score numbers flying up

export class ScorePopupPool {
  private element: HTMLDivElement;
  private popups: { el: HTMLDivElement; life: number }[] = [];

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'scorePopups';
    this.element.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 135;
      font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.element);
  }

  show(score: number, x: number, y: number, color: string) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute; left: ${x}px; top: ${y}px;
      font-size: 18px; font-weight: bold; color: ${color};
      text-shadow: 0 0 8px ${color};
      animation: scoreFly 0.8s ease-out forwards;
    `;
    el.textContent = `+${score}`;
    this.element.appendChild(el);
    this.popups.push({ el, life: 0.8 });
  }

  update(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= dt;
      if (this.popups[i].life <= 0) {
        this.popups[i].el.remove();
        this.popups.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.popups) p.el.remove();
    this.popups = [];
  }

  destroy() {
    this.element.remove();
  }
}

// ---- Streak Effect ----
// Visual streak counter that shows consecutive hit quality

export class StreakCounter {
  private element: HTMLDivElement;
  private streakType: string = '';
  private streakCount = 0;
  private hideTimer: number | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'streakCounter';
    this.element.style.cssText = `
      position: fixed; top: 45%; right: 20px; z-index: 135;
      font-family: 'Courier New', monospace; text-align: right;
      pointer-events: none; transition: opacity 0.3s;
      opacity: 0;
    `;
    document.body.appendChild(this.element);
  }

  addHit(quality: string) {
    if (quality === this.streakType) {
      this.streakCount++;
    } else {
      this.streakType = quality;
      this.streakCount = 1;
    }

    if (this.streakCount >= 3 && (quality === 'perfect' || quality === 'great')) {
      this.show();
    }

    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.element.style.opacity = '0';
    }, 2000);
  }

  onMiss() {
    this.streakType = '';
    this.streakCount = 0;
    this.element.style.opacity = '0';
  }

  private show() {
    const color = this.streakType === 'perfect' ? '#00ffff' : '#00ff88';
    const label = this.streakType.toUpperCase();
    this.element.innerHTML = `
      <div style="font-size: 12px; opacity: 0.5; color: ${color};">${label} STREAK</div>
      <div style="font-size: 28px; color: ${color}; text-shadow: 0 0 15px ${color}; font-weight: bold;">
        ×${this.streakCount}
      </div>
    `;
    this.element.style.opacity = '1';
  }

  clear() {
    this.streakType = '';
    this.streakCount = 0;
    this.element.style.opacity = '0';
  }

  destroy() {
    this.element.remove();
  }
}
