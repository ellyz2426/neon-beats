// ============================================================
// Neon Beats VR — Dynamic Difficulty Adjustment (DDA)
// Automatically adjusts difficulty based on player performance
// Can be toggled on/off in settings
// ============================================================

import type { GameState } from './game';

export interface DDAState {
  enabled: boolean;
  targetAccuracy: number;     // aim for this accuracy (0.7-0.85)
  currentDiffMultiplier: number;  // 0.5 = half density, 2.0 = double
  adjustmentSpeed: number;    // how fast to adjust
  minMultiplier: number;
  maxMultiplier: number;
  recentHits: boolean[];      // rolling window
  windowSize: number;
}

export function createDDAState(): DDAState {
  return {
    enabled: false,
    targetAccuracy: 0.78,
    currentDiffMultiplier: 1.0,
    adjustmentSpeed: 0.02,
    minMultiplier: 0.4,
    maxMultiplier: 1.8,
    recentHits: [],
    windowSize: 30,
  };
}

export function ddaOnHit(state: DDAState, quality: string) {
  if (!state.enabled) return;
  state.recentHits.push(quality !== 'miss');
  while (state.recentHits.length > state.windowSize) {
    state.recentHits.shift();
  }
}

export function ddaOnMiss(state: DDAState) {
  if (!state.enabled) return;
  state.recentHits.push(false);
  while (state.recentHits.length > state.windowSize) {
    state.recentHits.shift();
  }
}

export function updateDDA(state: DDAState): number {
  if (!state.enabled || state.recentHits.length < 10) return 1.0;

  const recentAccuracy = state.recentHits.filter(h => h).length / state.recentHits.length;

  if (recentAccuracy > state.targetAccuracy + 0.1) {
    // Too easy — increase difficulty
    state.currentDiffMultiplier = Math.min(
      state.maxMultiplier,
      state.currentDiffMultiplier + state.adjustmentSpeed
    );
  } else if (recentAccuracy < state.targetAccuracy - 0.1) {
    // Too hard — decrease difficulty
    state.currentDiffMultiplier = Math.max(
      state.minMultiplier,
      state.currentDiffMultiplier - state.adjustmentSpeed
    );
  }

  return state.currentDiffMultiplier;
}

export function getDDALabel(mult: number): string {
  if (mult < 0.7) return 'EASY';
  if (mult < 0.9) return 'RELAXED';
  if (mult < 1.1) return 'NORMAL';
  if (mult < 1.3) return 'CHALLENGING';
  if (mult < 1.5) return 'INTENSE';
  return 'EXTREME';
}

// ============================================================
// Song Difficulty Curve System
// Ensures songs have proper difficulty pacing:
//   - Easy intro (first 15% of song)
//   - Gradual buildup (15-40%)
//   - Main challenge (40-75%)
//   - Climax (75-90%)
//   - Wind-down (90-100%)
// ============================================================

export interface DifficultyCurve {
  timePercent: number;
  densityMultiplier: number;
  complexityMultiplier: number;  // chance of holds, doubles, etc.
}

export const DIFFICULTY_CURVES: Record<string, DifficultyCurve[]> = {
  standard: [
    { timePercent: 0,    densityMultiplier: 0.4, complexityMultiplier: 0.2 },
    { timePercent: 0.15, densityMultiplier: 0.6, complexityMultiplier: 0.3 },
    { timePercent: 0.4,  densityMultiplier: 0.85, complexityMultiplier: 0.6 },
    { timePercent: 0.6,  densityMultiplier: 1.0, complexityMultiplier: 0.8 },
    { timePercent: 0.75, densityMultiplier: 1.0, complexityMultiplier: 1.0 },
    { timePercent: 0.9,  densityMultiplier: 1.15, complexityMultiplier: 1.0 },
    { timePercent: 0.95, densityMultiplier: 0.6, complexityMultiplier: 0.5 },
    { timePercent: 1.0,  densityMultiplier: 0.3, complexityMultiplier: 0.2 },
  ],
  aggressive: [
    { timePercent: 0,    densityMultiplier: 0.6, complexityMultiplier: 0.4 },
    { timePercent: 0.1,  densityMultiplier: 0.9, complexityMultiplier: 0.7 },
    { timePercent: 0.3,  densityMultiplier: 1.0, complexityMultiplier: 0.9 },
    { timePercent: 0.5,  densityMultiplier: 1.1, complexityMultiplier: 1.0 },
    { timePercent: 0.8,  densityMultiplier: 1.2, complexityMultiplier: 1.0 },
    { timePercent: 1.0,  densityMultiplier: 0.5, complexityMultiplier: 0.3 },
  ],
  gentle: [
    { timePercent: 0,    densityMultiplier: 0.2, complexityMultiplier: 0.1 },
    { timePercent: 0.2,  densityMultiplier: 0.4, complexityMultiplier: 0.2 },
    { timePercent: 0.5,  densityMultiplier: 0.7, complexityMultiplier: 0.4 },
    { timePercent: 0.8,  densityMultiplier: 0.9, complexityMultiplier: 0.6 },
    { timePercent: 0.95, densityMultiplier: 0.5, complexityMultiplier: 0.3 },
    { timePercent: 1.0,  densityMultiplier: 0.2, complexityMultiplier: 0.1 },
  ],
};

export function getCurveMultipliers(
  curve: DifficultyCurve[],
  timePercent: number
): { density: number; complexity: number } {
  // Find surrounding keyframes
  let lower = curve[0];
  let upper = curve[curve.length - 1];

  for (let i = 0; i < curve.length - 1; i++) {
    if (timePercent >= curve[i].timePercent && timePercent <= curve[i + 1].timePercent) {
      lower = curve[i];
      upper = curve[i + 1];
      break;
    }
  }

  // Interpolate
  const range = upper.timePercent - lower.timePercent;
  const t = range > 0 ? (timePercent - lower.timePercent) / range : 0;

  return {
    density: lower.densityMultiplier + (upper.densityMultiplier - lower.densityMultiplier) * t,
    complexity: lower.complexityMultiplier + (upper.complexityMultiplier - lower.complexityMultiplier) * t,
  };
}
