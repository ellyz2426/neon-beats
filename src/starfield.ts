// ============================================================
// Neon Beats VR — Dynamic Starfield & Grid Visualizer
// Procedural background that reacts to music intensity
// ============================================================

import {
  Group,
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Color,
  AdditiveBlending,
  BoxGeometry,
  MeshBasicMaterial,
  PlaneGeometry,
  DoubleSide,
} from '@iwsdk/core';

// ---- Reactive Starfield ----

export class ReactiveStarfield {
  private group: Group;
  private points: Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private starCount: number;
  private baseColor: Color;
  private accentColor: Color;
  private intensity = 0;
  private warpSpeed = 0;

  constructor(count: number = 500, spread: number = 30, depth: number = 50) {
    this.group = new Group();
    this.starCount = count;
    this.baseColor = new Color(0x4488ff);
    this.accentColor = new Color(0xff00ff);

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * spread;
      this.positions[i3 + 1] = Math.random() * 10 + 1;
      this.positions[i3 + 2] = -Math.random() * depth;

      this.velocities[i3] = (Math.random() - 0.5) * 0.5;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      this.velocities[i3 + 2] = Math.random() * 2 + 0.5;

      // Random between base and accent
      const t = Math.random();
      this.colors[i3] = this.baseColor.r * (1 - t) + this.accentColor.r * t;
      this.colors[i3 + 1] = this.baseColor.g * (1 - t) + this.accentColor.g * t;
      this.colors[i3 + 2] = this.baseColor.b * (1 - t) + this.accentColor.b * t;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(this.colors, 3));

    const mat = new PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.points = new Points(geo, mat);
    this.group.add(this.points);
  }

  getGroup(): Group { return this.group; }

  setColors(base: Color, accent: Color) {
    this.baseColor.copy(base);
    this.accentColor.copy(accent);
  }

  setBeatIntensity(val: number) { this.intensity = val; }
  setWarpSpeed(val: number) { this.warpSpeed = val; }

  update(dt: number, beatIntensity: number, combo: number) {
    const speed = 1 + this.warpSpeed * 3 + beatIntensity * 2 + combo * 0.02;
    const sizeMultiplier = 1 + beatIntensity * 0.5;

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      this.positions[i3] += this.velocities[i3] * dt;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * speed * dt;

      // Wrap stars back when they pass the camera
      if (this.positions[i3 + 2] > 5) {
        this.positions[i3 + 2] = -50;
        this.positions[i3] = (Math.random() - 0.5) * 30;
        this.positions[i3 + 1] = Math.random() * 10 + 1;
      }

      // Beat-reactive color pulse
      const pulse = Math.min(1, beatIntensity * 1.5);
      const t = Math.random() * 0.1; // subtle variation
      this.colors[i3] = this.baseColor.r * (1 - pulse) + this.accentColor.r * pulse + t;
      this.colors[i3 + 1] = this.baseColor.g * (1 - pulse) + this.accentColor.g * pulse + t;
      this.colors[i3 + 2] = this.baseColor.b * (1 - pulse) + this.accentColor.b * pulse + t;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    (this.points.material as PointsMaterial).size = 0.06 * sizeMultiplier;
    (this.points.material as PointsMaterial).opacity = 0.4 + beatIntensity * 0.4;
  }
}

// ---- Infinite Grid Floor ----

export class InfiniteGridFloor {
  private group: Group;
  private gridLines: Mesh[] = [];
  private crossLines: Mesh[] = [];
  private scrollOffset = 0;
  private numLines: number;
  private spacing: number;
  private material: MeshBasicMaterial;

  constructor(width: number = 20, depth: number = 40, spacing: number = 1) {
    this.group = new Group();
    this.spacing = spacing;
    this.numLines = Math.ceil(depth / spacing) + 2;

    this.material = new MeshBasicMaterial({
      color: 0x003344,
      transparent: true,
      opacity: 0.15,
    });

    // Horizontal scrolling lines
    const lineGeo = new BoxGeometry(width, 0.003, 0.02);
    for (let i = 0; i < this.numLines; i++) {
      const line = new Mesh(lineGeo, this.material.clone());
      line.position.set(0, -0.01, -i * spacing);
      this.group.add(line);
      this.gridLines.push(line);
    }

    // Vertical static lines
    const vLineGeo = new BoxGeometry(0.02, 0.003, depth);
    const numVLines = Math.ceil(width / spacing);
    for (let i = -numVLines / 2; i <= numVLines / 2; i++) {
      const line = new Mesh(vLineGeo, this.material.clone());
      line.position.set(i * spacing, -0.01, -depth / 2);
      this.group.add(line);
      this.crossLines.push(line);
    }
  }

  getGroup(): Group { return this.group; }

  setColor(color: number) {
    for (const line of this.gridLines) {
      (line.material as MeshBasicMaterial).color.set(color);
    }
    for (const line of this.crossLines) {
      (line.material as MeshBasicMaterial).color.set(color);
    }
  }

  update(dt: number, speed: number, beatIntensity: number) {
    this.scrollOffset += speed * dt;

    for (let i = 0; i < this.gridLines.length; i++) {
      let z = -i * this.spacing + (this.scrollOffset % (this.numLines * this.spacing));
      if (z > 5) z -= this.numLines * this.spacing;
      this.gridLines[i].position.z = z;

      const dist = Math.abs(z);
      const alpha = Math.max(0.02, 0.2 - dist * 0.005) + beatIntensity * 0.1;
      (this.gridLines[i].material as MeshBasicMaterial).opacity = alpha;
    }

    // Beat pulse on vertical lines
    for (const line of this.crossLines) {
      (line.material as MeshBasicMaterial).opacity = 0.08 + beatIntensity * 0.08;
    }
  }
}

// ---- Pulse Ring ----
// Expanding rings that fire on beat

interface PulseRingInstance {
  mesh: Mesh;
  life: number;
  maxLife: number;
  speed: number;
  active: boolean;
}

export class BeatPulseRings {
  private group: Group;
  private rings: PulseRingInstance[] = [];
  private baseColor: Color;

  constructor(poolSize: number = 8) {
    this.group = new Group();
    this.baseColor = new Color(0x00ffff);

    const geo = new PlaneGeometry(1, 1);

    for (let i = 0; i < poolSize; i++) {
      const mat = new MeshBasicMaterial({
        color: this.baseColor,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        side: DoubleSide,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.01;
      mesh.visible = false;
      this.group.add(mesh);

      this.rings.push({
        mesh,
        life: 0,
        maxLife: 1,
        speed: 3,
        active: false,
      });
    }
  }

  getGroup(): Group { return this.group; }

  setColor(color: Color) { this.baseColor.copy(color); }

  emit(z: number = -3, intensity: number = 1) {
    for (const ring of this.rings) {
      if (!ring.active) {
        ring.active = true;
        ring.life = 0;
        ring.maxLife = 0.8 + intensity * 0.4;
        ring.speed = 2 + intensity * 4;
        ring.mesh.visible = true;
        ring.mesh.position.z = z;
        ring.mesh.scale.set(0.1, 0.1, 0.1);
        (ring.mesh.material as MeshBasicMaterial).opacity = 0.5 * intensity;
        (ring.mesh.material as MeshBasicMaterial).color.copy(this.baseColor);
        break;
      }
    }
  }

  update(dt: number) {
    for (const ring of this.rings) {
      if (!ring.active) continue;
      ring.life += dt;
      const t = ring.life / ring.maxLife;
      if (t >= 1) {
        ring.active = false;
        ring.mesh.visible = false;
        continue;
      }

      const scale = 0.1 + t * ring.speed * 2;
      ring.mesh.scale.set(scale, scale, 1);
      (ring.mesh.material as MeshBasicMaterial).opacity = (1 - t) * 0.4;
    }
  }
}

// ---- Waveform Ribbon ----
// Side ribbons that pulse with audio data

export class WaveformRibbon {
  private group: Group;
  private segments: Mesh[] = [];
  private segCount: number;
  private side: 'left' | 'right';

  constructor(side: 'left' | 'right', segCount: number = 32, height: number = 3, xOffset: number = 3) {
    this.group = new Group();
    this.side = side;
    this.segCount = segCount;

    const segGeo = new BoxGeometry(0.08, 0.08, 0.3);
    const x = side === 'left' ? -xOffset : xOffset;

    for (let i = 0; i < segCount; i++) {
      const mat = new MeshBasicMaterial({
        color: side === 'left' ? 0x00ffff : 0xff00ff,
        transparent: true,
        opacity: 0.3,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const seg = new Mesh(segGeo, mat);
      seg.position.set(x, 0.5 + (i / segCount) * height, -5);
      this.group.add(seg);
      this.segments.push(seg);
    }
  }

  getGroup(): Group { return this.group; }

  update(dt: number, beatIntensity: number, time: number) {
    for (let i = 0; i < this.segCount; i++) {
      const t = i / this.segCount;
      const wave = Math.sin(time * 4 + t * Math.PI * 4) * 0.5 + 0.5;
      const intensity = wave * beatIntensity;
      const scaleX = 1 + intensity * 3;
      this.segments[i].scale.x = scaleX;
      (this.segments[i].material as MeshBasicMaterial).opacity = 0.1 + intensity * 0.4;
    }
  }
}
