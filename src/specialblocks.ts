// ============================================================
// Neon Beats VR — Special Block Types
// Bombs (avoid!), slides (swipe across), and chains
// ============================================================

import {
  Group,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  OctahedronGeometry,
  MeshBasicMaterial,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  Color,
} from '@iwsdk/core';
import { LANE_COLORS } from './environment';

export type SpecialBlockType = 'bomb' | 'slide' | 'chain_start' | 'chain_end';

export interface SpecialBlockEvent {
  time: number;
  lane: number;
  type: SpecialBlockType;
  targetLane?: number; // for slides
}

export function createBombMesh(): Group {
  const group = new Group();

  // Red octahedron
  const bomb = new Mesh(
    new OctahedronGeometry(0.22, 0),
    new MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 })
  );
  group.add(bomb);

  // Danger wireframe
  const edges = new LineSegments(
    new EdgesGeometry(new OctahedronGeometry(0.28, 0)),
    new LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5 })
  );
  group.add(edges);

  // X marks
  for (const rot of [0, Math.PI / 2]) {
    const mark = new Mesh(
      new BoxGeometry(0.3, 0.04, 0.04),
      new MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.8 })
    );
    mark.rotation.z = Math.PI / 4 + rot;
    group.add(mark);
  }

  return group;
}

export function createSlideMesh(fromLane: number, toLane: number): Group {
  const group = new Group();
  const fromColor = LANE_COLORS[fromLane % LANE_COLORS.length];
  const toColor = LANE_COLORS[toLane % LANE_COLORS.length];

  // Diamond shape
  const diamond = new Mesh(
    new BoxGeometry(0.3, 0.3, 0.1),
    new MeshBasicMaterial({ color: fromColor, transparent: true, opacity: 0.7 })
  );
  diamond.rotation.z = Math.PI / 4;
  group.add(diamond);

  // Arrow indicator
  const direction = toLane > fromLane ? 1 : -1;
  const arrow = new Mesh(
    new BoxGeometry(0.15, 0.04, 0.04),
    new MeshBasicMaterial({ color: toColor, transparent: true, opacity: 0.9 })
  );
  arrow.position.x = direction * 0.15;
  arrow.rotation.z = direction * -0.3;
  group.add(arrow);

  // Trail line showing direction
  const trail = new Mesh(
    new BoxGeometry(0.5 * Math.abs(toLane - fromLane), 0.02, 0.02),
    new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
  );
  trail.position.x = direction * 0.15 * Math.abs(toLane - fromLane);
  group.add(trail);

  return group;
}

// Generate special blocks for a song
export function generateSpecialBlocks(
  bpm: number,
  duration: number,
  difficulty: string,
  numLanes: number
): SpecialBlockEvent[] {
  const events: SpecialBlockEvent[] = [];
  const beatDur = 60 / bpm;

  // Bomb frequency
  const bombChance = difficulty === 'easy' ? 0.02 : difficulty === 'medium' ? 0.04 : difficulty === 'hard' ? 0.06 : 0.08;
  // Slide frequency
  const slideChance = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 0.02 : difficulty === 'hard' ? 0.04 : 0.06;

  const totalBeats = Math.floor(duration / beatDur);
  for (let i = 8; i < totalBeats; i++) { // start after 8 beats
    const time = i * beatDur + 2; // 2s offset

    if (Math.random() < bombChance) {
      events.push({
        time,
        lane: Math.floor(Math.random() * numLanes),
        type: 'bomb',
      });
    }

    if (Math.random() < slideChance) {
      const fromLane = Math.floor(Math.random() * numLanes);
      let toLane: number;
      do {
        toLane = Math.floor(Math.random() * numLanes);
      } while (toLane === fromLane);
      events.push({
        time,
        lane: fromLane,
        type: 'slide',
        targetLane: toLane,
      });
    }
  }

  return events.sort((a, b) => a.time - b.time);
}
