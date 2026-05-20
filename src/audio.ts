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

  // Master compressor for glue and limiting
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 6;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(compressor);
  compressor.connect(audioCtx.destination);

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
  type: 'tap' | 'hold' | 'double' | 'bomb' | 'slide';
  holdDuration?: number;
  duration?: number;  // used by patterns/boss for hold-style events
  targetLane?: number; // for slide events
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
  // Sub layer - deep sine
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(160, time);
  sub.frequency.exponentialRampToValueAtTime(40, time + 0.08);
  sub.frequency.exponentialRampToValueAtTime(25, time + 0.2);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.65, time);
  subGain.gain.setValueAtTime(0.5, time + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start(time);
  sub.stop(time + 0.25);

  // Click layer - adds attack definition
  const click = ctx.createOscillator();
  click.type = 'sine';
  click.frequency.setValueAtTime(800, time);
  click.frequency.exponentialRampToValueAtTime(200, time + 0.02);
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.4, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  click.connect(clickGain);
  clickGain.connect(dest);
  click.start(time);
  click.stop(time + 0.03);
}

function playSnare(ctx: AudioContext, dest: AudioNode, time: number) {
  // Noise layer with bandpass for crisp texture
  const n = noise(ctx, 0.15);
  const nBand = ctx.createBiquadFilter();
  nBand.type = 'bandpass';
  nBand.frequency.value = 3000;
  nBand.Q.value = 0.8;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.3, time);
  nGain.gain.setValueAtTime(0.2, time + 0.02);
  nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  n.connect(nBand);
  nBand.connect(nGain);
  nGain.connect(dest);
  n.start(time);
  n.stop(time + 0.15);

  // Body - punchy tonal hit
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(250, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.04);
  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(0.35, time);
  oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(oGain);
  oGain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.1);

  // High snap transient
  const snap = ctx.createOscillator();
  snap.type = 'sine';
  snap.frequency.setValueAtTime(1200, time);
  snap.frequency.exponentialRampToValueAtTime(400, time + 0.01);
  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0.15, time);
  snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
  snap.connect(snapGain);
  snapGain.connect(dest);
  snap.start(time);
  snap.stop(time + 0.015);
}

function playHihat(ctx: AudioContext, dest: AudioNode, time: number) {
  const n = noise(ctx, 0.05);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 10000;
  bp.Q.value = 1.5;
  n.connect(hp);
  hp.connect(bp);
  bp.connect(gain);
  gain.connect(dest);
  n.start(time);
  n.stop(time + 0.05);
}

function playBass(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  // Two detuned oscillators for richness
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, time);
  osc1.detune.value = -7;

  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq, time);
  osc2.detune.value = 7;

  // Sub oscillator one octave below
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(freq / 2, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, time);
  filter.frequency.exponentialRampToValueAtTime(200, time + dur * 0.8);
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.setValueAtTime(0.18, time + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.15, time);
  subGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  sub.connect(subGain);
  subGain.connect(dest);

  osc1.start(time);
  osc2.start(time);
  sub.start(time);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
  sub.stop(time + dur);
}

function playSynth(ctx: AudioContext, dest: AudioNode, time: number, freq: number, dur: number) {
  // Main oscillator — pulse width modulation feel via detuned pair
  const osc1 = ctx.createOscillator();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(freq, time);
  osc1.detune.value = -5;

  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq * 1.002, time);
  osc2.detune.value = 5;

  // Filter sweep — open and close
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(1200, time + dur * 0.5);
  filter.frequency.exponentialRampToValueAtTime(600, time + dur);
  filter.Q.value = 2;

  // ADSR-like envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.1, time + 0.01); // attack
  gain.gain.linearRampToValueAtTime(0.07, time + 0.05); // decay to sustain
  gain.gain.setValueAtTime(0.07, time + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur); // release

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur + 0.05);
  osc2.stop(time + dur + 0.05);
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
