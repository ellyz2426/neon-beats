// ============================================================
// Neon Beats VR — HUD (Heads-Up Display)
// Score, combo, health, progress, timing feedback
// ============================================================

export interface HUDElements {
  container: HTMLDivElement;
  score: HTMLDivElement;
  combo: HTMLDivElement;
  multiplier: HTMLDivElement;
  health: HTMLDivElement;
  healthFill: HTMLDivElement;
  progress: HTMLDivElement;
  progressFill: HTMLDivElement;
  timingFeedback: HTMLDivElement;
  songInfo: HTMLDivElement;
  laneKeys: HTMLDivElement;
}

export function createHUD(numLanes: number): HUDElements {
  const container = document.createElement('div');
  container.id = 'hud';
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50;
    font-family: 'Courier New', monospace; color: #fff;
  `;

  // Score (top-right)
  const score = document.createElement('div');
  score.style.cssText = `
    position: absolute; top: 20px; right: 30px;
    font-size: 36px; font-weight: bold;
    text-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff;
    text-align: right;
  `;
  score.textContent = '0';

  // Combo (center-top)
  const combo = document.createElement('div');
  combo.style.cssText = `
    position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
    font-size: 28px; font-weight: bold;
    text-shadow: 0 0 15px #ff00ff;
    opacity: 0; transition: opacity 0.1s;
  `;

  // Multiplier (below combo)
  const multiplier = document.createElement('div');
  multiplier.style.cssText = `
    position: absolute; top: 55px; left: 50%; transform: translateX(-50%);
    font-size: 18px;
    text-shadow: 0 0 10px #ffcc00;
    opacity: 0;
  `;

  // Health bar (top-left)
  const health = document.createElement('div');
  health.style.cssText = `
    position: absolute; top: 20px; left: 30px;
    width: 200px; height: 12px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 6px; overflow: hidden;
  `;
  const healthFill = document.createElement('div');
  healthFill.style.cssText = `
    width: 100%; height: 100%;
    background: linear-gradient(90deg, #00ff88, #00ffcc);
    border-radius: 6px;
    transition: width 0.3s, background 0.3s;
  `;
  health.appendChild(healthFill);

  // Song progress (bottom)
  const progress = document.createElement('div');
  progress.style.cssText = `
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    width: 300px; height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px; overflow: hidden;
  `;
  const progressFill = document.createElement('div');
  progressFill.style.cssText = `
    width: 0%; height: 100%;
    background: linear-gradient(90deg, #ff00ff, #00ffff);
    border-radius: 2px;
    transition: width 0.5s linear;
  `;
  progress.appendChild(progressFill);

  // Timing feedback (center)
  const timingFeedback = document.createElement('div');
  timingFeedback.style.cssText = `
    position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%);
    font-size: 24px; font-weight: bold;
    opacity: 0; transition: opacity 0.05s;
  `;

  // Song info (top-left below health)
  const songInfo = document.createElement('div');
  songInfo.style.cssText = `
    position: absolute; top: 42px; left: 30px;
    font-size: 12px; opacity: 0.5;
  `;

  // Lane key indicators (bottom-center)
  const laneKeys = document.createElement('div');
  laneKeys.style.cssText = `
    position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 40px; font-size: 14px; opacity: 0.4;
  `;
  const keyNames = numLanes === 4 ? ['D', 'F', 'J', 'K'] : ['A', 'S', 'D', 'F', 'G'];
  const laneColorHex = ['#ff0066', '#00ffff', '#ff6600', '#9933ff', '#00ff88'];
  for (let i = 0; i < numLanes; i++) {
    const key = document.createElement('div');
    key.style.cssText = `
      width: 32px; height: 32px; line-height: 32px; text-align: center;
      border: 1px solid ${laneColorHex[i]}; border-radius: 4px;
      color: ${laneColorHex[i]}; font-weight: bold;
    `;
    key.textContent = keyNames[i];
    key.id = `laneKey_${i}`;
    laneKeys.appendChild(key);
  }

  container.appendChild(score);
  container.appendChild(combo);
  container.appendChild(multiplier);
  container.appendChild(health);
  container.appendChild(progress);
  container.appendChild(timingFeedback);
  container.appendChild(songInfo);
  container.appendChild(laneKeys);
  document.body.appendChild(container);

  return { container, score, combo, multiplier, health, healthFill, progress, progressFill, timingFeedback, songInfo, laneKeys };
}

export function updateHUD(
  hud: HUDElements,
  score: number,
  comboVal: number,
  multiplierVal: number,
  healthVal: number,
  maxHealth: number,
  songProgress: number,
  songName: string
) {
  hud.score.textContent = score.toLocaleString();

  if (comboVal > 1) {
    hud.combo.textContent = `${comboVal} COMBO`;
    hud.combo.style.opacity = '1';
    hud.multiplier.textContent = `×${multiplierVal}`;
    hud.multiplier.style.opacity = '1';
  } else {
    hud.combo.style.opacity = '0';
    hud.multiplier.style.opacity = '0';
  }

  const healthPct = (healthVal / maxHealth) * 100;
  hud.healthFill.style.width = `${healthPct}%`;
  if (healthPct < 30) {
    hud.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff3300)';
  } else if (healthPct < 60) {
    hud.healthFill.style.background = 'linear-gradient(90deg, #ff6600, #ffcc00)';
  } else {
    hud.healthFill.style.background = 'linear-gradient(90deg, #00ff88, #00ffcc)';
  }

  hud.progressFill.style.width = `${Math.min(100, songProgress * 100)}%`;
  hud.songInfo.textContent = songName;
}

let feedbackTimeout: number | null = null;

export function showTimingFeedback(hud: HUDElements, quality: 'perfect' | 'great' | 'good' | 'miss') {
  const colors: Record<string, string> = {
    perfect: '#00ffff',
    great: '#00ff88',
    good: '#ffcc00',
    miss: '#ff0044',
  };
  const texts: Record<string, string> = {
    perfect: 'PERFECT',
    great: 'GREAT',
    good: 'GOOD',
    miss: 'MISS',
  };

  hud.timingFeedback.textContent = texts[quality];
  hud.timingFeedback.style.color = colors[quality];
  hud.timingFeedback.style.textShadow = `0 0 20px ${colors[quality]}, 0 0 40px ${colors[quality]}`;
  hud.timingFeedback.style.opacity = '1';
  hud.timingFeedback.style.transform = 'translate(-50%, -50%) scale(1.2)';

  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  feedbackTimeout = window.setTimeout(() => {
    hud.timingFeedback.style.opacity = '0';
    hud.timingFeedback.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 300);
}

export function flashLaneKey(hud: HUDElements, lane: number, hit: boolean) {
  const key = document.getElementById(`laneKey_${lane}`);
  if (!key) return;
  key.style.opacity = '1';
  key.style.background = hit ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.2)';
  setTimeout(() => {
    key.style.opacity = '0.4';
    key.style.background = 'transparent';
  }, 150);
}

export function showHUD(hud: HUDElements) { hud.container.style.display = 'block'; }
export function hideHUD(hud: HUDElements) { hud.container.style.display = 'none'; }
