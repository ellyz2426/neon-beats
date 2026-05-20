// ============================================================
// Neon Beats VR — Beat Blocks
// Block spawning, movement, hit detection
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  Color,
  Vector3,
  AdditiveBlending,
} from '@iwsdk/core';
import { LANE_COLORS, LANE_SPACING, LANE_LENGTH, HIT_ZONE_Z, SPAWN_Z } from './environment';
import type { BeatEvent } from './audio';
import { TIMING } from './game';

export interface ActiveBlock {
  mesh: Group;
  event: BeatEvent;
  lane: number;
  targetTime: number;
  speed: number;  // units per second
  alive: boolean;
  scored: boolean;
  holdProgress?: number;
}

const BLOCK_SIZE = 0.35;
const APPROACH_TIME = 2.0; // seconds for block to travel from spawn to hit zone

export function createBlockMesh(lane: number, type: 'tap' | 'hold' | 'double', holdDuration?: number): Group {
  const group = new Group();
  const color = LANE_COLORS[lane % LANE_COLORS.length];

  if (type === 'hold' && holdDuration) {
    // Hold block: elongated
    const length = holdDuration * (LANE_LENGTH / APPROACH_TIME);
    const body = new Mesh(
      new BoxGeometry(BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8, length),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      })
    );
    body.position.z = -length / 2;
    group.add(body);

    // Head block
    const head = new Mesh(
      new BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    group.add(head);

    // Wireframe on head
    const edges = new LineSegments(
      new EdgesGeometry(new BoxGeometry(BLOCK_SIZE * 1.05, BLOCK_SIZE * 1.05, BLOCK_SIZE * 1.05)),
      new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    );
    group.add(edges);
  } else {
    // Standard tap block
    const size = type === 'double' ? BLOCK_SIZE * 0.9 : BLOCK_SIZE;
    const block = new Mesh(
      new BoxGeometry(size, size, size),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
    );
    group.add(block);

    // Wireframe
    const edges = new LineSegments(
      new EdgesGeometry(new BoxGeometry(size * 1.08, size * 1.08, size * 1.08)),
      new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    group.add(edges);

    // Inner glow core
    const core = new Mesh(
      new BoxGeometry(size * 0.4, size * 0.4, size * 0.4),
      new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      })
    );
    group.add(core);

    // Arrow indicator for direction (visual flair)
    if (type === 'double') {
      // Double tap marker — two dots
      for (const ox of [-0.12, 0.12]) {
        const dot = new Mesh(
          new BoxGeometry(0.06, 0.06, size + 0.02),
          new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
        );
        dot.position.x = ox;
        group.add(dot);
      }
    }
  }

  return group;
}

export class BlockManager {
  private blocks: ActiveBlock[] = [];
  private container: Group;
  private numLanes: number;
  private speed: number;

  constructor(container: Group, numLanes: number) {
    this.container = container;
    this.numLanes = numLanes;
    this.speed = LANE_LENGTH / APPROACH_TIME;
  }

  spawnBlock(event: BeatEvent, songTime: number): ActiveBlock {
    const mesh = createBlockMesh(event.lane, event.type, event.holdDuration);
    const totalWidth = (this.numLanes - 1) * LANE_SPACING;
    const x = -totalWidth / 2 + event.lane * LANE_SPACING;
    const z = SPAWN_Z;
    mesh.position.set(x, 0.5, z);
    mesh.name = `block_${this.blocks.length}`;
    this.container.add(mesh);

    const block: ActiveBlock = {
      mesh,
      event,
      lane: event.lane,
      targetTime: event.time,
      speed: this.speed,
      alive: true,
      scored: false,
    };

    if (event.type === 'hold') {
      block.holdProgress = 0;
    }

    this.blocks.push(block);
    return block;
  }

  update(songTime: number, dt: number): ActiveBlock[] {
    const missedBlocks: ActiveBlock[] = [];

    for (const block of this.blocks) {
      if (!block.alive) continue;

      // Calculate position based on time until target
      const timeUntilHit = block.targetTime - songTime;
      const z = HIT_ZONE_Z + timeUntilHit * block.speed;
      block.mesh.position.z = z;

      // Rotate for visual flair
      block.mesh.rotation.y += dt * 1.5;
      block.mesh.rotation.x += dt * 0.5;

      // Pulse as it approaches
      const proximity = Math.max(0, 1 - Math.abs(timeUntilHit) / 0.5);
      const scale = 1 + proximity * 0.15;
      block.mesh.scale.setScalar(scale);

      // Check if missed (past the hit zone + grace period)
      if (songTime > block.targetTime + TIMING.miss && !block.scored) {
        block.scored = true;
        missedBlocks.push(block);
      }

      // Remove if way past
      if (songTime > block.targetTime + 1.0) {
        block.alive = false;
        this.container.remove(block.mesh);
      }
    }

    // Cleanup dead blocks
    this.blocks = this.blocks.filter(b => b.alive);

    return missedBlocks;
  }

  tryHitLane(lane: number, songTime: number): { block: ActiveBlock; timeDiff: number } | null {
    let bestBlock: ActiveBlock | null = null;
    let bestDiff = Infinity;

    for (const block of this.blocks) {
      if (!block.alive || block.scored || block.lane !== lane) continue;
      const diff = songTime - block.targetTime;
      const absDiff = Math.abs(diff);
      if (absDiff < TIMING.miss && absDiff < bestDiff) {
        bestDiff = absDiff;
        bestBlock = block;
      }
    }

    if (bestBlock) {
      bestBlock.scored = true;
      return { block: bestBlock, timeDiff: songTime - bestBlock.targetTime };
    }
    return null;
  }

  removeBlock(block: ActiveBlock) {
    block.alive = false;
    this.container.remove(block.mesh);
  }

  getUpcomingBlocks(songTime: number, lookAhead: number): BeatEvent[] {
    return this.blocks
      .filter(b => b.alive && !b.scored && b.targetTime > songTime && b.targetTime < songTime + lookAhead)
      .map(b => b.event);
  }

  clear() {
    for (const block of this.blocks) {
      this.container.remove(block.mesh);
    }
    this.blocks = [];
  }

  getActiveCount(): number {
    return this.blocks.filter(b => b.alive).length;
  }
}
