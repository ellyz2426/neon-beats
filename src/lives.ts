// ============================================================
// Neon Beats VR — Lives & Power Systems
// Lives: start with 3, lose on health depletion, gain from milestones
// Bomb: screen-clear limited-use ability
// Survival mode: blocks get faster until you die
// ============================================================

import { playComboSound, playMissSound } from './audio';

// ---- Lives System ----

export interface LivesState {
  lives: number;
  maxLives: number;
  bombs: number;
  maxBombs: number;
  livesEnabled: boolean;   // false for no-fail mode
  bombsEnabled: boolean;
  // Milestone tracking for extra lives
  comboMilestones: number[];    // combos that grant extra lives
  nextComboMilestone: number;
  scoreMilestones: number[];
  nextScoreMilestone: number;
}

export function createLivesState(enabled: boolean = true): LivesState {
  return {
    lives: 3,
    maxLives: 5,
    bombs: 2,
    maxBombs: 3,
    livesEnabled: enabled,
    bombsEnabled: true,
    comboMilestones: [50, 100, 200, 500],
    nextComboMilestone: 0,
    scoreMilestones: [10000, 25000, 50000, 100000],
    nextScoreMilestone: 0,
  };
}

export function loseLife(state: LivesState): boolean {
  if (!state.livesEnabled) return false;
  state.lives = Math.max(0, state.lives - 1);
  return state.lives <= 0;  // true if game over
}

export function checkMilestones(state: LivesState, combo: number, score: number): string[] {
  const rewards: string[] = [];

  // Combo milestones
  if (state.nextComboMilestone < state.comboMilestones.length) {
    if (combo >= state.comboMilestones[state.nextComboMilestone]) {
      if (state.lives < state.maxLives) {
        state.lives++;
        rewards.push(`+1 LIFE (${combo} combo!)`);
      }
      state.nextComboMilestone++;
    }
  }

  // Score milestones
  if (state.nextScoreMilestone < state.scoreMilestones.length) {
    if (score >= state.scoreMilestones[state.nextScoreMilestone]) {
      if (state.bombs < state.maxBombs) {
        state.bombs++;
        rewards.push(`+1 BOMB (${score.toLocaleString()} pts!)`);
      }
      state.nextScoreMilestone++;
    }
  }

  return rewards;
}

export function useBomb(state: LivesState): boolean {
  if (!state.bombsEnabled || state.bombs <= 0) return false;
  state.bombs--;
  return true;
}

// ---- Survival Mode ----

export interface SurvivalState {
  active: boolean;
  baseSpeed: number;       // initial block speed multiplier
  currentSpeed: number;    // current speed multiplier
  speedIncrement: number;  // speed increase per wave
  waveBlocks: number;      // blocks per wave
  wavesCompleted: number;
  blocksInWave: number;    // blocks cleared this wave
  timeAlive: number;
  peakCombo: number;
  totalScore: number;
}

export function createSurvivalState(): SurvivalState {
  return {
    active: false,
    baseSpeed: 1.0,
    currentSpeed: 1.0,
    speedIncrement: 0.05,   // 5% faster each wave
    waveBlocks: 20,
    wavesCompleted: 0,
    blocksInWave: 0,
    timeAlive: 0,
    peakCombo: 0,
    totalScore: 0,
  };
}

export function startSurvival(state: SurvivalState) {
  state.active = true;
  state.currentSpeed = state.baseSpeed;
  state.wavesCompleted = 0;
  state.blocksInWave = 0;
  state.timeAlive = 0;
  state.peakCombo = 0;
  state.totalScore = 0;
}

export function updateSurvival(state: SurvivalState, dt: number, combo: number, score: number): string | null {
  if (!state.active) return null;

  state.timeAlive += dt;
  state.peakCombo = Math.max(state.peakCombo, combo);
  state.totalScore = score;

  // Check if wave complete
  if (state.blocksInWave >= state.waveBlocks) {
    state.wavesCompleted++;
    state.blocksInWave = 0;
    state.currentSpeed += state.speedIncrement;
    state.waveBlocks = Math.min(50, state.waveBlocks + 2);  // more blocks each wave
    return `WAVE ${state.wavesCompleted + 1} — ${Math.round(state.currentSpeed * 100)}% speed`;
  }

  return null;
}

export function onSurvivalBlockHit(state: SurvivalState) {
  state.blocksInWave++;
}

export function getSurvivalSpeedMultiplier(state: SurvivalState): number {
  return state.active ? state.currentSpeed : 1.0;
}

// ---- Zen Mode ----

export interface ZenState {
  active: boolean;
  duration: number;   // how long they've been vibing
}

export function createZenState(): ZenState {
  return { active: false, duration: 0 };
}

export function updateZen(state: ZenState, dt: number) {
  if (state.active) state.duration += dt;
}

// ---- Daily Challenge ----

export interface DailyChallengeConfig {
  songId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  modifiers: string[];     // modifier names active for this challenge
  seed: number;            // deterministic seed for the day
  date: string;            // YYYY-MM-DD
}

export function getDailyChallenge(): DailyChallengeConfig {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const seed = hashDate(dateStr);

  // Deterministic song selection
  const songIds = [
    'neon-pulse', 'digital-rush', 'circuit-breaker', 'laser-storm',
    'quantum-flux', 'void-protocol', 'midnight-drive', 'crystal-rain',
    'neon-samurai', 'thunder-pulse', 'ghost-protocol', 'solar-flare',
  ];
  const songIndex = seed % songIds.length;
  const difficulties = ['medium', 'hard', 'hard', 'expert'] as const;
  const diffIndex = Math.floor(seed / songIds.length) % difficulties.length;

  // Optional modifiers
  const modPool = ['mirror', 'hidden', 'fadeIn'];
  const modIndex = Math.floor(seed / 100) % (modPool.length + 1);
  const mods = modIndex < modPool.length ? [modPool[modIndex]] : [];

  return {
    songId: songIds[songIndex],
    difficulty: difficulties[diffIndex],
    modifiers: mods,
    seed,
    date: dateStr,
  };
}

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getDailyChallengeKey(): string {
  return `neonbeats-daily-${new Date().toISOString().split('T')[0]}`;
}

export function hasDailyChallengeBeenPlayed(): boolean {
  return localStorage.getItem(getDailyChallengeKey()) !== null;
}

export function saveDailyChallengeScore(score: number, accuracy: number) {
  localStorage.setItem(getDailyChallengeKey(), JSON.stringify({ score, accuracy, time: Date.now() }));
}
