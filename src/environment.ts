// ============================================================
// Neon Beats VR — Holodeck Environment
// Grid floor, walls, lanes, neon aesthetic
// ============================================================

import {
  Group,
  Mesh,
  PlaneGeometry,
  BoxGeometry,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  Color,
  Vector3,
  DoubleSide,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
} from '@iwsdk/core';

export const LANE_COLORS = [
  new Color('#ff0066'), // Red-pink
  new Color('#00ffff'), // Cyan
  new Color('#ff6600'), // Orange
  new Color('#9933ff'), // Purple
];

export const LANE_SPACING = 1.0;
export const LANE_LENGTH = 20;
export const HIT_ZONE_Z = -2; // Where blocks should be hit (relative to player)
export const SPAWN_Z = HIT_ZONE_Z - LANE_LENGTH;

export function createEnvironment(numLanes: number): Group {
  const env = new Group();
  env.name = 'environment';

  // Grid floor
  const floorGrid = createGridFloor(40, 40, 40, 40);
  floorGrid.position.set(0, -0.01, -LANE_LENGTH / 2);
  env.add(floorGrid);

  // Grid ceiling
  const ceilingGrid = createGridFloor(40, 40, 40, 40);
  ceilingGrid.position.set(0, 8, -LANE_LENGTH / 2);
  ceilingGrid.rotation.x = Math.PI;
  env.add(ceilingGrid);

  // Side walls
  for (const side of [-1, 1]) {
    const wall = createGridWall(40, 8, 40, 8);
    wall.position.set(side * 8, 4, -LANE_LENGTH / 2);
    wall.rotation.y = side * Math.PI / 2;
    env.add(wall);
  }

  // Back wall
  const backWall = createGridWall(16, 8, 16, 8);
  backWall.position.set(0, 4, SPAWN_Z - 2);
  env.add(backWall);

  // Lanes
  const lanesGroup = createLanes(numLanes);
  env.add(lanesGroup);

  // Hit zone indicator
  const hitZone = createHitZone(numLanes);
  env.add(hitZone);

  // Ambient particles
  const particles = createAmbientParticles(200);
  env.add(particles);

  return env;
}

function createGridFloor(w: number, h: number, segW: number, segH: number): Group {
  const group = new Group();

  // Solid dark floor
  const floor = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ color: 0x050510, side: DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Grid lines
  const gridGeo = new EdgesGeometry(new PlaneGeometry(w, h, segW, segH));
  const gridMat = new LineBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.4 });
  const grid = new LineSegments(gridGeo, gridMat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.005;
  group.add(grid);

  return group;
}

function createGridWall(w: number, h: number, segW: number, segH: number): Group {
  const group = new Group();

  const wall = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ color: 0x050510, side: DoubleSide, transparent: true, opacity: 0.6 })
  );
  group.add(wall);

  const gridGeo = new EdgesGeometry(new PlaneGeometry(w, h, segW, segH));
  const gridMat = new LineBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.3 });
  const grid = new LineSegments(gridGeo, gridMat);
  grid.position.z = 0.01;
  group.add(grid);

  return group;
}

function createLanes(numLanes: number): Group {
  const lanes = new Group();
  lanes.name = 'lanes';

  const totalWidth = (numLanes - 1) * LANE_SPACING;
  const startX = -totalWidth / 2;

  for (let i = 0; i < numLanes; i++) {
    const x = startX + i * LANE_SPACING;
    const color = LANE_COLORS[i % LANE_COLORS.length];

    // Lane strip (subtle glow on floor)
    const strip = new Mesh(
      new PlaneGeometry(0.15, LANE_LENGTH),
      new MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: DoubleSide,
      })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.02, HIT_ZONE_Z - LANE_LENGTH / 2);
    lanes.add(strip);

    // Lane edge lines
    for (const offset of [-0.3, 0.3]) {
      const geo = new BufferGeometry();
      const verts = new Float32Array([
        x + offset, 0.01, HIT_ZONE_Z,
        x + offset, 0.01, SPAWN_Z,
      ]);
      geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
      const line = new LineSegments(geo, new LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
      }));
      lanes.add(line);
    }
  }

  return lanes;
}

function createHitZone(numLanes: number): Group {
  const zone = new Group();
  zone.name = 'hitZone';

  const totalWidth = (numLanes - 1) * LANE_SPACING + 1.2;

  // Glowing bar across all lanes
  const bar = new Mesh(
    new BoxGeometry(totalWidth, 0.05, 0.1),
    new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    })
  );
  bar.position.set(0, 0.5, HIT_ZONE_Z);
  zone.add(bar);

  // Individual lane hit markers
  const startX = -((numLanes - 1) * LANE_SPACING) / 2;
  for (let i = 0; i < numLanes; i++) {
    const x = startX + i * LANE_SPACING;
    const color = LANE_COLORS[i % LANE_COLORS.length];

    // Diamond marker
    const marker = new Mesh(
      new BoxGeometry(0.3, 0.3, 0.05),
      new MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
      })
    );
    marker.rotation.z = Math.PI / 4;
    marker.position.set(x, 0.5, HIT_ZONE_Z);
    marker.name = `hitMarker_${i}`;
    zone.add(marker);

    // Glow ring
    const ring = new Mesh(
      new CylinderGeometry(0.25, 0.25, 0.02, 16, 1, true),
      new MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: DoubleSide,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.5, HIT_ZONE_Z);
    ring.name = `hitRing_${i}`;
    zone.add(ring);
  }

  return zone;
}

function createAmbientParticles(count: number): Group {
  const particles = new Group();
  particles.name = 'ambientParticles';

  for (let i = 0; i < count; i++) {
    const size = 0.02 + Math.random() * 0.04;
    const geo = new BoxGeometry(size, size, size);
    const color = LANE_COLORS[Math.floor(Math.random() * LANE_COLORS.length)];
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.3,
    });
    const p = new Mesh(geo, mat);
    p.position.set(
      (Math.random() - 0.5) * 14,
      Math.random() * 7,
      HIT_ZONE_Z - Math.random() * LANE_LENGTH * 1.2
    );
    p.userData.speed = 0.002 + Math.random() * 0.005;
    p.userData.phase = Math.random() * Math.PI * 2;
    particles.add(p);
  }

  return particles;
}

export function updateEnvironment(env: Group, time: number, beatIntensity: number) {
  // Animate ambient particles
  const particles = env.getObjectByName('ambientParticles');
  if (particles) {
    for (const p of particles.children) {
      const mesh = p as Mesh;
      mesh.position.y += Math.sin(time * 0.5 + mesh.userData.phase) * 0.001;
      mesh.position.z += mesh.userData.speed;
      if (mesh.position.z > HIT_ZONE_Z + 2) {
        mesh.position.z = SPAWN_Z - 2;
      }
      // Pulse with beat
      const scale = 1 + beatIntensity * 0.5;
      mesh.scale.setScalar(scale);
    }
  }

  // Pulse hit zone
  const hitZone = env.getObjectByName('hitZone');
  if (hitZone) {
    for (const child of hitZone.children) {
      if (child.name.startsWith('hitRing_')) {
        const ring = child as Mesh;
        const mat = ring.material as MeshBasicMaterial;
        mat.opacity = 0.2 + beatIntensity * 0.3;
        ring.scale.setScalar(1 + beatIntensity * 0.2);
      }
    }
  }
}

export function flashHitMarker(env: Group, lane: number, color: string) {
  const hitZone = env.getObjectByName('hitZone');
  if (!hitZone) return;
  const marker = hitZone.getObjectByName(`hitMarker_${lane}`) as Mesh;
  if (!marker) return;
  const mat = marker.material as MeshBasicMaterial;
  mat.color.set(color);
  mat.opacity = 1.0;
  // Will fade in update
  marker.userData.flashTime = performance.now();
}

export function updateHitMarkerFlash(env: Group, numLanes: number) {
  const hitZone = env.getObjectByName('hitZone');
  if (!hitZone) return;
  const now = performance.now();
  for (let i = 0; i < numLanes; i++) {
    const marker = hitZone.getObjectByName(`hitMarker_${i}`) as Mesh;
    if (!marker) continue;
    const flashTime = marker.userData.flashTime || 0;
    const elapsed = (now - flashTime) / 1000;
    if (elapsed < 0.3) {
      const mat = marker.material as MeshBasicMaterial;
      mat.opacity = 1.0 - elapsed / 0.3 * 0.6;
      marker.scale.setScalar(1 + (1 - elapsed / 0.3) * 0.3);
    } else {
      const mat = marker.material as MeshBasicMaterial;
      mat.color.copy(LANE_COLORS[i % LANE_COLORS.length]);
      mat.opacity = 0.4;
      marker.scale.setScalar(1);
    }
  }
}
