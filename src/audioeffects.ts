// ============================================================
// Neon Beats VR — Audio Effects Chain
// Reverb, delay, compressor for richer synthwave sound
// ============================================================

let effectsInitialized = false;
let reverbNode: ConvolverNode | null = null;
let delayNode: DelayNode | null = null;
let delayFeedback: GainNode | null = null;
let compressorNode: DynamicsCompressorNode | null = null;
let reverbGain: GainNode | null = null;
let delayGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let effectsOutput: GainNode | null = null;

// Reverb amount 0-1
let reverbAmount = 0.3;
// Delay amount 0-1
let delayAmount = 0.15;

export function initAudioEffects(ctx: AudioContext, destination: AudioNode): GainNode {
  if (effectsInitialized && effectsOutput) return effectsOutput;

  // Create effect nodes
  compressorNode = ctx.createDynamicsCompressor();
  compressorNode.threshold.value = -18;
  compressorNode.knee.value = 12;
  compressorNode.ratio.value = 4;
  compressorNode.attack.value = 0.005;
  compressorNode.release.value = 0.1;

  // Reverb
  reverbNode = ctx.createConvolver();
  reverbNode.buffer = createReverbIR(ctx, 1.8, 3.0); // 1.8s decay, 3s length
  reverbGain = ctx.createGain();
  reverbGain.gain.value = reverbAmount;

  // Delay
  delayNode = ctx.createDelay(1.0);
  delayNode.delayTime.value = 0.375; // Synced to ~160bpm quarter note
  delayFeedback = ctx.createGain();
  delayFeedback.gain.value = 0.35;
  delayGain = ctx.createGain();
  delayGain.gain.value = delayAmount;

  // Wire delay feedback loop
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayGain);

  // Dry signal
  dryGain = ctx.createGain();
  dryGain.gain.value = 0.7;

  // Effects input/output
  effectsOutput = ctx.createGain();
  effectsOutput.gain.value = 1.0;

  // Route: input -> [dry, reverb, delay] -> compressor -> destination
  dryGain.connect(compressorNode);
  reverbGain.connect(compressorNode);
  delayGain.connect(compressorNode);
  compressorNode.connect(effectsOutput);
  effectsOutput.connect(destination);

  effectsInitialized = true;
  return effectsOutput;
}

export function getEffectsInput(ctx: AudioContext): { dry: GainNode; reverb: ConvolverNode; delay: DelayNode } | null {
  if (!dryGain || !reverbNode || !delayNode) return null;
  return { dry: dryGain, reverb: reverbNode, delay: delayNode };
}

// Connect a source through the effects chain
export function connectWithEffects(source: AudioNode) {
  if (!dryGain || !reverbNode || !delayNode) {
    // Fallback: no effects
    return;
  }
  source.connect(dryGain);
  source.connect(reverbNode);
  reverbNode.connect(reverbGain!);
  source.connect(delayNode);
}

export function setReverbAmount(amount: number) {
  reverbAmount = Math.max(0, Math.min(1, amount));
  if (reverbGain) reverbGain.gain.value = reverbAmount;
}

export function setDelayAmount(amount: number) {
  delayAmount = Math.max(0, Math.min(1, amount));
  if (delayGain) delayGain.gain.value = delayAmount;
}

export function setDelayTime(time: number) {
  if (delayNode) delayNode.delayTime.value = Math.max(0.05, Math.min(1.0, time));
}

export function setDelayFeedback(feedback: number) {
  if (delayFeedback) delayFeedback.gain.value = Math.max(0, Math.min(0.9, feedback));
}

export function syncDelayToBPM(bpm: number, subdivision: number = 4) {
  // subdivision: 4 = quarter note, 8 = eighth note, etc.
  const delayTime = 60 / bpm / (subdivision / 4);
  setDelayTime(Math.min(1.0, delayTime));
}

// Generate synthetic impulse response for reverb
function createReverbIR(ctx: AudioContext, decay: number, length: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * length);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;

      // Exponential decay with early reflections
      let envelope = Math.exp(-t / decay);

      // Add some early reflections
      if (t < 0.05) {
        envelope += 0.3 * Math.exp(-t / 0.01);
      }
      if (t > 0.02 && t < 0.08) {
        envelope += 0.15 * Math.exp(-(t - 0.03) / 0.02);
      }

      // Diffusion
      const noise = (Math.random() * 2 - 1);
      data[i] = noise * envelope;

      // Add some subtle modulation
      data[i] *= 1 + 0.02 * Math.sin(t * 3.14 * 2);
    }
  }

  return buffer;
}

// Create a sidechain compression effect (for that pumping sound)
export function createSidechainPump(ctx: AudioContext, bpm: number, targetGain: GainNode) {
  const beatDuration = 60 / bpm;
  let lastBeatTime = 0;

  return {
    update(currentTime: number) {
      const beatPhase = (currentTime % beatDuration) / beatDuration;
      // Quick attack, slow release pumping
      const pump = beatPhase < 0.1
        ? 1 - (beatPhase / 0.1) * 0.3
        : 0.7 + (beatPhase - 0.1) / 0.9 * 0.3;
      targetGain.gain.value = pump;
    },

    setBPM(newBPM: number) {
      // nothing to store, recalculated dynamically
    },
  };
}

// Distortion curve for overdrive effects
export function createDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = amount * 50;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Stereo widener effect
export class StereoWidener {
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private delayL: DelayNode;
  private delayR: DelayNode;

  constructor(ctx: AudioContext, widthMs: number = 0.3) {
    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);
    this.delayL = ctx.createDelay(0.05);
    this.delayR = ctx.createDelay(0.05);

    const widthSec = widthMs / 1000;
    this.delayL.delayTime.value = widthSec;
    this.delayR.delayTime.value = 0;

    this.splitter.connect(this.delayL, 0);
    this.splitter.connect(this.delayR, 1);
    this.delayL.connect(this.merger, 0, 0);
    this.delayR.connect(this.merger, 0, 1);
  }

  get input(): ChannelSplitterNode { return this.splitter; }
  get output(): ChannelMergerNode { return this.merger; }

  setWidth(ms: number) {
    this.delayL.delayTime.value = ms / 1000;
  }
}

// Filter sweep for transitions
export function createFilterSweep(
  ctx: AudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  startTime: number
): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(startFreq, startTime);
  filter.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  filter.Q.value = 2;
  return filter;
}

// Chorus effect
export class ChorusEffect {
  private input_: GainNode;
  private output_: GainNode;

  constructor(ctx: AudioContext, rate: number = 1.5, depth: number = 0.002) {
    this.input_ = ctx.createGain();
    this.output_ = ctx.createGain();

    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;

    const delay1 = ctx.createDelay(0.1);
    delay1.delayTime.value = 0.005;
    const delay2 = ctx.createDelay(0.1);
    delay2.delayTime.value = 0.007;

    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = rate;
    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.value = depth;
    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(delay1.delayTime);
    lfo1.start();

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = rate * 1.1;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = depth * 0.8;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(delay2.delayTime);
    lfo2.start();

    this.input_.connect(dry);
    this.input_.connect(delay1);
    this.input_.connect(delay2);
    dry.connect(this.output_);
    delay1.connect(wet);
    delay2.connect(wet);
    wet.connect(this.output_);
  }

  get input(): GainNode { return this.input_; }
  get output(): GainNode { return this.output_; }
}
