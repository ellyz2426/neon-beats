// ============================================================
// Neon Beats VR — Player Progression System
// XP earned from playing songs, completing challenges, achievements
// Levels that unlock features, songs, themes
// Titles/ranks displayed on score cards
// ============================================================

// ---- Types ----

export interface PlayerLevel {
  level: number;
  xp: number;
  totalXP: number;
  title: string;
  nextLevelXP: number;
}

export interface UnlockReward {
  type: 'song' | 'theme' | 'title' | 'feature';
  id: string;
  name: string;
  level: number;
}

// ---- XP Curve ----

function xpForLevel(level: number): number {
  // Quadratic curve: level 1 = 100xp, level 10 = 1000xp, etc.
  return Math.round(100 * level * (1 + level * 0.1));
}

function getTitleForLevel(level: number): string {
  if (level >= 50) return 'RHYTHM GOD';
  if (level >= 40) return 'GRANDMASTER';
  if (level >= 35) return 'VIRTUOSO';
  if (level >= 30) return 'MAESTRO';
  if (level >= 25) return 'EXPERT';
  if (level >= 20) return 'VETERAN';
  if (level >= 15) return 'SKILLED';
  if (level >= 10) return 'ADEPT';
  if (level >= 7) return 'JOURNEYMAN';
  if (level >= 5) return 'APPRENTICE';
  if (level >= 3) return 'TRAINEE';
  if (level >= 2) return 'ROOKIE';
  return 'NEWCOMER';
}

// ---- Unlock Schedule ----

const UNLOCKS: UnlockReward[] = [
  { type: 'theme', id: 'cyberpunk', name: 'Cyberpunk Theme', level: 2 },
  { type: 'theme', id: 'ocean', name: 'Ocean Theme', level: 3 },
  { type: 'feature', id: 'practice', name: 'Practice Mode', level: 3 },
  { type: 'theme', id: 'space', name: 'Space Theme', level: 5 },
  { type: 'feature', id: 'modifiers', name: 'Modifiers', level: 5 },
  { type: 'theme', id: 'sakura', name: 'Sakura Theme', level: 7 },
  { type: 'feature', id: 'editor', name: 'Beat Editor', level: 8 },
  { type: 'theme', id: 'inferno', name: 'Inferno Theme', level: 10 },
  { type: 'theme', id: 'arctic', name: 'Arctic Theme', level: 12 },
  { type: 'feature', id: 'boss', name: 'Boss Battles', level: 15 },
  { type: 'theme', id: 'synthwave', name: 'Synthwave Theme', level: 18 },
  { type: 'theme', id: 'void', name: 'Void Theme', level: 20 },
  { type: 'theme', id: 'forest', name: 'Forest Theme', level: 25 },
  { type: 'title', id: 'ultimate', name: 'Ultimate Title', level: 50 },
];

// ---- State Management ----

const PROGRESS_KEY = 'neonbeats-progression';

export function loadProgression(): PlayerLevel {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    level: 1,
    xp: 0,
    totalXP: 0,
    title: getTitleForLevel(1),
    nextLevelXP: xpForLevel(2),
  };
}

export function saveProgression(state: PlayerLevel) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
}

/**
 * Add XP and check for level ups
 * Returns array of new unlocks
 */
export function addXP(state: PlayerLevel, amount: number): UnlockReward[] {
  const oldLevel = state.level;
  state.xp += amount;
  state.totalXP += amount;

  const newUnlocks: UnlockReward[] = [];

  // Check for level ups
  while (state.xp >= state.nextLevelXP) {
    state.xp -= state.nextLevelXP;
    state.level++;
    state.title = getTitleForLevel(state.level);
    state.nextLevelXP = xpForLevel(state.level + 1);

    // Check unlocks for this level
    const levelUnlocks = UNLOCKS.filter(u => u.level === state.level);
    newUnlocks.push(...levelUnlocks);
  }

  saveProgression(state);
  return newUnlocks;
}

/**
 * Calculate XP earned from a song
 */
export function calculateSongXP(
  score: number,
  accuracy: number,
  maxCombo: number,
  difficulty: string,
  isFullCombo: boolean
): number {
  const diffMult: Record<string, number> = {
    easy: 1, medium: 1.5, hard: 2, expert: 3,
  };

  let xp = Math.round(score / 100);  // base from score
  xp += Math.round(accuracy * 50);    // accuracy bonus
  xp += Math.round(maxCombo * 0.5);   // combo bonus
  xp = Math.round(xp * (diffMult[difficulty] || 1));  // difficulty multiplier
  if (isFullCombo) xp = Math.round(xp * 1.5);         // full combo bonus

  return xp;
}

// ---- Level Display UI ----

let levelBarEl: HTMLDivElement | null = null;

export function createLevelBar(): HTMLDivElement {
  if (levelBarEl) return levelBarEl;

  const el = document.createElement('div');
  el.id = 'level-bar';
  el.style.cssText = `
    position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);
    width: 250px; font-family: monospace; z-index: 50;
    pointer-events: none; display: none;
  `;
  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span id="lb-level" style="color: #888; font-size: 10px;">LV.1</span>
      <span id="lb-title" style="color: #00ffff; font-size: 10px;">NEWCOMER</span>
      <span id="lb-xp" style="color: #666; font-size: 10px;">0/100</span>
    </div>
    <div style="background: rgba(255,255,255,0.05); height: 3px; border-radius: 1.5px;">
      <div id="lb-progress" style="height: 100%; background: linear-gradient(90deg, #00ffff, #ff00ff); border-radius: 1.5px; width: 0%; transition: width 0.5s;"></div>
    </div>
  `;
  document.body.appendChild(el);
  levelBarEl = el;
  return el;
}

export function updateLevelBar(state: PlayerLevel) {
  const levelEl = document.getElementById('lb-level');
  const titleEl = document.getElementById('lb-title');
  const xpEl = document.getElementById('lb-xp');
  const progressEl = document.getElementById('lb-progress');

  if (levelEl) levelEl.textContent = `LV.${state.level}`;
  if (titleEl) titleEl.textContent = state.title;
  if (xpEl) xpEl.textContent = `${state.xp}/${state.nextLevelXP}`;
  if (progressEl) progressEl.style.width = `${(state.xp / state.nextLevelXP) * 100}%`;
}

export function showLevelBar() {
  if (levelBarEl) levelBarEl.style.display = 'block';
}

export function hideLevelBar() {
  if (levelBarEl) levelBarEl.style.display = 'none';
}
