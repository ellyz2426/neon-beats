// ============================================================
// Neon Beats VR — Endless Mode
// Procedural infinite track with escalating difficulty
// ============================================================

import { generateSong, type Song, type BeatEvent } from './audio';

export interface EndlessState {
  active: boolean;
  bpm: number;
  baseBpm: number;
  difficulty: number; // 0-1 scale
  phase: number;      // current phase count
  phaseBeats: BeatEvent[];
  phaseDuration: number;
  totalElapsed: number;
  survivalTime: number;
  speedMultiplier: number;
}

export function createEndlessState(startBpm: number = 120): EndlessState {
  return {
    active: false,
    bpm: startBpm,
    baseBpm: startBpm,
    difficulty: 0.3,
    phase: 0,
    phaseBeats: [],
    phaseDuration: 30,
    totalElapsed: 0,
    survivalTime: 0,
    speedMultiplier: 1,
  };
}

export function generateNextPhase(state: EndlessState, numLanes: number): { beats: BeatEvent[]; song: Song } {
  state.phase++;

  // Escalate difficulty
  state.difficulty = Math.min(1, 0.3 + state.phase * 0.05);
  state.bpm = state.baseBpm + state.phase * 3; // +3 BPM per phase
  state.speedMultiplier = 1 + state.phase * 0.02;
  state.phaseDuration = 25 + Math.min(state.phase * 2, 20);

  // Map difficulty to named level
  const diffName = state.difficulty < 0.4 ? 'easy' :
                   state.difficulty < 0.6 ? 'medium' :
                   state.difficulty < 0.8 ? 'hard' : 'expert';

  const song = generateSong(
    `Phase ${state.phase}`,
    state.bpm,
    diffName,
    state.phaseDuration,
    numLanes
  );

  // Offset beats by total elapsed time
  const offset = state.totalElapsed;
  const beats = song.beats.map(b => ({ ...b, time: b.time + offset }));
  state.phaseBeats = beats;
  state.totalElapsed += state.phaseDuration;

  return { beats, song };
}

export function getEndlessDifficultyLabel(state: EndlessState): string {
  if (state.difficulty < 0.4) return 'WARMING UP';
  if (state.difficulty < 0.6) return 'GETTING REAL';
  if (state.difficulty < 0.8) return 'INTENSE';
  if (state.difficulty < 0.95) return 'EXTREME';
  return 'IMPOSSIBLE';
}

export function getEndlessPhaseColor(phase: number): string {
  const colors = ['#00ffff', '#00ff88', '#ffcc00', '#ff6600', '#ff0066', '#ff00ff', '#9933ff'];
  return colors[phase % colors.length];
}
