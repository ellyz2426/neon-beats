// ============================================================
// Neon Beats VR — Star Rating & Performance Grade
// ============================================================

import { getAccuracy, type GameState } from './game';

export interface StarRating {
  stars: number;       // 0-3
  halfStar: boolean;
  label: string;
  color: string;
}

export function calculateStars(state: GameState): StarRating {
  const accuracy = getAccuracy(state);
  const total = state.perfects + state.greats + state.goods + state.misses;
  if (total === 0) return { stars: 0, halfStar: false, label: 'No Data', color: '#666' };

  // Star thresholds
  if (accuracy >= 95 && state.misses <= 2) {
    return { stars: 3, halfStar: false, label: '★★★ MASTER', color: '#ffff00' };
  }
  if (accuracy >= 90) {
    return { stars: 2, halfStar: true, label: '★★☆ EXCELLENT', color: '#ff00ff' };
  }
  if (accuracy >= 80) {
    return { stars: 2, halfStar: false, label: '★★ GREAT', color: '#00ffff' };
  }
  if (accuracy >= 70) {
    return { stars: 1, halfStar: true, label: '★☆ GOOD', color: '#00ff88' };
  }
  if (accuracy >= 50) {
    return { stars: 1, halfStar: false, label: '★ OK', color: '#ffcc00' };
  }
  return { stars: 0, halfStar: true, label: '☆ KEEP TRYING', color: '#ff6600' };
}

export function getStarDisplay(rating: StarRating): string {
  let display = '';
  for (let i = 0; i < rating.stars; i++) display += '★';
  if (rating.halfStar) display += '☆';
  while (display.length < 3) display += '·';
  return display;
}

// ---- Performance Breakdown ----

export interface PerformanceBreakdown {
  perfectPercent: number;
  greatPercent: number;
  goodPercent: number;
  missPercent: number;
  perfectBar: string;    // visual bar
}

export function getPerformanceBreakdown(state: GameState): PerformanceBreakdown {
  const total = state.perfects + state.greats + state.goods + state.misses;
  if (total === 0) return { perfectPercent: 0, greatPercent: 0, goodPercent: 0, missPercent: 0, perfectBar: '' };

  const pp = (state.perfects / total) * 100;
  const gp = (state.greats / total) * 100;
  const gop = (state.goods / total) * 100;
  const mp = (state.misses / total) * 100;

  // Visual bar (20 chars wide)
  const barLen = 20;
  const pLen = Math.round(pp / 100 * barLen);
  const grLen = Math.round(gp / 100 * barLen);
  const goLen = Math.round(gop / 100 * barLen);
  const mLen = barLen - pLen - grLen - goLen;
  const bar = '█'.repeat(pLen) + '▓'.repeat(grLen) + '▒'.repeat(goLen) + '░'.repeat(Math.max(0, mLen));

  return { perfectPercent: pp, greatPercent: gp, goodPercent: gop, missPercent: mp, perfectBar: bar };
}
