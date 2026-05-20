// ============================================================
// Neon Beats VR — Crowd & Audience Reactions
// Ambient crowd sounds that react to player performance
// Cheers on combos, gasps on misses, roars on perfect streaks
// ============================================================

import { initAudio } from './audio';

type CrowdMood = 'silent' | 'murmur' | 'excited' | 'roaring';

export class CrowdSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private mood: CrowdMood = 'silent';
  private targetMood: CrowdMood = 'silent';
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private enabled = true;
  private volume = 0.15;

  constructor() {}

  init() {
    this.ctx = initAudio();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Create noise buffer for crowd ambience
    const bufSize = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    // Brown noise (smoother, more crowd-like)
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }

  setEnabled(enabled: boolean) { this.enabled = enabled; }
  setVolume(v: number) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  /**
   * Update crowd mood based on combo and performance
   */
  updatePerformance(combo: number, health: number, maxHealth: number) {
    if (!this.enabled) {
      this.targetMood = 'silent';
      return;
    }

    if (combo >= 50) {
      this.targetMood = 'roaring';
    } else if (combo >= 20) {
      this.targetMood = 'excited';
    } else if (combo >= 5) {
      this.targetMood = 'murmur';
    } else {
      this.targetMood = 'silent';
    }
  }

  /**
   * Trigger a cheer (on combo milestones)
   */
  cheer() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    // Short crowd cheer: filtered noise burst
    if (!this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const gain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1200;
    filt.Q.value = 0.5;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.masterGain);
    src.start(this.ctx.currentTime);
    src.stop(this.ctx.currentTime + 0.8);
  }

  /**
   * Trigger a gasp (on miss during high combo)
   */
  gasp() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    if (!this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const gain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 2000;
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.masterGain);
    src.start(this.ctx.currentTime);
    src.stop(this.ctx.currentTime + 0.4);
  }

  startAmbient() {
    // Start quiet ambient murmur
    if (!this.ctx || !this.masterGain || !this.noiseBuf) return;
    this.stopAmbient();

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = this.noiseBuf;
    this.noiseNode.loop = true;

    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 400;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0;

    this.noiseNode.connect(filt);
    filt.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.noiseNode.start();
  }

  stopAmbient() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch {}
      this.noiseNode = null;
    }
    this.ambientGain = null;
  }

  update(dt: number) {
    if (!this.ambientGain) return;

    const moodGains: Record<CrowdMood, number> = {
      'silent': 0,
      'murmur': 0.05,
      'excited': 0.12,
      'roaring': 0.25,
    };

    const target = moodGains[this.targetMood];
    const current = this.ambientGain.gain.value;
    this.ambientGain.gain.value = current + (target - current) * Math.min(1, dt * 2);
  }

  dispose() {
    this.stopAmbient();
  }
}
