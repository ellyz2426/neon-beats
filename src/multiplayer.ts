// ============================================================
// Neon Beats VR — Multiplayer Score Comparison
// Turn-based local multiplayer: players take turns on same song
// Compare scores after all players finish
// Display split results screen
// ============================================================

import { getAccuracy, getGrade, type GameState } from './game';
import { calculateStars } from './rating';
import type { SongInfo } from './songs';

// ---- Types ----

export interface PlayerResult {
  name: string;
  score: number;
  accuracy: number;
  grade: string;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  stars: number;
}

export interface MultiplayerSession {
  active: boolean;
  songId: string;
  difficulty: string;
  playerCount: number;
  currentPlayer: number;
  playerNames: string[];
  results: PlayerResult[];
}

// ---- State Management ----

export function createMultiplayerSession(
  songId: string,
  difficulty: string,
  playerNames: string[]
): MultiplayerSession {
  return {
    active: true,
    songId,
    difficulty,
    playerCount: playerNames.length,
    currentPlayer: 0,
    playerNames,
    results: [],
  };
}

export function recordPlayerResult(session: MultiplayerSession, state: GameState) {
  const accuracy = getAccuracy(state);
  session.results.push({
    name: session.playerNames[session.currentPlayer],
    score: state.score,
    accuracy,
    grade: getGrade(accuracy),
    maxCombo: state.maxCombo,
    perfects: state.perfects,
    greats: state.greats,
    goods: state.goods,
    misses: state.misses,
    stars: calculateStars(state),
  });
  session.currentPlayer++;
}

export function isSessionComplete(session: MultiplayerSession): boolean {
  return session.currentPlayer >= session.playerCount;
}

export function getWinner(session: MultiplayerSession): PlayerResult | null {
  if (session.results.length === 0) return null;
  return session.results.reduce((best, r) => r.score > best.score ? r : best);
}

// ---- Multiplayer Results UI ----

let mpResultsEl: HTMLDivElement | null = null;

export function showMultiplayerResults(
  session: MultiplayerSession,
  songInfo: SongInfo,
  onReplay: () => void,
  onExit: () => void
) {
  if (!mpResultsEl) {
    mpResultsEl = document.createElement('div');
    mpResultsEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 170; overflow-y: auto;
      font-family: monospace; color: #fff; display: none;
    `;
    document.body.appendChild(mpResultsEl);
  }

  const winner = getWinner(session);
  const sorted = [...session.results].sort((a, b) => b.score - a.score);

  let html = `
    <div style="max-width: 700px; margin: 0 auto; padding: 25px; text-align: center;">
      <h2 style="color: #00ffff; text-shadow: 0 0 15px rgba(0,255,255,0.5); margin-bottom: 5px;">◆ MULTIPLAYER RESULTS ◆</h2>
      <div style="color: #888; font-size: 13px; margin-bottom: 20px;">${songInfo.name} • ${songInfo.bpm} BPM • ${session.difficulty.toUpperCase()}</div>

      ${winner ? `
        <div style="margin-bottom: 25px;">
          <div style="color: #ffd700; font-size: 16px; text-shadow: 0 0 10px rgba(255,215,0,0.5);">🏆 WINNER</div>
          <div style="color: #ffd700; font-size: 28px; font-weight: bold;">${winner.name}</div>
          <div style="color: #888; font-size: 14px;">${winner.score.toLocaleString()} pts • ${(winner.accuracy * 100).toFixed(1)}% • ${winner.grade}</div>
        </div>
      ` : ''}

      <!-- Leaderboard -->
      <div style="text-align: left; margin-bottom: 20px;">
  `;

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const isWinner = i === 0;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

    html += `
      <div style="background: ${isWinner ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isWinner ? '#332200' : '#222'}; padding: 12px; margin-bottom: 6px; border-radius: 4px; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px; width: 30px; text-align: center;">${medal}</div>
        <div style="flex: 1;">
          <div style="color: ${isWinner ? '#ffd700' : '#ccc'}; font-weight: bold;">${r.name}</div>
          <div style="color: #666; font-size: 11px;">${r.perfects}P / ${r.greats}Gr / ${r.goods}Go / ${r.misses}M • ${r.maxCombo}x combo</div>
        </div>
        <div style="text-align: right;">
          <div style="color: ${isWinner ? '#ffd700' : '#fff'}; font-weight: bold; font-size: 18px;">${r.score.toLocaleString()}</div>
          <div style="color: #888; font-size: 12px;">${(r.accuracy * 100).toFixed(1)}% • ${r.grade} • ${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        </div>
      </div>
    `;
  }

  html += `
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="mp-replay" style="background: #00ffff; color: #000; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace; font-weight: bold;">PLAY AGAIN</button>
        <button id="mp-exit" style="background: #333; color: #fff; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace;">EXIT</button>
      </div>
    </div>
  `;

  mpResultsEl.innerHTML = html;
  mpResultsEl.style.display = 'block';

  document.getElementById('mp-replay')?.addEventListener('click', () => {
    mpResultsEl!.style.display = 'none';
    onReplay();
  });
  document.getElementById('mp-exit')?.addEventListener('click', () => {
    mpResultsEl!.style.display = 'none';
    onExit();
  });
}

export function hideMultiplayerResults() {
  if (mpResultsEl) mpResultsEl.style.display = 'none';
}

// ---- Player Name Setup UI ----

let setupEl: HTMLDivElement | null = null;

export function showPlayerSetup(
  onStart: (names: string[]) => void,
  onCancel: () => void
) {
  if (!setupEl) {
    setupEl = document.createElement('div');
    setupEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 170;
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; color: #fff;
    `;
    document.body.appendChild(setupEl);
  }

  setupEl.innerHTML = `
    <div style="background: #111; border: 1px solid #333; padding: 25px; border-radius: 8px; width: 350px; text-align: center;">
      <h3 style="color: #00ffff; margin-top: 0;">◆ MULTIPLAYER SETUP</h3>
      <div style="margin-bottom: 15px;">
        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 5px;">PLAYER 1</label>
        <input id="mp-p1" type="text" value="Player 1" style="width: 100%; background: #0a0a0a; color: #fff; border: 1px solid #333; padding: 6px; font-family: monospace; text-align: center; box-sizing: border-box;" />
      </div>
      <div style="margin-bottom: 15px;">
        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 5px;">PLAYER 2</label>
        <input id="mp-p2" type="text" value="Player 2" style="width: 100%; background: #0a0a0a; color: #fff; border: 1px solid #333; padding: 6px; font-family: monospace; text-align: center; box-sizing: border-box;" />
      </div>
      <div style="margin-bottom: 20px;">
        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 5px;">PLAYER 3 (optional)</label>
        <input id="mp-p3" type="text" value="" placeholder="Leave empty to skip" style="width: 100%; background: #0a0a0a; color: #666; border: 1px solid #222; padding: 6px; font-family: monospace; text-align: center; box-sizing: border-box;" />
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="mp-start" style="background: #00ff88; color: #000; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace; font-weight: bold;">START</button>
        <button id="mp-cancel" style="background: #333; color: #fff; border: none; padding: 8px 25px; cursor: pointer; font-family: monospace;">CANCEL</button>
      </div>
    </div>
  `;
  setupEl.style.display = 'flex';

  document.getElementById('mp-start')?.addEventListener('click', () => {
    const names: string[] = [];
    const p1 = (document.getElementById('mp-p1') as HTMLInputElement).value.trim();
    const p2 = (document.getElementById('mp-p2') as HTMLInputElement).value.trim();
    const p3 = (document.getElementById('mp-p3') as HTMLInputElement).value.trim();
    if (p1) names.push(p1);
    if (p2) names.push(p2);
    if (p3) names.push(p3);
    if (names.length < 2) names.push('Player 2');
    setupEl!.style.display = 'none';
    onStart(names);
  });

  document.getElementById('mp-cancel')?.addEventListener('click', () => {
    setupEl!.style.display = 'none';
    onCancel();
  });
}
