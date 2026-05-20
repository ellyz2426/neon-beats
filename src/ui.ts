// ============================================================
// Neon Beats VR — UI Screens
// Title, Song Select, Results, Settings
// ============================================================

import { SONG_LIBRARY, getDifficultyColor, type SongInfo } from './songs';
import { getAccuracy, getGrade, getGradeColor, loadHighScore, type GameState } from './game';
import { playMenuSelect } from './audio';
import { calculateStars, getStarDisplay } from './rating';

// ---- Generic Screen Helpers ----

function createScreen(id: string): HTMLDivElement {
  const screen = document.createElement('div');
  screen.id = id;
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,5,30,0.95) 0%, rgba(0,0,0,0.98) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;
  document.body.appendChild(screen);
  return screen;
}

function removeScreen(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ---- Title Screen ----

export function showTitleScreen(onStart: () => void): HTMLDivElement {
  removeScreen('titleScreen');
  const screen = createScreen('titleScreen');

  screen.innerHTML = `
    <div style="text-align: center;">
      <h1 style="
        font-size: 72px; margin-bottom: 5px; letter-spacing: 8px;
        background: linear-gradient(135deg, #ff0066, #00ffff, #ff00ff, #ffff00);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text; filter: drop-shadow(0 0 30px rgba(255,0,102,0.5));
        animation: titlePulse 2s ease-in-out infinite;
      ">NEON BEATS</h1>
      <p style="font-size: 16px; opacity: 0.5; letter-spacing: 4px; margin-bottom: 60px;">
        VR RHYTHM EXPERIENCE
      </p>
      <button id="startBtn" style="
        background: transparent; border: 2px solid #00ffff; color: #00ffff;
        padding: 15px 50px; font-size: 20px; font-family: 'Courier New', monospace;
        cursor: pointer; letter-spacing: 3px;
        text-shadow: 0 0 10px #00ffff; box-shadow: 0 0 20px rgba(0,255,255,0.2);
        transition: all 0.2s;
      ">PLAY</button>
      <div style="margin-top: 30px; font-size: 12px; opacity: 0.3;">
        Use D F J K keys to hit blocks • SPACE to pause
      </div>
    </div>
    <style>
      @keyframes titlePulse {
        0%, 100% { filter: drop-shadow(0 0 30px rgba(255,0,102,0.5)); }
        50% { filter: drop-shadow(0 0 50px rgba(0,255,255,0.8)); }
      }
      #startBtn:hover {
        background: rgba(0,255,255,0.1) !important;
        box-shadow: 0 0 40px rgba(0,255,255,0.4) !important;
        transform: scale(1.05);
      }
    </style>
  `;

  const btn = document.getElementById('startBtn')!;
  btn.addEventListener('click', () => {
    playMenuSelect();
    onStart();
  });

  return screen;
}

export function hideTitleScreen() { removeScreen('titleScreen'); }

// ---- Song Select Screen ----

export function showSongSelectScreen(
  selectedIndex: number,
  highScores: Map<string, number>,
  onSelect: (songId: string) => void,
  onBack: () => void
): HTMLDivElement {
  removeScreen('songSelect');
  const screen = createScreen('songSelect');

  let html = `
    <div style="text-align: center; max-width: 600px; width: 90%;">
      <h2 style="font-size: 36px; margin-bottom: 30px; letter-spacing: 4px;
        text-shadow: 0 0 20px #ff00ff;">SELECT TRACK</h2>
      <div id="songList" style="display: flex; flex-direction: column; gap: 8px; max-height: 60vh; overflow-y: auto;">
        <div class="songItem" data-index="-1" data-id="endless" style="
          background: rgba(255,255,0,0.05); border: 2px solid rgba(255,255,0,0.3);
          padding: 14px 20px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.15s; margin-bottom: 8px;
        ">
          <div style="text-align: left;">
            <div style="font-size: 20px; font-weight: bold; color: #ffff00;
              text-shadow: 0 0 15px #ffff00;">∞ ENDLESS MODE</div>
            <div style="font-size: 12px; opacity: 0.5;">Infinite procedural track • Escalating difficulty</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #ffff00; text-transform: uppercase;">∞</div>
            ${(highScores.get('endless') || 0) > 0 ? `<div style="font-size: 11px; opacity: 0.4;">Best: ${(highScores.get('endless') || 0).toLocaleString()}</div>` : ''}
          </div>
        </div>
  `;

  for (let i = 0; i < SONG_LIBRARY.length; i++) {
    const song = SONG_LIBRARY[i];
    const hs = highScores.get(song.id) || 0;
    const diffColor = getDifficultyColor(song.difficulty);
    html += `
      <div class="songItem" data-index="${i}" data-id="${song.id}" style="
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        padding: 12px 20px; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; justify-content: space-between;
        transition: all 0.15s;
        ${i === selectedIndex ? `border-color: ${song.color}; background: rgba(255,255,255,0.1);` : ''}
      ">
        <div style="text-align: left;">
          <div style="font-size: 18px; font-weight: bold; color: ${song.color};
            text-shadow: 0 0 10px ${song.color};">${song.name}</div>
          <div style="font-size: 12px; opacity: 0.5;">${song.artist} • ${song.bpm} BPM • ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: ${diffColor}; text-transform: uppercase;">${song.difficulty}</div>
          ${hs > 0 ? `<div style="font-size: 11px; opacity: 0.4;">Best: ${hs.toLocaleString()}</div>` : ''}
        </div>
      </div>
    `;
  }

  html += `
      </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
        <button class="songItem" data-id="_modifiers" style="
          background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.3);
          color: #00ffff; padding: 8px 20px; font-size: 13px;
          font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          transition: all 0.2s;
        ">⚙ MODIFIERS</button>
        <button class="songItem" data-id="_stats" style="
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,255,0.3);
          color: #ff00ff; padding: 8px 20px; font-size: 13px;
          font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          transition: all 0.2s;
        ">📊 STATS</button>
      </div>
      <button id="backBtn" style="
        margin-top: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.5); padding: 8px 30px; font-size: 14px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
        transition: all 0.2s;
      ">BACK</button>
    </div>
    <style>
      .songItem:hover {
        background: rgba(255,255,255,0.1) !important;
        transform: translateX(5px);
      }
    </style>
  `;

  screen.innerHTML = html;

  // Song click handlers
  const items = screen.querySelectorAll('.songItem');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      playMenuSelect();
      const id = (item as HTMLElement).dataset.id!;
      onSelect(id);
    });
  });

  document.getElementById('backBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  return screen;
}

export function hideSongSelectScreen() { removeScreen('songSelect'); }

// ---- Countdown Screen ----

export function showCountdown(value: number): HTMLDivElement {
  removeScreen('countdown');
  const screen = createScreen('countdown');
  screen.style.background = 'transparent';
  screen.innerHTML = `
    <div style="
      font-size: 120px; font-weight: bold;
      color: ${value === 0 ? '#00ffff' : '#ffffff'};
      text-shadow: 0 0 40px ${value === 0 ? '#00ffff' : '#ffffff'},
                   0 0 80px ${value === 0 ? '#00ffff' : '#ffffff'};
      animation: countBounce 0.3s ease-out;
    ">${value === 0 ? 'GO!' : value}</div>
    <style>
      @keyframes countBounce {
        0% { transform: scale(1.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  return screen;
}

export function hideCountdown() { removeScreen('countdown'); }

// ---- Results Screen ----

export function showResultsScreen(
  state: GameState,
  songInfo: SongInfo,
  isNewHighScore: boolean,
  onRetry: () => void,
  onMenu: () => void
): HTMLDivElement {
  removeScreen('results');
  const screen = createScreen('results');
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  const gradeColor = getGradeColor(grade);
  const starRating = calculateStars(state);

  screen.innerHTML = `
    <div style="text-align: center; max-width: 500px;">
      <h2 style="font-size: 24px; opacity: 0.6; margin-bottom: 5px;">RESULTS</h2>
      <h1 style="font-size: 48px; color: ${songInfo.color};
        text-shadow: 0 0 20px ${songInfo.color}; margin-bottom: 10px;">${songInfo.name}</h1>
      
      <div style="font-size: 96px; font-weight: bold; color: ${gradeColor};
        text-shadow: 0 0 40px ${gradeColor}, 0 0 80px ${gradeColor};
        margin: 5px 0; line-height: 1;">${grade}</div>
      
      <div style="font-size: 24px; color: ${starRating.color};
        text-shadow: 0 0 15px ${starRating.color}; margin-bottom: 5px;
        letter-spacing: 4px;">${getStarDisplay(starRating)}</div>
      <div style="font-size: 13px; color: ${starRating.color}; opacity: 0.7; margin-bottom: 12px;">${starRating.label}</div>
      
      ${isNewHighScore ? `<div style="font-size: 18px; color: #ffff00;
        text-shadow: 0 0 20px #ffff00; margin-bottom: 15px;
        animation: newHS 0.5s ease-in-out infinite alternate;">★ NEW HIGH SCORE ★</div>` : ''}
      
      <div style="font-size: 36px; margin-bottom: 20px;
        text-shadow: 0 0 15px #00ffff;">${state.score.toLocaleString()}</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px;
        font-size: 14px; text-align: left; padding: 0 20px;">
        <div><span style="color: #00ffff;">PERFECT:</span> ${state.perfects}</div>
        <div><span style="color: #00ff88;">GREAT:</span> ${state.greats}</div>
        <div><span style="color: #ffcc00;">GOOD:</span> ${state.goods}</div>
        <div><span style="color: #ff0044;">MISS:</span> ${state.misses}</div>
        <div><span style="opacity: 0.6;">MAX COMBO:</span> ${state.maxCombo}</div>
        <div><span style="opacity: 0.6;">ACCURACY:</span> ${accuracy.toFixed(1)}%</div>
      </div>
      
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="retryBtn" style="
          background: transparent; border: 2px solid #ff00ff; color: #ff00ff;
          padding: 12px 35px; font-size: 16px; font-family: 'Courier New', monospace;
          cursor: pointer; letter-spacing: 2px; border-radius: 4px;
          text-shadow: 0 0 10px #ff00ff; transition: all 0.2s;
        ">RETRY</button>
        <button id="menuBtn" style="
          background: transparent; border: 1px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.6); padding: 12px 35px; font-size: 16px;
          font-family: 'Courier New', monospace; cursor: pointer;
          letter-spacing: 2px; border-radius: 4px; transition: all 0.2s;
        ">MENU</button>
      </div>
    </div>
    <style>
      @keyframes newHS { from { transform: scale(1); } to { transform: scale(1.05); } }
      #retryBtn:hover { background: rgba(255,0,255,0.1) !important; transform: scale(1.05); }
      #menuBtn:hover { background: rgba(255,255,255,0.05) !important; }
    </style>
  `;

  document.getElementById('retryBtn')!.addEventListener('click', () => { playMenuSelect(); onRetry(); });
  document.getElementById('menuBtn')!.addEventListener('click', () => { playMenuSelect(); onMenu(); });

  return screen;
}

export function hideResultsScreen() { removeScreen('results'); }

// ---- Pause Overlay ----

export function showPauseOverlay(onResume: () => void, onQuit: () => void): HTMLDivElement {
  removeScreen('pause');
  const screen = createScreen('pause');
  screen.style.background = 'rgba(0,0,0,0.8)';

  screen.innerHTML = `
    <div style="text-align: center;">
      <h2 style="font-size: 48px; letter-spacing: 6px; margin-bottom: 40px;
        text-shadow: 0 0 20px #00ffff;">PAUSED</h2>
      <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
        <button id="resumeBtn" style="
          background: transparent; border: 2px solid #00ffff; color: #00ffff;
          padding: 12px 50px; font-size: 18px; font-family: 'Courier New', monospace;
          cursor: pointer; letter-spacing: 2px; border-radius: 4px;
          text-shadow: 0 0 10px #00ffff; transition: all 0.2s;
        ">RESUME</button>
        <button id="quitBtn" style="
          background: transparent; border: 1px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.5); padding: 10px 50px; font-size: 14px;
          font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
          transition: all 0.2s;
        ">QUIT</button>
      </div>
      <div style="margin-top: 30px; font-size: 12px; opacity: 0.3;">Press SPACE to resume</div>
    </div>
  `;

  document.getElementById('resumeBtn')!.addEventListener('click', () => { playMenuSelect(); onResume(); });
  document.getElementById('quitBtn')!.addEventListener('click', () => { playMenuSelect(); onQuit(); });

  return screen;
}

export function hidePauseOverlay() { removeScreen('pause'); }
