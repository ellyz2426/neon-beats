// ============================================================
// Neon Beats VR — Practice Mode
// Slow down, loop sections, show timing guides
// ============================================================

import { playMenuSelect } from './audio';

export interface PracticeConfig {
  enabled: boolean;
  speedMultiplier: number;     // 0.25 - 1.0
  loopEnabled: boolean;
  loopStartBeat: number;       // beat index
  loopEndBeat: number;
  showTimingGuides: boolean;
  showEarlyLateLabels: boolean;
  autoRestart: boolean;        // auto restart on fail
  metronomeEnabled: boolean;
  sectionLoopSecs: number;     // section length in seconds
  sectionStart: number;        // start time in seconds
}

export function createDefaultPracticeConfig(): PracticeConfig {
  return {
    enabled: false,
    speedMultiplier: 1.0,
    loopEnabled: false,
    loopStartBeat: 0,
    loopEndBeat: 0,
    showTimingGuides: true,
    showEarlyLateLabels: true,
    autoRestart: true,
    metronomeEnabled: false,
    sectionLoopSecs: 30,
    sectionStart: 0,
  };
}

// Practice mode overlay/controls
let practiceOverlay: HTMLDivElement | null = null;

export function showPracticeControls(
  config: PracticeConfig,
  songDuration: number,
  onUpdate: (config: PracticeConfig) => void,
  onExit: () => void
): HTMLDivElement {
  hidePracticeControls();

  const overlay = document.createElement('div');
  overlay.id = 'practiceControls';
  overlay.style.cssText = `
    position: fixed; bottom: 15px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.8); border: 1px solid rgba(0,255,255,0.3);
    border-radius: 8px; padding: 10px 15px; z-index: 180;
    font-family: 'Courier New', monospace; color: #fff;
    display: flex; gap: 12px; align-items: center; pointer-events: auto;
  `;
  document.body.appendChild(overlay);
  practiceOverlay = overlay;

  function render() {
    overlay.innerHTML = `
      <div style="font-size: 10px; color: #00ffff; letter-spacing: 1px;">PRACTICE</div>

      <!-- Speed control -->
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 10px; opacity: 0.5;">Speed:</span>
        ${speedBtn(0.25, config.speedMultiplier)}
        ${speedBtn(0.5, config.speedMultiplier)}
        ${speedBtn(0.75, config.speedMultiplier)}
        ${speedBtn(1.0, config.speedMultiplier)}
      </div>

      <!-- Loop toggle -->
      <div class="pToggle" data-key="loop" style="
        background: ${config.loopEnabled ? 'rgba(255,0,255,0.15)' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${config.loopEnabled ? '#ff00ff' : 'rgba(255,255,255,0.1)'};
        color: ${config.loopEnabled ? '#ff00ff' : '#666'};
        padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;
      ">🔁 Loop</div>

      <!-- Section control (if loop enabled) -->
      ${config.loopEnabled ? `
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 10px; opacity: 0.5;">Section:</span>
          <input type="range" class="pSectionSlider" min="0" max="${Math.max(0, songDuration - config.sectionLoopSecs)}"
            value="${config.sectionStart}" step="5" style="width: 80px; height: 3px;">
          <span style="font-size: 10px; color: #ff00ff;">${formatTime(config.sectionStart)}-${formatTime(config.sectionStart + config.sectionLoopSecs)}</span>
        </div>
      ` : ''}

      <!-- Metronome -->
      <div class="pToggle" data-key="metronome" style="
        background: ${config.metronomeEnabled ? 'rgba(255,255,0,0.15)' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${config.metronomeEnabled ? '#ffff00' : 'rgba(255,255,255,0.1)'};
        color: ${config.metronomeEnabled ? '#ffff00' : '#666'};
        padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;
      ">🥁 Metro</div>

      <!-- Timing guides -->
      <div class="pToggle" data-key="guides" style="
        background: ${config.showTimingGuides ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${config.showTimingGuides ? '#00ff88' : 'rgba(255,255,255,0.1)'};
        color: ${config.showTimingGuides ? '#00ff88' : '#666'};
        padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;
      ">📏 Guides</div>

      <!-- Exit practice -->
      <button class="pExitBtn" style="
        background: transparent; border: 1px solid rgba(255,0,0,0.3);
        color: #ff4444; padding: 3px 10px; font-size: 10px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 3px;
      ">EXIT</button>
    `;

    // Wire speed buttons
    overlay.querySelectorAll('.pSpeedBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        config.speedMultiplier = parseFloat((btn as HTMLElement).dataset.speed!);
        playMenuSelect();
        onUpdate(config);
        render();
      });
    });

    // Wire toggles
    overlay.querySelectorAll('.pToggle').forEach(el => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.key;
        switch (key) {
          case 'loop': config.loopEnabled = !config.loopEnabled; break;
          case 'metronome': config.metronomeEnabled = !config.metronomeEnabled; break;
          case 'guides': config.showTimingGuides = !config.showTimingGuides; break;
        }
        playMenuSelect();
        onUpdate(config);
        render();
      });
    });

    // Wire section slider
    const sectionSlider = overlay.querySelector('.pSectionSlider') as HTMLInputElement;
    if (sectionSlider) {
      sectionSlider.addEventListener('input', () => {
        config.sectionStart = parseFloat(sectionSlider.value);
        onUpdate(config);
        render();
      });
    }

    // Wire exit
    const exitBtn = overlay.querySelector('.pExitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        playMenuSelect();
        onExit();
      });
    }
  }

  render();
  return overlay;
}

function speedBtn(speed: number, current: number): string {
  const active = Math.abs(current - speed) < 0.01;
  return `
    <button class="pSpeedBtn" data-speed="${speed}" style="
      background: ${active ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.03)'};
      border: 1px solid ${active ? '#00ffff' : 'rgba(255,255,255,0.1)'};
      color: ${active ? '#00ffff' : '#666'}; padding: 2px 6px;
      font-size: 10px; font-family: 'Courier New', monospace; cursor: pointer;
      border-radius: 2px;
    ">${speed === 1.0 ? '1×' : `${speed}×`}</button>
  `;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function hidePracticeControls() {
  if (practiceOverlay) {
    practiceOverlay.remove();
    practiceOverlay = null;
  }
}

export function isPracticeActive(): boolean {
  return practiceOverlay !== null;
}

// Metronome click sound
export function playMetronomeClick(ctx: AudioContext, dest: AudioNode, time: number, isDownbeat: boolean) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isDownbeat ? 1000 : 800, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(isDownbeat ? 0.2 : 0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.04);
}

// Timing guide lines — visual indicators in the 3D scene
export interface TimingGuideConfig {
  showPerfectZone: boolean;
  showGreatZone: boolean;
  showGoodZone: boolean;
  zoneColors: {
    perfect: string;
    great: string;
    good: string;
  };
}

export const DEFAULT_TIMING_GUIDE: TimingGuideConfig = {
  showPerfectZone: true,
  showGreatZone: true,
  showGoodZone: false,
  zoneColors: {
    perfect: '#00ffff',
    great: '#00ff88',
    good: '#ffcc00',
  },
};

// Song section bookmark system for practice loops
export interface SectionBookmark {
  name: string;
  startTime: number;
  endTime: number;
}

export function createSectionBookmarks(songDuration: number, sectionLength: number = 15): SectionBookmark[] {
  const bookmarks: SectionBookmark[] = [];
  let t = 0;
  let idx = 1;
  while (t < songDuration) {
    const end = Math.min(t + sectionLength, songDuration);
    bookmarks.push({ name: `Section ${idx}`, startTime: t, endTime: end });
    t = end;
    idx++;
  }
  return bookmarks;
}
