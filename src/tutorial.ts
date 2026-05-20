// ============================================================
// Neon Beats VR — Tutorial System
// First-time player onboarding with interactive tutorial
// ============================================================

import { playMenuSelect, playHitSound, playMissSound, playCountdownBeep } from './audio';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlight?: string; // CSS selector to highlight
  action?: 'wait' | 'press_any' | 'press_lane' | 'combo_3' | 'auto_advance';
  duration?: number;  // auto_advance duration in ms
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Neon Beats!',
    content: 'A rhythm game set in a neon holodeck. Blocks fly toward you — hit them in time with the music!',
    action: 'press_any',
  },
  {
    id: 'lanes',
    title: 'The Lanes',
    content: 'Blocks approach through 4 lanes. Each lane has its own color and key.\n\n🔴 D  •  🔵 F  •  🟠 J  •  🟣 K',
    action: 'press_any',
  },
  {
    id: 'timing',
    title: 'Timing Matters',
    content: 'Hit blocks as they reach the glowing line at the bottom.\n\n⚡ Perfect — within 50ms\n✨ Great — within 100ms\n✓ Good — within 180ms\n✗ Miss — too early or too late',
    action: 'press_any',
  },
  {
    id: 'try_hit',
    title: 'Try It!',
    content: 'Press any lane key (D, F, J, or K) to see how it feels.',
    action: 'press_lane',
  },
  {
    id: 'combos',
    title: 'Combo System',
    content: 'Hit blocks in a row to build a combo. Every 10 hits increases your multiplier up to ×8!\n\nMissing a block resets your combo to zero.',
    action: 'press_any',
  },
  {
    id: 'scoring',
    title: 'Scoring',
    content: 'Perfect: 300 pts × multiplier\nGreat: 200 pts × multiplier\nGood: 100 pts × multiplier\n\nHigher difficulty songs have more blocks and faster patterns.',
    action: 'press_any',
  },
  {
    id: 'special_blocks',
    title: 'Special Blocks',
    content: '💣 Bombs (red octahedron) — DON\'T hit these! They deal damage.\n\n💎 Slides (diamond with arrow) — Hit the starting lane, then the target lane for bonus points.',
    action: 'press_any',
  },
  {
    id: 'health',
    title: 'Health Bar',
    content: 'Missing blocks drains your health. If it reaches zero, the song ends.\n\nPerfect hits heal you slightly. Use the No Fail modifier if you want to practice without pressure.',
    action: 'press_any',
  },
  {
    id: 'modifiers',
    title: 'Game Modifiers',
    content: '⚙ Access modifiers from the song select screen:\n\n• No Fail — Can\'t lose health\n• Half Speed — Slower notes\n• Auto Play — Watch the AI\n• Mirror — Lanes reversed\n• Hidden / Fade In — Visibility changes',
    action: 'press_any',
  },
  {
    id: 'pause',
    title: 'Pause & Controls',
    content: 'Press SPACE or ESC to pause during gameplay.\n\nYou can also click/tap on lanes to hit blocks — useful for mobile or VR!',
    action: 'press_any',
  },
  {
    id: 'challenges',
    title: 'Challenges',
    content: 'Each song comes with random mini-challenges:\n\n🥉 Bronze — Easy goals like 5 perfects in a row\n🥈 Silver — Tougher targets\n🥇 Gold — Expert objectives\n💎 Diamond — Only the best',
    action: 'press_any',
  },
  {
    id: 'ready',
    title: 'You\'re Ready!',
    content: 'Head to the song select to choose your first track.\n\nStart with "Neon Pulse" (Easy) to warm up, or dive straight into Endless Mode for an infinite challenge.\n\nGood luck, and feel the beat! 🎵',
    action: 'press_any',
  },
];

// ---- Tutorial Screen ----

let tutorialScreen: HTMLDivElement | null = null;
let currentStepIndex = 0;
let stepCallback: (() => void) | null = null;
let keyListener: ((e: KeyboardEvent) => void) | null = null;

export function showTutorial(onComplete: () => void): HTMLDivElement {
  hideTutorial();
  currentStepIndex = 0;

  const screen = document.createElement('div');
  screen.id = 'tutorialScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,5,20,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 250; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;
  document.body.appendChild(screen);
  tutorialScreen = screen;

  stepCallback = onComplete;

  renderStep();
  setupKeyListener();

  return screen;
}

function renderStep() {
  if (!tutorialScreen) return;
  const step = TUTORIAL_STEPS[currentStepIndex];
  const progress = `${currentStepIndex + 1}/${TUTORIAL_STEPS.length}`;
  const progressPct = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  const lines = step.content.split('\n').map(l =>
    `<div style="min-height: 12px;">${l || '&nbsp;'}</div>`
  ).join('');

  tutorialScreen.innerHTML = `
    <div style="text-align: center; max-width: 500px; width: 90%;">
      <!-- Progress bar -->
      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; opacity: 0.3; margin-bottom: 4px;">
          <span>TUTORIAL</span>
          <span>${progress}</span>
        </div>
        <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px;">
          <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, #00ffff, #ff00ff);
            border-radius: 2px; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Content -->
      <div style="
        background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.2);
        border-radius: 8px; padding: 30px 25px; margin-bottom: 20px;
      ">
        <h2 style="font-size: 24px; margin-bottom: 15px; color: #00ffff;
          text-shadow: 0 0 15px #00ffff; letter-spacing: 2px;">${step.title}</h2>
        <div style="font-size: 14px; line-height: 1.8; text-align: left; opacity: 0.8;">
          ${lines}
        </div>
      </div>

      <!-- Navigation -->
      <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
        ${currentStepIndex > 0 ? `
          <button id="tutPrev" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.4); padding: 8px 20px; font-size: 12px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">← PREV</button>
        ` : ''}
        <button id="tutNext" style="
          background: transparent; border: 2px solid #00ffff; color: #00ffff;
          padding: 8px 25px; font-size: 14px; font-family: 'Courier New', monospace;
          cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          text-shadow: 0 0 10px #00ffff; transition: all 0.2s;
        ">${currentStepIndex < TUTORIAL_STEPS.length - 1 ? 'NEXT →' : 'START PLAYING!'}</button>
        <button id="tutSkip" style="
          background: transparent; border: none; color: rgba(255,255,255,0.25);
          padding: 8px 12px; font-size: 11px; font-family: 'Courier New', monospace;
          cursor: pointer;
        ">Skip Tutorial</button>
      </div>

      <!-- Hint -->
      <div style="margin-top: 15px; font-size: 11px; opacity: 0.2;">
        ${step.action === 'press_lane' ? 'Press D, F, J, or K to continue' : 'Press any key or click NEXT'}
      </div>
    </div>

    <style>
      #tutNext:hover { background: rgba(0,255,255,0.1); transform: scale(1.03); }
    </style>
  `;

  // Wire buttons
  const nextBtn = document.getElementById('tutNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      playMenuSelect();
      advanceStep();
    });
  }

  const prevBtn = document.getElementById('tutPrev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      playMenuSelect();
      if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
      }
    });
  }

  const skipBtn = document.getElementById('tutSkip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      playMenuSelect();
      completeTutorial();
    });
  }

  // Auto-advance if configured
  if (step.action === 'auto_advance' && step.duration) {
    setTimeout(() => {
      if (tutorialScreen) advanceStep();
    }, step.duration);
  }
}

function advanceStep() {
  if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
    currentStepIndex++;
    renderStep();
  } else {
    completeTutorial();
  }
}

function completeTutorial() {
  const cb = stepCallback;
  hideTutorial();
  if (cb) cb();
}

function setupKeyListener() {
  if (keyListener) window.removeEventListener('keydown', keyListener);
  keyListener = (e: KeyboardEvent) => {
    if (!tutorialScreen) return;
    const step = TUTORIAL_STEPS[currentStepIndex];

    if (step.action === 'press_lane') {
      const laneKeys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
      if (laneKeys.includes(e.code)) {
        playHitSound('perfect');
        advanceStep();
      }
    } else if (e.code === 'Escape') {
      completeTutorial();
    } else if (e.code === 'ArrowRight' || e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      advanceStep();
    } else if (e.code === 'ArrowLeft' && currentStepIndex > 0) {
      currentStepIndex--;
      renderStep();
    }
  };
  window.addEventListener('keydown', keyListener);
}

export function hideTutorial() {
  if (keyListener) {
    window.removeEventListener('keydown', keyListener);
    keyListener = null;
  }
  if (tutorialScreen) {
    tutorialScreen.remove();
    tutorialScreen = null;
  }
  stepCallback = null;
}

export function isTutorialActive(): boolean {
  return tutorialScreen !== null;
}

// Mini inline tip system for contextual help
export class TipSystem {
  private tips = new Map<string, boolean>();
  private tipElement: HTMLDivElement | null = null;
  private hideTimeout: number | null = null;

  constructor() {
    this.loadShown();
  }

  private loadShown() {
    try {
      const raw = localStorage.getItem('neonbeats_tips_shown');
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach(id => this.tips.set(id, true));
      }
    } catch { /* ignore */ }
  }

  private saveShown() {
    try {
      localStorage.setItem('neonbeats_tips_shown', JSON.stringify([...this.tips.keys()]));
    } catch { /* ignore */ }
  }

  showTip(id: string, message: string, duration: number = 4000) {
    if (this.tips.has(id)) return;
    this.tips.set(id, true);
    this.saveShown();

    if (this.tipElement) this.tipElement.remove();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.tipElement = document.createElement('div');
    this.tipElement.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); border: 1px solid rgba(0,255,255,0.3);
      color: #00ffff; padding: 10px 20px; border-radius: 6px;
      font-family: 'Courier New', monospace; font-size: 13px;
      z-index: 300; pointer-events: none;
      animation: tipSlideUp 0.3s ease-out;
    `;
    this.tipElement.textContent = `💡 ${message}`;
    document.body.appendChild(this.tipElement);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes tipSlideUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    this.tipElement.appendChild(style);

    this.hideTimeout = window.setTimeout(() => {
      if (this.tipElement) {
        this.tipElement.remove();
        this.tipElement = null;
      }
    }, duration);
  }

  reset() {
    this.tips.clear();
    this.saveShown();
  }
}
