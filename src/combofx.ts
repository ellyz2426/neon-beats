// ============================================================
// Neon Beats VR — Enhanced Combo & Lane Effects
// Combo counter with animated digits
// Lane-specific particle bursts on hit
// Combo fire trail effect
// Score popup with varying size by points gained
// ============================================================

import {
  Group, Mesh, SphereGeometry, MeshBasicMaterial,
  Color, AdditiveBlending, Vector3,
} from '@iwsdk/core';

// ---- Lane Burst Particles ----

interface BurstParticle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class LaneBurstSystem {
  private group: Group;
  private pool: BurstParticle[] = [];
  private geo: SphereGeometry;

  constructor(poolSize: number = 60) {
    this.group = new Group();
    this.geo = new SphereGeometry(0.02, 4, 4);

    for (let i = 0; i < poolSize; i++) {
      const mat = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(this.geo, mat);
      mesh.visible = false;
      this.group.add(mesh);

      this.pool.push({
        mesh,
        velocity: new Vector3(),
        life: 0,
        maxLife: 0,
        active: false,
      });
    }
  }

  getGroup(): Group { return this.group; }

  /**
   * Burst particles from a lane position
   */
  burst(x: number, y: number, z: number, color: Color, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const p = this.pool.find(p => !p.active);
      if (!p) break;

      p.active = true;
      p.mesh.visible = true;
      (p.mesh.material as MeshBasicMaterial).color.copy(color);
      (p.mesh.material as MeshBasicMaterial).opacity = 0.8;
      p.mesh.position.set(x, y, z);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;
      p.velocity.set(
        Math.cos(angle) * speed * 0.5,
        Math.abs(Math.sin(angle)) * speed,
        (Math.random() - 0.5) * speed * 0.3,
      );
      p.life = 0;
      p.maxLife = 0.3 + Math.random() * 0.2;
    }
  }

  update(dt: number) {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.velocity.y -= 4 * dt;  // gravity
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      const t = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = 0.8 * (1 - t);
      p.mesh.scale.setScalar(1 - t * 0.5);
    }
  }
}

// ---- Animated Combo Counter (HTML overlay) ----

export class AnimatedComboCounter {
  private el: HTMLDivElement;
  private currentCombo = 0;
  private displayCombo = 0;
  private scale = 1;
  private targetScale = 1;
  private shakeX = 0;
  private shakeY = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed; right: 30px; top: 50%;
      transform: translateY(-50%);
      font-family: monospace; font-weight: bold;
      color: #00ffff; font-size: 48px;
      text-shadow: 0 0 20px rgba(0,255,255,0.5);
      z-index: 55; pointer-events: none;
      opacity: 0; transition: opacity 0.3s;
    `;
    this.el.innerHTML = `
      <div id="acc-combo" style="text-align: center;">0</div>
      <div style="text-align: center; font-size: 12px; color: #888; letter-spacing: 3px;">COMBO</div>
    `;
    document.body.appendChild(this.el);
  }

  setCombo(combo: number) {
    if (combo === this.currentCombo) return;
    this.currentCombo = combo;

    if (combo === 0) {
      this.el.style.opacity = '0';
      return;
    }

    this.el.style.opacity = '1';
    this.targetScale = 1.2 + Math.min(combo / 100, 0.5);

    // Color by combo level
    if (combo >= 100) {
      this.el.style.color = '#ffd700';
      this.el.style.textShadow = '0 0 25px rgba(255,215,0,0.6)';
    } else if (combo >= 50) {
      this.el.style.color = '#ff00ff';
      this.el.style.textShadow = '0 0 20px rgba(255,0,255,0.5)';
    } else if (combo >= 25) {
      this.el.style.color = '#ff6600';
      this.el.style.textShadow = '0 0 15px rgba(255,102,0,0.4)';
    } else {
      this.el.style.color = '#00ffff';
      this.el.style.textShadow = '0 0 20px rgba(0,255,255,0.5)';
    }

    // Shake on big combos
    if (combo >= 50 && combo % 10 === 0) {
      this.shakeX = (Math.random() - 0.5) * 6;
      this.shakeY = (Math.random() - 0.5) * 6;
    }
  }

  update(dt: number) {
    // Smooth number display
    if (this.displayCombo !== this.currentCombo) {
      const diff = this.currentCombo - this.displayCombo;
      this.displayCombo += Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.2);
      if (Math.abs(this.currentCombo - this.displayCombo) < 1) {
        this.displayCombo = this.currentCombo;
      }
    }

    const el = document.getElementById('acc-combo');
    if (el) el.textContent = String(Math.round(this.displayCombo));

    // Scale animation
    this.scale += (this.targetScale - this.scale) * Math.min(1, dt * 10);
    this.targetScale += (1 - this.targetScale) * Math.min(1, dt * 3);

    // Shake decay
    this.shakeX *= Math.max(0, 1 - dt * 10);
    this.shakeY *= Math.max(0, 1 - dt * 10);

    this.el.style.transform = `translateY(-50%) scale(${this.scale}) translate(${this.shakeX}px, ${this.shakeY}px)`;
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; this.el.style.opacity = '0'; }
}

// ---- Score Popup System ----

interface ScorePopup {
  el: HTMLDivElement;
  life: number;
  y: number;
}

export class ScorePopupSystem {
  private popups: ScorePopup[] = [];

  show(points: number, x: number, quality: string) {
    const el = document.createElement('div');
    const colors: Record<string, string> = {
      perfect: '#00ffff',
      great: '#00ff88',
      good: '#ffcc00',
    };
    const sizes: Record<string, string> = {
      perfect: '18px',
      great: '15px',
      good: '13px',
    };

    el.style.cssText = `
      position: fixed; left: ${50 + (x - 0.5) * 30}%;
      bottom: 35%; color: ${colors[quality] || '#fff'};
      font-family: monospace; font-weight: bold;
      font-size: ${sizes[quality] || '14px'};
      pointer-events: none; z-index: 56;
      text-shadow: 0 0 8px ${colors[quality] || '#fff'};
      transition: transform 0.3s, opacity 0.5s;
    `;
    el.textContent = `+${points}`;
    document.body.appendChild(el);

    const popup: ScorePopup = { el, life: 0, y: 0 };
    this.popups.push(popup);

    // Animate upward
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-40px)';
      el.style.opacity = '0';
    });

    setTimeout(() => {
      el.remove();
      const idx = this.popups.indexOf(popup);
      if (idx >= 0) this.popups.splice(idx, 1);
    }, 800);
  }
}
