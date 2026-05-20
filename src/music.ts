// ============================================================
// Neon Beats VR — Dynamic Music Layers
// Background music layers that add/remove based on combo level
// Layer 0: ambient pad (always)
// Layer 1: kick drum (combo >= 5)
// Layer 2: hihat pattern (combo >= 15)
// Layer 3: bass line (combo >= 30)
// Layer 4: lead melody (combo >= 50)
// ============================================================

import { initAudio } from './audio';

interface MusicLayer {
  name: string;
  nodes: AudioNode[];
  gainNode: GainNode;
  targetGain: number;
  currentGain: number;
  comboThreshold: number;
  active: boolean;
}

export class DynamicMusicEngine {
  private ctx: AudioContext | null = null;
  private layers: MusicLayer[] = [];
  private masterGain: GainNode | null = null;
  private playing = false;
  private bpm = 120;
  private beatDur = 0.5;
  private nextBeatTime = 0;
  private currentBeat = 0;
  private timerInterval: number | null = null;
  private volume = 0.3;

  constructor() {}

  init(bpm: number) {
    this.ctx = initAudio();
    this.bpm = bpm;
    this.beatDur = 60 / bpm;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  start() {
    if (!this.ctx || !this.masterGain || this.playing) return;
    this.playing = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.1;

    // Setup layers
    this.setupLayers();

    // Schedule ahead
    this.scheduleTick();
  }

  stop() {
    this.playing = false;
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    // Fade out all layers
    for (const layer of this.layers) {
      layer.targetGain = 0;
    }
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  /**
   * Call every frame with current combo to adjust layers
   */
  updateCombo(combo: number) {
    for (const layer of this.layers) {
      layer.targetGain = combo >= layer.comboThreshold ? 1 : 0;
    }
  }

  update(dt: number) {
    // Smooth gain transitions
    for (const layer of this.layers) {
      const speed = dt * 3; // smooth transition
      layer.currentGain += (layer.targetGain - layer.currentGain) * Math.min(1, speed);
      layer.gainNode.gain.value = Math.max(0, Math.min(1, layer.currentGain));
    }
  }

  private setupLayers() {
    if (!this.ctx || !this.masterGain) return;
    this.layers = [];

    // Layer 0: Ambient pad (always on)
    this.addLayer('pad', 0, 0.15);

    // Layer 1: Kick (combo >= 5)
    this.addLayer('kick', 5, 0.4);

    // Layer 2: Hihat (combo >= 15)
    this.addLayer('hihat', 15, 0.12);

    // Layer 3: Bass (combo >= 30)
    this.addLayer('bass', 30, 0.25);

    // Layer 4: Lead (combo >= 50)
    this.addLayer('lead', 50, 0.2);
  }

  private addLayer(name: string, threshold: number, maxGain: number) {
    if (!this.ctx || !this.masterGain) return;

    const gain = this.ctx.createGain();
    gain.gain.value = threshold === 0 ? maxGain : 0;
    gain.connect(this.masterGain);

    this.layers.push({
      name,
      nodes: [],
      gainNode: gain,
      targetGain: threshold === 0 ? 1 : 0,
      currentGain: threshold === 0 ? 1 : 0,
      comboThreshold: threshold,
      active: false,
    });
  }

  private scheduleTick() {
    if (!this.playing) return;

    const scheduleAhead = 0.1;
    const tick = () => {
      if (!this.playing || !this.ctx) return;

      while (this.nextBeatTime < this.ctx.currentTime + scheduleAhead) {
        this.scheduleBeat(this.nextBeatTime, this.currentBeat);
        this.nextBeatTime += this.beatDur;
        this.currentBeat++;
      }
    };

    this.timerInterval = window.setInterval(tick, 25);
    tick();
  }

  private scheduleBeat(time: number, beat: number) {
    if (!this.ctx) return;
    const isDownbeat = beat % 4 === 0;
    const isHalf = beat % 2 === 0;
    const isEighth = true;

    // Pad layer — sustained drone
    if (beat % 16 === 0 && this.layers[0]) {
      this.schedulePad(time, this.layers[0].gainNode);
    }

    // Kick layer
    if (isDownbeat && this.layers[1]) {
      this.scheduleKick(time, this.layers[1].gainNode);
    }

    // Hihat layer
    if (isEighth && this.layers[2]) {
      this.scheduleHihat(time, this.layers[2].gainNode, isDownbeat ? 0.6 : 0.3);
    }

    // Bass layer — root note on downbeats
    if (isHalf && this.layers[3]) {
      this.scheduleBass(time, this.layers[3].gainNode, beat);
    }

    // Lead layer — melody on specific beats
    if (this.layers[4] && (beat % 4 === 0 || beat % 4 === 3)) {
      this.scheduleLead(time, this.layers[4].gainNode, beat);
    }
  }

  private schedulePad(time: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55; // A1
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.5);
    gain.gain.linearRampToValueAtTime(0.1, time + this.beatDur * 14);
    gain.gain.linearRampToValueAtTime(0, time + this.beatDur * 16);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + this.beatDur * 16);
  }

  private scheduleKick(time: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.08);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private scheduleHihat(time: number, dest: AudioNode, volume: number) {
    if (!this.ctx) return;
    const bufSize = this.ctx.sampleRate * 0.02;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 8000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(dest);
    src.start(time);
  }

  private scheduleBass(time: number, dest: AudioNode, beat: number) {
    if (!this.ctx) return;
    const notes = [55, 55, 73.42, 65.41]; // A1, A1, D2, C2
    const noteIndex = Math.floor(beat / 8) % notes.length;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = notes[noteIndex];
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 200;
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + this.beatDur * 0.9);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + this.beatDur);
  }

  private scheduleLead(time: number, dest: AudioNode, beat: number) {
    if (!this.ctx) return;
    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]; // A minor pentatonic-ish
    const noteIndex = (beat * 3 + Math.floor(beat / 7)) % scale.length;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = scale[noteIndex];
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + this.beatDur * 0.7);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + this.beatDur);
  }

  dispose() {
    this.stop();
    this.layers = [];
  }
}
