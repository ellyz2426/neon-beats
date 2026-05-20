// ============================================================
// Neon Beats VR — Interactive Practice Mode
// A guided practice session that teaches each mechanic:
//   1. Basic tapping (single lane)
//   2. Multiple lanes
//   3. Timing precision
//   4. Hold blocks
//   5. Combo building
// Each step sends a few blocks and waits for the player to succeed
// ============================================================

import { playHitSound, playMissSound, playMenuSelect } from './audio';

export type PracticePhase = 
  | 'single_lane'
  | 'multi_lane'
  | 'timing'
  | 'holds'
  | 'combos'
  | 'complete';

export interface PracticeState {
  phase: PracticePhase;
  blocksHit: number;
  blocksRequired: number;
  perfectsHit: number;
  perfectsRequired: number;
  comboReached: number;
  comboRequired: number;
  message: string;
  hint: string;
  progress: number;  // 0-1 across all phases
}

const PHASE_ORDER: PracticePhase[] = [
  'single_lane', 'multi_lane', 'timing', 'holds', 'combos', 'complete'
];

export function createPracticeState(): PracticeState {
  return {
    phase: 'single_lane',
    blocksHit: 0,
    blocksRequired: 3,
    perfectsHit: 0,
    perfectsRequired: 0,
    comboReached: 0,
    comboRequired: 0,
    message: 'Hit the blocks!',
    hint: 'Press the lane key when the block reaches the hit zone',
    progress: 0,
  };
}

export function getPracticePhaseConfig(phase: PracticePhase): {
  message: string;
  hint: string;
  blocksRequired: number;
  perfectsRequired: number;
  comboRequired: number;
  useLanes: number[];
  useHolds: boolean;
  bpmOverride?: number;
} {
  switch (phase) {
    case 'single_lane':
      return {
        message: 'Step 1: Single Lane',
        hint: 'Press D when the red block reaches the line',
        blocksRequired: 3,
        perfectsRequired: 0,
        comboRequired: 0,
        useLanes: [0],
        useHolds: false,
        bpmOverride: 80,
      };
    case 'multi_lane':
      return {
        message: 'Step 2: All Lanes',
        hint: 'D = Red, F = Blue, J = Orange, K = Purple',
        blocksRequired: 6,
        perfectsRequired: 0,
        comboRequired: 0,
        useLanes: [0, 1, 2, 3],
        useHolds: false,
        bpmOverride: 90,
      };
    case 'timing':
      return {
        message: 'Step 3: Precision!',
        hint: 'Try to get PERFECT timing — hit blocks right on the line',
        blocksRequired: 0,
        perfectsRequired: 3,
        comboRequired: 0,
        useLanes: [0, 1, 2, 3],
        useHolds: false,
        bpmOverride: 100,
      };
    case 'holds':
      return {
        message: 'Step 4: Hold Blocks',
        hint: 'Press and HOLD the key for long blocks',
        blocksRequired: 4,
        perfectsRequired: 0,
        comboRequired: 0,
        useLanes: [0, 1, 2, 3],
        useHolds: true,
        bpmOverride: 90,
      };
    case 'combos':
      return {
        message: 'Step 5: Build a Combo!',
        hint: 'Hit 5 blocks in a row without missing',
        blocksRequired: 0,
        perfectsRequired: 0,
        comboRequired: 5,
        useLanes: [0, 1, 2, 3],
        useHolds: false,
        bpmOverride: 100,
      };
    case 'complete':
      return {
        message: 'Practice Complete!',
        hint: 'You\'re ready to play!',
        blocksRequired: 0,
        perfectsRequired: 0,
        comboRequired: 0,
        useLanes: [],
        useHolds: false,
      };
  }
}

export function advancePracticePhase(state: PracticeState): boolean {
  const idx = PHASE_ORDER.indexOf(state.phase);
  if (idx < PHASE_ORDER.length - 1) {
    const nextPhase = PHASE_ORDER[idx + 1];
    state.phase = nextPhase;
    state.blocksHit = 0;
    state.perfectsHit = 0;
    state.comboReached = 0;
    const config = getPracticePhaseConfig(nextPhase);
    state.message = config.message;
    state.hint = config.hint;
    state.blocksRequired = config.blocksRequired;
    state.perfectsRequired = config.perfectsRequired;
    state.comboRequired = config.comboRequired;
    state.progress = (idx + 1) / (PHASE_ORDER.length - 1);
    return true;
  }
  return false;
}

export function checkPracticeProgress(
  state: PracticeState,
  hitQuality?: 'perfect' | 'great' | 'good',
  currentCombo?: number
): boolean {
  if (hitQuality) {
    state.blocksHit++;
    if (hitQuality === 'perfect') state.perfectsHit++;
  }
  if (currentCombo !== undefined && currentCombo > state.comboReached) {
    state.comboReached = currentCombo;
  }

  const config = getPracticePhaseConfig(state.phase);
  
  if (config.blocksRequired > 0 && state.blocksHit >= config.blocksRequired) return true;
  if (config.perfectsRequired > 0 && state.perfectsHit >= config.perfectsRequired) return true;
  if (config.comboRequired > 0 && state.comboReached >= config.comboRequired) return true;
  
  return false;
}

// Practice HUD overlay
export function renderPracticeHUD(state: PracticeState): string {
  const config = getPracticePhaseConfig(state.phase);
  let progressText = '';
  
  if (config.blocksRequired > 0) {
    progressText = `${state.blocksHit}/${config.blocksRequired} blocks`;
  } else if (config.perfectsRequired > 0) {
    progressText = `${state.perfectsHit}/${config.perfectsRequired} perfects`;
  } else if (config.comboRequired > 0) {
    progressText = `${state.comboReached}/${config.comboRequired} combo`;
  }

  return `
    <div style="
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.85); border: 1px solid rgba(0,255,255,0.4);
      padding: 15px 30px; border-radius: 8px; z-index: 180;
      font-family: 'Courier New', monospace; color: #fff; text-align: center;
      pointer-events: none;
    ">
      <div style="font-size: 18px; color: #00ffff; margin-bottom: 5px; letter-spacing: 2px;">
        ${state.message}
      </div>
      <div style="font-size: 13px; opacity: 0.6; margin-bottom: 8px;">
        ${state.hint}
      </div>
      ${progressText ? `
        <div style="font-size: 14px; color: #00ff88;">
          ${progressText}
        </div>
      ` : ''}
      <div style="margin-top: 8px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px;">
        <div style="height: 100%; width: ${state.progress * 100}%; background: #00ffff; border-radius: 2px;"></div>
      </div>
    </div>
  `;
}


// ---- Legacy Practice Config (used by index.ts) ----

export interface PracticeConfig {
  enabled: boolean;
  metronomeEnabled: boolean;
  slowMode: boolean;
  speedMultiplier: number;
  loopSection: boolean;
  loopStart: number;
  loopEnd: number;
}

export function createDefaultPracticeConfig(): PracticeConfig {
  return {
    enabled: false,
    metronomeEnabled: false,
    slowMode: false,
    speedMultiplier: 1.0,
    loopSection: false,
    loopStart: 0,
    loopEnd: 0,
  };
}

let practiceControlsEl: HTMLDivElement | null = null;

export function showPracticeControls(config: PracticeConfig, onChange: (config: PracticeConfig) => void): HTMLDivElement {
  hidePracticeControls();
  const el = document.createElement('div');
  el.id = 'practiceControls';
  el.style.cssText = `
    position: fixed; top: 10px; right: 10px; z-index: 180;
    background: rgba(0,0,0,0.85); border: 1px solid rgba(0,255,255,0.3);
    border-radius: 6px; padding: 10px 15px; font-family: 'Courier New', monospace;
    color: #fff; font-size: 12px; pointer-events: auto;
  `;
  el.innerHTML = `
    <div style="color: #00ffff; font-size: 11px; letter-spacing: 1px; margin-bottom: 8px;">PRACTICE MODE</div>
    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 4px;">
      <input type="checkbox" id="pracMetronome" ${config.metronomeEnabled ? 'checked' : ''}>
      <span>Metronome</span>
    </label>
    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 4px;">
      <input type="checkbox" id="pracSlow" ${config.slowMode ? 'checked' : ''}>
      <span>Slow Mode (0.5×)</span>
    </label>
    <div style="margin-top: 6px; font-size: 11px; opacity: 0.4;">
      Speed: ${config.speedMultiplier.toFixed(1)}×
    </div>
  `;
  document.body.appendChild(el);
  practiceControlsEl = el;

  el.querySelector('#pracMetronome')?.addEventListener('change', (e) => {
    config.metronomeEnabled = (e.target as HTMLInputElement).checked;
    onChange(config);
  });
  el.querySelector('#pracSlow')?.addEventListener('change', (e) => {
    config.slowMode = (e.target as HTMLInputElement).checked;
    config.speedMultiplier = config.slowMode ? 0.5 : 1.0;
    onChange(config);
  });

  return el;
}

export function hidePracticeControls() {
  if (practiceControlsEl) {
    practiceControlsEl.remove();
    practiceControlsEl = null;
  }
  document.getElementById('practiceControls')?.remove();
}

export function playMetronomeClick() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch { /* ignore */ }
}
