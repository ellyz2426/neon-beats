// ============================================================
// Neon Beats VR — Challenge Mode System
// Specific objectives for players to complete:
//   - "Hit 50 perfects"
//   - "No misses for 30 seconds"
//   - "Reach 100 combo"
//   - "Score 50,000 points"
//   - "Complete song at expert difficulty"
// Unlockable challenges with rewards
// ============================================================

import { getAccuracy, type GameState } from './game';

// ---- Types ----

export interface ChallengeObjective {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'perfects' | 'combo' | 'accuracy' | 'score' | 'noMiss' | 'fullCombo' | 'speed' | 'survival';
  target: number;
  songId?: string;        // specific song, or any
  difficulty?: string;    // specific difficulty, or any
  timeLimit?: number;     // seconds (for timed challenges)
  rewardXP: number;
  rewardTitle?: string;
}

export interface ChallengeProgress {
  id: string;
  completed: boolean;
  bestProgress: number;   // 0-1
  attempts: number;
  completedAt?: number;
}

// ---- Challenge Library ----

export const CHALLENGE_LIBRARY: ChallengeObjective[] = [
  // Beginner challenges
  {
    id: 'first-perfect',
    name: 'First Light',
    description: 'Hit 10 perfect notes in a single song',
    icon: '✦',
    type: 'perfects',
    target: 10,
    rewardXP: 50,
  },
  {
    id: 'combo-10',
    name: 'Chain Reaction',
    description: 'Reach a 10-hit combo',
    icon: '🔗',
    type: 'combo',
    target: 10,
    rewardXP: 50,
  },
  {
    id: 'accuracy-80',
    name: 'On Target',
    description: 'Finish a song with 80% accuracy',
    icon: '🎯',
    type: 'accuracy',
    target: 0.8,
    rewardXP: 75,
  },

  // Intermediate challenges
  {
    id: 'perfect-50',
    name: 'Precision Machine',
    description: 'Hit 50 perfect notes in a single song',
    icon: '⚡',
    type: 'perfects',
    target: 50,
    rewardXP: 150,
  },
  {
    id: 'combo-50',
    name: 'Unstoppable',
    description: 'Reach a 50-hit combo',
    icon: '🔥',
    type: 'combo',
    target: 50,
    rewardXP: 200,
  },
  {
    id: 'no-miss-30',
    name: 'Untouchable',
    description: 'Go 30 seconds without missing a note',
    icon: '🛡',
    type: 'noMiss',
    target: 30,
    rewardXP: 200,
  },
  {
    id: 'score-25k',
    name: 'Score Seeker',
    description: 'Score 25,000 points in a single song',
    icon: '💎',
    type: 'score',
    target: 25000,
    rewardXP: 150,
  },
  {
    id: 'accuracy-90',
    name: 'Sharpshooter',
    description: 'Finish a song with 90% accuracy',
    icon: '🎯',
    type: 'accuracy',
    target: 0.9,
    rewardXP: 250,
  },

  // Advanced challenges
  {
    id: 'combo-100',
    name: 'Century Club',
    description: 'Reach a 100-hit combo',
    icon: '💯',
    type: 'combo',
    target: 100,
    rewardXP: 400,
  },
  {
    id: 'full-combo',
    name: 'Flawless',
    description: 'Complete a song without missing any notes',
    icon: '👑',
    type: 'fullCombo',
    target: 1,
    rewardXP: 500,
  },
  {
    id: 'score-50k',
    name: 'High Roller',
    description: 'Score 50,000 points in a single song',
    icon: '💰',
    type: 'score',
    target: 50000,
    rewardXP: 300,
  },
  {
    id: 'accuracy-95',
    name: 'Near Perfection',
    description: 'Finish a song with 95% accuracy',
    icon: '✨',
    type: 'accuracy',
    target: 0.95,
    rewardXP: 400,
  },
  {
    id: 'perfect-100',
    name: 'Centurion',
    description: 'Hit 100 perfect notes in a single song',
    icon: '⭐',
    type: 'perfects',
    target: 100,
    rewardXP: 500,
  },

  // Expert challenges
  {
    id: 'combo-200',
    name: 'Double Century',
    description: 'Reach a 200-hit combo',
    icon: '🌟',
    type: 'combo',
    target: 200,
    rewardXP: 800,
  },
  {
    id: 'score-100k',
    name: 'Legend',
    description: 'Score 100,000 points in a single song',
    icon: '🏆',
    type: 'score',
    target: 100000,
    rewardXP: 750,
  },
  {
    id: 'accuracy-99',
    name: 'Virtually Perfect',
    description: 'Finish a song with 99% accuracy',
    icon: '💫',
    type: 'accuracy',
    target: 0.99,
    rewardXP: 1000,
  },
  {
    id: 'expert-fc',
    name: 'Master',
    description: 'Full combo on an expert song',
    icon: '🔮',
    type: 'fullCombo',
    target: 1,
    difficulty: 'expert',
    rewardXP: 1500,
  },
];

// ---- Storage ----

const PROGRESS_KEY = 'neonbeats-challenge-progress';

export function loadChallengeProgress(): Map<string, ChallengeProgress> {
  const map = new Map<string, ChallengeProgress>();
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (data) {
      const arr: ChallengeProgress[] = JSON.parse(data);
      for (const p of arr) map.set(p.id, p);
    }
  } catch {}
  return map;
}

export function saveChallengeProgress(progress: Map<string, ChallengeProgress>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress.values()]));
}

// ---- Evaluation ----

export function evaluateChallenges(
  state: GameState,
  difficulty: string,
  progress: Map<string, ChallengeProgress>,
  noMissStreak: number  // longest no-miss streak in seconds
): string[] {
  const completed: string[] = [];
  const accuracy = getAccuracy(state);

  for (const challenge of CHALLENGE_LIBRARY) {
    if (progress.get(challenge.id)?.completed) continue;

    // Check difficulty filter
    if (challenge.difficulty && challenge.difficulty !== difficulty) continue;

    let met = false;
    let progressValue = 0;

    switch (challenge.type) {
      case 'perfects':
        progressValue = state.perfects / challenge.target;
        met = state.perfects >= challenge.target;
        break;
      case 'combo':
        progressValue = state.maxCombo / challenge.target;
        met = state.maxCombo >= challenge.target;
        break;
      case 'accuracy':
        progressValue = accuracy / challenge.target;
        met = accuracy >= challenge.target;
        break;
      case 'score':
        progressValue = state.score / challenge.target;
        met = state.score >= challenge.target;
        break;
      case 'noMiss':
        progressValue = noMissStreak / challenge.target;
        met = noMissStreak >= challenge.target;
        break;
      case 'fullCombo':
        progressValue = state.misses === 0 ? 1 : 0;
        met = state.misses === 0;
        break;
    }

    // Update progress
    const existing = progress.get(challenge.id) || {
      id: challenge.id,
      completed: false,
      bestProgress: 0,
      attempts: 0,
    };
    existing.attempts++;
    existing.bestProgress = Math.max(existing.bestProgress, Math.min(1, progressValue));

    if (met) {
      existing.completed = true;
      existing.completedAt = Date.now();
      completed.push(challenge.id);
    }

    progress.set(challenge.id, existing);
  }

  saveChallengeProgress(progress);
  return completed;
}

// ---- Challenge List UI ----

let challengeListEl: HTMLDivElement | null = null;

export function showChallengeList(
  progress: Map<string, ChallengeProgress>,
  onClose: () => void
) {
  if (!challengeListEl) {
    challengeListEl = document.createElement('div');
    challengeListEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 160; overflow-y: auto;
      font-family: monospace; color: #fff; display: none;
    `;
    document.body.appendChild(challengeListEl);
  }

  const totalCompleted = [...progress.values()].filter(p => p.completed).length;
  const totalXP = CHALLENGE_LIBRARY
    .filter(c => progress.get(c.id)?.completed)
    .reduce((sum, c) => sum + c.rewardXP, 0);

  let html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="color: #ffcc00; margin: 0; text-shadow: 0 0 10px rgba(255,204,0,0.5);">◆ CHALLENGES</h2>
        <div style="text-align: right;">
          <div style="color: #ffcc00; font-size: 12px;">${totalCompleted}/${CHALLENGE_LIBRARY.length} Complete</div>
          <div style="color: #888; font-size: 11px;">${totalXP.toLocaleString()} XP earned</div>
        </div>
        <button id="close-challenges" style="background: #333; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: monospace;">✕</button>
      </div>
  `;

  for (const challenge of CHALLENGE_LIBRARY) {
    const p = progress.get(challenge.id);
    const completed = p?.completed || false;
    const prog = p?.bestProgress || 0;

    html += `
      <div style="background: ${completed ? 'rgba(255,204,0,0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${completed ? '#332200' : '#222'}; padding: 12px; margin-bottom: 8px; border-radius: 4px; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px; width: 40px; text-align: center; ${completed ? '' : 'filter: grayscale(1); opacity: 0.5;'}">${challenge.icon}</div>
        <div style="flex: 1;">
          <div style="color: ${completed ? '#ffcc00' : '#aaa'}; font-weight: bold; font-size: 13px;">
            ${challenge.name} ${completed ? '✓' : ''}
          </div>
          <div style="color: #666; font-size: 11px;">${challenge.description}</div>
          ${!completed ? `
            <div style="background: #111; height: 4px; border-radius: 2px; margin-top: 4px;">
              <div style="background: #555; height: 100%; width: ${Math.min(100, prog * 100)}%; border-radius: 2px;"></div>
            </div>
          ` : ''}
        </div>
        <div style="text-align: right; min-width: 50px;">
          <div style="color: ${completed ? '#ffd700' : '#555'}; font-size: 12px;">${challenge.rewardXP} XP</div>
          ${p?.attempts ? `<div style="color: #444; font-size: 10px;">${p.attempts} tries</div>` : ''}
        </div>
      </div>
    `;
  }

  html += '</div>';
  challengeListEl.innerHTML = html;
  challengeListEl.style.display = 'block';

  document.getElementById('close-challenges')?.addEventListener('click', () => {
    challengeListEl!.style.display = 'none';
    onClose();
  });
}
