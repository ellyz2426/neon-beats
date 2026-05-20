// ============================================================
// Neon Beats VR — Beat Blocks
// Block spawning, movement, hit detection
// Includes special blocks: bombs, slides, chains
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
import {
  createBombMesh,
  createSlideMesh,
  generateSpecialBlocks,
  type SpecialBlockEvent,
  type SpecialBlockType,
} from './specialblocks';

export interface ActiveBlock {
  mesh: Group;
  event: BeatEvent;
  lane: number;
  targetTime: number;
  speed: number;  // units per second
  alive: boolean;
  scored: boolean;
  holdProgress?: number;
  // Special block fields
  isSpecial: boolean;
  specialType?: SpecialBlockType;
  targetLane?: number; // for slides
  slidePhase?: 'start' | 'target'; // current slide phase
}

const BLOCK_SIZE = 0.35;
const APPROACH_TIME = 2.0; // seconds for block to travel from spawn to hit zone

export function createBlockMesh(lane: number, type: string, holdDuration?: number): Group {
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
  private specialBlocks: SpecialBlockEvent[] = [];
  private nextSpecialIndex = 0;

  constructor(container: Group, numLanes: number) {
    this.container = container;
    this.numLanes = numLanes;
    this.speed = LANE_LENGTH / APPROACH_TIME;
  }

  // Generate special blocks for a song and prepare them
  prepareSpecialBlocks(bpm: number, duration: number, difficulty: string) {
    this.specialBlocks = generateSpecialBlocks(bpm, duration, difficulty, this.numLanes);
    this.nextSpecialIndex = 0;
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
      isSpecial: false,
    };

    if (event.type === 'hold') {
      block.holdProgress = 0;
    }

    this.blocks.push(block);
    return block;
  }

  // Spawn special blocks based on song time
  spawnSpecialBlocks(songTime: number, spawnAhead: number): ActiveBlock[] {
    const spawned: ActiveBlock[] = [];

    while (this.nextSpecialIndex < this.specialBlocks.length) {
      const se = this.specialBlocks[this.nextSpecialIndex];
      if (se.time - songTime > spawnAhead) break;

      // Check if there's already a regular block very close to this time in same lane
      const hasConflict = this.blocks.some(b =>
        b.alive && !b.scored && b.lane === se.lane &&
        Math.abs(b.targetTime - se.time) < 0.3
      );

      if (!hasConflict) {
        const block = this.spawnSpecialBlock(se);
        spawned.push(block);
      }

      this.nextSpecialIndex++;
    }

    return spawned;
  }

  private spawnSpecialBlock(se: SpecialBlockEvent): ActiveBlock {
    let mesh: Group;
    if (se.type === 'bomb') {
      mesh = createBombMesh();
    } else {
      mesh = createSlideMesh(se.lane, se.targetLane ?? se.lane);
    }

    const totalWidth = (this.numLanes - 1) * LANE_SPACING;
    const x = -totalWidth / 2 + se.lane * LANE_SPACING;
    mesh.position.set(x, 0.5, SPAWN_Z);
    mesh.name = `special_${this.blocks.length}`;
    this.container.add(mesh);

    // Create a fake beat event for the special block
    const fakeEvent: BeatEvent = {
      time: se.time,
      lane: se.lane,
      type: 'tap',
    };

    const block: ActiveBlock = {
      mesh,
      event: fakeEvent,
      lane: se.lane,
      targetTime: se.time,
      speed: this.speed,
      alive: true,
      scored: false,
      isSpecial: true,
      specialType: se.type,
      targetLane: se.targetLane,
      slidePhase: se.type === 'slide' ? 'start' : undefined,
    };

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
      if (block.isSpecial && block.specialType === 'bomb') {
        block.mesh.rotation.y += dt * 3.0;
        block.mesh.rotation.x += dt * 2.0;
        // Pulsing red glow
        const pulse = 0.7 + 0.3 * Math.sin(songTime * 8);
        block.mesh.scale.setScalar(0.9 + pulse * 0.15);
      } else if (block.isSpecial && block.specialType === 'slide') {
        block.mesh.rotation.y += dt * 2.0;
        block.mesh.rotation.z = Math.sin(songTime * 4) * 0.15;
      } else {
        block.mesh.rotation.y += dt * 1.5;
        block.mesh.rotation.x += dt * 0.5;
      }

      // Pulse as it approaches (non-bomb only)
      if (!block.isSpecial || block.specialType !== 'bomb') {
        const proximity = Math.max(0, 1 - Math.abs(timeUntilHit) / 0.5);
        const scale = 1 + proximity * 0.15;
        block.mesh.scale.setScalar(scale);
      }

      // Check if missed (past the hit zone + grace period)
      if (songTime > block.targetTime + TIMING.miss && !block.scored) {
        block.scored = true;
        // Bombs that are missed are actually a success (player avoided them)
        if (block.isSpecial && block.specialType === 'bomb') {
          // Don't count as a miss — player correctly avoided the bomb
        } else {
          missedBlocks.push(block);
        }
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

  // Try hitting slide's target lane
  tryHitSlideTarget(targetLane: number, songTime: number): { block: ActiveBlock; timeDiff: number } | null {
    for (const block of this.blocks) {
      if (!block.alive || !block.isSpecial || block.specialType !== 'slide') continue;
      if (block.slidePhase !== 'target' || block.targetLane !== targetLane) continue;
      const diff = Math.abs(songTime - block.targetTime);
      if (diff < TIMING.miss * 2) { // More generous timing for slides
        block.scored = true;
        return { block, timeDiff: songTime - block.targetTime };
      }
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
    this.specialBlocks = [];
    this.nextSpecialIndex = 0;
  }

  getActiveCount(): number {
    return this.blocks.filter(b => b.alive).length;
  }

  // Get all active special blocks for rendering/logic
  getActiveSpecialBlocks(): ActiveBlock[] {
    return this.blocks.filter(b => b.alive && b.isSpecial);
  }

  setSpeedMultiplier(mult: number) {
    this.speed = (LANE_LENGTH / APPROACH_TIME) * mult;
  }
}
