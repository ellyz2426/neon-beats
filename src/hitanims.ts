// ============================================================
// Neon Beats VR — Hit Animations & Destruction Effects
// Per-block-type hit animations:
//   - Normal: shatter into fragments
//   - Hold: dissolve with sparks
//   - Double: explode outward
//   - Bomb: screen-flash + debris
//   - Perfect: golden burst + star field
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  SphereGeometry,
  Color,
  Vector3,
  AdditiveBlending,
  IcosahedronGeometry,
} from '@iwsdk/core';

// ---- Fragment Pool ----

interface Fragment {
  mesh: Mesh;
  velocity: Vector3;
  angVelocity: Vector3;
  life: number;
  maxLife: number;
  gravity: number;
  active: boolean;
}

const POOL_SIZE = 120;

export class HitAnimationSystem {
  private group: Group;
  private pool: Fragment[] = [];
  private activeFragments: Fragment[] = [];

  // Shared geometries
  private shardGeo: BoxGeometry;
  private sparkGeo: SphereGeometry;
  private starGeo: IcosahedronGeometry;

  constructor() {
    this.group = new Group();
    this.shardGeo = new BoxGeometry(0.03, 0.03, 0.008);
    this.sparkGeo = new SphereGeometry(0.01, 4, 4);
    this.starGeo = new IcosahedronGeometry(0.02, 0);

    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(this.shardGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);

      this.pool.push({
        mesh,
        velocity: new Vector3(),
        angVelocity: new Vector3(),
        life: 0,
        maxLife: 0,
        gravity: 0,
        active: false,
      });
    }
  }

  getGroup(): Group { return this.group; }

  private getFragment(): Fragment | null {
    for (const f of this.pool) {
      if (!f.active) return f;
    }
    return null;
  }

  /**
   * Normal block shatter — fragments fly outward
   */
  spawnShatter(x: number, y: number, z: number, color: Color, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const f = this.getFragment();
      if (!f) break;

      f.active = true;
      f.mesh.visible = true;
      f.mesh.geometry = this.shardGeo;
      (f.mesh.material as MeshBasicMaterial).color.copy(color);
      (f.mesh.material as MeshBasicMaterial).opacity = 1;

      f.mesh.position.set(
        x + (Math.random() - 0.5) * 0.1,
        y + (Math.random() - 0.5) * 0.1,
        z
      );
      f.mesh.scale.setScalar(0.6 + Math.random() * 0.8);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      f.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.7 + 0.5,
        (Math.random() - 0.5) * 1.5
      );
      f.angVelocity.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      f.gravity = 4;
      f.life = 0;
      f.maxLife = 0.4 + Math.random() * 0.3;
    }
  }

  /**
   * Hold block dissolve — sparks float upward
   */
  spawnDissolve(x: number, y: number, z: number, color: Color, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const f = this.getFragment();
      if (!f) break;

      f.active = true;
      f.mesh.visible = true;
      f.mesh.geometry = this.sparkGeo;
      (f.mesh.material as MeshBasicMaterial).color.copy(color);
      (f.mesh.material as MeshBasicMaterial).opacity = 0.8;

      f.mesh.position.set(
        x + (Math.random() - 0.5) * 0.15,
        y + (Math.random() - 0.5) * 0.15,
        z
      );
      f.mesh.scale.setScalar(0.5 + Math.random() * 1);

      f.velocity.set(
        (Math.random() - 0.5) * 0.8,
        0.8 + Math.random() * 1.5,  // float upward
        (Math.random() - 0.5) * 0.5
      );
      f.angVelocity.set(0, 0, 0);
      f.gravity = -0.5; // negative = float up
      f.life = 0;
      f.maxLife = 0.6 + Math.random() * 0.5;
    }
  }

  /**
   * Double-tap explode — larger burst outward
   */
  spawnExplode(x: number, y: number, z: number, color: Color, count: number = 16) {
    for (let i = 0; i < count; i++) {
      const f = this.getFragment();
      if (!f) break;

      f.active = true;
      f.mesh.visible = true;
      f.mesh.geometry = i % 3 === 0 ? this.starGeo : this.shardGeo;
      (f.mesh.material as MeshBasicMaterial).color.copy(color);
      (f.mesh.material as MeshBasicMaterial).opacity = 1;

      f.mesh.position.set(x, y, z);
      f.mesh.scale.setScalar(0.4 + Math.random() * 1.2);

      // Spherical explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 3;
      f.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
      f.angVelocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      f.gravity = 2;
      f.life = 0;
      f.maxLife = 0.5 + Math.random() * 0.3;
    }
  }

  /**
   * Perfect hit — golden star burst
   */
  spawnPerfect(x: number, y: number, z: number, count: number = 10) {
    const gold = new Color(0xffd700);
    const white = new Color(0xffffff);

    for (let i = 0; i < count; i++) {
      const f = this.getFragment();
      if (!f) break;

      f.active = true;
      f.mesh.visible = true;
      f.mesh.geometry = this.starGeo;
      (f.mesh.material as MeshBasicMaterial).color.copy(i % 2 === 0 ? gold : white);
      (f.mesh.material as MeshBasicMaterial).opacity = 1;

      f.mesh.position.set(x, y, z);
      f.mesh.scale.setScalar(0.8 + Math.random() * 0.6);

      const angle = (i / count) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      f.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 1,
        (Math.random() - 0.5) * 0.5
      );
      f.angVelocity.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        0
      );
      f.gravity = 1.5;
      f.life = 0;
      f.maxLife = 0.7 + Math.random() * 0.4;
    }
  }

  /**
   * Miss feedback — dark red drip
   */
  spawnMissEffect(x: number, y: number, z: number) {
    const dark = new Color(0xff0044);
    for (let i = 0; i < 5; i++) {
      const f = this.getFragment();
      if (!f) break;

      f.active = true;
      f.mesh.visible = true;
      f.mesh.geometry = this.sparkGeo;
      (f.mesh.material as MeshBasicMaterial).color.copy(dark);
      (f.mesh.material as MeshBasicMaterial).opacity = 0.6;

      f.mesh.position.set(
        x + (Math.random() - 0.5) * 0.2,
        y,
        z
      );
      f.mesh.scale.setScalar(0.5);

      f.velocity.set(
        (Math.random() - 0.5) * 0.5,
        -1 - Math.random() * 2,  // fall down
        (Math.random() - 0.5) * 0.3
      );
      f.angVelocity.set(0, 0, 0);
      f.gravity = 5;
      f.life = 0;
      f.maxLife = 0.5;
    }
  }

  update(dt: number) {
    for (const f of this.pool) {
      if (!f.active) continue;

      f.life += dt;
      if (f.life >= f.maxLife) {
        f.active = false;
        f.mesh.visible = false;
        continue;
      }

      // Physics
      f.velocity.y -= f.gravity * dt;
      f.mesh.position.x += f.velocity.x * dt;
      f.mesh.position.y += f.velocity.y * dt;
      f.mesh.position.z += f.velocity.z * dt;

      // Rotation
      f.mesh.rotation.x += f.angVelocity.x * dt;
      f.mesh.rotation.y += f.angVelocity.y * dt;
      f.mesh.rotation.z += f.angVelocity.z * dt;

      // Fade out
      const t = f.life / f.maxLife;
      (f.mesh.material as MeshBasicMaterial).opacity = Math.max(0, 1 - t * t);

      // Scale down
      const s = 1 - t * 0.5;
      f.mesh.scale.setScalar(s * (f.mesh.scale.x > 0 ? 1 : 0.5));
    }
  }

  dispose() {
    for (const f of this.pool) {
      (f.mesh.material as MeshBasicMaterial).dispose();
    }
    this.shardGeo.dispose();
    this.sparkGeo.dispose();
    this.starGeo.dispose();
  }
}
