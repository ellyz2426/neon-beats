// ============================================================
// Neon Beats VR — Custom Song Editor / Beat Mapper
// Let players create their own beat patterns:
//   - Set BPM and duration
//   - Tap lanes to place beats in real-time or grid mode
//   - Adjust beat types (tap, hold, bomb, slide)
//   - Preview and play custom songs
//   - Save/load custom songs to localStorage
// ============================================================

import type { BeatEvent, Song } from './audio';
import { playMenuSelect, playHitSound } from './audio';
import { getSongInfo, type SongInfo } from './songs';

// ---- Types ----

export interface CustomSong {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  beats: BeatEvent[];
  createdAt: number;
  updatedAt: number;
}

interface EditorState {
  active: boolean;
  song: CustomSong;
  playing: boolean;
  currentTime: number;
  selectedBeatType: 'tap' | 'hold' | 'bomb' | 'slide';
  gridSnap: number;  // snap to nearest N-th of a beat
  zoom: number;       // timeline zoom level
  scrollOffset: number;
  selectedBeat: number | null;
}

// ---- Storage ----

const STORAGE_KEY = 'neonbeats-custom-songs';

export function loadCustomSongs(): CustomSong[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveCustomSong(song: CustomSong) {
  const songs = loadCustomSongs();
  const existing = songs.findIndex(s => s.id === song.id);
  song.updatedAt = Date.now();
  if (existing >= 0) {
    songs[existing] = song;
  } else {
    songs.push(song);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

export function deleteCustomSong(id: string) {
  const songs = loadCustomSongs().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

export function customSongToPlayable(custom: CustomSong): Song {
  return {
    name: custom.name,
    bpm: custom.bpm,
    duration: custom.duration,
    difficulty: 'medium' as const,
    beats: [...custom.beats].sort((a, b) => a.time - b.time),
    bassPattern: [],
    kickPattern: [],
    snarePattern: [],
    hihatPattern: [],
    synthMelody: [],
  };
}

export function customSongToSongInfo(custom: CustomSong): SongInfo {
  return {
    id: custom.id,
    name: custom.name,
    artist: custom.artist || 'Custom',
    bpm: custom.bpm,
    duration: custom.duration,
    difficulty: estimateDifficulty(custom),
    color: '#ffcc00',
    description: `Custom song • ${custom.beats.length} beats`,
  };
}

function estimateDifficulty(song: CustomSong): 'easy' | 'medium' | 'hard' | 'expert' {
  const beatsPerSecond = song.beats.length / song.duration;
  if (beatsPerSecond < 1.5) return 'easy';
  if (beatsPerSecond < 3) return 'medium';
  if (beatsPerSecond < 5) return 'hard';
  return 'expert';
}

// ---- Editor UI ----

let editorOverlay: HTMLDivElement | null = null;

export function createEditorUI(): HTMLDivElement {
  if (editorOverlay) return editorOverlay;

  const el = document.createElement('div');
  el.id = 'beat-editor';
  el.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.95); z-index: 200; display: none;
    font-family: monospace; color: #fff; overflow: hidden;
  `;

  el.innerHTML = `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="color: #ffcc00; margin: 0; text-shadow: 0 0 10px rgba(255,204,0,0.5);">◆ BEAT EDITOR</h2>
        <div>
          <button id="editor-save" style="background: #00ff88; color: #000; border: none; padding: 6px 16px; margin: 0 5px; cursor: pointer; font-family: monospace; font-weight: bold;">SAVE</button>
          <button id="editor-play" style="background: #00ffff; color: #000; border: none; padding: 6px 16px; margin: 0 5px; cursor: pointer; font-family: monospace; font-weight: bold;">PREVIEW</button>
          <button id="editor-close" style="background: #ff0044; color: #fff; border: none; padding: 6px 16px; margin: 0 5px; cursor: pointer; font-family: monospace; font-weight: bold;">✕ CLOSE</button>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
        <div>
          <label style="color: #888; font-size: 11px;">SONG NAME</label>
          <input id="editor-name" type="text" value="My Song" style="width: 100%; background: #111; color: #fff; border: 1px solid #333; padding: 4px 8px; font-family: monospace; box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #888; font-size: 11px;">ARTIST</label>
          <input id="editor-artist" type="text" value="Custom" style="width: 100%; background: #111; color: #fff; border: 1px solid #333; padding: 4px 8px; font-family: monospace; box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #888; font-size: 11px;">BPM</label>
          <input id="editor-bpm" type="number" value="120" min="60" max="300" style="width: 100%; background: #111; color: #fff; border: 1px solid #333; padding: 4px 8px; font-family: monospace; box-sizing: border-box;" />
        </div>
        <div>
          <label style="color: #888; font-size: 11px;">DURATION (sec)</label>
          <input id="editor-duration" type="number" value="90" min="30" max="600" style="width: 100%; background: #111; color: #fff; border: 1px solid #333; padding: 4px 8px; font-family: monospace; box-sizing: border-box;" />
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <label style="color: #888; font-size: 11px;">BEAT TYPE:</label>
        <button class="type-btn active" data-type="tap" style="background: #00ffff; color: #000; border: none; padding: 3px 10px; cursor: pointer; font-family: monospace; font-size: 11px;">TAP</button>
        <button class="type-btn" data-type="hold" style="background: #333; color: #fff; border: none; padding: 3px 10px; cursor: pointer; font-family: monospace; font-size: 11px;">HOLD</button>
        <button class="type-btn" data-type="bomb" style="background: #333; color: #fff; border: none; padding: 3px 10px; cursor: pointer; font-family: monospace; font-size: 11px;">BOMB</button>
        <button class="type-btn" data-type="slide" style="background: #333; color: #fff; border: none; padding: 3px 10px; cursor: pointer; font-family: monospace; font-size: 11px;">SLIDE</button>
        <span style="flex: 1;"></span>
        <label style="color: #888; font-size: 11px;">GRID:</label>
        <select id="editor-grid" style="background: #111; color: #fff; border: 1px solid #333; font-family: monospace; font-size: 11px;">
          <option value="1">1/4 note</option>
          <option value="2" selected>1/8 note</option>
          <option value="4">1/16 note</option>
        </select>
      </div>
      <div id="editor-timeline" style="background: #0a0a0a; border: 1px solid #333; height: 300px; overflow-x: auto; overflow-y: hidden; position: relative; cursor: crosshair;">
        <canvas id="editor-canvas" width="2000" height="300"></canvas>
      </div>
      <div style="margin-top: 8px; color: #666; font-size: 11px;">
        Click lanes to place beats • Right-click to remove • Scroll to navigate • <span id="editor-beat-count">0</span> beats placed
      </div>
    </div>
  `;

  document.body.appendChild(el);
  editorOverlay = el;
  return el;
}

// ---- Editor Controller ----

export class BeatEditor {
  private state: EditorState;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private numLanes = 4;
  private onClose: (() => void) | null = null;
  private onPlay: ((song: Song) => void) | null = null;

  constructor() {
    this.state = {
      active: false,
      song: this.createNewSong(),
      playing: false,
      currentTime: 0,
      selectedBeatType: 'tap',
      gridSnap: 2,
      zoom: 1,
      scrollOffset: 0,
      selectedBeat: null,
    };
  }

  private createNewSong(): CustomSong {
    return {
      id: `custom-${Date.now()}`,
      name: 'My Song',
      artist: 'Custom',
      bpm: 120,
      duration: 90,
      beats: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  open(numLanes: number, onClose: () => void, onPlay: (song: Song) => void, existingSong?: CustomSong) {
    this.numLanes = numLanes;
    this.onClose = onClose;
    this.onPlay = onPlay;

    if (existingSong) {
      this.state.song = { ...existingSong, beats: [...existingSong.beats] };
    } else {
      this.state.song = this.createNewSong();
    }

    const ui = createEditorUI();
    ui.style.display = 'block';
    this.state.active = true;

    // Get canvas
    this.canvas = document.getElementById('editor-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') || null;

    this.setupEventListeners();
    this.syncUIFromState();
    this.render();
  }

  close() {
    if (editorOverlay) editorOverlay.style.display = 'none';
    this.state.active = false;
    if (this.onClose) this.onClose();
  }

  private setupEventListeners() {
    const closeBtn = document.getElementById('editor-close');
    const saveBtn = document.getElementById('editor-save');
    const playBtn = document.getElementById('editor-play');

    closeBtn?.addEventListener('click', () => this.close());
    saveBtn?.addEventListener('click', () => {
      this.syncStateFromUI();
      saveCustomSong(this.state.song);
      playMenuSelect();
    });
    playBtn?.addEventListener('click', () => {
      this.syncStateFromUI();
      if (this.onPlay) {
        this.onPlay(customSongToPlayable(this.state.song));
      }
    });

    // Beat type buttons
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => {
          (b as HTMLElement).style.background = '#333';
          (b as HTMLElement).style.color = '#fff';
          b.classList.remove('active');
        });
        (btn as HTMLElement).style.background = '#00ffff';
        (btn as HTMLElement).style.color = '#000';
        btn.classList.add('active');
        this.state.selectedBeatType = (btn as HTMLElement).dataset.type as any;
      });
    });

    // Grid snap
    const gridSelect = document.getElementById('editor-grid') as HTMLSelectElement;
    gridSelect?.addEventListener('change', () => {
      this.state.gridSnap = parseInt(gridSelect.value);
      this.render();
    });

    // Canvas click to place beats
    this.canvas?.addEventListener('click', (e) => {
      this.handleCanvasClick(e);
    });

    this.canvas?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleCanvasRightClick(e);
    });
  }

  private syncUIFromState() {
    const nameEl = document.getElementById('editor-name') as HTMLInputElement;
    const artistEl = document.getElementById('editor-artist') as HTMLInputElement;
    const bpmEl = document.getElementById('editor-bpm') as HTMLInputElement;
    const durEl = document.getElementById('editor-duration') as HTMLInputElement;

    if (nameEl) nameEl.value = this.state.song.name;
    if (artistEl) artistEl.value = this.state.song.artist;
    if (bpmEl) bpmEl.value = String(this.state.song.bpm);
    if (durEl) durEl.value = String(this.state.song.duration);

    this.updateBeatCount();
  }

  private syncStateFromUI() {
    const nameEl = document.getElementById('editor-name') as HTMLInputElement;
    const artistEl = document.getElementById('editor-artist') as HTMLInputElement;
    const bpmEl = document.getElementById('editor-bpm') as HTMLInputElement;
    const durEl = document.getElementById('editor-duration') as HTMLInputElement;

    if (nameEl) this.state.song.name = nameEl.value || 'Untitled';
    if (artistEl) this.state.song.artist = artistEl.value || 'Custom';
    if (bpmEl) this.state.song.bpm = Math.max(60, Math.min(300, parseInt(bpmEl.value) || 120));
    if (durEl) this.state.song.duration = Math.max(30, Math.min(600, parseInt(durEl.value) || 90));
  }

  private handleCanvasClick(e: MouseEvent) {
    if (!this.canvas || !this.ctx) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    // Map x to time
    const beatDur = 60 / this.state.song.bpm;
    const pixelsPerBeat = 60 * this.state.zoom;
    const time = (x / pixelsPerBeat) * beatDur;

    // Snap to grid
    const snapUnit = beatDur / this.state.gridSnap;
    const snappedTime = Math.round(time / snapUnit) * snapUnit;

    // Map y to lane
    const laneHeight = this.canvas.height / this.numLanes;
    const lane = Math.floor(y / laneHeight);
    if (lane < 0 || lane >= this.numLanes) return;

    // Add beat
    this.state.song.beats.push({
      time: snappedTime,
      lane,
      type: this.state.selectedBeatType,
      holdDuration: this.state.selectedBeatType === 'hold' ? beatDur * 2 : undefined,
    });

    playHitSound('good');
    this.updateBeatCount();
    this.render();
  }

  private handleCanvasRightClick(e: MouseEvent) {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const beatDur = 60 / this.state.song.bpm;
    const pixelsPerBeat = 60 * this.state.zoom;
    const clickTime = (x / pixelsPerBeat) * beatDur;
    const laneHeight = this.canvas.height / this.numLanes;
    const clickLane = Math.floor(y / laneHeight);

    // Find nearest beat within tolerance
    const tolerance = beatDur * 0.25;
    const idx = this.state.song.beats.findIndex(b =>
      Math.abs(b.time - clickTime) < tolerance && b.lane === clickLane
    );

    if (idx >= 0) {
      this.state.song.beats.splice(idx, 1);
      this.updateBeatCount();
      this.render();
    }
  }

  private updateBeatCount() {
    const el = document.getElementById('editor-beat-count');
    if (el) el.textContent = String(this.state.song.beats.length);
  }

  private render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const beatDur = 60 / this.state.song.bpm;
    const pixelsPerBeat = 60 * this.state.zoom;
    const laneH = H / this.numLanes;

    // Extend canvas width based on duration
    const totalBeats = this.state.song.duration / beatDur;
    this.canvas.width = Math.max(W, totalBeats * pixelsPerBeat + 100);

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, H);

    // Lane lines
    ctx.strokeStyle = '#222';
    for (let i = 0; i <= this.numLanes; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * laneH);
      ctx.lineTo(this.canvas.width, i * laneH);
      ctx.stroke();
    }

    // Lane labels
    ctx.fillStyle = '#444';
    ctx.font = '11px monospace';
    const laneNames = ['D', 'F', 'J', 'K'];
    for (let i = 0; i < this.numLanes; i++) {
      ctx.fillText(laneNames[i] || `L${i}`, 5, i * laneH + laneH / 2 + 4);
    }

    // Beat grid lines
    for (let t = 0; t < this.state.song.duration; t += beatDur / this.state.gridSnap) {
      const x = (t / beatDur) * pixelsPerBeat;
      const isMeasure = Math.abs(t % (beatDur * 4)) < 0.001;
      ctx.strokeStyle = isMeasure ? '#333' : '#1a1a1a';
      ctx.lineWidth = isMeasure ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();

      if (isMeasure) {
        ctx.fillStyle = '#555';
        ctx.font = '9px monospace';
        ctx.fillText(`${Math.round(t)}s`, x + 2, 10);
      }
    }

    // Draw beats
    const typeColors: Record<string, string> = {
      tap: '#00ffff',
      hold: '#00ff88',
      bomb: '#ff0044',
      slide: '#ffcc00',
    };

    for (const beat of this.state.song.beats) {
      const x = (beat.time / beatDur) * pixelsPerBeat;
      const y = beat.lane * laneH;
      const color = typeColors[beat.type] || '#00ffff';

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;

      if (beat.type === 'hold' && beat.holdDuration) {
        const w = (beat.holdDuration / beatDur) * pixelsPerBeat;
        ctx.fillRect(x - 4, y + 4, w, laneH - 8);
      } else if (beat.type === 'bomb') {
        ctx.beginPath();
        ctx.arc(x, y + laneH / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - 4, y + 4, 8, laneH - 8);
      }

      ctx.globalAlpha = 1;
    }
  }

  isActive(): boolean { return this.state.active; }

  getSong(): CustomSong { return this.state.song; }
}
