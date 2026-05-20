// ============================================================
// Neon Beats VR — Key Rebinding Screen
// Allow players to customize their lane key bindings
// ============================================================

import { playMenuSelect } from './audio';
import type { Settings } from './settings';

let rebindScreen: HTMLDivElement | null = null;
let listeningFor: number | null = null;
let keyListener: ((e: KeyboardEvent) => void) | null = null;

const DEFAULT_LANE_KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
const KEY_DISPLAY_NAMES: Record<string, string> = {
  KeyA: 'A', KeyB: 'B', KeyC: 'C', KeyD: 'D', KeyE: 'E', KeyF: 'F',
  KeyG: 'G', KeyH: 'H', KeyI: 'I', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
  KeyM: 'M', KeyN: 'N', KeyO: 'O', KeyP: 'P', KeyQ: 'Q', KeyR: 'R',
  KeyS: 'S', KeyT: 'T', KeyU: 'U', KeyV: 'V', KeyW: 'W', KeyX: 'X',
  KeyY: 'Y', KeyZ: 'Z',
  Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
  Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
  Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
  BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Space: 'SPACE', Enter: 'ENTER', Tab: 'TAB',
};

function getKeyDisplayName(code: string): string {
  return KEY_DISPLAY_NAMES[code] || code.replace('Key', '').replace('Digit', '');
}

const LANE_COLORS = ['#ff0044', '#00ff88', '#0088ff', '#ff8800'];

export function showKeyRebindScreen(
  settings: Settings,
  onSave: (keys: string[]) => void,
  onBack: () => void
): HTMLDivElement {
  hideKeyRebindScreen();

  const currentKeys = [...settings.laneKeys];

  const screen = document.createElement('div');
  screen.id = 'keyRebind';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,2,15,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  function render() {
    screen.innerHTML = `
      <div style="text-align: center; max-width: 450px; width: 90%;">
        <h2 style="font-size: 24px; letter-spacing: 3px; margin-bottom: 25px;
          color: #00ffff; text-shadow: 0 0 15px #00ffff;">KEY BINDINGS</h2>

        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 25px;">
          ${currentKeys.map((key, i) => `
            <div class="keySlot" data-lane="${i}" style="
              width: 80px; text-align: center; cursor: pointer;
            ">
              <div style="font-size: 11px; opacity: 0.4; margin-bottom: 5px;">LANE ${i + 1}</div>
              <div style="
                width: 60px; height: 60px; border: 2px solid ${listeningFor === i ? '#ffd700' : LANE_COLORS[i]};
                border-radius: 8px; display: flex; align-items: center; justify-content: center;
                margin: 0 auto; font-size: 22px; font-weight: bold;
                color: ${listeningFor === i ? '#ffd700' : LANE_COLORS[i]};
                background: ${listeningFor === i ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)'};
                transition: all 0.2s; box-shadow: 0 0 10px ${LANE_COLORS[i]}30;
              ">
                ${listeningFor === i ? '...' : getKeyDisplayName(key)}
              </div>
              <div style="font-size: 10px; opacity: 0.3; margin-top: 5px;">
                ${listeningFor === i ? 'Press a key' : 'Click to change'}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
          <button id="resetKeysBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.4); padding: 8px 20px; font-size: 12px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">RESET DEFAULTS</button>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="saveKeysBtn" style="
            background: transparent; border: 2px solid #00ff88; color: #00ff88;
            padding: 10px 30px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          ">SAVE</button>
          <button id="cancelKeysBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.4); padding: 10px 30px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">CANCEL</button>
        </div>

        <div style="font-size: 11px; opacity: 0.25; margin-top: 20px;">
          Avoid keys used for pause (Space) or navigation (Escape)
        </div>
      </div>
    `;

    // Wire key slot clicks
    screen.querySelectorAll('.keySlot').forEach(slot => {
      slot.addEventListener('click', () => {
        const lane = parseInt((slot as HTMLElement).dataset.lane!);
        listeningFor = lane;
        render();
      });
    });

    screen.querySelector('#resetKeysBtn')?.addEventListener('click', () => {
      playMenuSelect();
      for (let i = 0; i < DEFAULT_LANE_KEYS.length; i++) {
        currentKeys[i] = DEFAULT_LANE_KEYS[i];
      }
      listeningFor = null;
      render();
    });

    screen.querySelector('#saveKeysBtn')?.addEventListener('click', () => {
      playMenuSelect();
      onSave([...currentKeys]);
    });

    screen.querySelector('#cancelKeysBtn')?.addEventListener('click', () => {
      playMenuSelect();
      onBack();
    });
  }

  // Key capture listener
  if (keyListener) window.removeEventListener('keydown', keyListener);
  keyListener = (e: KeyboardEvent) => {
    if (listeningFor === null) return;
    
    // Don't allow reserved keys
    const reserved = ['Escape', 'Space', 'Tab', 'Enter'];
    if (reserved.includes(e.code)) return;

    e.preventDefault();
    currentKeys[listeningFor] = e.code;
    listeningFor = null;
    playMenuSelect();
    render();
  };
  window.addEventListener('keydown', keyListener);

  document.body.appendChild(screen);
  rebindScreen = screen;
  render();
  return screen;
}

export function hideKeyRebindScreen() {
  listeningFor = null;
  if (keyListener) {
    window.removeEventListener('keydown', keyListener);
    keyListener = null;
  }
  if (rebindScreen) {
    rebindScreen.remove();
    rebindScreen = null;
  }
  document.getElementById('keyRebind')?.remove();
}
