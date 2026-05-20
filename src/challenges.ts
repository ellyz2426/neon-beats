// ============================================================
// Neon Beats VR — Combo Challenges
// Mini-objectives during gameplay with bonus scoring
// ============================================================

export type ChallengeType =
  | 'perfect_streak'      // Hit N perfects in a row
  | 'no_miss_duration'    // No misses for N seconds
  | 'combo_target'        // Reach N combo
  | 'score_target'        // Reach N score within time
  | 'accuracy_target'     // Keep accuracy above N%
  | 'full_combo_section'; // No misses in a song section

export interface Challenge {
  id: string;
  type: ChallengeType;
  name: string;
  description: string;
  target: number;           // goal value
  bonusScore: number;       // awarded on completion
  difficulty: 'bronze' | 'silver' | 'gold' | 'diamond';
  color: string;
}

export interface ActiveChallenge {
  challenge: Challenge;
  progress: number;
  startTime: number;
  completed: boolean;
  failed: boolean;
  displayTimer: number;     // countdown to hide popup
}

// ---- Challenge Definitions ----

const CHALLENGE_POOL: Challenge[] = [
  // Perfect streaks
  { id: 'perf5', type: 'perfect_streak', name: 'Precision I', description: 'Hit 5 Perfects in a row', target: 5, bonusScore: 500, difficulty: 'bronze', color: '#00ffff' },
  { id: 'perf10', type: 'perfect_streak', name: 'Precision II', description: 'Hit 10 Perfects in a row', target: 10, bonusScore: 1500, difficulty: 'silver', color: '#00ffff' },
  { id: 'perf20', type: 'perfect_streak', name: 'Precision III', description: 'Hit 20 Perfects in a row', target: 20, bonusScore: 4000, difficulty: 'gold', color: '#ffff00' },
  { id: 'perf50', type: 'perfect_streak', name: 'Machine', description: 'Hit 50 Perfects in a row', target: 50, bonusScore: 10000, difficulty: 'diamond', color: '#ff00ff' },

  // No miss durations
  { id: 'nomiss15', type: 'no_miss_duration', name: 'Focus I', description: 'No misses for 15 seconds', target: 15, bonusScore: 400, difficulty: 'bronze', color: '#00ff88' },
  { id: 'nomiss30', type: 'no_miss_duration', name: 'Focus II', description: 'No misses for 30 seconds', target: 30, bonusScore: 1200, difficulty: 'silver', color: '#00ff88' },
  { id: 'nomiss60', type: 'no_miss_duration', name: 'Zen', description: 'No misses for 60 seconds', target: 60, bonusScore: 3000, difficulty: 'gold', color: '#ffff00' },

  // Combo targets
  { id: 'combo25', type: 'combo_target', name: 'Streak I', description: 'Reach 25 combo', target: 25, bonusScore: 600, difficulty: 'bronze', color: '#ff6600' },
  { id: 'combo50', type: 'combo_target', name: 'Streak II', description: 'Reach 50 combo', target: 50, bonusScore: 1800, difficulty: 'silver', color: '#ff6600' },
  { id: 'combo100', type: 'combo_target', name: 'Streak III', description: 'Reach 100 combo', target: 100, bonusScore: 5000, difficulty: 'gold', color: '#ffff00' },
  { id: 'combo200', type: 'combo_target', name: 'Infinite', description: 'Reach 200 combo', target: 200, bonusScore: 12000, difficulty: 'diamond', color: '#ff00ff' },

  // Score targets
  { id: 'score10k', type: 'score_target', name: 'Rising Star', description: 'Score 10,000 in 30 seconds', target: 10000, bonusScore: 800, difficulty: 'bronze', color: '#ffcc00' },
  { id: 'score50k', type: 'score_target', name: 'Superstar', description: 'Score 50,000 in 60 seconds', target: 50000, bonusScore: 3000, difficulty: 'silver', color: '#ffcc00' },

  // Accuracy targets
  { id: 'acc95', type: 'accuracy_target', name: 'Sharp Eye', description: 'Maintain 95% accuracy', target: 95, bonusScore: 2000, difficulty: 'silver', color: '#9933ff' },
  { id: 'acc99', type: 'accuracy_target', name: 'Perfectionist', description: 'Maintain 99% accuracy', target: 99, bonusScore: 5000, difficulty: 'gold', color: '#9933ff' },
];

// ---- Challenge Manager ----

export class ChallengeManager {
  private activeChallenges: ActiveChallenge[] = [];
  private completedIds = new Set<string>();
  private perfectStreak = 0;
  private lastMissTime = 0;
  private songStartTime = 0;
  private scoreCheckpoints: { time: number; score: number }[] = [];
  private totalBonusScore = 0;
  private pendingNotifications: { name: string; bonus: number; color: string; difficulty: string }[] = [];

  reset(songTime: number) {
    this.activeChallenges = [];
    this.completedIds.clear();
    this.perfectStreak = 0;
    this.lastMissTime = songTime;
    this.songStartTime = songTime;
    this.scoreCheckpoints = [];
    this.totalBonusScore = 0;
    this.pendingNotifications = [];
  }

  // Select challenges for this play session based on difficulty
  selectChallenges(difficulty: string, isEndless: boolean): void {
    this.activeChallenges = [];
    const pool = [...CHALLENGE_POOL];

    // Filter by appropriate difficulty
    let maxDiff: string[];
    switch (difficulty) {
      case 'easy': maxDiff = ['bronze']; break;
      case 'medium': maxDiff = ['bronze', 'silver']; break;
      case 'hard': maxDiff = ['bronze', 'silver', 'gold']; break;
      default: maxDiff = ['bronze', 'silver', 'gold', 'diamond']; break;
    }

    const eligible = pool.filter(c => maxDiff.includes(c.difficulty));

    // Pick 3 random challenges
    const shuffled = eligible.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, isEndless ? 4 : 3);

    for (const ch of selected) {
      this.activeChallenges.push({
        challenge: ch,
        progress: 0,
        startTime: 0,
        completed: false,
        failed: false,
        displayTimer: 0,
      });
    }
  }

  onHit(quality: 'perfect' | 'great' | 'good', combo: number, score: number, songTime: number, accuracy: number) {
    if (quality === 'perfect') {
      this.perfectStreak++;
    } else {
      this.perfectStreak = 0;
    }

    this.scoreCheckpoints.push({ time: songTime, score });

    for (const ac of this.activeChallenges) {
      if (ac.completed || ac.failed) continue;

      switch (ac.challenge.type) {
        case 'perfect_streak':
          ac.progress = this.perfectStreak;
          if (ac.progress >= ac.challenge.target) this.completeChallenge(ac);
          break;

        case 'no_miss_duration':
          ac.progress = songTime - this.lastMissTime;
          if (ac.progress >= ac.challenge.target) this.completeChallenge(ac);
          break;

        case 'combo_target':
          ac.progress = combo;
          if (ac.progress >= ac.challenge.target) this.completeChallenge(ac);
          break;

        case 'score_target':
          // Check score gained within time window
          const windowSize = ac.challenge.target >= 50000 ? 60 : 30;
          const cutoff = songTime - windowSize;
          const oldCheckpoints = this.scoreCheckpoints.filter(cp => cp.time <= cutoff);
          const baseScore = oldCheckpoints.length > 0 ? oldCheckpoints[oldCheckpoints.length - 1].score : 0;
          ac.progress = score - baseScore;
          if (ac.progress >= ac.challenge.target) this.completeChallenge(ac);
          break;

        case 'accuracy_target':
          ac.progress = accuracy;
          break;
      }
    }
  }

  onMiss(songTime: number, accuracy: number) {
    this.perfectStreak = 0;
    this.lastMissTime = songTime;

    for (const ac of this.activeChallenges) {
      if (ac.completed || ac.failed) continue;

      switch (ac.challenge.type) {
        case 'accuracy_target':
          if (accuracy < ac.challenge.target) {
            ac.failed = true;
          }
          break;
        case 'no_miss_duration':
          ac.progress = 0;
          break;
      }
    }
  }

  private completeChallenge(ac: ActiveChallenge) {
    if (ac.completed || this.completedIds.has(ac.challenge.id)) return;
    ac.completed = true;
    ac.displayTimer = 3.0;
    this.completedIds.add(ac.challenge.id);
    this.totalBonusScore += ac.challenge.bonusScore;
    this.pendingNotifications.push({
      name: ac.challenge.name,
      bonus: ac.challenge.bonusScore,
      color: ac.challenge.color,
      difficulty: ac.challenge.difficulty,
    });
  }

  update(dt: number) {
    for (const ac of this.activeChallenges) {
      if (ac.displayTimer > 0) ac.displayTimer -= dt;
    }
  }

  popNotifications(): { name: string; bonus: number; color: string; difficulty: string }[] {
    const result = [...this.pendingNotifications];
    this.pendingNotifications = [];
    return result;
  }

  getActiveChallenges(): ActiveChallenge[] {
    return this.activeChallenges;
  }

  getTotalBonus(): number {
    return this.totalBonusScore;
  }

  getCompletedCount(): number {
    return this.completedIds.size;
  }

  getDifficultyIcon(diff: string): string {
    switch (diff) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'diamond': return '💎';
      default: return '⭐';
    }
  }
}

// ---- Challenge HUD Rendering ----

let challengeHUD: HTMLDivElement | null = null;

export function createChallengeHUD(): HTMLDivElement {
  if (challengeHUD) challengeHUD.remove();
  challengeHUD = document.createElement('div');
  challengeHUD.id = 'challengeHUD';
  challengeHUD.style.cssText = `
    position: fixed; top: 80px; right: 15px; z-index: 150;
    font-family: 'Courier New', monospace; pointer-events: none;
    display: flex; flex-direction: column; gap: 4px; align-items: flex-end;
  `;
  document.body.appendChild(challengeHUD);
  return challengeHUD;
}

export function updateChallengeHUD(manager: ChallengeManager) {
  if (!challengeHUD) return;
  const challenges = manager.getActiveChallenges();

  challengeHUD.innerHTML = challenges.map(ac => {
    const ch = ac.challenge;
    const pct = Math.min(100, (ac.progress / ch.target) * 100);
    const isDone = ac.completed;
    const isFailed = ac.failed;

    let statusColor = ch.color;
    let statusText = `${Math.floor(ac.progress)}/${ch.target}`;
    let opacity = 0.8;

    if (isDone) {
      statusColor = '#ffff00';
      statusText = '✓ COMPLETE';
      opacity = ac.displayTimer > 0 ? 1 : 0.4;
    } else if (isFailed) {
      statusColor = '#ff0044';
      statusText = '✗ FAILED';
      opacity = 0.3;
    }

    return `
      <div style="
        background: rgba(0,0,0,0.5); border: 1px solid ${statusColor}40;
        padding: 4px 8px; border-radius: 4px; opacity: ${opacity};
        min-width: 140px; transition: opacity 0.3s;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; color: ${statusColor};">${manager.getDifficultyIcon(ch.difficulty)} ${ch.name}</span>
          <span style="font-size: 9px; color: ${statusColor};">${statusText}</span>
        </div>
        <div style="height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; margin-top: 2px;">
          <div style="height: 100%; width: ${pct}%; background: ${statusColor}; border-radius: 1px; transition: width 0.2s;"></div>
        </div>
      </div>
    `;
  }).join('');
}

export function hideChallengeHUD() {
  if (challengeHUD) {
    challengeHUD.remove();
    challengeHUD = null;
  }
}
