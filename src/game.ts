// ============================================================
// Neon Beats VR — Game State & Scoring
// ============================================================

export type GamePhase = 'title' | 'songSelect' | 'countdown' | 'playing' | 'results' | 'settings';

export interface GameState {
  phase: GamePhase;
  songId: string;
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  health: number;
  maxHealth: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  totalNotes: number;
  notesHit: number;
  songTime: number;
  songDuration: number;
  countdownValue: number;
  highScores: Map<string, number>;
  selectedSongIndex: number;
  numLanes: number;
  endless: boolean;
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    songId: '',
    score: 0,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    health: 100,
    maxHealth: 100,
    perfects: 0,
    greats: 0,
    goods: 0,
    misses: 0,
    totalNotes: 0,
    notesHit: 0,
    songTime: 0,
    songDuration: 0,
    countdownValue: 3,
    highScores: new Map<string, number>(),
    selectedSongIndex: 0,
    numLanes: 4,
    endless: false,
  };
}

export function resetGameplay(state: GameState) {
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.multiplier = 1;
  state.health = 100;
  state.perfects = 0;
  state.greats = 0;
  state.goods = 0;
  state.misses = 0;
  state.totalNotes = 0;
  state.notesHit = 0;
  state.songTime = 0;
  state.countdownValue = 3;
}

// Timing windows in seconds
export const TIMING = {
  perfect: 0.05,
  great: 0.10,
  good: 0.18,
  miss: 0.25,
};

export function getHitQuality(timeDiff: number): 'perfect' | 'great' | 'good' | 'miss' {
  const abs = Math.abs(timeDiff);
  if (abs <= TIMING.perfect) return 'perfect';
  if (abs <= TIMING.great) return 'great';
  if (abs <= TIMING.good) return 'good';
  return 'miss';
}

export function scoreHit(state: GameState, quality: 'perfect' | 'great' | 'good') {
  const baseScore = quality === 'perfect' ? 300 : quality === 'great' ? 200 : 100;
  state.combo++;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  state.multiplier = Math.min(8, 1 + Math.floor(state.combo / 10));
  state.score += baseScore * state.multiplier;
  state.notesHit++;

  if (quality === 'perfect') state.perfects++;
  else if (quality === 'great') state.greats++;
  else state.goods++;

  // Heal slightly on perfect
  if (quality === 'perfect') {
    state.health = Math.min(state.maxHealth, state.health + 1);
  }
}

export function scoreMiss(state: GameState) {
  state.combo = 0;
  state.multiplier = 1;
  state.misses++;
  state.health = Math.max(0, state.health - 10);
}

export function getAccuracy(state: GameState): number {
  const total = state.perfects + state.greats + state.goods + state.misses;
  if (total === 0) return 100;
  const weighted = state.perfects * 1.0 + state.greats * 0.8 + state.goods * 0.5;
  return (weighted / total) * 100;
}

export function getGrade(accuracy: number): string {
  if (accuracy >= 98) return 'SS';
  if (accuracy >= 95) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  if (accuracy >= 60) return 'D';
  return 'F';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'SS': return '#ffff00';
    case 'S': return '#ff00ff';
    case 'A': return '#00ffff';
    case 'B': return '#00ff88';
    case 'C': return '#ffcc00';
    case 'D': return '#ff6600';
    case 'F': return '#ff0000';
    default: return '#ffffff';
  }
}

// Save/load high scores from localStorage
export function saveHighScore(songId: string, score: number): boolean {
  try {
    const key = `neonbeats_hs_${songId}`;
    const existing = parseInt(localStorage.getItem(key) || '0', 10);
    if (score > existing) {
      localStorage.setItem(key, score.toString());
      return true;
    }
    return false;
  } catch { return false; }
}

export function loadHighScore(songId: string): number {
  try {
    return parseInt(localStorage.getItem(`neonbeats_hs_${songId}`) || '0', 10);
  } catch { return 0; }
}

export function loadAllHighScores(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('neonbeats_hs_')) {
        const songId = key.replace('neonbeats_hs_', '');
        map.set(songId, parseInt(localStorage.getItem(key) || '0', 10));
      }
    }
  } catch { /* ignore */ }
  return map;
}
