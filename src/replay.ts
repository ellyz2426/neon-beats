// ============================================================
// Neon Beats VR — Input Replay & Ghost System
// Record inputs, replay ghosts, compare performances
// ============================================================

export interface InputEvent {
  time: number;       // song time in seconds
  lane: number;       // lane index
  quality: string;    // 'perfect' | 'great' | 'good' | 'miss' | 'bomb' | 'slide'
  score: number;      // cumulative score at this point
  combo: number;      // combo at this point
}

export interface ReplayData {
  songId: string;
  difficulty: string;
  date: string;
  totalScore: number;
  grade: string;
  events: InputEvent[];
  modifiers: string[];
}

const REPLAY_KEY_PREFIX = 'neonbeats_replay_';
const MAX_REPLAYS_PER_SONG = 3;

export class InputRecorder {
  private events: InputEvent[] = [];
  private recording = false;
  private songId = '';
  private difficulty = '';
  private modifierNames: string[] = [];

  startRecording(songId: string, difficulty: string, modifiers: string[]) {
    this.events = [];
    this.recording = true;
    this.songId = songId;
    this.difficulty = difficulty;
    this.modifierNames = [...modifiers];
  }

  recordEvent(time: number, lane: number, quality: string, score: number, combo: number) {
    if (!this.recording) return;
    this.events.push({ time, lane, quality, score, combo });
  }

  stopRecording(totalScore: number, grade: string): ReplayData {
    this.recording = false;
    return {
      songId: this.songId,
      difficulty: this.difficulty,
      date: new Date().toISOString(),
      totalScore,
      grade,
      events: [...this.events],
      modifiers: [...this.modifierNames],
    };
  }

  isRecording(): boolean { return this.recording; }
  getEventCount(): number { return this.events.length; }
}

// Save best replay per song
export function saveReplay(replay: ReplayData) {
  try {
    const key = `${REPLAY_KEY_PREFIX}${replay.songId}`;
    const existing = loadReplays(replay.songId);
    existing.push(replay);
    existing.sort((a, b) => b.totalScore - a.totalScore);
    const trimmed = existing.slice(0, MAX_REPLAYS_PER_SONG);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function loadReplays(songId: string): ReplayData[] {
  try {
    const raw = localStorage.getItem(`${REPLAY_KEY_PREFIX}${songId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function loadBestReplay(songId: string): ReplayData | null {
  const replays = loadReplays(songId);
  return replays.length > 0 ? replays[0] : null;
}

// Ghost player — plays back a replay during live gameplay
export class GhostPlayer {
  private replay: ReplayData | null = null;
  private nextEventIndex = 0;
  private active = false;
  private ghostScore = 0;
  private ghostCombo = 0;

  load(replay: ReplayData) {
    this.replay = replay;
    this.nextEventIndex = 0;
    this.active = true;
    this.ghostScore = 0;
    this.ghostCombo = 0;
  }

  update(songTime: number): InputEvent[] {
    if (!this.active || !this.replay) return [];
    const triggered: InputEvent[] = [];

    while (this.nextEventIndex < this.replay.events.length) {
      const event = this.replay.events[this.nextEventIndex];
      if (event.time > songTime + 0.05) break;
      triggered.push(event);
      this.ghostScore = event.score;
      this.ghostCombo = event.combo;
      this.nextEventIndex++;
    }

    return triggered;
  }

  getGhostScore(): number { return this.ghostScore; }
  getGhostCombo(): number { return this.ghostCombo; }
  isActive(): boolean { return this.active; }

  stop() {
    this.active = false;
    this.replay = null;
  }
}

// ---- Ghost HUD Overlay ----
let ghostHUD: HTMLDivElement | null = null;

export function createGhostHUD(): HTMLDivElement {
  if (ghostHUD) ghostHUD.remove();
  ghostHUD = document.createElement('div');
  ghostHUD.id = 'ghostHUD';
  ghostHUD.style.cssText = `
    position: fixed; top: 15px; left: 15px; z-index: 140;
    font-family: 'Courier New', monospace; pointer-events: none;
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px; padding: 6px 10px;
  `;
  document.body.appendChild(ghostHUD);
  return ghostHUD;
}

export function updateGhostHUD(ghost: GhostPlayer, playerScore: number) {
  if (!ghostHUD || !ghost.isActive()) return;
  const diff = playerScore - ghost.getGhostScore();
  const color = diff >= 0 ? '#00ff88' : '#ff4444';
  const sign = diff >= 0 ? '+' : '';
  ghostHUD.innerHTML = `
    <div style="font-size: 10px; opacity: 0.4;">GHOST</div>
    <div style="font-size: 14px; color: ${color};">${sign}${diff.toLocaleString()}</div>
  `;
}

export function hideGhostHUD() {
  if (ghostHUD) { ghostHUD.remove(); ghostHUD = null; }
}
