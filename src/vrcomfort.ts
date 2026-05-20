// ============================================================
// Neon Beats VR — VR Comfort & Accessibility
// Vignette overlay during movement
// Comfort mode options for motion-sensitive players
// Seated/standing mode toggle
// Head-locked HUD option for XR
// ============================================================

// ---- Comfort Vignette ----

export class ComfortVignette {
  private overlay: HTMLDivElement;
  private intensity = 0;
  private targetIntensity = 0;
  private enabled = true;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 1; opacity: 0;
      background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%);
    `;
    document.body.appendChild(this.overlay);
  }

  setEnabled(enabled: boolean) { this.enabled = enabled; }

  /**
   * Set vignette intensity (0-1)
   * Called during camera/player movement
   */
  setIntensity(intensity: number) {
    this.targetIntensity = this.enabled ? Math.min(1, intensity) : 0;
  }

  update(dt: number) {
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * 8);
    this.overlay.style.opacity = String(this.intensity);
  }
}

// ---- VR Comfort Settings ----

export interface VRComfortSettings {
  vignetteEnabled: boolean;
  vignetteIntensity: number;     // 0-1 max vignette strength
  seatedMode: boolean;           // adjust height for seated play
  seatedHeight: number;          // meters to lower the viewpoint
  headLockedHUD: boolean;        // HUD follows head vs world-space
  reducedParticles: boolean;     // fewer particles for comfort
  snapTurning: boolean;          // snap turning vs smooth
  snapTurnAngle: number;         // degrees per snap
  teleportOnly: boolean;         // restrict to teleport locomotion
  colorBlindAssist: boolean;     // shape-coded blocks in addition to color
}

export function createDefaultVRComfort(): VRComfortSettings {
  return {
    vignetteEnabled: true,
    vignetteIntensity: 0.6,
    seatedMode: false,
    seatedHeight: 0.3,
    headLockedHUD: false,
    reducedParticles: false,
    snapTurning: false,
    snapTurnAngle: 30,
    teleportOnly: false,
    colorBlindAssist: false,
  };
}

const VR_COMFORT_KEY = 'neonbeats-vr-comfort';

export function loadVRComfort(): VRComfortSettings {
  try {
    const data = localStorage.getItem(VR_COMFORT_KEY);
    if (data) return { ...createDefaultVRComfort(), ...JSON.parse(data) };
  } catch {}
  return createDefaultVRComfort();
}

export function saveVRComfort(settings: VRComfortSettings) {
  localStorage.setItem(VR_COMFORT_KEY, JSON.stringify(settings));
}

// ---- VR Comfort Settings UI ----

let comfortUI: HTMLDivElement | null = null;

export function showVRComfortSettings(
  settings: VRComfortSettings,
  onSave: (settings: VRComfortSettings) => void,
  onClose: () => void
) {
  if (!comfortUI) {
    comfortUI = document.createElement('div');
    comfortUI.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 180;
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; color: #fff;
    `;
    document.body.appendChild(comfortUI);
  }

  const makeToggle = (label: string, id: string, checked: boolean) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #222;">
      <span style="color: #ccc; font-size: 12px;">${label}</span>
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;" />
    </div>
  `;

  comfortUI.innerHTML = `
    <div style="background: #111; border: 1px solid #333; padding: 20px; border-radius: 8px; width: 380px;">
      <h3 style="color: #00ffff; margin-top: 0; text-align: center;">◆ VR COMFORT SETTINGS</h3>
      ${makeToggle('Comfort Vignette', 'vc-vignette', settings.vignetteEnabled)}
      ${makeToggle('Seated Mode', 'vc-seated', settings.seatedMode)}
      ${makeToggle('Head-Locked HUD', 'vc-headhud', settings.headLockedHUD)}
      ${makeToggle('Reduced Particles', 'vc-particles', settings.reducedParticles)}
      ${makeToggle('Snap Turning', 'vc-snap', settings.snapTurning)}
      ${makeToggle('Teleport Only', 'vc-teleport', settings.teleportOnly)}
      ${makeToggle('Color Blind Assist', 'vc-colorblind', settings.colorBlindAssist)}
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
        <button id="vc-save" style="background: #00ff88; color: #000; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace; font-weight: bold;">SAVE</button>
        <button id="vc-close" style="background: #333; color: #fff; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace;">CANCEL</button>
      </div>
    </div>
  `;
  comfortUI.style.display = 'flex';

  document.getElementById('vc-save')?.addEventListener('click', () => {
    const newSettings: VRComfortSettings = {
      ...settings,
      vignetteEnabled: (document.getElementById('vc-vignette') as HTMLInputElement).checked,
      seatedMode: (document.getElementById('vc-seated') as HTMLInputElement).checked,
      headLockedHUD: (document.getElementById('vc-headhud') as HTMLInputElement).checked,
      reducedParticles: (document.getElementById('vc-particles') as HTMLInputElement).checked,
      snapTurning: (document.getElementById('vc-snap') as HTMLInputElement).checked,
      teleportOnly: (document.getElementById('vc-teleport') as HTMLInputElement).checked,
      colorBlindAssist: (document.getElementById('vc-colorblind') as HTMLInputElement).checked,
    };
    saveVRComfort(newSettings);
    comfortUI!.style.display = 'none';
    onSave(newSettings);
  });

  document.getElementById('vc-close')?.addEventListener('click', () => {
    comfortUI!.style.display = 'none';
    onClose();
  });
}
