// ============================================================
// Neon Beats VR — Object Pooling System
// Reusable pool for blocks, particles, and effects
// Eliminates GC spikes from rapid create/destroy
// ============================================================

import { Mesh, MeshBasicMaterial, BoxGeometry, Group, type Geometry, type Material } from '@iwsdk/core';

// ---- Generic Pool ----

export class ObjectPool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 0) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }
    this.reset(obj);
    this.active.add(obj);
    return obj;
  }

  release(obj: T) {
    this.active.delete(obj);
    this.pool.push(obj);
  }

  releaseAll() {
    for (const obj of this.active) {
      this.pool.push(obj);
    }
    this.active.clear();
  }

  getActiveCount(): number { return this.active.size; }
  getPoolSize(): number { return this.pool.length; }
  getTotalSize(): number { return this.pool.length + this.active.size; }
}

// ---- Mesh Pool ----

export class MeshPool {
  private pool: ObjectPool<Mesh>;
  private parent: Group;

  constructor(
    geometry: BoxGeometry | Geometry,
    materialFactory: () => MeshBasicMaterial,
    parent: Group,
    initialSize: number = 50
  ) {
    this.parent = parent;
    this.pool = new ObjectPool<Mesh>(
      () => {
        const mesh = new Mesh(geometry, materialFactory());
        mesh.visible = false;
        parent.add(mesh);
        return mesh;
      },
      (mesh) => {
        mesh.visible = true;
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        (mesh.material as MeshBasicMaterial).opacity = 1;
      },
      initialSize
    );
  }

  acquire(): Mesh {
    return this.pool.acquire();
  }

  release(mesh: Mesh) {
    mesh.visible = false;
    this.pool.release(mesh);
  }

  releaseAll() {
    this.pool.releaseAll();
  }

  getStats() {
    return {
      active: this.pool.getActiveCount(),
      pooled: this.pool.getPoolSize(),
      total: this.pool.getTotalSize(),
    };
  }
}

// ---- Frame Rate Monitor ----

export class FrameRateMonitor {
  private frameTimes: number[] = [];
  private maxSamples = 60;
  private currentFPS = 60;
  private qualityLevel: 'high' | 'medium' | 'low' = 'high';
  private lowFPSFrames = 0;
  private highFPSFrames = 0;

  addFrame(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getFPS(): number {
    if (this.frameTimes.length === 0) return 60;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.currentFPS = avg > 0 ? 1 / avg : 60;
    return this.currentFPS;
  }

  /**
   * Returns recommended quality level based on frame rate
   */
  getQualityLevel(): 'high' | 'medium' | 'low' {
    const fps = this.getFPS();

    if (fps < 30) {
      this.lowFPSFrames++;
      this.highFPSFrames = 0;
      if (this.lowFPSFrames > 30) {
        this.qualityLevel = 'low';
      } else if (this.lowFPSFrames > 10) {
        this.qualityLevel = 'medium';
      }
    } else if (fps < 50) {
      this.lowFPSFrames++;
      this.highFPSFrames = 0;
      if (this.lowFPSFrames > 30) {
        this.qualityLevel = 'medium';
      }
    } else {
      this.highFPSFrames++;
      this.lowFPSFrames = 0;
      if (this.highFPSFrames > 120) {
        this.qualityLevel = 'high';
      }
    }

    return this.qualityLevel;
  }

  getFrame99th(): number {
    if (this.frameTimes.length === 0) return 0;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.99)] || 0;
  }
}

// ---- Dynamic Quality ----

export interface QualitySettings {
  particleCount: number;
  skyParticleCount: number;
  hitFragmentCount: number;
  enableTrails: boolean;
  enableScreenEffects: boolean;
  enableCrowdAudio: boolean;
  shadowsEnabled: boolean;
}

export function getQualitySettings(level: 'high' | 'medium' | 'low'): QualitySettings {
  switch (level) {
    case 'high':
      return {
        particleCount: 100,
        skyParticleCount: 80,
        hitFragmentCount: 12,
        enableTrails: true,
        enableScreenEffects: true,
        enableCrowdAudio: true,
        shadowsEnabled: true,
      };
    case 'medium':
      return {
        particleCount: 50,
        skyParticleCount: 40,
        hitFragmentCount: 6,
        enableTrails: true,
        enableScreenEffects: true,
        enableCrowdAudio: false,
        shadowsEnabled: false,
      };
    case 'low':
      return {
        particleCount: 20,
        skyParticleCount: 15,
        hitFragmentCount: 3,
        enableTrails: false,
        enableScreenEffects: false,
        enableCrowdAudio: false,
        shadowsEnabled: false,
      };
  }
}
