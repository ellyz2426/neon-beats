// ============================================================
// Neon Beats VR — Zen Mode
// No scoring, no health, just vibes and music
// Blocks gently flow past, hitting them creates beautiful effects
// Time slows, colors shift, environment breathes
// ============================================================

import {
  Group, Mesh, SphereGeometry, MeshBasicMaterial,
  Color, AdditiveBlending, Vector3,
} from '@iwsdk/core';

// ---- Zen State ----

export interface ZenModeState {
  active: boolean;
  timeAlive: number;
  totalHits: number;
  colorCyclePhase: number;
  breathRate: number;
  calmLevel: number;  // builds over time
}

export function createZenModeState(): ZenModeState {
  return {
    active: false,
    timeAlive: 0,
    totalHits: 0,
    colorCyclePhase: 0,
    breathRate: 4,  // seconds per breath cycle
    calmLevel: 0,
  };
}

export function updateZenMode(state: ZenModeState, dt: number): { color: Color; breathIntensity: number } {
  if (!state.active) return { color: new Color(0x00ffff), breathIntensity: 0 };

  state.timeAlive += dt;
  state.colorCyclePhase += dt * 0.05;
  state.calmLevel = Math.min(1, state.timeAlive / 120);  // fully calm after 2 minutes

  // Slow color cycle through the rainbow
  const hue = (state.colorCyclePhase % 1);
  const color = new Color().setHSL(hue, 0.6, 0.5);

  // Breathing intensity
  const breathPhase = (state.timeAlive % state.breathRate) / state.breathRate;
  const breathIntensity = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5;

  return { color, breathIntensity };
}

// ---- Zen Particles (ambient floating orbs) ----

interface ZenOrb {
  mesh: Mesh;
  basePos: Vector3;
  speed: number;
  phase: number;
  radius: number;
}

export class ZenParticleField {
  private group: Group;
  private orbs: ZenOrb[] = [];

  constructor(count: number = 60) {
    this.group = new Group();
    const geo = new SphereGeometry(0.04, 8, 8);

    for (let i = 0; i < count; i++) {
      const mat = new MeshBasicMaterial({
        color: new Color().setHSL(Math.random(), 0.5, 0.5),
        transparent: true,
        opacity: 0.3,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(geo, mat);
      const basePos = new Vector3(
        (Math.random() - 0.5) * 12,
        0.5 + Math.random() * 5,
        -Math.random() * 20
      );
      mesh.position.copy(basePos);
      this.group.add(mesh);

      this.orbs.push({
        mesh,
        basePos,
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        radius: 0.3 + Math.random() * 0.8,
      });
    }
  }

  getGroup(): Group { return this.group; }

  update(dt: number, time: number, breathIntensity: number, zenColor: Color) {
    for (const orb of this.orbs) {
      // Gentle floating motion
      orb.mesh.position.x = orb.basePos.x + Math.sin(time * orb.speed + orb.phase) * orb.radius;
      orb.mesh.position.y = orb.basePos.y + Math.cos(time * orb.speed * 0.7 + orb.phase) * orb.radius * 0.5;
      orb.mesh.position.z = orb.basePos.z + Math.sin(time * orb.speed * 0.3) * 0.5;

      // Color slowly shifts
      const mat = orb.mesh.material as MeshBasicMaterial;
      mat.color.lerp(zenColor, dt * 0.3);

      // Breath-linked opacity
      mat.opacity = 0.15 + breathIntensity * 0.2;

      // Scale with breath
      const s = 0.8 + breathIntensity * 0.4;
      orb.mesh.scale.setScalar(s);
    }
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }
}

// ---- Zen HUD (minimal) ----

let zenHudEl: HTMLDivElement | null = null;

export function showZenHUD() {
  if (!zenHudEl) {
    zenHudEl = document.createElement('div');
    zenHudEl.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      font-family: monospace; z-index: 50; pointer-events: none;
      text-align: center;
    `;
    zenHudEl.innerHTML = `
      <div style="color: rgba(255,255,255,0.2); font-size: 12px; letter-spacing: 3px;">ZEN MODE</div>
      <div id="zen-timer" style="color: rgba(255,255,255,0.1); font-size: 11px; margin-top: 3px;">0:00</div>
    `;
    document.body.appendChild(zenHudEl);
  }
  zenHudEl.style.display = 'block';
}

export function updateZenHUD(timeAlive: number) {
  const timerEl = document.getElementById('zen-timer');
  if (timerEl) {
    const mins = Math.floor(timeAlive / 60);
    const secs = Math.floor(timeAlive % 60);
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export function hideZenHUD() {
  if (zenHudEl) zenHudEl.style.display = 'none';
}
