// ============================================================
// Neon Beats VR — Stats Dashboard
// Detailed player statistics and progress tracking
// Performance trends, per-song breakdowns, achievement progress
// ============================================================

import { loadAllHighScores, type GameState } from './game';
import { SONG_LIBRARY, getSongInfo } from './songs';
import { loadAchievements } from './achievements';

// ---- Extended Stats ----

export interface ExtendedStats {
  // Overall
  totalPlays: number;
  totalScore: number;
  totalPerfects: number;
  totalGreats: number;
  totalGoods: number;
  totalMisses: number;
  totalNotesHit: number;
  totalPlayTime: number;  // seconds
  bestCombo: number;
  bestScore: number;
  bestAccuracy: number;

  // Averages
  avgAccuracy: number;
  avgScore: number;

  // Per-difficulty stats
  easyPlays: number;
  mediumPlays: number;
  hardPlays: number;
  expertPlays: number;

  // Streaks
  currentDayStreak: number;
  bestDayStreak: number;
  lastPlayDate: string;

  // Song-specific
  songsPlayed: string[];
  songsBeatAtExpert: string[];
  fullCombos: number;
  sRanks: number;
}

const STATS_KEY = 'neonbeats-extended-stats';

export function loadExtendedStats(): ExtendedStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) return JSON.parse(data);
  } catch {}

  return {
    totalPlays: 0,
    totalScore: 0,
    totalPerfects: 0,
    totalGreats: 0,
    totalGoods: 0,
    totalMisses: 0,
    totalNotesHit: 0,
    totalPlayTime: 0,
    bestCombo: 0,
    bestScore: 0,
    bestAccuracy: 0,
    avgAccuracy: 0,
    avgScore: 0,
    easyPlays: 0,
    mediumPlays: 0,
    hardPlays: 0,
    expertPlays: 0,
    currentDayStreak: 0,
    bestDayStreak: 0,
    lastPlayDate: '',
    songsPlayed: [],
    songsBeatAtExpert: [],
    fullCombos: 0,
    sRanks: 0,
  };
}

export function saveExtendedStats(stats: ExtendedStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function updateExtendedStats(
  stats: ExtendedStats,
  gameState: GameState,
  songId: string,
  difficulty: string,
  accuracy: number,
  grade: string,
  playDuration: number
) {
  stats.totalPlays++;
  stats.totalScore += gameState.score;
  stats.totalPerfects += gameState.perfects;
  stats.totalGreats += gameState.greats;
  stats.totalGoods += gameState.goods;
  stats.totalMisses += gameState.misses;
  stats.totalNotesHit += gameState.perfects + gameState.greats + gameState.goods;
  stats.totalPlayTime += playDuration;

  if (gameState.maxCombo > stats.bestCombo) stats.bestCombo = gameState.maxCombo;
  if (gameState.score > stats.bestScore) stats.bestScore = gameState.score;
  if (accuracy > stats.bestAccuracy) stats.bestAccuracy = accuracy;

  // Running average
  stats.avgAccuracy = ((stats.avgAccuracy * (stats.totalPlays - 1)) + accuracy) / stats.totalPlays;
  stats.avgScore = stats.totalScore / stats.totalPlays;

  // Difficulty tracking
  switch (difficulty) {
    case 'easy': stats.easyPlays++; break;
    case 'medium': stats.mediumPlays++; break;
    case 'hard': stats.hardPlays++; break;
    case 'expert': stats.expertPlays++; break;
  }

  // Song tracking
  if (!stats.songsPlayed.includes(songId)) {
    stats.songsPlayed.push(songId);
  }
  if (difficulty === 'expert' && accuracy >= 0.9 && !stats.songsBeatAtExpert.includes(songId)) {
    stats.songsBeatAtExpert.push(songId);
  }

  // Full combos and S ranks
  if (gameState.misses === 0) stats.fullCombos++;
  if (grade === 'S' || grade === 'S+') stats.sRanks++;

  // Day streak
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastPlayDate) {
    const lastDate = new Date(stats.lastPlayDate);
    const todayDate = new Date(today);
    const dayDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff === 1) {
      stats.currentDayStreak++;
    } else if (dayDiff > 1) {
      stats.currentDayStreak = 1;
    }
  } else {
    stats.currentDayStreak = 1;
  }
  stats.bestDayStreak = Math.max(stats.bestDayStreak, stats.currentDayStreak);
  stats.lastPlayDate = today;

  saveExtendedStats(stats);
}

// ---- Stats Dashboard UI ----

let dashboardEl: HTMLDivElement | null = null;

export function showStatsDashboard(stats: ExtendedStats, onClose: () => void) {
  if (!dashboardEl) {
    dashboardEl = document.createElement('div');
    dashboardEl.id = 'stats-dashboard';
    dashboardEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 150; overflow-y: auto;
      font-family: monospace; color: #fff; display: none;
    `;
    document.body.appendChild(dashboardEl);
  }

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const songsTotal = SONG_LIBRARY.length;
  const songsPlayed = stats.songsPlayed.length;
  const completionPct = songsTotal > 0 ? Math.round((songsPlayed / songsTotal) * 100) : 0;

  dashboardEl.innerHTML = `
    <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #00ffff; margin: 0; text-shadow: 0 0 10px rgba(0,255,255,0.5);">◆ PLAYER STATS</h2>
        <button id="close-dashboard" style="background: #333; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: monospace;">✕ CLOSE</button>
      </div>

      <!-- Top stats cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
        <div style="background: rgba(0,255,255,0.05); border: 1px solid #003344; padding: 12px; text-align: center; border-radius: 4px;">
          <div style="color: #00ffff; font-size: 24px; font-weight: bold;">${stats.totalPlays}</div>
          <div style="color: #666; font-size: 11px;">TOTAL PLAYS</div>
        </div>
        <div style="background: rgba(0,255,136,0.05); border: 1px solid #003322; padding: 12px; text-align: center; border-radius: 4px;">
          <div style="color: #00ff88; font-size: 24px; font-weight: bold;">${(stats.avgAccuracy * 100).toFixed(1)}%</div>
          <div style="color: #666; font-size: 11px;">AVG ACCURACY</div>
        </div>
        <div style="background: rgba(255,204,0,0.05); border: 1px solid #332200; padding: 12px; text-align: center; border-radius: 4px;">
          <div style="color: #ffcc00; font-size: 24px; font-weight: bold;">${stats.bestCombo}x</div>
          <div style="color: #666; font-size: 11px;">BEST COMBO</div>
        </div>
        <div style="background: rgba(255,0,255,0.05); border: 1px solid #330033; padding: 12px; text-align: center; border-radius: 4px;">
          <div style="color: #ff00ff; font-size: 24px; font-weight: bold;">${formatTime(stats.totalPlayTime)}</div>
          <div style="color: #666; font-size: 11px;">PLAY TIME</div>
        </div>
      </div>

      <!-- Detailed stats -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <!-- Performance -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid #222; padding: 15px; border-radius: 4px;">
          <h3 style="color: #00ffff; font-size: 13px; margin: 0 0 10px 0;">PERFORMANCE</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
            <span style="color: #666;">Best Score</span><span style="text-align: right;">${stats.bestScore.toLocaleString()}</span>
            <span style="color: #666;">Total Score</span><span style="text-align: right;">${stats.totalScore.toLocaleString()}</span>
            <span style="color: #666;">Best Accuracy</span><span style="text-align: right;">${(stats.bestAccuracy * 100).toFixed(1)}%</span>
            <span style="color: #666;">Full Combos</span><span style="text-align: right;">${stats.fullCombos}</span>
            <span style="color: #666;">S Ranks</span><span style="text-align: right; color: #ffd700;">${stats.sRanks}</span>
          </div>
        </div>

        <!-- Hit Breakdown -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid #222; padding: 15px; border-radius: 4px;">
          <h3 style="color: #00ff88; font-size: 13px; margin: 0 0 10px 0;">HIT BREAKDOWN</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
            <span style="color: #00ffff;">Perfect</span><span style="text-align: right;">${stats.totalPerfects.toLocaleString()}</span>
            <span style="color: #00ff88;">Great</span><span style="text-align: right;">${stats.totalGreats.toLocaleString()}</span>
            <span style="color: #ffcc00;">Good</span><span style="text-align: right;">${stats.totalGoods.toLocaleString()}</span>
            <span style="color: #ff0044;">Miss</span><span style="text-align: right;">${stats.totalMisses.toLocaleString()}</span>
            <span style="color: #666;">Total Notes</span><span style="text-align: right;">${stats.totalNotesHit.toLocaleString()}</span>
          </div>
        </div>

        <!-- Difficulty Distribution -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid #222; padding: 15px; border-radius: 4px;">
          <h3 style="color: #ffcc00; font-size: 13px; margin: 0 0 10px 0;">DIFFICULTY PLAYS</h3>
          <div style="font-size: 12px;">
            <div style="margin-bottom: 5px;">
              <span style="color: #00ff88;">Easy</span>
              <div style="background: #111; height: 8px; border-radius: 2px; margin-top: 2px;">
                <div style="background: #00ff88; height: 100%; width: ${stats.totalPlays ? (stats.easyPlays / stats.totalPlays * 100) : 0}%; border-radius: 2px;"></div>
              </div>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="color: #ffcc00;">Medium</span>
              <div style="background: #111; height: 8px; border-radius: 2px; margin-top: 2px;">
                <div style="background: #ffcc00; height: 100%; width: ${stats.totalPlays ? (stats.mediumPlays / stats.totalPlays * 100) : 0}%; border-radius: 2px;"></div>
              </div>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="color: #ff6600;">Hard</span>
              <div style="background: #111; height: 8px; border-radius: 2px; margin-top: 2px;">
                <div style="background: #ff6600; height: 100%; width: ${stats.totalPlays ? (stats.hardPlays / stats.totalPlays * 100) : 0}%; border-radius: 2px;"></div>
              </div>
            </div>
            <div>
              <span style="color: #ff0044;">Expert</span>
              <div style="background: #111; height: 8px; border-radius: 2px; margin-top: 2px;">
                <div style="background: #ff0044; height: 100%; width: ${stats.totalPlays ? (stats.expertPlays / stats.totalPlays * 100) : 0}%; border-radius: 2px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid #222; padding: 15px; border-radius: 4px;">
          <h3 style="color: #ff00ff; font-size: 13px; margin: 0 0 10px 0;">PROGRESS</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
            <span style="color: #666;">Songs Played</span><span style="text-align: right;">${songsPlayed}/${songsTotal} (${completionPct}%)</span>
            <span style="color: #666;">Expert Clears</span><span style="text-align: right;">${stats.songsBeatAtExpert.length}</span>
            <span style="color: #666;">Day Streak</span><span style="text-align: right;">${stats.currentDayStreak} day${stats.currentDayStreak !== 1 ? 's' : ''}</span>
            <span style="color: #666;">Best Streak</span><span style="text-align: right;">${stats.bestDayStreak} days</span>
          </div>
        </div>
      </div>
    </div>
  `;

  dashboardEl.style.display = 'block';

  const closeBtn = document.getElementById('close-dashboard');
  closeBtn?.addEventListener('click', () => {
    dashboardEl!.style.display = 'none';
    onClose();
  });
}

export function hideStatsDashboard() {
  if (dashboardEl) dashboardEl.style.display = 'none';
}
