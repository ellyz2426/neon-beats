// ============================================================
// Neon Beats VR — Settings & Stats Screens
// ============================================================

import { playMenuSelect } from './audio';
import { type Modifiers, formatModifiers, getScoreMultiplier } from './modifiers';
import type { PlayerStats } from './modifiers';

// ---- Modifiers Screen ----

export function showModifiersScreen(
  mods: Modifiers,
  onApply: (mods: Modifiers) => void,
  onBack: () => void
): HTMLDivElement {
  const existing = document.getElementById('modifiersScreen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'modifiersScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,5,30,0.95) 0%, rgba(0,0,0,0.98) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  const current = { ...mods };

  function render() {
    const mult = getScoreMultiplier(current);
    screen.innerHTML = `
      <div style="text-align: center; max-width: 500px; width: 90%;">
        <h2 style="font-size: 28px; margin-bottom: 25px; letter-spacing: 3px;
          text-shadow: 0 0 15px #00ffff;">MODIFIERS</h2>
        <div style="font-size: 14px; opacity: 0.5; margin-bottom: 20px;">
          Score multiplier: <span style="color: ${mult >= 1 ? '#00ff88' : '#ff6600'};">×${mult.toFixed(1)}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
          ${modToggle('noFail', 'NO FAIL', 'Health cannot reach zero', current.noFail, '#00ff88')}
          ${modToggle('halfSpeed', 'HALF SPEED', 'Notes approach at 50% speed', current.halfSpeed, '#00ffff')}
          ${modToggle('autoPlay', 'AUTO PLAY', 'Watch the game play itself', current.autoPlay, '#ffcc00')}
          ${modToggle('mirror', 'MIRROR', 'Lanes are reversed', current.mirror, '#ff00ff')}
          ${modToggle('hidden', 'HIDDEN', 'Notes fade before the hit zone', current.hidden, '#ff6600')}
          ${modToggle('fadeIn', 'FADE IN', 'Notes appear gradually', current.fadeIn, '#9933ff')}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="modBtn applyBtn" style="
            background: transparent; border: 2px solid #00ffff; color: #00ffff;
            padding: 10px 35px; font-size: 14px; font-family: 'Courier New', monospace;
            cursor: pointer; border-radius: 4px; transition: all 0.2s;
          ">APPLY</button>
          <button class="modBtn backBtn" style="
            background: transparent; border: 1px solid rgba(255,255,255,0.3);
            color: rgba(255,255,255,0.5); padding: 10px 35px; font-size: 14px;
            font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          ">BACK</button>
        </div>
      </div>
    `;

    // Wire up toggle clicks
    screen.querySelectorAll('.modToggle').forEach(el => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.key as keyof Modifiers;
        (current as any)[key] = !(current as any)[key];
        playMenuSelect();
        render();
      });
    });

    screen.querySelector('.applyBtn')!.addEventListener('click', () => {
      playMenuSelect();
      onApply(current);
    });
    screen.querySelector('.backBtn')!.addEventListener('click', () => {
      playMenuSelect();
      onBack();
    });
  }

  document.body.appendChild(screen);
  render();
  return screen;
}

function modToggle(key: string, label: string, desc: string, active: boolean, color: string): string {
  return `
    <div class="modToggle" data-key="${key}" style="
      background: ${active ? `rgba(255,255,255,0.08)` : 'rgba(255,255,255,0.02)'};
      border: 1px solid ${active ? color : 'rgba(255,255,255,0.1)'};
      padding: 10px 16px; border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      transition: all 0.15s;
    ">
      <div>
        <div style="font-size: 14px; font-weight: bold; color: ${active ? color : '#888'};">${label}</div>
        <div style="font-size: 11px; opacity: 0.4;">${desc}</div>
      </div>
      <div style="
        width: 36px; height: 20px; border-radius: 10px;
        background: ${active ? color : '#333'}; position: relative;
        transition: background 0.2s;
      ">
        <div style="
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          position: absolute; top: 2px; ${active ? 'right: 2px;' : 'left: 2px;'}
          transition: all 0.2s;
        "></div>
      </div>
    </div>
  `;
}

export function hideModifiersScreen() {
  document.getElementById('modifiersScreen')?.remove();
}

// ---- Stats Screen ----

export function showStatsScreen(stats: PlayerStats, onBack: () => void): HTMLDivElement {
  const existing = document.getElementById('statsScreen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'statsScreen';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,5,30,0.95) 0%, rgba(0,0,0,0.98) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  const accuracy = stats.totalNotesHit + stats.totalMisses > 0 ?
    (stats.totalNotesHit / (stats.totalNotesHit + stats.totalMisses) * 100) : 0;
  const hours = Math.floor(stats.totalPlayTime / 3600);
  const mins = Math.floor((stats.totalPlayTime % 3600) / 60);

  screen.innerHTML = `
    <div style="text-align: center; max-width: 500px; width: 90%;">
      <h2 style="font-size: 28px; margin-bottom: 25px; letter-spacing: 3px;
        text-shadow: 0 0 15px #ff00ff;">PLAYER STATS</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left;
        margin-bottom: 25px; font-size: 14px;">
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">TOTAL SCORE</div>
          <div style="font-size: 22px; color: #00ffff;">${stats.totalScore.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">BEST COMBO</div>
          <div style="font-size: 22px; color: #ff00ff;">${stats.bestCombo}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">NOTES HIT</div>
          <div style="font-size: 18px;">${stats.totalNotesHit.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">ACCURACY</div>
          <div style="font-size: 18px;">${accuracy.toFixed(1)}%</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">SONGS PLAYED</div>
          <div style="font-size: 18px;">${stats.totalSongsPlayed}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">SONGS CLEARED</div>
          <div style="font-size: 18px;">${stats.totalSongsCleared}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; grid-column: span 2;">
          <div style="opacity: 0.5; font-size: 11px;">PLAY TIME</div>
          <div style="font-size: 18px;">${hours > 0 ? `${hours}h ` : ''}${mins}m</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">PERFECTS</div>
          <div style="color: #00ffff;">${stats.totalPerfects.toLocaleString()}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
          <div style="opacity: 0.5; font-size: 11px;">GREATS</div>
          <div style="color: #00ff88;">${stats.totalGreats.toLocaleString()}</div>
        </div>
      </div>
      <button id="statsBackBtn" style="
        background: transparent; border: 1px solid rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.5); padding: 10px 35px; font-size: 14px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
      ">BACK</button>
    </div>
  `;

  document.getElementById('statsBackBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  document.body.appendChild(screen);
  return screen;
}

export function hideStatsScreen() {
  document.getElementById('statsScreen')?.remove();
}
