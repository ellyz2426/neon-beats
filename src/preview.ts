// ============================================================
// Neon Beats VR — Song Preview
// Short audio preview in song select screen
// ============================================================

import { initAudio, generateSong, type Song } from './audio';

let previewCtx: AudioContext | null = null;
let previewGain: GainNode | null = null;
let previewOscillators: OscillatorNode[] = [];
let previewTimeout: number | null = null;
let previewPlaying = false;
let currentPreviewId = '';

export function startPreview(songName: string, bpm: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', songId: string) {
  if (currentPreviewId === songId && previewPlaying) return;
  stopPreview();
  currentPreviewId = songId;

  try {
    previewCtx = initAudio();
    if (!previewCtx) return;

    previewGain = previewCtx.createGain();
    previewGain.gain.value = 0;
    previewGain.connect(previewCtx.destination);

    // Fade in
    previewGain.gain.linearRampToValueAtTime(0.15, previewCtx.currentTime + 0.3);

    const now = previewCtx.currentTime;
    const beatDur = 60 / bpm;

    // Play a short musical phrase
    const root = midiToFreq(48); // C3
    const scale = getScaleForDifficulty(difficulty);

    // Kick pattern
    for (let i = 0; i < 8; i++) {
      const t = now + i * beatDur;
      playPreviewKick(previewCtx, previewGain, t);
      if (i % 2 === 1) playPreviewSnare(previewCtx, previewGain, t);
      playPreviewHihat(previewCtx, previewGain, t + beatDur * 0.5);
    }

    // Bass line
    const bassNotes = [0, 0, 3, 5, 0, 0, 7, 5];
    for (let i = 0; i < bassNotes.length; i++) {
      const freq = root * Math.pow(2, scale[bassNotes[i] % scale.length] / 12);
      playPreviewBass(previewCtx, previewGain, now + i * beatDur, freq, beatDur * 0.7);
    }

    // Melody preview
    const melodyNotes = generatePreviewMelody(difficulty);
    const eighthDur = beatDur / 2;
    for (let i = 0; i < melodyNotes.length; i++) {
      if (melodyNotes[i] < 0) continue;
      const freq = root * 2 * Math.pow(2, scale[melodyNotes[i] % scale.length] / 12);
      playPreviewSynth(previewCtx, previewGain, now + i * eighthDur, freq, eighthDur * 0.6);
    }

    previewPlaying = true;

    // Auto-stop after 4 seconds with fade out
    previewTimeout = window.setTimeout(() => {
      fadeOutPreview();
    }, 3500);

  } catch { stopPreview(); }
}

function fadeOutPreview() {
  if (previewGain && previewCtx) {
    previewGain.gain.linearRampToValueAtTime(0, previewCtx.currentTime + 0.5);
    previewTimeout = window.setTimeout(() => stopPreview(), 600);
  }
}

export function stopPreview() {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  for (const osc of previewOscillators) {
    try { osc.stop(); } catch { /* ignore */ }
  }
  previewOscillators = [];

  if (previewGain) {
    try { previewGain.disconnect(); } catch { /* ignore */ }
    previewGain = null;
  }

  previewPlaying = false;
  currentPreviewId = '';
}

export function isPreviewPlaying(): boolean {
  return previewPlaying;
}

// ---- Preview instruments ----

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getScaleForDifficulty(diff: string): number[] {
  // Minor pentatonic for easy/medium, harmonic minor for hard/expert
  if (diff === 'easy' || diff === 'medium') return [0, 3, 5, 7, 10]; // minor pentatonic
  return [0, 2, 3, 5, 7, 8, 11]; // harmonic minor
}

function generatePreviewMelody(difficulty: string): number[] {
  const length = 16; // 16 eighth notes = 8 beats
  const notes: number[] = [];
  const density = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.6 : 0.8;

  let lastNote = 2;
  for (let i = 0; i < length; i++) {
    if (Math.random() < density) {
      lastNote += Math.floor(Math.random() * 3) - 1;
      lastNote = Math.max(0, Math.min(6, lastNote));
      notes.push(lastNote);
    } else {
      notes.push(-1); // rest
    }
  }
  return notes;
}

function playPreviewKick(ctx: AudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.12);
  previewOscillators.push(osc);
}

function playPreviewSnare(ctx: AudioContext, dest: AudioNode, time: number) {
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + 0.08);
}

function playPreviewHihat(ctx: AudioContext, dest: AudioNode, time: number) {
  const bufferSize = ctx.sampleRate * 0.03;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8000;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + 0.03);
}

function playPreviewBass(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
  previewOscillators.push(osc);
}

function playPreviewSynth(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
  previewOscillators.push(osc);
}
