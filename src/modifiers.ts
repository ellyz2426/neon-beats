// ============================================================
// Neon Beats VR — Practice Mode & Modifiers
// No-fail, speed control, lane isolation
// ============================================================

export interface Modifiers {
  noFail: boolean;
  halfSpeed: boolean;
  autoPlay: boolean;
  mirror: boolean;    // reverse lane order
  hidden: boolean;    // blocks fade before hit zone
  fadeIn: boolean;    // blocks fade in as they approach
}

export function createDefaultModifiers(): Modifiers {
  return {
    noFail: false,
    halfSpeed: false,
    autoPlay: false,
    mirror: false,
    hidden: false,
    fadeIn: false,
  };
}

export function getScoreMultiplier(mods: Modifiers): number {
  let mult = 1.0;
  if (mods.noFail) mult *= 0.5;
  if (mods.halfSpeed) mult *= 0.5;
  if (mods.autoPlay) mult = 0;
  if (mods.hidden) mult *= 1.2;
  if (mods.mirror) mult *= 1.0;
  if (mods.fadeIn) mult *= 1.1;
  return mult;
}

export function formatModifiers(mods: Modifiers): string[] {
  const active: string[] = [];
  if (mods.noFail) active.push('No Fail');
  if (mods.halfSpeed) active.push('Half Speed');
  if (mods.autoPlay) active.push('Auto Play');
  if (mods.mirror) active.push('Mirror');
  if (mods.hidden) active.push('Hidden');
  if (mods.fadeIn) active.push('Fade In');
  return active;
}

// ---- Stats Tracking ----

export interface PlayerStats {
  totalScore: number;
  totalNotesHit: number;
  totalPerfects: number;
  totalGreats: number;
  totalGoods: number;
  totalMisses: number;
  totalSongsPlayed: number;
  totalSongsCleared: number;
  bestCombo: number;
  totalPlayTime: number; // seconds
  songsPlayed: Record<string, number>;
}

export function loadStats(): PlayerStats {
  try {
    const data = localStorage.getItem('neonbeats_stats');
    if (data) return JSON.parse(data);
  } catch {}
  return {
    totalScore: 0,
    totalNotesHit: 0,
    totalPerfects: 0,
    totalGreats: 0,
    totalGoods: 0,
    totalMisses: 0,
    totalSongsPlayed: 0,
    totalSongsCleared: 0,
    bestCombo: 0,
    totalPlayTime: 0,
    songsPlayed: {},
  };
}

export function saveStats(stats: PlayerStats) {
  try {
    localStorage.setItem('neonbeats_stats', JSON.stringify(stats));
  } catch {}
}

export function updateStatsAfterSong(
  stats: PlayerStats,
  score: number,
  perfects: number,
  greats: number,
  goods: number,
  misses: number,
  maxCombo: number,
  playTime: number,
  songId: string,
  cleared: boolean
): PlayerStats {
  stats.totalScore += score;
  stats.totalNotesHit += perfects + greats + goods;
  stats.totalPerfects += perfects;
  stats.totalGreats += greats;
  stats.totalGoods += goods;
  stats.totalMisses += misses;
  stats.totalSongsPlayed++;
  if (cleared) stats.totalSongsCleared++;
  if (maxCombo > stats.bestCombo) stats.bestCombo = maxCombo;
  stats.totalPlayTime += playTime;
  stats.songsPlayed[songId] = (stats.songsPlayed[songId] || 0) + 1;
  saveStats(stats);
  return stats;
}
