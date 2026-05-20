// ============================================================
// Neon Beats VR — Power-Up System
// Collectible power-ups that appear during gameplay:
//   - Score Boost (2x score for 10 seconds)
//   - Time Slow (blocks move at 50% for 8 seconds)
//   - Shield (absorb next 3 misses)
//   - Mega Combo (combo doesn't reset for 15 seconds)
//   - Perfect Wave (all hits count as perfect for 5 seconds)
// ============================================================

import {
  Group,
  Mesh,
  OctahedronGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  BoxGeometry,
} from '@iwsdk/core';

// ---- Power-Up Types ----

export type PowerUpType = 'score_boost' | 'time_slow' | 'shield' | 'mega_combo' | 'perfect_wave';

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  color: string;
  duration: number; // seconds
  icon: string;
}

const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  score_boost: {
    type: 'score_boost',
    name: 'SCORE BOOST',
    description: '2× score for 10 seconds',
    color: '#ffd700',
    duration: 10,
    icon: '⚡',
  },
  time_slow: {
    type: 'time_slow',
    name: 'TIME SLOW',
    description: 'Blocks slow to 50% for 8 seconds',
    color: '#00ffff',
    duration: 8,
    icon: '⏳',
  },
  shield: {
    type: 'shield',
    name: 'SHIELD',
    description: 'Absorb next 3 misses',
    color: '#00ff88',
    duration: 30,
    icon: '🛡️',
  },
  mega_combo: {
    type: 'mega_combo',
    name: 'MEGA COMBO',
    description: 'Combo never resets for 15 seconds',
    color: '#ff00ff',
    duration: 15,
    icon: '🔥',
  },
  perfect_wave: {
    type: 'perfect_wave',
    name: 'PERFECT WAVE',
    description: 'All hits count as Perfect for 5 seconds',
    color: '#ffffff',
    duration: 5,
    icon: '✨',
  },
};

export function getPowerUpConfig(type: PowerUpType): PowerUpConfig {
  return POWERUP_CONFIGS[type];
}

// ---- Active Power-Up State ----

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  shieldHits?: number;
}

export class PowerUpManager {
  private active: ActivePowerUp[] = [];
  private spawnCooldown = 0;
  private spawnInterval = 20; // seconds between spawns
  private spawned: PowerUpPickup[] = [];
  private container: Group;

  constructor() {
    this.container = new Group();
  }

  getContainer(): Group { return this.container; }

  update(dt: number, songTime: number): void {
    // Update active power-ups
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.active[i].remainingTime -= dt;
      if (this.active[i].remainingTime <= 0) {
        this.active.splice(i, 1);
      }
    }

    // Update spawned pickups
    for (const pickup of this.spawned) {
      pickup.update(dt);
    }

    // Spawn check
    this.spawnCooldown -= dt;
  }

  shouldSpawn(): boolean {
    if (this.spawnCooldown <= 0 && this.spawned.length === 0) {
      this.spawnCooldown = this.spawnInterval;
      return true;
    }
    return false;
  }

  spawnPickup(x: number, y: number, z: number): PowerUpPickup {
    const types: PowerUpType[] = ['score_boost', 'time_slow', 'shield', 'mega_combo', 'perfect_wave'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_CONFIGS[type];

    const pickup = new PowerUpPickup(type, config.color, x, y, z);
    this.container.add(pickup.getGroup());
    this.spawned.push(pickup);
    return pickup;
  }

  collectPickup(pickup: PowerUpPickup): ActivePowerUp {
    const idx = this.spawned.indexOf(pickup);
    if (idx >= 0) {
      this.spawned.splice(idx, 1);
      this.container.remove(pickup.getGroup());
    }

    const config = POWERUP_CONFIGS[pickup.type];
    const activePU: ActivePowerUp = {
      type: pickup.type,
      remainingTime: config.duration,
      shieldHits: pickup.type === 'shield' ? 3 : undefined,
    };

    // Check if already active — extend duration
    const existing = this.active.find(a => a.type === pickup.type);
    if (existing) {
      existing.remainingTime += config.duration;
      if (existing.shieldHits !== undefined && activePU.shieldHits !== undefined) {
        existing.shieldHits += activePU.shieldHits;
      }
      return existing;
    }

    this.active.push(activePU);
    return activePU;
  }

  isActive(type: PowerUpType): boolean {
    return this.active.some(a => a.type === type);
  }

  getActiveOfType(type: PowerUpType): ActivePowerUp | undefined {
    return this.active.find(a => a.type === type);
  }

  getScoreMultiplier(): number {
    return this.isActive('score_boost') ? 2 : 1;
  }

  getSpeedMultiplier(): number {
    return this.isActive('time_slow') ? 0.5 : 1;
  }

  canAbsorbMiss(): boolean {
    const shield = this.getActiveOfType('shield');
    if (shield && shield.shieldHits && shield.shieldHits > 0) {
      shield.shieldHits--;
      if (shield.shieldHits <= 0) {
        const idx = this.active.indexOf(shield);
        if (idx >= 0) this.active.splice(idx, 1);
      }
      return true;
    }
    return false;
  }

  isComboProtected(): boolean {
    return this.isActive('mega_combo');
  }

  isPerfectWave(): boolean {
    return this.isActive('perfect_wave');
  }

  getActiveList(): ActivePowerUp[] {
    return [...this.active];
  }

  clearAll() {
    this.active = [];
    for (const pickup of this.spawned) {
      this.container.remove(pickup.getGroup());
    }
    this.spawned = [];
  }
}

// ---- Power-Up Pickup (3D object in scene) ----

export class PowerUpPickup {
  public type: PowerUpType;
  private group: Group;
  private mesh: Mesh;
  private material: MeshBasicMaterial;
  private time = 0;
  public alive = true;
  public lifeTime = 8; // seconds before it disappears

  constructor(type: PowerUpType, color: string, x: number, y: number, z: number) {
    this.type = type;
    this.group = new Group();

    const geo = new OctahedronGeometry(0.15, 0);
    this.material = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.material);
    this.group.add(this.mesh);

    // Inner glow
    const innerGeo = new OctahedronGeometry(0.08, 0);
    const innerMat = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
    });
    this.group.add(new Mesh(innerGeo, innerMat));

    this.group.position.set(x, y, z);
  }

  getGroup(): Group { return this.group; }
  getPosition() { return this.group.position; }

  update(dt: number) {
    this.time += dt;
    this.mesh.rotation.y += dt * 2;
    this.mesh.rotation.x += dt * 1.5;

    // Bob up and down
    this.group.position.y += Math.sin(this.time * 3) * 0.003;

    // Fade out near end of life
    if (this.time > this.lifeTime - 2) {
      const t = (this.lifeTime - this.time) / 2;
      this.material.opacity = 0.8 * Math.max(0, t);
      // Blink when about to expire
      if (t < 1) {
        this.material.opacity *= Math.sin(this.time * 10) > 0 ? 1 : 0.3;
      }
    }

    if (this.time >= this.lifeTime) {
      this.alive = false;
    }
  }
}

// ---- Power-Up HUD ----

export function renderPowerUpHUD(active: ActivePowerUp[]): string {
  if (active.length === 0) return '';

  const items = active.map(pu => {
    const config = POWERUP_CONFIGS[pu.type];
    const pct = (pu.remainingTime / config.duration * 100);
    const extraInfo = pu.shieldHits !== undefined ? ` (${pu.shieldHits} hits)` : '';

    return `
      <div style="display: flex; align-items: center; gap: 6px; padding: 4px 8px;
        background: ${config.color}15; border-left: 3px solid ${config.color};
        border-radius: 0 4px 4px 0;">
        <span style="font-size: 14px;">${config.icon}</span>
        <div style="flex: 1;">
          <div style="font-size: 10px; color: ${config.color};">${config.name}${extraInfo}</div>
          <div style="height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; margin-top: 2px;">
            <div style="height: 100%; width: ${pct}%; background: ${config.color}; border-radius: 1px;
              transition: width 0.2s;"></div>
          </div>
        </div>
        <span style="font-size: 10px; opacity: 0.5;">${Math.ceil(pu.remainingTime)}s</span>
      </div>
    `;
  }).join('');

  return `
    <div style="
      position: fixed; top: 100px; right: 10px; z-index: 80;
      display: flex; flex-direction: column; gap: 4px;
      font-family: 'Courier New', monospace; pointer-events: none;
      min-width: 150px;
    ">
      ${items}
    </div>
  `;
}
