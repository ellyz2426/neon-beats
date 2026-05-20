// ============================================================
// Neon Beats VR — Audio Engine
// Procedural music generation + SFX using Web Audio API
// ============================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

export function initAudio(): AudioContext {
  if (audioCtx) return audioCtx;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(audioCtx.destination);

  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(masterGain);

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.6;
  sfxGain.connect(masterGain);

  return audioCtx;
}

export function getAudioCtx(): AudioContext | null { return audioCtx; }

export function setMasterVolume(v: number) { if (masterGain) masterGain.gain.value = v; }
export function setMusicVolume(v: number) { if (musicGain) musicGain.gain.value = v; }
export function setSfxVolume(v: number) { if (sfxGain) sfxGain.gain.value = v; }

// ---- Procedural SFX ----

function noise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

export function playHitSound(quality: 'perfect' | 'great' | 'good') {
  if (!audioCtx || !sfxGain) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  // Higher pitch for better hits
  const baseFreq = quality === 'perfect' ? 880 : quality === 'great' ? 660 : 440;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.2);

  // Add shimmer for perfect hits
  if (quality === 'perfect') {
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1760, now);
    shimmer.frequency.exponentialRampToValueAtTime(2640, now + 0.1);
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0.15, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    shimmer.connect(sGain);
    sGain.connect(sfxGain);
    shimmer.start(now);
    shimmer.stop(now + 0.15);
  }
}

export function playMissSound() {
  if (!audioCtx || !sfxGain) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function playComboSound(combo: number) {
  if (!audioCtx || !sfxGain) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const baseFreq = 440 + Math.min(combo, 50) * 10;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const t = now + i * 0.05;
    osc.frequency.setValueAtTime(baseFreq * (1 + i * 0.5), t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }
}

export function playMenuSelect() {
  if (!audioCtx || !sfxGain) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playCountdownBeep(final: boolean) {
  if (!audioCtx || !sfxGain) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(final ? 880 : 440, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (final ? 0.4 : 0.2));
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + (final ? 0.4 : 0.2));
}

// ---- Procedural Music Engine ----

export interface BeatEvent {
  time: number;       // seconds from song start
  lane: number;       // 0-3
  type: 'tap' | 'hold' | 'double';
  holdDuration?: number;
}

export interface Song {
  name: string;
  bpm: number;
  duration: number;   // seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  beats: BeatEvent[];
  bassPattern: number[];
  kickPattern: boolean[];
  snarePattern: boolean[];
  hihatPattern: boolean[];
  synthMelody: number[];
}

import {
  generateStructuredBeats,
  generateStructuredDrums,
  generateStructuredBass,
  generateStructuredMelody,
} from './songgen';

export function generateSong(name: string, bpm: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', durationSecs: number, numLanes: number = 4): Song {
  const root = 48; // C3
  const drums = generateStructuredDrums(bpm, durationSecs, difficulty);

  return {
    name,
    bpm,
    duration: durationSecs,
    difficulty,
    beats: generateStructuredBeats(bpm, durationSecs, difficulty, numLanes),
    bassPattern: generateStructuredBass(bpm, durationSecs, root, difficulty),
    kickPattern: drums.kick,
    snarePattern: drums.snare,
    hihatPattern: drums.hihat,
    synthMelody: generateStructuredMelody(bpm, durationSecs, root, difficulty),
  };
}

// ---- Music Playback ----

let musicPlaying = false;
let musicStartTime = 0;
let musicScheduler: number | null = null;
let currentSong: Song | null = null;
let nextKickStep = 0;
let nextSnareStep = 0;
let nextHihatStep = 0;
let nextBassStep = 0;
let nextMelodyStep = 0;

export function startMusic(song: Song) {
  if (!audioCtx || !musicGain) return;
  const ctx = audioCtx;
  if (ctx.state === 'suspended') ctx.resume();

  currentSong = song;
  musicPlaying = true;
  musicStartTime = ctx.currentTime;
  nextKickStep = 0;
  nextSnareStep = 0;
  nextHihatStep = 0;
  nextBassStep = 0;
  nextMelodyStep = 0;

  scheduleMusic();
}

function scheduleMusic() {
  if (!audioCtx || !musicGain || !musicPlaying || !currentSong) return;
  const ctx = audioCtx;
  const song = currentSong;
  const now = ctx.currentTime;
  const elapsed = now - musicStartTime;
  const stepDuration16 = 60 / song.bpm / 4; // 16th note
  const stepDuration8 = 60 / song.bpm / 2;  // 8th note
  const beatDuration = 60 / song.bpm;

  // Schedule ahead 0.2s
  const scheduleAhead = 0.2;

  // Kick drum
  while (nextKickStep < song.kickPattern.length) {
    const t = musicStartTime + nextKickStep * stepDuration16;
    if (t > now + scheduleAhead) break;
    if (song.kickPattern[nextKickStep] && t >= now) {
      playKick(ctx, musicGain, t);
    }
    nextKickStep++;
  }

  // Snare
  while (nextSnareStep < song.snarePattern.length) {
    const t = musicStartTime + nextSnareStep * stepDuration16;
    if (t > now + scheduleAhead) break;
    if (song.snarePattern[nextSnareStep] && t >= now) {
      playSnare(ctx, musicGain, t);
    }
    nextSnareStep++;
  }

  // Hi-hat
  while (nextHihatStep < song.hihatPattern.length) {
    const t = musicStartTime + nextHihatStep * stepDuration16;
    if (t > now + scheduleAhead) break;
    if (song.hihatPattern[nextHihatStep] && t >= now) {
      playHihat(ctx, musicGain, t);
    }
    nextHihatStep++;
  }

  // Bass
  while (nextBassStep < song.bassPattern.length) {
    const t = musicStartTime + nextBassStep * beatDuration;
    if (t > now + scheduleAhead) break;
    if (song.bassPattern[nextBassStep] > 0 && t >= now) {
      playBass(ctx, musicGain, t, song.bassPattern[nextBassStep], beatDuration * 0.8);
    }
    nextBassStep++;
  }

  // Melody
  while (nextMelodyStep < song.synthMelody.length) {
    const t = musicStartTime + nextMelodyStep * stepDuration8;
    if (t > now + scheduleAhead) break;
    if (song.synthMelody[nextMelodyStep] > 0 && t >= now) {
      playSynth(ctx, musicGain, t, song.synthMelody[nextMelodyStep], stepDuration8 * 0.7);
    }
    nextMelodyStep++;
  }

  if (musicPlaying) {
    musicScheduler = window.setTimeout(scheduleMusic, 50);
  }
}

function playKick(ctx: AudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.15);
}

function playSnare(ctx: AudioContext, dest: AudioNode, time: number) {
  // Noise burst
  const n = noise(ctx, 0.1);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.25, time);
  nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  n.connect(filter);
  filter.connect(nGain);
  nGain.connect(dest);
  n.start(time);
  n.stop(time + 0.1);

  // Body
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(0.3, time);
  oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(oGain);
  oGain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.08);
}

function playHihat(ctx: AudioContext, dest: AudioNode, time: number) {
  const n = noise(ctx, 0.04);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  n.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  n.start(time);
  n.stop(time + 0.04);
}

function playBass(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, time);
  gain.gain.setValueAtTime(0.25, time + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

function playSynth(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, time);
  filter.frequency.exponentialRampToValueAtTime(800, time + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.setValueAtTime(0.08, time + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur);
}

export function stopMusic() {
  musicPlaying = false;
  if (musicScheduler !== null) {
    clearTimeout(musicScheduler);
    musicScheduler = null;
  }
  currentSong = null;
}

export function getMusicTime(): number {
  if (!audioCtx || !musicPlaying) return 0;
  return audioCtx.currentTime - musicStartTime;
}

export function isMusicPlaying(): boolean { return musicPlaying; }
