// ============================================================
// Neon Beats VR — Advanced Beat Patterns
// Pattern library for more varied and musical beat generation
// Arpeggios, runs, syncopation, polyrhythms, call-and-response
// ============================================================

import type { BeatEvent } from './audio';

// ---- Pattern Types ----

type PatternFunc = (startTime: number, bpm: number, numLanes: number) => BeatEvent[];

// ---- Pattern Library ----

/** Straight quarter notes across lanes */
function patternStraight(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  for (let i = 0; i < 4; i++) {
    beats.push({
      time: startTime + i * beatDur,
      lane: i % numLanes,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Ascending arpeggio (left to right) */
function patternArpUp(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  for (let i = 0; i < numLanes; i++) {
    beats.push({
      time: startTime + i * beatDur * 0.5,
      lane: i,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Descending arpeggio (right to left) */
function patternArpDown(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  for (let i = 0; i < numLanes; i++) {
    beats.push({
      time: startTime + i * beatDur * 0.5,
      lane: numLanes - 1 - i,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Zigzag pattern */
function patternZigzag(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  const lanes = [0, numLanes - 1, 1, numLanes - 2];
  for (let i = 0; i < lanes.length; i++) {
    beats.push({
      time: startTime + i * beatDur * 0.5,
      lane: lanes[i] % numLanes,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Double tap (two lanes at once) */
function patternDoubles(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  for (let i = 0; i < 2; i++) {
    const lane1 = i;
    const lane2 = numLanes - 1 - i;
    if (lane1 !== lane2) {
      beats.push(
        { time: startTime + i * beatDur, lane: lane1, type: 'tap', duration: 0 },
        { time: startTime + i * beatDur, lane: lane2, type: 'tap', duration: 0 }
      );
    }
  }
  return beats;
}

/** Syncopated (off-beat emphasis) */
function patternSyncopated(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  // Hits on the "and" of each beat
  for (let i = 0; i < 4; i++) {
    beats.push({
      time: startTime + i * beatDur + beatDur * 0.5,
      lane: Math.floor(Math.random() * numLanes),
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Triplet pattern */
function patternTriplets(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  for (let i = 0; i < 3; i++) {
    beats.push({
      time: startTime + i * beatDur / 3,
      lane: i % numLanes,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Fast run across all lanes */
function patternRun(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  const step = beatDur / numLanes;
  for (let i = 0; i < numLanes * 2; i++) {
    beats.push({
      time: startTime + i * step,
      lane: i % numLanes,
      type: 'tap',
      duration: 0,
    });
  }
  return beats;
}

/** Hold + tap combo */
function patternHoldTap(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  return [
    { time: startTime, lane: 0, type: 'hold', duration: beatDur * 2 },
    { time: startTime + beatDur, lane: Math.min(2, numLanes - 1), type: 'tap', duration: 0 },
    { time: startTime + beatDur * 1.5, lane: Math.min(3, numLanes - 1), type: 'tap', duration: 0 },
  ];
}

/** Call and response (burst, pause, burst) */
function patternCallResponse(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  // Call: 3 quick taps
  for (let i = 0; i < 3; i++) {
    beats.push({ time: startTime + i * beatDur * 0.5, lane: i % numLanes, type: 'tap', duration: 0 });
  }
  // Response: 3 quick taps shifted
  for (let i = 0; i < 3; i++) {
    beats.push({ time: startTime + beatDur * 2 + i * beatDur * 0.5, lane: (i + 2) % numLanes, type: 'tap', duration: 0 });
  }
  return beats;
}

/** Staircase (ascending then descending) */
function patternStaircase(startTime: number, bpm: number, numLanes: number): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  const step = beatDur * 0.5;
  // Up
  for (let i = 0; i < numLanes; i++) {
    beats.push({ time: startTime + i * step, lane: i, type: 'tap', duration: 0 });
  }
  // Down
  for (let i = numLanes - 2; i >= 0; i--) {
    beats.push({ time: startTime + (numLanes + numLanes - 2 - i) * step, lane: i, type: 'tap', duration: 0 });
  }
  return beats;
}

// ---- Pattern Pool ----

interface WeightedPattern {
  pattern: PatternFunc;
  name: string;
  minDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  weight: number;
}

const PATTERN_POOL: WeightedPattern[] = [
  { pattern: patternStraight, name: 'straight', minDifficulty: 'easy', weight: 3 },
  { pattern: patternArpUp, name: 'arp-up', minDifficulty: 'easy', weight: 2 },
  { pattern: patternArpDown, name: 'arp-down', minDifficulty: 'easy', weight: 2 },
  { pattern: patternZigzag, name: 'zigzag', minDifficulty: 'medium', weight: 2 },
  { pattern: patternDoubles, name: 'doubles', minDifficulty: 'medium', weight: 1.5 },
  { pattern: patternSyncopated, name: 'syncopated', minDifficulty: 'medium', weight: 1.5 },
  { pattern: patternTriplets, name: 'triplets', minDifficulty: 'hard', weight: 1 },
  { pattern: patternRun, name: 'run', minDifficulty: 'hard', weight: 1 },
  { pattern: patternHoldTap, name: 'hold-tap', minDifficulty: 'medium', weight: 1.5 },
  { pattern: patternCallResponse, name: 'call-response', minDifficulty: 'hard', weight: 1 },
  { pattern: patternStaircase, name: 'staircase', minDifficulty: 'hard', weight: 1 },
];

const DIFF_ORDER = ['easy', 'medium', 'hard', 'expert'];

function getDifficultyIndex(diff: string): number {
  return DIFF_ORDER.indexOf(diff);
}

/**
 * Get patterns available for a given difficulty
 */
export function getAvailablePatterns(difficulty: string): WeightedPattern[] {
  const diffIdx = getDifficultyIndex(difficulty);
  return PATTERN_POOL.filter(p => getDifficultyIndex(p.minDifficulty) <= diffIdx);
}

/**
 * Select a random pattern weighted by probability
 */
export function selectPattern(difficulty: string): PatternFunc {
  const available = getAvailablePatterns(difficulty);
  if (available.length === 0) return patternStraight;

  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * totalWeight;
  for (const p of available) {
    r -= p.weight;
    if (r <= 0) return p.pattern;
  }
  return available[available.length - 1].pattern;
}

/**
 * Generate a sequence of pattern-based beats
 */
export function generatePatternedBeats(
  startTime: number,
  duration: number,
  bpm: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert',
  numLanes: number
): BeatEvent[] {
  const beatDur = 60 / bpm;
  const beats: BeatEvent[] = [];
  let time = startTime;

  while (time < startTime + duration - beatDur * 4) {
    const pattern = selectPattern(difficulty);
    const patternBeats = pattern(time, bpm, numLanes);
    beats.push(...patternBeats);

    // Gap between patterns
    const maxEnd = patternBeats.reduce((max, b) => Math.max(max, b.time + (b.duration || 0)), time);
    time = maxEnd + beatDur * (1 + Math.random());
  }

  return beats;
}
