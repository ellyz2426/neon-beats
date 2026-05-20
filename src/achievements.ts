// ============================================================
// Neon Beats VR — Achievements System
// Track player milestones across sessions
// ============================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: AchievementContext) => boolean;
  unlocked: boolean;
}

export interface AchievementContext {
  totalScore: number;
  bestCombo: number;
  totalPerfects: number;
  totalSongsCleared: number;
  totalPlayTime: number;
  currentCombo: number;
  currentScore: number;
  currentPerfects: number;
  accuracy: number;
  grade: string;
  songDifficulty: string;
  endlessPhase: number;
  maxCombo: number;
  score: number;
  songsCompleted: number;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'first_clear', name: 'First Clear', description: 'Complete your first song',
    icon: '🎵', color: '#00ff88',
    condition: (ctx) => ctx.totalSongsCleared >= 1,
  },
  {
    id: 'combo_10', name: 'Getting Started', description: 'Reach a 10 combo',
    icon: '🔥', color: '#ffcc00',
    condition: (ctx) => ctx.currentCombo >= 10,
  },
  {
    id: 'combo_50', name: 'On Fire', description: 'Reach a 50 combo',
    icon: '💫', color: '#ff6600',
    condition: (ctx) => ctx.currentCombo >= 50,
  },
  {
    id: 'combo_100', name: 'Unstoppable', description: 'Reach a 100 combo',
    icon: '⚡', color: '#ff00ff',
    condition: (ctx) => ctx.currentCombo >= 100,
  },
  {
    id: 'combo_200', name: 'Legendary Chain', description: 'Reach a 200 combo',
    icon: '👑', color: '#ffff00',
    condition: (ctx) => ctx.currentCombo >= 200,
  },
  {
    id: 'perfect_song', name: 'Perfectionist', description: 'Get SS rank on any song',
    icon: '💎', color: '#00ffff',
    condition: (ctx) => ctx.grade === 'SS',
  },
  {
    id: 'score_10k', name: 'Rising Star', description: 'Score 10,000 in a single song',
    icon: '⭐', color: '#00ffff',
    condition: (ctx) => ctx.currentScore >= 10000,
  },
  {
    id: 'score_50k', name: 'Superstar', description: 'Score 50,000 in a single song',
    icon: '🌟', color: '#ff00ff',
    condition: (ctx) => ctx.currentScore >= 50000,
  },
  {
    id: 'score_100k', name: 'Mega Star', description: 'Score 100,000 in a single song',
    icon: '💫', color: '#ffff00',
    condition: (ctx) => ctx.currentScore >= 100000,
  },
  {
    id: 'hard_clear', name: 'Brave Heart', description: 'Clear a Hard song',
    icon: '🛡️', color: '#ff6600',
    condition: (ctx) => ctx.songDifficulty === 'hard' && ctx.totalSongsCleared > 0,
  },
  {
    id: 'expert_clear', name: 'Elite Player', description: 'Clear an Expert song',
    icon: '🏆', color: '#ff0044',
    condition: (ctx) => ctx.songDifficulty === 'expert' && ctx.totalSongsCleared > 0,
  },
  {
    id: 'endless_5', name: 'Marathon Runner', description: 'Survive 5 phases in Endless',
    icon: '🏃', color: '#9933ff',
    condition: (ctx) => ctx.endlessPhase >= 5,
  },
  {
    id: 'endless_10', name: 'Infinite Loop', description: 'Survive 10 phases in Endless',
    icon: '♾️', color: '#ffff00',
    condition: (ctx) => ctx.endlessPhase >= 10,
  },
  {
    id: 'perfects_100', name: 'Precision Machine', description: 'Hit 100 total Perfects',
    icon: '🎯', color: '#00ffff',
    condition: (ctx) => ctx.totalPerfects >= 100,
  },
  {
    id: 'perfects_1000', name: 'Rhythm Master', description: 'Hit 1,000 total Perfects',
    icon: '🎯', color: '#ff00ff',
    condition: (ctx) => ctx.totalPerfects >= 1000,
  },
  {
    id: 'playtime_30', name: 'Dedicated', description: 'Play for 30 minutes total',
    icon: '⏰', color: '#00ff88',
    condition: (ctx) => ctx.totalPlayTime >= 1800,
  },
  {
    id: 'playtime_60', name: 'Addicted', description: 'Play for 1 hour total',
    icon: '⏰', color: '#ff00ff',
    condition: (ctx) => ctx.totalPlayTime >= 3600,
  },

  // ---- New Achievements ----
  // Combo mastery
  {
    id: 'combo_500', name: 'Transcendent', description: 'Reach a 500 combo',
    icon: '🌌', color: '#ff00ff',
    condition: (ctx) => ctx.maxCombo >= 500,
  },
  // Accuracy
  {
    id: 'accuracy_95', name: 'Sharpshooter', description: 'Finish a song with 95%+ accuracy',
    icon: '🎯', color: '#00ffff',
    condition: (ctx) => ctx.accuracy >= 0.95,
  },
  {
    id: 'accuracy_99', name: 'Virtually Perfect', description: 'Finish a song with 99%+ accuracy',
    icon: '💫', color: '#ffd700',
    condition: (ctx) => ctx.accuracy >= 0.99,
  },
  // Scoring
  {
    id: 'score_200k', name: 'Score Legend', description: 'Score 200,000 in a single song',
    icon: '👑', color: '#ffd700',
    condition: (ctx) => ctx.score >= 200000,
  },
  // Songs
  {
    id: 'songs_5', name: 'Explorer', description: 'Complete 5 different songs',
    icon: '🗺', color: '#44ff88',
    condition: (ctx) => ctx.songsCompleted >= 5,
  },
  {
    id: 'songs_10', name: 'Traveler', description: 'Complete 10 different songs',
    icon: '🌍', color: '#44ff88',
    condition: (ctx) => ctx.songsCompleted >= 10,
  },
  {
    id: 'songs_20', name: 'Globetrotter', description: 'Complete 20 different songs',
    icon: '🚀', color: '#44ff88',
    condition: (ctx) => ctx.songsCompleted >= 20,
  },
  // Full combos
  {
    id: 'fc_easy', name: 'No Misses', description: 'Full combo on an Easy song',
    icon: '💚', color: '#00ff88',
    condition: (ctx) => ctx.accuracy >= 1.0 && ctx.songDifficulty === 'easy',
  },
  {
    id: 'fc_hard', name: 'Iron Will', description: 'Full combo on a Hard song',
    icon: '🧡', color: '#ff6600',
    condition: (ctx) => ctx.accuracy >= 1.0 && ctx.songDifficulty === 'hard',
  },
  {
    id: 'fc_expert', name: 'Diamond Hands', description: 'Full combo on an Expert song',
    icon: '💎', color: '#ff0044',
    condition: (ctx) => ctx.accuracy >= 1.0 && ctx.songDifficulty === 'expert',
  },
  // Playtime
  {
    id: 'playtime_5h', name: 'Veteran', description: 'Play for 5 hours total',
    icon: '🎖', color: '#aaccff',
    condition: (ctx) => ctx.totalPlayTime >= 18000,
  },
  {
    id: 'playtime_10h', name: 'Legend', description: 'Play for 10 hours total',
    icon: '🏅', color: '#ffd700',
    condition: (ctx) => ctx.totalPlayTime >= 36000,
  },
  // Speed
  {
    id: 'fast_200', name: 'Speed Demon', description: 'Clear a 200+ BPM song',
    icon: '⚡', color: '#ffcc00',
    condition: (ctx) => (ctx as any).bpm >= 200 && ctx.accuracy >= 0.5,
  },
  // Endless
  {
    id: 'endless_20', name: 'Eternal', description: 'Survive 20 phases in Endless',
    icon: '♾', color: '#ff00ff',
    condition: (ctx) => ctx.endlessPhase >= 20,
  },
  // Perfects
  {
    id: 'perfects_5000', name: 'Perfect Storm', description: 'Hit 5,000 total Perfects',
    icon: '⭐', color: '#ffd700',
    condition: (ctx) => (ctx as any).totalPerfects >= 5000,
  },
  // Fun
  {
    id: 'midnight', name: 'Night Owl', description: 'Play between midnight and 4 AM',
    icon: '🦉', color: '#6644ff',
    condition: () => {
      const h = new Date().getHours();
      return h >= 0 && h < 4;
    },
  },
  {
    id: 'comeback', name: 'Comeback King', description: 'Win with less than 10% health remaining',
    icon: '💪', color: '#ff4400',
    condition: (ctx) => ctx.accuracy >= 0.5 && (ctx as any).healthPercent <= 0.1,
  },
  {
    id: 'no_perfect', name: 'Barely Made It', description: 'Complete a song with 0 Perfects',
    icon: '😅', color: '#ffcc00',
    condition: (ctx) => (ctx as any).perfects === 0 && ctx.accuracy >= 0.5,
  },
];

export function loadAchievements(): Achievement[] {
  let unlocked: Set<string>;
  try {
    const data = localStorage.getItem('neonbeats_achievements');
    unlocked = data ? new Set(JSON.parse(data)) : new Set();
  } catch { unlocked = new Set(); }

  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: unlocked.has(def.id),
  }));
}

export function saveAchievements(achievements: Achievement[]) {
  try {
    const unlocked = achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('neonbeats_achievements', JSON.stringify(unlocked));
  } catch {}
}

export function checkAchievements(
  achievements: Achievement[],
  context: AchievementContext
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  for (const ach of achievements) {
    if (!ach.unlocked && ach.condition(context)) {
      ach.unlocked = true;
      newlyUnlocked.push(ach);
    }
  }
  if (newlyUnlocked.length > 0) {
    saveAchievements(achievements);
  }
  return newlyUnlocked;
}

// ---- Achievement Notification ----

let achievementQueue: Achievement[] = [];
let showingAchievement = false;

export function queueAchievementNotification(ach: Achievement) {
  achievementQueue.push(ach);
  if (!showingAchievement) showNextAchievement();
}

function showNextAchievement() {
  if (achievementQueue.length === 0) {
    showingAchievement = false;
    return;
  }
  showingAchievement = true;
  const ach = achievementQueue.shift()!;

  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: -80px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.9); border: 1px solid ${ach.color};
    border-radius: 8px; padding: 12px 24px; z-index: 300;
    font-family: 'Courier New', monospace; color: #fff;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 0 20px ${ach.color}40;
    transition: top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  el.innerHTML = `
    <span style="font-size: 28px;">${ach.icon}</span>
    <div>
      <div style="font-size: 11px; opacity: 0.5; letter-spacing: 2px;">ACHIEVEMENT UNLOCKED</div>
      <div style="font-size: 16px; color: ${ach.color}; font-weight: bold;">${ach.name}</div>
      <div style="font-size: 11px; opacity: 0.6;">${ach.description}</div>
    </div>
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => { el.style.top = '20px'; });

  setTimeout(() => {
    el.style.top = '-80px';
    setTimeout(() => {
      el.remove();
      showNextAchievement();
    }, 400);
  }, 3000);
}
