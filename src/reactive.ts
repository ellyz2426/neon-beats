// ============================================================
// Neon Beats VR — Reactive Environment
// Background environment that reacts to music and performance:
//   - Pulsing walls that throb on beat
//   - Moving floor grid that speeds with combo
//   - Sky/ceiling particles that respond to intensity
//   - Stage color transitions between song sections
//   - Miss/fail screen darkening and crack effects
//   - Perfect streak escalating intensity
// ============================================================

import {
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  AdditiveBlending,
  BoxGeometry,
  SphereGeometry,
  RingGeometry,
  DoubleSide,
  Vector3,
} from '@iwsdk/core';

// ---- Reactive Walls ----

export class ReactiveWalls {
  private group: Group;
  private leftWall: Mesh;
  private rightWall: Mesh;
  private leftMat: MeshBasicMaterial;
  private rightMat: MeshBasicMaterial;
  private baseColor = new Color(0x001122);
  private pulseColor = new Color(0x003366);
  private intensity = 0;

  constructor(distance: number = 4, height: number = 6, depth: number = 20) {
    this.group = new Group();

    const geo = new PlaneGeometry(depth, height, 16, 8);
    this.leftMat = new MeshBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
    });
    this.rightMat = new MeshBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
    });

    this.leftWall = new Mesh(geo, this.leftMat);
    this.leftWall.position.set(-distance, height / 2, -depth / 2);
    this.leftWall.rotation.y = Math.PI / 2;

    this.rightWall = new Mesh(geo.clone(), this.rightMat);
    this.rightWall.position.set(distance, height / 2, -depth / 2);
    this.rightWall.rotation.y = -Math.PI / 2;

    this.group.add(this.leftWall, this.rightWall);
  }

  getGroup(): Group { return this.group; }

  setBeatIntensity(intensity: number) { this.intensity = intensity; }

  setColor(color: Color) {
    this.pulseColor.copy(color);
  }

  update(dt: number, time: number) {
    const t = this.intensity * 0.5;
    const c = this.baseColor.clone().lerp(this.pulseColor, t);
    this.leftMat.color.copy(c);
    this.rightMat.color.copy(c);
    this.leftMat.opacity = 0.15 + t * 0.25;
    this.rightMat.opacity = 0.15 + t * 0.25;

    // Subtle wave animation
    const wave = Math.sin(time * 2) * 0.05 * this.intensity;
    this.leftWall.position.x = -4 + wave;
    this.rightWall.position.x = 4 - wave;
  }
}

// ---- Moving Floor Grid ----

export class FloorGrid {
  private group: Group;
  private lines: Mesh[] = [];
  private material: MeshBasicMaterial;
  private scrollSpeed = 1;
  private scrollOffset = 0;
  private numLines = 30;
  private spacing = 0.5;

  constructor(width: number = 8, depth: number = 15) {
    this.group = new Group();
    this.material = new MeshBasicMaterial({
      color: 0x003344,
      transparent: true,
      opacity: 0.2,
    });

    // Horizontal lines that scroll toward player
    const lineGeo = new BoxGeometry(width, 0.005, 0.02);
    for (let i = 0; i < this.numLines; i++) {
      const line = new Mesh(lineGeo, this.material.clone());
      line.position.set(0, 0.001, -i * this.spacing);
      this.group.add(line);
      this.lines.push(line);
    }
  }

  getGroup(): Group { return this.group; }

  setSpeed(speed: number) { this.scrollSpeed = speed; }

  setColor(color: number) {
    this.material.color.set(color);
  }

  update(dt: number, beatIntensity: number, combo: number) {
    const speed = this.scrollSpeed * (1 + combo * 0.01) + beatIntensity * 2;
    this.scrollOffset += speed * dt;

    for (let i = 0; i < this.lines.length; i++) {
      let z = -i * this.spacing + (this.scrollOffset % (this.numLines * this.spacing));
      if (z > 2) z -= this.numLines * this.spacing;
      this.lines[i].position.z = z;
      // Fade based on distance
      const dist = Math.abs(z);
      (this.lines[i].material as MeshBasicMaterial).opacity = Math.max(0.05, 0.3 - dist * 0.02);
    }

    // Beat pulse color
    const pulse = beatIntensity * 0.3;
    this.material.opacity = 0.15 + pulse;
  }
}

// ---- Sky Particles ----

interface SkyParticle {
  mesh: Mesh;
  basePos: Vector3;
  speed: number;
  phase: number;
}

export class SkyParticles {
  private group: Group;
  private particles: SkyParticle[] = [];
  private material: MeshBasicMaterial;

  constructor(count: number = 80, spread: number = 10, height: number = 5) {
    this.group = new Group();
    this.material = new MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
    });

    const geo = new SphereGeometry(0.015, 4, 4);

    for (let i = 0; i < count; i++) {
      const mat = this.material.clone();
      const mesh = new Mesh(geo, mat);
      const basePos = new Vector3(
        (Math.random() - 0.5) * spread,
        2 + Math.random() * height,
        -Math.random() * 15
      );
      mesh.position.copy(basePos);
      this.group.add(mesh);

      this.particles.push({
        mesh,
        basePos,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  getGroup(): Group { return this.group; }

  setColor(color: Color) {
    this.material.color.copy(color);
  }

  update(dt: number, time: number, beatIntensity: number, combo: number) {
    const baseIntensity = 0.1 + beatIntensity * 0.3 + Math.min(combo * 0.002, 0.3);

    for (const p of this.particles) {
      // Gentle float
      p.mesh.position.x = p.basePos.x + Math.sin(time * p.speed + p.phase) * 0.3;
      p.mesh.position.y = p.basePos.y + Math.sin(time * p.speed * 0.7 + p.phase) * 0.2;
      p.mesh.position.z = p.basePos.z + Math.cos(time * p.speed * 0.5) * 0.15;

      // Brightness scales with beat and combo
      (p.mesh.material as MeshBasicMaterial).opacity = baseIntensity + Math.sin(time * 3 + p.phase) * 0.05;

      // Scale up on beat
      const s = 1 + beatIntensity * 0.5;
      p.mesh.scale.setScalar(s);
    }
  }
}

// ---- Stage Transition Manager ----

interface StageTheme {
  name: string;
  wallColor: Color;
  floorColor: number;
  skyColor: Color;
  fogColor: number;
  triggerCombo: number;
}

export class StageManager {
  private stages: StageTheme[] = [
    { name: 'calm', wallColor: new Color(0x001122), floorColor: 0x003344, skyColor: new Color(0x002244), fogColor: 0x000811, triggerCombo: 0 },
    { name: 'warm', wallColor: new Color(0x221100), floorColor: 0x443300, skyColor: new Color(0x331100), fogColor: 0x110800, triggerCombo: 10 },
    { name: 'electric', wallColor: new Color(0x002255), floorColor: 0x0055ff, skyColor: new Color(0x0044ff), fogColor: 0x000822, triggerCombo: 25 },
    { name: 'fire', wallColor: new Color(0x441100), floorColor: 0xff3300, skyColor: new Color(0xff2200), fogColor: 0x110400, triggerCombo: 50 },
    { name: 'golden', wallColor: new Color(0x332200), floorColor: 0xffdd00, skyColor: new Color(0xffcc00), fogColor: 0x111000, triggerCombo: 100 },
  ];

  private currentStage = 0;
  private transitionProgress = 1;
  private transitionSpeed = 0.5;

  getCurrentStage(): StageTheme { return this.stages[this.currentStage]; }

  update(combo: number, dt: number): StageTheme | null {
    // Check if we should transition
    let targetStage = 0;
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (combo >= this.stages[i].triggerCombo) {
        targetStage = i;
        break;
      }
    }

    if (targetStage !== this.currentStage) {
      this.currentStage = targetStage;
      this.transitionProgress = 0;
      return this.stages[targetStage];
    }

    this.transitionProgress = Math.min(1, this.transitionProgress + dt * this.transitionSpeed);
    return null;
  }

  getTransitionProgress(): number { return this.transitionProgress; }
}

// ---- Miss Screen Effect ----

export class MissScreenEffect {
  private overlay: HTMLDivElement;
  private crackCanvas: HTMLCanvasElement;
  private crackCtx: CanvasRenderingContext2D;
  private darkIntensity = 0;
  private crackIntensity = 0;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 3; opacity: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(255,0,68,0.2) 100%);
    `;
    document.body.appendChild(this.overlay);

    this.crackCanvas = document.createElement('canvas');
    this.crackCanvas.width = 200;
    this.crackCanvas.height = 200;
    this.crackCanvas.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      pointer-events: none; z-index: 4; opacity: 0; width: 100%; height: 100%;
    `;
    this.crackCtx = this.crackCanvas.getContext('2d')!;
    document.body.appendChild(this.crackCanvas);
  }

  triggerDarken(intensity: number = 0.3) {
    this.darkIntensity = Math.max(this.darkIntensity, intensity);
  }

  triggerCrack() {
    this.crackIntensity = 1;
    this.drawCrack();
  }

  private drawCrack() {
    const ctx = this.crackCtx;
    const W = this.crackCanvas.width;
    const H = this.crackCanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255, 0, 68, 0.5)';
    ctx.lineWidth = 1;

    // Draw random crack lines from center
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let x = cx, y = cy;
      const steps = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < steps; j++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  update(dt: number) {
    this.darkIntensity = Math.max(0, this.darkIntensity - dt * 2);
    this.crackIntensity = Math.max(0, this.crackIntensity - dt * 3);

    this.overlay.style.opacity = String(this.darkIntensity);
    this.crackCanvas.style.opacity = String(this.crackIntensity);
  }
}

// ---- Perfect Streak Glow ----

export class PerfectStreakGlow {
  private overlay: HTMLDivElement;
  private streakCount = 0;
  private intensity = 0;
  private color = new Color(0xffd700);

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 2; opacity: 0;
      background: radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%);
    `;
    document.body.appendChild(this.overlay);
  }

  onPerfect() {
    this.streakCount++;
    if (this.streakCount >= 5) {
      this.intensity = Math.min(0.5, this.streakCount * 0.02);
    }
  }

  onNonPerfect() {
    this.streakCount = 0;
  }

  update(dt: number) {
    if (this.streakCount < 5) {
      this.intensity = Math.max(0, this.intensity - dt * 2);
    }
    this.overlay.style.opacity = String(this.intensity);

    // Pulse effect
    if (this.intensity > 0) {
      const pulse = Math.sin(Date.now() / 200) * 0.05;
      this.overlay.style.opacity = String(Math.max(0, this.intensity + pulse));
    }
  }
}
