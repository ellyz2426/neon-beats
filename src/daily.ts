// ============================================================
// Neon Beats VR — Daily Challenge System
// A new challenge every day with unique modifiers and goals
// Leaderboard for daily scores across all players
// ============================================================

import { playMenuSelect } from './audio';
import type { SongInfo } from './songs';
import { SONG_LIBRARY } from './songs';

export interface DailyChallenge {
  date: string;            // YYYY-MM-DD
  songId: string;
  difficulty: string;
  modifiers: DailyModifier[];
  goals: DailyGoal[];
  seed: number;            // Deterministic seed for the day
}

export interface DailyModifier {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface DailyGoal {
  id: string;
  description: string;
  target: number;
  reward: string;
  icon: string;
}

export interface DailyResult {
  date: string;
  score: number;
  accuracy: number;
  goalsCompleted: string[];
  grade: string;
  maxCombo: number;
}

const DAILY_STORAGE_KEY = 'neonbeats_daily';

// Modifier pool
const MODIFIER_POOL: DailyModifier[] = [
  { id: 'speed_up', name: 'Speed Demon', description: 'Notes move 25% faster', color: '#ff6600' },
  { id: 'shrink', name: 'Tiny Targets', description: 'Blocks are 30% smaller', color: '#ff00ff' },
  { id: 'flip', name: 'Mirror World', description: 'Lanes are reversed', color: '#9933ff' },
  { id: 'ghost', name: 'Ghost Notes', description: 'Notes fade before reaching you', color: '#336699' },
  { id: 'no_miss', name: 'Perfect or Nothing', description: 'Only Perfects count as hits', color: '#ffd700' },
  { id: 'random_lanes', name: 'Chaos Lanes', description: 'Lane assignments randomize each beat', color: '#ff3366' },
  { id: 'beat_warp', name: 'Beat Warp', description: 'Speed changes on every 4th bar', color: '#00ff88' },
  { id: 'dark_mode', name: 'Lights Out', description: 'Background goes completely dark', color: '#222222' },
];

// Goal templates
const GOAL_TEMPLATES: Array<(song: SongInfo) => DailyGoal> = [
  (s) => ({ id: 'score_50k', description: 'Score 50,000+', target: 50000, reward: '🏅 Daily Bronze', icon: '🎯' }),
  (s) => ({ id: 'score_100k', description: 'Score 100,000+', target: 100000, reward: '🥈 Daily Silver', icon: '🎯' }),
  (s) => ({ id: 'score_200k', description: 'Score 200,000+', target: 200000, reward: '🥇 Daily Gold', icon: '🏆' }),
  (s) => ({ id: 'combo_50', description: '50+ combo', target: 50, reward: '🔥 Combo Star', icon: '🔥' }),
  (s) => ({ id: 'combo_100', description: '100+ combo', target: 100, reward: '💥 Combo Master', icon: '💥' }),
  (s) => ({ id: 'accuracy_90', description: '90%+ accuracy', target: 90, reward: '🎯 Sharpshooter', icon: '🎯' }),
  (s) => ({ id: 'accuracy_95', description: '95%+ accuracy', target: 95, reward: '💎 Diamond Aim', icon: '💎' }),
  (s) => ({ id: 'no_miss', description: 'Zero misses', target: 0, reward: '⭐ Flawless', icon: '⭐' }),
  (s) => ({ id: 'perfect_20', description: '20+ Perfects', target: 20, reward: '✨ Precision', icon: '✨' }),
];

// Deterministic pseudo-random from seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateDailyChallenge(): DailyChallenge {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rng = seededRandom(seed);

  // Pick a song deterministically
  const songIdx = Math.floor(rng() * SONG_LIBRARY.length);
  const song = SONG_LIBRARY[songIdx];

  // Pick difficulty (weighted toward medium/hard)
  const diffs = ['easy', 'medium', 'medium', 'hard', 'hard', 'expert'];
  const difficulty = diffs[Math.floor(rng() * diffs.length)];

  // Pick 2 modifiers
  const modifierCount = 1 + Math.floor(rng() * 2);
  const shuffledMods = [...MODIFIER_POOL].sort(() => rng() - 0.5);
  const modifiers = shuffledMods.slice(0, modifierCount);

  // Pick 3 goals
  const shuffledGoals = [...GOAL_TEMPLATES].sort(() => rng() - 0.5);
  const goals = shuffledGoals.slice(0, 3).map(fn => fn(song));

  return {
    date: dateStr,
    songId: song.id,
    difficulty,
    modifiers,
    goals,
    seed,
  };
}

export function loadDailyResult(): DailyResult | null {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) return null;
    const result: DailyResult = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (result.date !== today) return null; // Expired
    return result;
  } catch { return null; }
}

export function saveDailyResult(result: DailyResult) {
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(result));
  } catch { /* ignore */ }
}

// ---- Daily Challenge Screen ----

let dailyScreen: HTMLDivElement | null = null;

export function showDailyChallengeScreen(
  onPlay: (challenge: DailyChallenge) => void,
  onBack: () => void
): HTMLDivElement {
  hideDailyChallengeScreen();

  const challenge = generateDailyChallenge();
  const existingResult = loadDailyResult();
  const songInfo = SONG_LIBRARY.find(s => s.id === challenge.songId);

  const screen = document.createElement('div');
  screen.id = 'dailyChallenge';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(15,5,0,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  const modifierHTML = challenge.modifiers.map(m => `
    <div style="background: ${m.color}22; border: 1px solid ${m.color}44;
      padding: 8px 12px; border-radius: 6px;">
      <div style="font-size: 13px; color: ${m.color}; font-weight: bold;">${m.name}</div>
      <div style="font-size: 10px; opacity: 0.5;">${m.description}</div>
    </div>
  `).join('');

  const goalHTML = challenge.goals.map(g => {
    const completed = existingResult?.goalsCompleted?.includes(g.id);
    return `
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
        <span style="font-size: 16px;">${completed ? '✅' : g.icon}</span>
        <span style="font-size: 13px; ${completed ? 'text-decoration: line-through; opacity: 0.4;' : ''}">${g.description}</span>
        <span style="font-size: 11px; opacity: 0.3; margin-left: auto;">${g.reward}</span>
      </div>
    `;
  }).join('');

  screen.innerHTML = `
    <div style="text-align: center; max-width: 500px; width: 90%;">
      <div style="font-size: 11px; opacity: 0.4; letter-spacing: 3px; margin-bottom: 5px;">
        ${challenge.date}
      </div>
      <h2 style="font-size: 28px; letter-spacing: 3px; margin-bottom: 5px;
        background: linear-gradient(135deg, #ffd700, #ff6600);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;">DAILY CHALLENGE</h2>
      <div style="font-size: 13px; opacity: 0.5; margin-bottom: 20px;">
        New challenge every day at midnight
      </div>

      <!-- Song -->
      <div style="background: rgba(255,255,255,0.03); border: 1px solid ${songInfo?.color || '#666'}44;
        padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="font-size: 18px; color: ${songInfo?.color || '#fff'};">${songInfo?.name || challenge.songId}</div>
        <div style="font-size: 12px; opacity: 0.4;">${songInfo?.artist || ''} • ${challenge.difficulty.toUpperCase()}</div>
      </div>

      <!-- Modifiers -->
      <div style="display: flex; gap: 8px; margin-bottom: 15px; justify-content: center;">
        ${modifierHTML}
      </div>

      <!-- Goals -->
      <div style="background: rgba(255,255,255,0.02); padding: 12px 15px; border-radius: 8px;
        text-align: left; margin-bottom: 15px;">
        <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 6px;">GOALS</div>
        ${goalHTML}
      </div>

      ${existingResult ? `
        <div style="background: rgba(0,255,136,0.05); padding: 10px; border-radius: 6px;
          margin-bottom: 15px; border: 1px solid rgba(0,255,136,0.2);">
          <div style="font-size: 12px; color: #00ff88;">Today's best: ${existingResult.score.toLocaleString()} (${existingResult.grade})</div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="dailyPlayBtn" style="
          background: transparent; border: 2px solid #ffd700; color: #ffd700;
          padding: 12px 35px; font-size: 16px; font-family: 'Courier New', monospace;
          cursor: pointer; letter-spacing: 2px; border-radius: 4px;
          text-shadow: 0 0 10px #ffd700;
        ">${existingResult ? 'TRY AGAIN' : 'PLAY'}</button>
        <button id="dailyBackBtn" style="
          background: transparent; border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.4); padding: 12px 25px; font-size: 14px;
          font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
        ">BACK</button>
      </div>
    </div>
  `;

  screen.querySelector('#dailyPlayBtn')?.addEventListener('click', () => {
    playMenuSelect();
    onPlay(challenge);
  });
  screen.querySelector('#dailyBackBtn')?.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  document.body.appendChild(screen);
  dailyScreen = screen;
  return screen;
}

export function hideDailyChallengeScreen() {
  if (dailyScreen) {
    dailyScreen.remove();
    dailyScreen = null;
  }
  document.getElementById('dailyChallenge')?.remove();
}
