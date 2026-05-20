// ============================================================
// Neon Beats VR — Leaderboard System
// Per-song local leaderboard with top scores, grades, dates
// ============================================================

import { playMenuSelect } from './audio';
import { getGrade, getGradeColor, getAccuracy, type GameState } from './game';
import { getSongInfo, SONG_LIBRARY, getDifficultyColor } from './songs';

export interface LeaderboardEntry {
  score: number;
  grade: string;
  accuracy: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  date: string;       // ISO date string
  modifiers: string;  // comma-separated modifier names
  difficulty: string;
}

const LB_KEY_PREFIX = 'neonbeats_lb_';
const MAX_ENTRIES = 10;

export function loadLeaderboard(songId: string, difficulty?: string): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(`${LB_KEY_PREFIX}${songId}`);
    if (raw) {
      let entries: LeaderboardEntry[] = JSON.parse(raw);
      if (difficulty) {
        entries = entries.filter(e => e.difficulty === difficulty);
      }
      return entries.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    }
  } catch { /* ignore */ }
  return [];
}

export function getPersonalBest(songId: string, difficulty?: string): LeaderboardEntry | null {
  const entries = loadLeaderboard(songId, difficulty);
  return entries.length > 0 ? entries[0] : null;
}

export function getAllTimeBest(): LeaderboardEntry | null {
  try {
    let best: LeaderboardEntry | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LB_KEY_PREFIX)) {
        const entries: LeaderboardEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
        for (const e of entries) {
          if (!best || e.score > best.score) best = e;
        }
      }
    }
    return best;
  } catch { return null; }
}

export function saveToLeaderboard(songId: string, entry: LeaderboardEntry): number {
  const entries = loadLeaderboard(songId);
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(`${LB_KEY_PREFIX}${songId}`, JSON.stringify(trimmed));
  } catch { /* ignore */ }

  // Return rank (1-indexed)
  return trimmed.findIndex(e => e === entry) + 1 || trimmed.length;
}

export function createLeaderboardEntry(
  state: GameState,
  modifierNames: string[],
  difficulty: string
): LeaderboardEntry {
  const accuracy = getAccuracy(state);
  return {
    score: state.score,
    grade: getGrade(accuracy),
    accuracy,
    maxCombo: state.maxCombo,
    perfects: state.perfects,
    greats: state.greats,
    goods: state.goods,
    misses: state.misses,
    date: new Date().toISOString(),
    modifiers: modifierNames.join(', '),
    difficulty,
  };
}

export function clearLeaderboard(songId: string) {
  try {
    localStorage.removeItem(`${LB_KEY_PREFIX}${songId}`);
  } catch { /* ignore */ }
}

export function clearAllLeaderboards() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LB_KEY_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ---- Leaderboard Screen ----

let lbScreen: HTMLDivElement | null = null;

export function showLeaderboardScreen(
  songId: string,
  onBack: () => void,
  onChangeSong?: (songId: string) => void
): HTMLDivElement {
  hideLeaderboardScreen();

  const screen = document.createElement('div');
  screen.id = 'leaderboardScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,5,30,0.95) 0%, rgba(0,0,0,0.98) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;
  document.body.appendChild(screen);
  lbScreen = screen;

  let currentSongId = songId;

  function render() {
    const entries = loadLeaderboard(currentSongId);
    const songInfo = getSongInfo(currentSongId);
    const songName = songInfo?.name || (currentSongId === 'endless' ? 'ENDLESS MODE' : currentSongId);
    const songColor = songInfo?.color || '#ffff00';

    screen.innerHTML = `
      <div style="text-align: center; max-width: 600px; width: 90%;">
        <h2 style="font-size: 28px; margin-bottom: 5px; letter-spacing: 3px;
          text-shadow: 0 0 15px #ffcc00;">🏆 LEADERBOARD</h2>
        <h3 style="font-size: 18px; color: ${songColor}; margin-bottom: 15px;
          text-shadow: 0 0 10px ${songColor};">${songName}</h3>

        <!-- Song selector -->
        <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
          ${SONG_LIBRARY.map(s => `
            <button class="lbSongBtn" data-song="${s.id}" style="
              background: ${s.id === currentSongId ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'};
              border: 1px solid ${s.id === currentSongId ? s.color : 'rgba(255,255,255,0.1)'};
              color: ${s.id === currentSongId ? s.color : '#666'}; padding: 3px 8px;
              font-size: 10px; font-family: 'Courier New', monospace; cursor: pointer;
              border-radius: 3px; transition: all 0.15s;
            ">${s.name}</button>
          `).join('')}
          <button class="lbSongBtn" data-song="endless" style="
            background: ${'endless' === currentSongId ? 'rgba(255,255,0,0.1)' : 'rgba(255,255,255,0.02)'};
            border: 1px solid ${'endless' === currentSongId ? '#ffff00' : 'rgba(255,255,255,0.1)'};
            color: ${'endless' === currentSongId ? '#ffff00' : '#666'}; padding: 3px 8px;
            font-size: 10px; font-family: 'Courier New', monospace; cursor: pointer;
            border-radius: 3px;
          ">∞ Endless</button>
        </div>

        <!-- Entries table -->
        <div style="text-align: left;">
          ${entries.length === 0 ? `
            <div style="text-align: center; opacity: 0.3; padding: 30px; font-size: 14px;">
              No scores yet. Play this song to set a record!
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: 30px 1fr 80px 60px 50px 70px; gap: 2px;
              font-size: 11px; opacity: 0.4; padding: 4px 8px; margin-bottom: 4px;">
              <span>#</span><span>DATE</span><span>SCORE</span><span>GRADE</span><span>COMBO</span><span>ACCURACY</span>
            </div>
            ${entries.map((e, i) => {
              const gc = getGradeColor(e.grade);
              const dateStr = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              return `
                <div style="
                  display: grid; grid-template-columns: 30px 1fr 80px 60px 50px 70px;
                  gap: 2px; padding: 6px 8px; border-radius: 4px; align-items: center;
                  background: ${i < 3 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)'};
                  border: 1px solid ${i === 0 ? 'rgba(255,204,0,0.2)' : 'transparent'};
                  font-size: 12px;
                ">
                  <span style="font-size: 13px;">${rankIcon}</span>
                  <span style="opacity: 0.5; font-size: 10px;">${dateStr}${e.modifiers ? ` [${e.modifiers}]` : ''}</span>
                  <span style="color: #00ffff; font-weight: bold;">${e.score.toLocaleString()}</span>
                  <span style="color: ${gc}; font-weight: bold;">${e.grade}</span>
                  <span>${e.maxCombo}×</span>
                  <span style="opacity: 0.7;">${e.accuracy.toFixed(1)}%</span>
                </div>
              `;
            }).join('')}
          `}
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
          ${entries.length > 0 ? `
            <button class="lbClearBtn" style="
              background: transparent; border: 1px solid rgba(255,0,0,0.3);
              color: #ff4444; padding: 6px 16px; font-size: 11px;
              font-family: 'Courier New', monospace; cursor: pointer; border-radius: 3px;
            ">CLEAR</button>
          ` : ''}
          <button class="lbBackBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.3);
            color: rgba(255,255,255,0.5); padding: 8px 30px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">BACK</button>
        </div>
      </div>
    `;

    // Wire song selector
    screen.querySelectorAll('.lbSongBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSongId = (btn as HTMLElement).dataset.song!;
        playMenuSelect();
        render();
      });
    });

    // Wire clear
    const clearBtn = screen.querySelector('.lbClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        playMenuSelect();
        clearLeaderboard(currentSongId);
        render();
      });
    }

    // Wire back
    screen.querySelector('.lbBackBtn')!.addEventListener('click', () => {
      playMenuSelect();
      onBack();
    });
  }

  render();
  return screen;
}

export function hideLeaderboardScreen() {
  if (lbScreen) {
    lbScreen.remove();
    lbScreen = null;
  }
}
