// ============================================================
// Neon Beats VR — Block Trails
// Glowing trails that follow blocks as they approach
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
} from '@iwsdk/core';

interface TrailSegment {
  mesh: Mesh;
  material: MeshBasicMaterial;
  age: number;
  active: boolean;
}

const TRAIL_POOL_SIZE = 200;
const TRAIL_SEGMENT_LIFETIME = 0.3;
const TRAIL_SPAWN_INTERVAL = 0.02;

export class BlockTrailSystem {
  private group: Group;
  private pool: TrailSegment[] = [];
  private spawnTimer = 0;
  private enabled = true;

  constructor() {
    this.group = new Group();

    const geo = new BoxGeometry(0.08, 0.08, 0.02);
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const mat = new MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        material: mat,
        age: 0,
        active: false,
      });
    }
  }

  getGroup(): Group { return this.group; }
  setEnabled(enabled: boolean) { this.enabled = enabled; }

  /**
   * Spawn a trail segment at a position
   */
  emit(x: number, y: number, z: number, color: Color | number) {
    if (!this.enabled) return;

    for (const seg of this.pool) {
      if (!seg.active) {
        seg.active = true;
        seg.age = 0;
        seg.mesh.visible = true;
        seg.mesh.position.set(x, y, z);
        seg.material.color.set(color);
        seg.material.opacity = 0.4;
        seg.mesh.scale.setScalar(1);
        return;
      }
    }
  }

  /**
   * Batch emit for multiple blocks
   */
  emitForBlocks(blocks: Array<{ x: number; y: number; z: number; color: Color | number }>) {
    if (!this.enabled) return;
    this.spawnTimer += 0.016; // ~60fps

    if (this.spawnTimer >= TRAIL_SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      for (const block of blocks) {
        this.emit(block.x, block.y, block.z, block.color);
      }
    }
  }

  update(dt: number) {
    for (const seg of this.pool) {
      if (!seg.active) continue;
      seg.age += dt;

      const t = seg.age / TRAIL_SEGMENT_LIFETIME;
      if (t >= 1) {
        seg.active = false;
        seg.mesh.visible = false;
        continue;
      }

      seg.material.opacity = 0.4 * (1 - t);
      const scale = 1 - t * 0.5;
      seg.mesh.scale.setScalar(scale);
    }
  }

  clear() {
    for (const seg of this.pool) {
      seg.active = false;
      seg.mesh.visible = false;
    }
  }
}

// ---- Enhanced Loading Screen ----

export function showLoadingScreen(songName: string, color: string = '#00ffff'): HTMLDivElement {
  const existing = document.getElementById('loadingScreen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'loadingScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,2,15,0.98) 0%, rgba(0,0,0,1) 100%);
    z-index: 300; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: none;
  `;

  screen.innerHTML = `
    <div style="text-align: center;">
      <!-- Song name -->
      <div style="font-size: 28px; color: ${color}; letter-spacing: 3px;
        text-shadow: 0 0 20px ${color}; margin-bottom: 8px;
        animation: loadPulse 1.5s ease-in-out infinite;">
        ${songName}
      </div>
      
      <!-- Loading bar -->
      <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.1);
        border-radius: 2px; margin: 20px auto; overflow: hidden;">
        <div id="loadingProgress" style="height: 100%; width: 0%; background: ${color};
          border-radius: 2px; transition: width 0.3s; box-shadow: 0 0 10px ${color};"></div>
      </div>
      
      <!-- Loading text -->
      <div id="loadingText" style="font-size: 12px; opacity: 0.4; letter-spacing: 2px;">
        GENERATING BEATS...
      </div>
      
      <!-- Decorative dots -->
      <div style="margin-top: 30px; display: flex; gap: 8px; justify-content: center;">
        ${[0, 1, 2, 3, 4].map(i => `
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};
            opacity: 0.3; animation: loadDot 1s ease-in-out ${i * 0.15}s infinite;"></div>
        `).join('')}
      </div>
    </div>
    
    <style>
      @keyframes loadPulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; text-shadow: 0 0 40px ${color}; }
      }
      @keyframes loadDot {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    </style>
  `;

  document.body.appendChild(screen);
  return screen;
}

export function updateLoadingProgress(percent: number, text?: string) {
  const bar = document.getElementById('loadingProgress') as HTMLElement;
  const label = document.getElementById('loadingText') as HTMLElement;
  if (bar) bar.style.width = `${Math.min(100, percent)}%`;
  if (label && text) label.textContent = text;
}

export function hideLoadingScreen() {
  const screen = document.getElementById('loadingScreen');
  if (screen) {
    screen.style.transition = 'opacity 0.5s';
    screen.style.opacity = '0';
    setTimeout(() => screen.remove(), 500);
  }
}
