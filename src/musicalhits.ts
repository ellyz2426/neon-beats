// ============================================================
// Neon Beats VR — Musical Hit Sounds
// Hit sounds that are actual musical notes
// Build a melody as you hit blocks
// Different timbres per quality (perfect=bell, great=pluck, etc.)
// ============================================================

import { initAudio } from './audio';

// Scale: A minor pentatonic across 2 octaves
const NOTE_FREQS = [
  220.00,  // A3
  261.63,  // C4
  293.66,  // D4
  329.63,  // E4
  392.00,  // G4
  440.00,  // A4
  523.25,  // C5
  587.33,  // D5
  659.26,  // E5
  783.99,  // G5
];

export class MusicalHitSounds {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noteIndex = 0;
  private lastHitTime = 0;
  private volume = 0.25;
  private enabled = true;

  constructor() {}

  init() {
    this.ctx = initAudio();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    // Simple reverb
    this.reverb = this.ctx.createConvolver();
    const reverbBuf = this.createReverbIR(this.ctx, 0.8, 2);
    this.reverb.buffer = reverbBuf;

    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.3;

    this.masterGain.connect(this.ctx.destination);
    this.reverb.connect(wetGain);
    wetGain.connect(this.ctx.destination);
  }

  setEnabled(e: boolean) { this.enabled = e; }
  setVolume(v: number) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  /**
   * Play a musical note on hit.
   * Lane determines which note in the scale.
   * Quality determines the timbre.
   */
  playHit(lane: number, quality: 'perfect' | 'great' | 'good', numLanes: number) {
    if (!this.ctx || !this.masterGain || !this.enabled) return;

    const now = this.ctx.currentTime;

    // Map lane to a note
    const scaleStart = this.noteIndex;
    const noteIdx = (scaleStart + lane) % NOTE_FREQS.length;
    const freq = NOTE_FREQS[noteIdx];

    // Advance the melody position on each hit
    if (now - this.lastHitTime > 0.5) {
      this.noteIndex = (this.noteIndex + 1) % NOTE_FREQS.length;
    }
    this.lastHitTime = now;

    switch (quality) {
      case 'perfect':
        this.playBell(freq, now);
        break;
      case 'great':
        this.playPluck(freq, now);
        break;
      case 'good':
        this.playChime(freq, now);
        break;
    }
  }

  /**
   * Bell tone for perfect hits — clean and resonant
   */
  private playBell(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.76; // Inharmonic partial (bell-like)

    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.3;

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

    osc1.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    gain.connect(this.masterGain);
    if (this.reverb) gain.connect(this.reverb);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.7);
    osc2.stop(time + 0.7);
  }

  /**
   * Pluck for great hits — sharp attack, quick decay
   */
  private playPluck(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(freq * 8, time);
    filt.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.1);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  /**
   * Chime for good hits — soft and muted
   */
  private playChime(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Miss sound — dissonant buzz
   */
  playMiss() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 80 + Math.random() * 30;

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private createReverbIR(ctx: AudioContext, decay: number, duration: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buf;
  }

  dispose() {
    // Nodes are auto-garbage-collected when disconnected
  }
}
