// ============================================================
// Neon Beats VR — Enhanced Sound Effects
// Hit sounds with variety and miss sound pool
// Combo milestone sounds, bomb warning, slide sounds
// ============================================================

import { initAudio } from './audio';

// ---- Sound Effects Pool ----

export class SFXPool {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.3;

  init() {
    this.ctx = initAudio();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  /**
   * Miss sound variety (pick from 4 different miss sounds)
   */
  playMissVariant(variant: number = -1) {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;
    const v = variant >= 0 ? variant % 4 : Math.floor(Math.random() * 4);

    switch (v) {
      case 0: this.playBuzz(time, 80, 0.12); break;
      case 1: this.playBuzz(time, 60, 0.15); break;
      case 2: this.playDescending(time); break;
      case 3: this.playStaticBurst(time); break;
    }
  }

  /**
   * Combo milestone celebration
   */
  playComboMilestone(combo: number) {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;

    // Rising arpeggio
    const notes = [261.63, 329.63, 392, 523.25, 659.26];
    const count = Math.min(5, Math.floor(combo / 25) + 2);

    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[i % notes.length];
      gain.gain.setValueAtTime(0, time + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, time + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.25);
    }
  }

  /**
   * Bomb warning sound
   */
  playBombWarning() {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, time + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time + i * 0.15);
      osc.stop(time + i * 0.15 + 0.12);
    }
  }

  /**
   * Slide start sound
   */
  playSlideStart() {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.linearRampToValueAtTime(600, time + 0.2);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  /**
   * Game over sound
   */
  playGameOver() {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;

    const notes = [440, 415.3, 392, 349.23, 329.63];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.2, time + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.2 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time + i * 0.2);
      osc.stop(time + i * 0.2 + 0.4);
    }
  }

  /**
   * Victory fanfare
   */
  playVictory() {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;

    const notes = [261.63, 329.63, 392, 523.25];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[i];

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = notes[i] * 1.5;
      const gain2 = this.ctx.createGain();
      gain2.gain.value = 0.1;

      gain.gain.setValueAtTime(0, time + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, time + i * 0.15 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.5);

      osc.connect(gain);
      osc2.connect(gain2);
      gain2.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time + i * 0.15);
      osc2.start(time + i * 0.15);
      osc.stop(time + i * 0.15 + 0.6);
      osc2.stop(time + i * 0.15 + 0.6);
    }
  }

  // ---- Internal sound generators ----

  private playBuzz(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  private playDescending(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playStaticBurst(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufSize = this.ctx.sampleRate * 0.05;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    src.connect(gain);
    gain.connect(this.masterGain!);
    src.start(time);
  }
}
