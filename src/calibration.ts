// ============================================================
// Neon Beats VR — Audio Calibration Screen
// Let players calibrate audio-visual timing offset
// Uses a simple tap-along-to-metronome test
// ============================================================

import { playMenuSelect, initAudio } from './audio';

let calibScreen: HTMLDivElement | null = null;
let calibrating = false;
let calibBpm = 120;
let calibTaps: number[] = [];
let calibStartTime = 0;
let calibInterval: number | null = null;
let beepOsc: OscillatorNode | null = null;

export function showCalibrationScreen(
  currentOffset: number,
  onSave: (offset: number) => void,
  onBack: () => void
): HTMLDivElement {
  hideCalibrationScreen();

  const screen = document.createElement('div');
  screen.id = 'audioCalibration';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,2,15,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  let measuredOffset = currentOffset;
  calibTaps = [];
  calibrating = false;

  function render() {
    screen.innerHTML = `
      <div style="text-align: center; max-width: 450px; width: 90%;">
        <h2 style="font-size: 24px; letter-spacing: 3px; margin-bottom: 10px;
          color: #00ffff; text-shadow: 0 0 15px #00ffff;">AUDIO CALIBRATION</h2>
        <div style="font-size: 13px; opacity: 0.5; margin-bottom: 25px;">
          Sync audio with your display for precise timing
        </div>

        <!-- Current offset -->
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;
          margin-bottom: 20px;">
          <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 5px;">
            CURRENT OFFSET
          </div>
          <div style="font-size: 28px; color: ${measuredOffset === 0 ? '#00ff88' : '#ffcc00'};">
            ${measuredOffset > 0 ? '+' : ''}${measuredOffset}ms
          </div>
          <div style="font-size: 11px; opacity: 0.3; margin-top: 5px;">
            ${measuredOffset < 0 ? 'Audio plays earlier' : measuredOffset > 0 ? 'Audio plays later' : 'No offset'}
          </div>
        </div>

        <!-- Manual adjustment -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 8px;">
            MANUAL ADJUST
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
            <button class="offsetBtn" data-delta="-10" style="
              background: transparent; border: 1px solid rgba(255,255,255,0.3);
              color: #fff; width: 40px; height: 40px; font-size: 18px;
              font-family: monospace; cursor: pointer; border-radius: 4px;
            ">-10</button>
            <button class="offsetBtn" data-delta="-1" style="
              background: transparent; border: 1px solid rgba(255,255,255,0.3);
              color: #fff; width: 40px; height: 40px; font-size: 18px;
              font-family: monospace; cursor: pointer; border-radius: 4px;
            ">-1</button>
            <div style="font-size: 22px; width: 70px; text-align: center;">
              ${measuredOffset}
            </div>
            <button class="offsetBtn" data-delta="1" style="
              background: transparent; border: 1px solid rgba(255,255,255,0.3);
              color: #fff; width: 40px; height: 40px; font-size: 18px;
              font-family: monospace; cursor: pointer; border-radius: 4px;
            ">+1</button>
            <button class="offsetBtn" data-delta="10" style="
              background: transparent; border: 1px solid rgba(255,255,255,0.3);
              color: #fff; width: 40px; height: 40px; font-size: 18px;
              font-family: monospace; cursor: pointer; border-radius: 4px;
            ">+10</button>
          </div>
        </div>

        <!-- Auto calibrate -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; opacity: 0.4; letter-spacing: 1px; margin-bottom: 8px;">
            AUTO CALIBRATE
          </div>
          <div style="font-size: 12px; opacity: 0.5; margin-bottom: 10px;">
            ${calibrating 
              ? `Tap along to the beat! (${calibTaps.length}/8 taps)`
              : 'Press Start, then tap along to the metronome clicks'}
          </div>
          <button id="calibStartBtn" style="
            background: transparent; border: 2px solid ${calibrating ? '#ff6600' : '#00ffff'};
            color: ${calibrating ? '#ff6600' : '#00ffff'};
            padding: 10px 30px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          ">${calibrating ? 'STOP' : 'START CALIBRATION'}</button>
          ${calibrating ? `
            <div id="calibTapBtn" style="
              margin-top: 15px; width: 120px; height: 120px; border-radius: 50%;
              background: rgba(0,255,255,0.1); border: 3px solid #00ffff;
              display: flex; align-items: center; justify-content: center;
              margin: 15px auto 0; cursor: pointer; font-size: 16px; color: #00ffff;
              transition: all 0.1s; user-select: none;
            ">TAP</div>
          ` : ''}
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="calibSaveBtn" style="
            background: transparent; border: 2px solid #00ff88; color: #00ff88;
            padding: 10px 30px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          ">SAVE</button>
          <button id="calibBackBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.4); padding: 10px 25px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">CANCEL</button>
        </div>
      </div>
    `;

    // Wire events
    screen.querySelectorAll('.offsetBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt((btn as HTMLElement).dataset.delta!);
        measuredOffset = Math.max(-100, Math.min(100, measuredOffset + delta));
        playMenuSelect();
        render();
      });
    });

    screen.querySelector('#calibStartBtn')?.addEventListener('click', () => {
      if (calibrating) {
        stopCalibration();
      } else {
        startCalibration();
      }
      render();
    });

    const tapBtn = screen.querySelector('#calibTapBtn');
    if (tapBtn) {
      tapBtn.addEventListener('mousedown', () => recordTap());
      tapBtn.addEventListener('touchstart', (e) => { e.preventDefault(); recordTap(); });
    }

    screen.querySelector('#calibSaveBtn')?.addEventListener('click', () => {
      playMenuSelect();
      stopCalibration();
      onSave(measuredOffset);
    });
    screen.querySelector('#calibBackBtn')?.addEventListener('click', () => {
      playMenuSelect();
      stopCalibration();
      onBack();
    });
  }

  function startCalibration() {
    calibrating = true;
    calibTaps = [];
    calibStartTime = performance.now();
    const beatMs = 60000 / calibBpm;

    const ctx = initAudio();
    calibInterval = window.setInterval(() => {
      // Play metronome click
      try {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } catch {}
    }, beatMs);
  }

  function stopCalibration() {
    calibrating = false;
    if (calibInterval) {
      clearInterval(calibInterval);
      calibInterval = null;
    }

    // Calculate offset from taps
    if (calibTaps.length >= 4) {
      const beatMs = 60000 / calibBpm;
      const offsets: number[] = [];
      for (const tap of calibTaps) {
        const elapsed = tap - calibStartTime;
        const nearestBeat = Math.round(elapsed / beatMs) * beatMs;
        const offset = elapsed - nearestBeat;
        offsets.push(offset);
      }
      const avgOffset = offsets.reduce((s, o) => s + o, 0) / offsets.length;
      measuredOffset = Math.round(avgOffset);
    }
  }

  function recordTap() {
    if (!calibrating) return;
    calibTaps.push(performance.now());
    
    // Visual feedback
    const tapBtn = screen.querySelector('#calibTapBtn') as HTMLElement;
    if (tapBtn) {
      tapBtn.style.background = 'rgba(0,255,255,0.3)';
      tapBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        tapBtn.style.background = 'rgba(0,255,255,0.1)';
        tapBtn.style.transform = 'scale(1)';
      }, 100);
    }

    if (calibTaps.length >= 8) {
      stopCalibration();
      render();
    } else {
      render();
    }
  }

  // Also listen for keyboard taps during calibration
  const calibKeyListener = (e: KeyboardEvent) => {
    if (calibrating && (e.code === 'Space' || e.code === 'KeyD' || e.code === 'KeyJ')) {
      e.preventDefault();
      recordTap();
    }
  };
  window.addEventListener('keydown', calibKeyListener);

  document.body.appendChild(screen);
  calibScreen = screen;
  render();

  // Clean up on close
  const originalHide = hideCalibrationScreen;
  (screen as any).__cleanup = () => {
    window.removeEventListener('keydown', calibKeyListener);
    stopCalibration();
  };

  return screen;
}

export function hideCalibrationScreen() {
  if (calibScreen) {
    if ((calibScreen as any).__cleanup) (calibScreen as any).__cleanup();
    calibScreen.remove();
    calibScreen = null;
  }
  document.getElementById('audioCalibration')?.remove();
}
