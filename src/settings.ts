// ============================================================
// Neon Beats VR — Settings System
// Volume, keybinds, visual preferences, colorblind mode, themes
// Persistent via localStorage
// ============================================================

import { playMenuSelect, setMasterVolume, setMusicVolume, setSfxVolume } from './audio';

export type ColorblindMode = 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type ThemeId = 'neon' | 'cyberpunk' | 'ocean' | 'space' | 'sakura';

export interface Settings {
  // Audio
  masterVolume: number;   // 0.0 - 1.0
  musicVolume: number;
  sfxVolume: number;

  // Controls
  laneKeys: string[];     // key codes for 4 lanes
  pauseKey: string;

  // Visual
  screenShakeIntensity: number; // 0.0 - 1.0
  particleDensity: number;      // 0.0 - 1.0 (multiplier)
  backgroundEffects: boolean;
  showFPS: boolean;
  showTimingMeter: boolean;

  // Accessibility
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  largeText: boolean;

  // Theme
  theme: ThemeId;

  // Gameplay
  noteSpeed: number;      // 0.5 - 2.0 multiplier
  audioOffset: number;    // ms offset for calibration (-100 to 100)

  // Tutorial
  tutorialCompleted: boolean;
  showHitGuides: boolean;
}

const SETTINGS_KEY = 'neonbeats_settings';

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.6,
  laneKeys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
  pauseKey: 'Space',
  screenShakeIntensity: 1.0,
  particleDensity: 1.0,
  backgroundEffects: true,
  showFPS: false,
  showTimingMeter: true,
  colorblindMode: 'off',
  reducedMotion: false,
  largeText: false,
  theme: 'neon',
  noteSpeed: 1.0,
  audioOffset: 0,
  tutorialCompleted: false,
  showHitGuides: true,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function applyAudioSettings(s: Settings) {
  setMasterVolume(s.masterVolume);
  setMusicVolume(s.musicVolume);
  setSfxVolume(s.sfxVolume);
}

// ---- Colorblind Palettes ----

export interface ColorPalette {
  lane1: string;
  lane2: string;
  lane3: string;
  lane4: string;
  perfect: string;
  great: string;
  good: string;
  miss: string;
  accent: string;
  highlight: string;
}

const NORMAL_PALETTE: ColorPalette = {
  lane1: '#ff0066', lane2: '#00ffff', lane3: '#ff6600', lane4: '#9933ff',
  perfect: '#00ffff', great: '#00ff88', good: '#ffcc00', miss: '#ff0044',
  accent: '#ff00ff', highlight: '#ffff00',
};

const DEUTERANOPIA_PALETTE: ColorPalette = {
  lane1: '#0077bb', lane2: '#33bbee', lane3: '#ee7733', lane4: '#cc3311',
  perfect: '#33bbee', great: '#009988', good: '#ee7733', miss: '#cc3311',
  accent: '#ee3377', highlight: '#bbbbbb',
};

const PROTANOPIA_PALETTE: ColorPalette = {
  lane1: '#004488', lane2: '#ddaa33', lane3: '#bb5566', lane4: '#000000',
  perfect: '#ddaa33', great: '#004488', good: '#bb5566', miss: '#000000',
  accent: '#ddaa33', highlight: '#ffffff',
};

const TRITANOPIA_PALETTE: ColorPalette = {
  lane1: '#cc6677', lane2: '#332288', lane3: '#ddcc77', lane4: '#117733',
  perfect: '#332288', great: '#117733', good: '#ddcc77', miss: '#cc6677',
  accent: '#882255', highlight: '#ffffff',
};

export function getColorPalette(mode: ColorblindMode): ColorPalette {
  switch (mode) {
    case 'deuteranopia': return DEUTERANOPIA_PALETTE;
    case 'protanopia': return PROTANOPIA_PALETTE;
    case 'tritanopia': return TRITANOPIA_PALETTE;
    default: return NORMAL_PALETTE;
  }
}

export function getLaneColorsFromPalette(palette: ColorPalette): string[] {
  return [palette.lane1, palette.lane2, palette.lane3, palette.lane4];
}

// ---- Key Display Names ----

const KEY_DISPLAY: Record<string, string> = {
  KeyD: 'D', KeyF: 'F', KeyJ: 'J', KeyK: 'K',
  KeyA: 'A', KeyS: 'S', KeyL: 'L', Semicolon: ';',
  KeyQ: 'Q', KeyW: 'W', KeyO: 'O', KeyP: 'P',
  KeyZ: 'Z', KeyX: 'X', Comma: ',', Period: '.',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
  ArrowLeft: '←', ArrowDown: '↓', ArrowUp: '↑', ArrowRight: '→',
  Space: 'SPACE', Escape: 'ESC', Enter: 'ENTER',
  ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT',
};

export function getKeyDisplayName(code: string): string {
  return KEY_DISPLAY[code] || code.replace('Key', '');
}

// ---- Settings Screen ----

let settingsScreen: HTMLDivElement | null = null;
let rebindTarget: number | null = null;
let rebindListener: ((e: KeyboardEvent) => void) | null = null;

export function showSettingsScreen(
  settings: Settings,
  onApply: (s: Settings) => void,
  onBack: () => void
): HTMLDivElement {
  hideSettingsScreen();
  const current = { ...settings, laneKeys: [...settings.laneKeys] };

  const screen = document.createElement('div');
  screen.id = 'settingsScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,5,30,0.95) 0%, rgba(0,0,0,0.98) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; overflow-y: auto;
  `;
  document.body.appendChild(screen);
  settingsScreen = screen;

  function render() {
    screen.innerHTML = `
      <div style="text-align: center; max-width: 550px; width: 90%; padding: 30px 0;">
        <h2 style="font-size: 28px; margin-bottom: 20px; letter-spacing: 3px;
          text-shadow: 0 0 15px #00ffff;">⚙ SETTINGS</h2>

        <!-- Audio Section -->
        <div style="text-align: left; margin-bottom: 18px;">
          <h3 style="font-size: 14px; color: #00ffff; margin-bottom: 8px; letter-spacing: 2px;">🔊 AUDIO</h3>
          ${slider('masterVol', 'Master Volume', current.masterVolume)}
          ${slider('musicVol', 'Music Volume', current.musicVolume)}
          ${slider('sfxVol', 'SFX Volume', current.sfxVolume)}
          ${slider('audioOffset', 'Audio Offset', (current.audioOffset + 100) / 200, `${current.audioOffset}ms`)}
        </div>

        <!-- Controls Section -->
        <div style="text-align: left; margin-bottom: 18px;">
          <h3 style="font-size: 14px; color: #ff00ff; margin-bottom: 8px; letter-spacing: 2px;">🎮 CONTROLS</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6px;">
            ${current.laneKeys.map((k, i) => `
              <div class="keyBind" data-lane="${i}" style="
                background: rgba(255,255,255,0.05); border: 1px solid ${rebindTarget === i ? '#ffff00' : 'rgba(255,255,255,0.15)'};
                padding: 8px; border-radius: 4px; text-align: center; cursor: pointer;
                transition: all 0.15s;
              ">
                <div style="font-size: 10px; opacity: 0.4;">Lane ${i + 1}</div>
                <div style="font-size: 18px; color: ${rebindTarget === i ? '#ffff00' : '#fff'}; font-weight: bold;">
                  ${rebindTarget === i ? '...' : getKeyDisplayName(k)}
                </div>
              </div>
            `).join('')}
          </div>
          <div style="font-size: 10px; opacity: 0.3; margin-top: 4px;">Click a key to rebind. Press any key to assign.</div>
          ${slider('noteSpeed', 'Note Speed', (current.noteSpeed - 0.5) / 1.5, `×${current.noteSpeed.toFixed(1)}`)}
        </div>

        <!-- Visual Section -->
        <div style="text-align: left; margin-bottom: 18px;">
          <h3 style="font-size: 14px; color: #ff6600; margin-bottom: 8px; letter-spacing: 2px;">✨ VISUALS</h3>
          ${slider('shakeIntensity', 'Screen Shake', current.screenShakeIntensity)}
          ${slider('particleDensity', 'Particle Density', current.particleDensity)}
          ${toggle('bgEffects', 'Background Effects', current.backgroundEffects, '#ff6600')}
          ${toggle('showFPS', 'Show FPS Counter', current.showFPS, '#00ffff')}
          ${toggle('showTiming', 'Show Timing Meter', current.showTimingMeter, '#ff00ff')}
        </div>

        <!-- Theme Section -->
        <div style="text-align: left; margin-bottom: 18px;">
          <h3 style="font-size: 14px; color: #ffff00; margin-bottom: 8px; letter-spacing: 2px;">🎨 THEME</h3>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${themeBtn('neon', 'Neon', '#00ffff', current.theme)}
            ${themeBtn('cyberpunk', 'Cyberpunk', '#ff0066', current.theme)}
            ${themeBtn('ocean', 'Ocean', '#0088ff', current.theme)}
            ${themeBtn('space', 'Space', '#9933ff', current.theme)}
            ${themeBtn('sakura', 'Sakura', '#ff88cc', current.theme)}
          </div>
        </div>

        <!-- Accessibility Section -->
        <div style="text-align: left; margin-bottom: 18px;">
          <h3 style="font-size: 14px; color: #00ff88; margin-bottom: 8px; letter-spacing: 2px;">♿ ACCESSIBILITY</h3>
          <div style="margin-bottom: 8px;">
            <div style="font-size: 12px; opacity: 0.5; margin-bottom: 4px;">Colorblind Mode</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${cbBtn('off', 'Off', current.colorblindMode)}
              ${cbBtn('deuteranopia', 'Deutan', current.colorblindMode)}
              ${cbBtn('protanopia', 'Protan', current.colorblindMode)}
              ${cbBtn('tritanopia', 'Tritan', current.colorblindMode)}
            </div>
          </div>
          ${toggle('reducedMotion', 'Reduced Motion', current.reducedMotion, '#00ff88')}
          ${toggle('largeText', 'Large Text', current.largeText, '#00ff88')}
          ${toggle('hitGuides', 'Show Hit Guides', current.showHitGuides, '#00ff88')}
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 10px;">
          <button class="settBtn applyBtn" style="
            background: transparent; border: 2px solid #00ffff; color: #00ffff;
            padding: 10px 35px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; transition: all 0.2s;
          ">APPLY</button>
          <button class="settBtn resetBtn" style="
            background: transparent; border: 1px solid rgba(255,100,0,0.4);
            color: #ff6600; padding: 10px 25px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">RESET</button>
          <button class="settBtn backBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.3);
            color: rgba(255,255,255,0.5); padding: 10px 35px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">BACK</button>
        </div>
      </div>
    `;

    // Wire sliders
    screen.querySelectorAll('.settSlider').forEach(el => {
      const input = el.querySelector('input') as HTMLInputElement;
      input.addEventListener('input', () => {
        const key = input.dataset.key!;
        const val = parseFloat(input.value);
        switch (key) {
          case 'masterVol': current.masterVolume = val; break;
          case 'musicVol': current.musicVolume = val; break;
          case 'sfxVol': current.sfxVolume = val; break;
          case 'shakeIntensity': current.screenShakeIntensity = val; break;
          case 'particleDensity': current.particleDensity = val; break;
          case 'noteSpeed': current.noteSpeed = 0.5 + val * 1.5; break;
          case 'audioOffset': current.audioOffset = Math.round(val * 200 - 100); break;
        }
        render();
      });
    });

    // Wire toggles
    screen.querySelectorAll('.settToggle').forEach(el => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.key!;
        switch (key) {
          case 'bgEffects': current.backgroundEffects = !current.backgroundEffects; break;
          case 'showFPS': current.showFPS = !current.showFPS; break;
          case 'showTiming': current.showTimingMeter = !current.showTimingMeter; break;
          case 'reducedMotion': current.reducedMotion = !current.reducedMotion; break;
          case 'largeText': current.largeText = !current.largeText; break;
          case 'hitGuides': current.showHitGuides = !current.showHitGuides; break;
        }
        playMenuSelect();
        render();
      });
    });

    // Wire key bindings
    screen.querySelectorAll('.keyBind').forEach(el => {
      el.addEventListener('click', () => {
        const lane = parseInt((el as HTMLElement).dataset.lane!);
        rebindTarget = lane;
        playMenuSelect();
        render();
        startRebindListener(current, () => { rebindTarget = null; render(); });
      });
    });

    // Wire theme buttons
    screen.querySelectorAll('.themeBtn').forEach(el => {
      el.addEventListener('click', () => {
        current.theme = (el as HTMLElement).dataset.theme as ThemeId;
        playMenuSelect();
        render();
      });
    });

    // Wire colorblind buttons
    screen.querySelectorAll('.cbBtn').forEach(el => {
      el.addEventListener('click', () => {
        current.colorblindMode = (el as HTMLElement).dataset.mode as ColorblindMode;
        playMenuSelect();
        render();
      });
    });

    // Wire main buttons
    screen.querySelector('.applyBtn')!.addEventListener('click', () => {
      playMenuSelect();
      saveSettings(current);
      applyAudioSettings(current);
      onApply(current);
    });
    screen.querySelector('.resetBtn')!.addEventListener('click', () => {
      playMenuSelect();
      Object.assign(current, DEFAULT_SETTINGS);
      current.laneKeys = [...DEFAULT_SETTINGS.laneKeys];
      render();
    });
    screen.querySelector('.backBtn')!.addEventListener('click', () => {
      playMenuSelect();
      onBack();
    });
  }

  render();
  return screen;
}

function startRebindListener(current: Settings, onDone: () => void) {
  if (rebindListener) window.removeEventListener('keydown', rebindListener);
  rebindListener = (e: KeyboardEvent) => {
    e.preventDefault();
    if (rebindTarget !== null && e.code !== 'Escape') {
      current.laneKeys[rebindTarget] = e.code;
    }
    window.removeEventListener('keydown', rebindListener!);
    rebindListener = null;
    onDone();
  };
  window.addEventListener('keydown', rebindListener);
}

function slider(key: string, label: string, value: number, displayOverride?: string): string {
  return `
    <div class="settSlider" style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
        <span style="opacity: 0.6;">${label}</span>
        <span style="color: #00ffff;">${displayOverride || Math.round(value * 100) + '%'}</span>
      </div>
      <input type="range" min="0" max="1" step="0.01" value="${value}" data-key="${key}" style="
        width: 100%; height: 4px; -webkit-appearance: none; appearance: none;
        background: rgba(255,255,255,0.15); outline: none; border-radius: 2px; cursor: pointer;
      ">
    </div>
  `;
}

function toggle(key: string, label: string, active: boolean, color: string): string {
  return `
    <div class="settToggle" data-key="${key}" style="
      background: ${active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'};
      border: 1px solid ${active ? color : 'rgba(255,255,255,0.08)'};
      padding: 8px 12px; border-radius: 4px; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 6px; transition: all 0.15s;
    ">
      <span style="font-size: 13px; color: ${active ? color : '#888'};">${label}</span>
      <div style="
        width: 32px; height: 18px; border-radius: 9px;
        background: ${active ? color : '#333'}; position: relative;
      ">
        <div style="
          width: 14px; height: 14px; border-radius: 50%; background: #fff;
          position: absolute; top: 2px; ${active ? 'right: 2px;' : 'left: 2px;'}
        "></div>
      </div>
    </div>
  `;
}

function themeBtn(id: string, label: string, color: string, currentTheme: string): string {
  const active = currentTheme === id;
  return `
    <div class="themeBtn" data-theme="${id}" style="
      background: ${active ? `rgba(255,255,255,0.1)` : 'rgba(255,255,255,0.03)'};
      border: 2px solid ${active ? color : 'rgba(255,255,255,0.1)'};
      color: ${active ? color : '#888'}; padding: 6px 14px; border-radius: 4px;
      cursor: pointer; font-size: 12px; font-family: 'Courier New', monospace;
      transition: all 0.15s; text-shadow: ${active ? `0 0 8px ${color}` : 'none'};
    ">${label}</div>
  `;
}

function cbBtn(mode: string, label: string, currentMode: string): string {
  const active = currentMode === mode;
  return `
    <div class="cbBtn" data-mode="${mode}" style="
      background: ${active ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)'};
      border: 1px solid ${active ? '#00ff88' : 'rgba(255,255,255,0.1)'};
      color: ${active ? '#00ff88' : '#888'}; padding: 5px 12px; border-radius: 4px;
      cursor: pointer; font-size: 11px; font-family: 'Courier New', monospace;
    ">${label}</div>
  `;
}

export function hideSettingsScreen() {
  if (rebindListener) {
    window.removeEventListener('keydown', rebindListener);
    rebindListener = null;
  }
  rebindTarget = null;
  const el = document.getElementById('settingsScreen');
  if (el) el.remove();
  settingsScreen = null;
}
