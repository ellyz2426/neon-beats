// ============================================================
// Neon Beats VR — Pad/Atmosphere Synthesizer
// Ambient pads that play in the background during songs
// Adds depth and atmosphere to the procedural music
// ============================================================

let padCtx: AudioContext | null = null;
let padGain: GainNode | null = null;
let activePadOscs: OscillatorNode[] = [];
let padFilter: BiquadFilterNode | null = null;
let padReverb: ConvolverNode | null = null;

// Chord voicings for pads (semitone offsets from root)
const PAD_VOICINGS: Record<string, number[][]> = {
  minor7:  [[0, 3, 7, 10], [5, 8, 0, 3], [7, 10, 2, 5], [3, 7, 10, 0]],
  major7:  [[0, 4, 7, 11], [5, 9, 0, 4], [7, 11, 2, 4], [2, 5, 9, 0]],
  sus:     [[0, 5, 7, 12], [5, 10, 0, 5], [7, 0, 2, 7], [3, 8, 10, 3]],
  ambient: [[0, 7, 12, 19], [5, 12, 17, 24], [7, 14, 19, 26], [3, 10, 15, 22]],
};

export function initPadSynth(ctx: AudioContext, destination: AudioNode) {
  padCtx = ctx;
  padGain = ctx.createGain();
  padGain.gain.value = 0; // Start silent, will fade in
  
  // Warm lowpass filter
  padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 800;
  padFilter.Q.value = 0.5;
  
  padFilter.connect(padGain);
  padGain.connect(destination);
}

export function startPad(root: number, voicing: keyof typeof PAD_VOICINGS = 'minor7', volume: number = 0.08) {
  if (!padCtx || !padFilter || !padGain) return;
  
  stopPad(); // Clean up previous
  
  const chords = PAD_VOICINGS[voicing] || PAD_VOICINGS.minor7;
  const chord = chords[0]; // Start with first chord
  const now = padCtx.currentTime;
  
  // Fade in
  padGain.gain.setValueAtTime(0, now);
  padGain.gain.linearRampToValueAtTime(volume, now + 2);
  
  for (const interval of chord) {
    // Two detuned oscillators per note for warmth
    for (const detune of [-8, 8]) {
      const osc = padCtx.createOscillator();
      osc.type = 'sine'; // Pure sine for smooth pads
      osc.frequency.value = 440 * Math.pow(2, (root + interval - 69) / 12);
      osc.detune.value = detune;
      
      const noteGain = padCtx.createGain();
      noteGain.gain.value = 0.5 / chord.length; // Normalize
      
      osc.connect(noteGain);
      noteGain.connect(padFilter);
      osc.start(now);
      activePadOscs.push(osc);
    }
  }
}

export function changePadChord(root: number, chordIndex: number, voicing: keyof typeof PAD_VOICINGS = 'minor7') {
  if (!padCtx || !padFilter || activePadOscs.length === 0) return;
  
  const chords = PAD_VOICINGS[voicing] || PAD_VOICINGS.minor7;
  const chord = chords[chordIndex % chords.length];
  const now = padCtx.currentTime;
  
  // Smoothly crossfade to new chord
  let oscIndex = 0;
  for (const interval of chord) {
    for (const detune of [-8, 8]) {
      if (oscIndex < activePadOscs.length) {
        const osc = activePadOscs[oscIndex];
        const newFreq = 440 * Math.pow(2, (root + interval - 69) / 12);
        osc.frequency.setValueAtTime(osc.frequency.value, now);
        osc.frequency.linearRampToValueAtTime(newFreq, now + 0.5); // Smooth glide
        osc.detune.value = detune;
        oscIndex++;
      }
    }
  }
}

export function setPadFilter(frequency: number) {
  if (!padCtx || !padFilter) return;
  const now = padCtx.currentTime;
  padFilter.frequency.setValueAtTime(padFilter.frequency.value, now);
  padFilter.frequency.linearRampToValueAtTime(frequency, now + 0.2);
}

export function setPadVolume(volume: number) {
  if (!padGain || !padCtx) return;
  const now = padCtx.currentTime;
  padGain.gain.setValueAtTime(padGain.gain.value, now);
  padGain.gain.linearRampToValueAtTime(volume, now + 0.3);
}

export function stopPad() {
  if (!padCtx) return;
  const now = padCtx.currentTime;
  
  if (padGain) {
    padGain.gain.setValueAtTime(padGain.gain.value, now);
    padGain.gain.linearRampToValueAtTime(0, now + 1);
  }
  
  // Stop oscillators after fade out
  for (const osc of activePadOscs) {
    try {
      osc.stop(now + 1.5);
    } catch { /* already stopped */ }
  }
  activePadOscs = [];
}

// Update pad based on song progress (call from game loop)
export function updatePad(songTime: number, bpm: number, root: number, voicing: keyof typeof PAD_VOICINGS = 'minor7', beatIntensity: number = 0) {
  if (!padFilter || !padCtx) return;
  
  // Change chords every 4 bars (16 beats)
  const beatsPerChord = 16;
  const beatDuration = 60 / bpm;
  const currentBeat = Math.floor(songTime / beatDuration);
  const chordIndex = Math.floor(currentBeat / beatsPerChord);
  
  // Check if we need a chord change
  const prevBeat = Math.floor((songTime - 0.05) / beatDuration);
  const prevChordIndex = Math.floor(prevBeat / beatsPerChord);
  
  if (chordIndex !== prevChordIndex) {
    changePadChord(root, chordIndex, voicing);
  }
  
  // React filter to beat intensity
  const baseFreq = 600;
  const maxFreq = 1200;
  const targetFreq = baseFreq + beatIntensity * (maxFreq - baseFreq);
  setPadFilter(targetFreq);
}
