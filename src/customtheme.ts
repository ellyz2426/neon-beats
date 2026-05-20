// ============================================================
// Neon Beats VR — Custom Theme Builder
// Let players create and save custom color themes
// ============================================================

import { playMenuSelect } from './audio';

export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  laneColors: string[];
  neonIntensity: number; // 0.5-2.0
  fogDensity: number;    // 0.5-2.0
  backgroundStyle: 'dark' | 'gradient' | 'stars' | 'grid';
}

const CUSTOM_THEME_KEY = 'neonbeats_custom_themes';
const ACTIVE_CUSTOM_THEME_KEY = 'neonbeats_active_custom_theme';

export function loadCustomThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCustomThemes(themes: CustomTheme[]) {
  try {
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(themes));
  } catch { /* ignore */ }
}

export function getActiveCustomTheme(): CustomTheme | null {
  try {
    const id = localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
    if (!id) return null;
    const themes = loadCustomThemes();
    return themes.find(t => t.id === id) || null;
  } catch { return null; }
}

export function setActiveCustomTheme(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY);
    }
  } catch { /* ignore */ }
}

export function createDefaultCustomTheme(): CustomTheme {
  return {
    id: `custom_${Date.now()}`,
    name: 'My Theme',
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    accentColor: '#ffff00',
    laneColors: ['#ff0044', '#00ff88', '#0088ff', '#ff8800'],
    neonIntensity: 1.0,
    fogDensity: 1.0,
    backgroundStyle: 'dark',
  };
}

// ---- Theme Builder Screen ----

let builderScreen: HTMLDivElement | null = null;

export function showThemeBuilder(
  existingTheme?: CustomTheme,
  onSave: (theme: CustomTheme) => void = () => {},
  onBack: () => void = () => {}
): HTMLDivElement {
  hideThemeBuilder();

  const theme = existingTheme ? { ...existingTheme } : createDefaultCustomTheme();

  const screen = document.createElement('div');
  screen.id = 'themeBuilder';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,2,15,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; overflow-y: auto;
  `;

  function render() {
    screen.innerHTML = `
      <div style="max-width: 500px; width: 90%; padding: 20px 0;">
        <h2 style="text-align: center; font-size: 24px; letter-spacing: 3px; margin-bottom: 20px;
          color: ${theme.primaryColor}; text-shadow: 0 0 15px ${theme.primaryColor};">
          THEME BUILDER</h2>
        
        <!-- Preview -->
        <div id="themePreview" style="
          height: 80px; border-radius: 8px; margin-bottom: 20px;
          background: linear-gradient(135deg, ${theme.primaryColor}22, ${theme.secondaryColor}22);
          border: 1px solid ${theme.primaryColor}44;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          overflow: hidden;
        ">
          ${theme.laneColors.map(c => `
            <div style="width: 30px; height: 50px; background: ${c};
              border-radius: 4px; opacity: ${theme.neonIntensity};
              box-shadow: 0 0 ${10 * theme.neonIntensity}px ${c};"></div>
          `).join('')}
        </div>

        <!-- Name -->
        <div style="margin-bottom: 15px;">
          <label style="font-size: 11px; opacity: 0.5; letter-spacing: 1px;">THEME NAME</label>
          <input type="text" id="themeName" value="${theme.name}" style="
            display: block; width: 100%; box-sizing: border-box; margin-top: 4px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
            color: #fff; padding: 8px 12px; font-family: 'Courier New', monospace;
            font-size: 14px; border-radius: 4px; outline: none;
          ">
        </div>

        <!-- Colors -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          ${colorPicker('Primary', 'primary', theme.primaryColor)}
          ${colorPicker('Secondary', 'secondary', theme.secondaryColor)}
          ${colorPicker('Accent', 'accent', theme.accentColor)}
        </div>

        <!-- Lane Colors -->
        <div style="margin-bottom: 15px;">
          <label style="font-size: 11px; opacity: 0.5; letter-spacing: 1px;">LANE COLORS</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            ${theme.laneColors.map((c, i) => `
              <div style="flex: 1; text-align: center;">
                <input type="color" class="laneColorInput" data-lane="${i}" value="${c}" style="
                  width: 40px; height: 30px; border: none; cursor: pointer;
                  background: transparent; border-radius: 4px;
                ">
                <div style="font-size: 10px; opacity: 0.3; margin-top: 2px;">L${i + 1}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Sliders -->
        <div style="margin-bottom: 15px;">
          <label style="font-size: 11px; opacity: 0.5; letter-spacing: 1px;">
            NEON INTENSITY: ${theme.neonIntensity.toFixed(1)}×</label>
          <input type="range" id="neonIntensity" min="0.3" max="2.0" step="0.1"
            value="${theme.neonIntensity}" style="width: 100%; margin-top: 4px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="font-size: 11px; opacity: 0.5; letter-spacing: 1px;">
            FOG DENSITY: ${theme.fogDensity.toFixed(1)}×</label>
          <input type="range" id="fogDensity" min="0.3" max="2.0" step="0.1"
            value="${theme.fogDensity}" style="width: 100%; margin-top: 4px;">
        </div>

        <!-- Background Style -->
        <div style="margin-bottom: 20px;">
          <label style="font-size: 11px; opacity: 0.5; letter-spacing: 1px;">BACKGROUND</label>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            ${(['dark', 'gradient', 'stars', 'grid'] as const).map(s => `
              <button class="bgStyleBtn" data-style="${s}" style="
                flex: 1; padding: 8px; font-size: 11px;
                font-family: 'Courier New', monospace;
                background: ${theme.backgroundStyle === s ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.03)'};
                border: 1px solid ${theme.backgroundStyle === s ? '#00ffff' : 'rgba(255,255,255,0.1)'};
                color: ${theme.backgroundStyle === s ? '#00ffff' : '#888'};
                cursor: pointer; border-radius: 4px; text-transform: uppercase;
              ">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="themeSaveBtn" style="
            background: transparent; border: 2px solid #00ff88; color: #00ff88;
            padding: 10px 30px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; letter-spacing: 1px;
          ">SAVE</button>
          <button id="themeBackBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.4); padding: 10px 30px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">CANCEL</button>
        </div>
      </div>
    `;

    // Wire events
    const nameInput = screen.querySelector('#themeName') as HTMLInputElement;
    nameInput?.addEventListener('input', () => { theme.name = nameInput.value; });

    screen.querySelectorAll('.colorInput').forEach(input => {
      input.addEventListener('input', (e) => {
        const key = (input as HTMLElement).dataset.key!;
        const val = (e.target as HTMLInputElement).value;
        if (key === 'primary') theme.primaryColor = val;
        if (key === 'secondary') theme.secondaryColor = val;
        if (key === 'accent') theme.accentColor = val;
        render();
      });
    });

    screen.querySelectorAll('.laneColorInput').forEach(input => {
      input.addEventListener('input', (e) => {
        const lane = parseInt((input as HTMLElement).dataset.lane!);
        theme.laneColors[lane] = (e.target as HTMLInputElement).value;
        render();
      });
    });

    const neonSlider = screen.querySelector('#neonIntensity') as HTMLInputElement;
    neonSlider?.addEventListener('input', () => {
      theme.neonIntensity = parseFloat(neonSlider.value);
      render();
    });

    const fogSlider = screen.querySelector('#fogDensity') as HTMLInputElement;
    fogSlider?.addEventListener('input', () => {
      theme.fogDensity = parseFloat(fogSlider.value);
      render();
    });

    screen.querySelectorAll('.bgStyleBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        theme.backgroundStyle = (btn as HTMLElement).dataset.style as any;
        render();
      });
    });

    screen.querySelector('#themeSaveBtn')?.addEventListener('click', () => {
      playMenuSelect();
      const themes = loadCustomThemes();
      const idx = themes.findIndex(t => t.id === theme.id);
      if (idx >= 0) themes[idx] = theme;
      else themes.push(theme);
      saveCustomThemes(themes);
      onSave(theme);
    });

    screen.querySelector('#themeBackBtn')?.addEventListener('click', () => {
      playMenuSelect();
      onBack();
    });
  }

  document.body.appendChild(screen);
  builderScreen = screen;
  render();
  return screen;
}

function colorPicker(label: string, key: string, value: string): string {
  return `
    <div style="text-align: center;">
      <label style="font-size: 10px; opacity: 0.5;">${label}</label>
      <input type="color" class="colorInput" data-key="${key}" value="${value}" style="
        display: block; width: 100%; height: 35px; margin-top: 4px;
        border: none; cursor: pointer; background: transparent;
        border-radius: 4px;
      ">
    </div>
  `;
}

export function hideThemeBuilder() {
  if (builderScreen) {
    builderScreen.remove();
    builderScreen = null;
  }
  document.getElementById('themeBuilder')?.remove();
}
