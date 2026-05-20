// ============================================================
// Neon Beats VR — Advanced Song Generation
// Better musical structure with phrases, patterns, drops
// ============================================================

import type { BeatEvent, Song } from './audio';

// Chord progressions (semitone offsets from root)
const PROGRESSIONS = {
  dark:     [[0, 3, 7], [5, 8, 0], [7, 10, 2], [3, 7, 10]],   // i - iv - v - bIII
  driving:  [[0, 4, 7], [5, 9, 0], [7, 11, 2], [5, 9, 0]],    // I - IV - V - IV
  epic:     [[0, 3, 7], [8, 0, 3], [5, 8, 0], [7, 10, 2]],    // i - bVI - iv - v
  tension:  [[0, 3, 7], [1, 4, 8], [3, 7, 10], [5, 8, 0]],    // i - bII - bIII - iv
};

interface PhraseConfig {
  bars: number;
  density: number;
  hasKick: boolean;
  hasSnare: boolean;
  hasHihat: boolean;
  hasBass: boolean;
  hasMelody: boolean;
  hasArp: boolean;
  beatDensity: number; // for gameplay blocks
  dropFeel: boolean;
}

// Song structure templates
const STRUCTURES: Record<string, PhraseConfig[]> = {
  buildup: [
    { bars: 4, density: 0.3, hasKick: false, hasSnare: false, hasHihat: true, hasBass: false, hasMelody: false, hasArp: true, beatDensity: 0.2, dropFeel: false },
    { bars: 4, density: 0.5, hasKick: true, hasSnare: false, hasHihat: true, hasBass: true, hasMelody: false, hasArp: true, beatDensity: 0.35, dropFeel: false },
    { bars: 8, density: 0.8, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: false, beatDensity: 0.6, dropFeel: true },
    { bars: 4, density: 0.4, hasKick: false, hasSnare: false, hasHihat: true, hasBass: true, hasMelody: true, hasArp: true, beatDensity: 0.3, dropFeel: false },
    { bars: 8, density: 0.9, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: false, beatDensity: 0.75, dropFeel: true },
    { bars: 4, density: 0.6, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: false, beatDensity: 0.4, dropFeel: false },
  ],
  intense: [
    { bars: 4, density: 0.6, hasKick: true, hasSnare: false, hasHihat: true, hasBass: true, hasMelody: false, hasArp: true, beatDensity: 0.4, dropFeel: false },
    { bars: 8, density: 0.9, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: false, beatDensity: 0.7, dropFeel: true },
    { bars: 4, density: 0.5, hasKick: true, hasSnare: false, hasHihat: true, hasBass: true, hasMelody: true, hasArp: true, beatDensity: 0.3, dropFeel: false },
    { bars: 8, density: 1.0, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: true, beatDensity: 0.85, dropFeel: true },
    { bars: 4, density: 0.7, hasKick: true, hasSnare: true, hasHihat: true, hasBass: true, hasMelody: true, hasArp: false, beatDensity: 0.5, dropFeel: false },
  ],
};

function getStructure(difficulty: string): PhraseConfig[] {
  if (difficulty === 'easy' || difficulty === 'medium') return STRUCTURES.buildup;
  return STRUCTURES.intense;
}

// ---- Improved Beat Generation ----

export function generateStructuredBeats(
  bpm: number,
  duration: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert',
  numLanes: number
): BeatEvent[] {
  const beats: BeatEvent[] = [];
  const beatDur = 60 / bpm;
  const structure = getStructure(difficulty);
  let time = 2.0; // 2s lead-in

  // Difficulty modifiers
  const holdChance = difficulty === 'easy' ? 0.03 : difficulty === 'medium' ? 0.08 : difficulty === 'hard' ? 0.12 : 0.15;
  const doubleChance = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 0.05 : difficulty === 'hard' ? 0.12 : 0.2;
  const tripletChance = difficulty === 'expert' ? 0.08 : 0;

  let phraseIndex = 0;
  while (time < duration - 2) {
    const phrase = structure[phraseIndex % structure.length];
    const phraseDuration = phrase.bars * 4 * beatDur;
    const phraseEnd = Math.min(time + phraseDuration, duration - 2);

    // Generate beats for this phrase
    const subdivision = phrase.dropFeel ? 2 : 1; // 8th notes during drops, quarters otherwise
    const stepDur = beatDur / subdivision;
    let t = time;
    let lastLane = -1;
    let patternCounter = 0;

    while (t < phraseEnd) {
      const shouldSpawn = Math.random() < phrase.beatDensity;
      if (shouldSpawn) {
        // Create interesting patterns
        let lane: number;
        if (phrase.dropFeel && patternCounter % 4 === 0) {
          // Rhythmic pattern during drops - alternating lanes
          lane = (patternCounter / 4) % numLanes;
        } else {
          // Avoid same lane too often
          do {
            lane = Math.floor(Math.random() * numLanes);
          } while (lane === lastLane && Math.random() < 0.6);
        }
        lastLane = lane;

        let type: 'tap' | 'hold' | 'double' = 'tap';
        if (Math.random() < holdChance && t + beatDur * 2 < phraseEnd) {
          type = 'hold';
        } else if (Math.random() < doubleChance) {
          type = 'double';
        }

        beats.push({
          time: t,
          lane,
          type,
          holdDuration: type === 'hold' ? beatDur * (1 + Math.floor(Math.random() * 3)) : undefined,
        });

        // Double tap: add second lane
        if (type === 'double') {
          let lane2: number;
          do {
            lane2 = Math.floor(Math.random() * numLanes);
          } while (lane2 === lane);
          beats.push({ time: t, lane: lane2, type: 'tap' });
        }

        // Triplet bursts (expert)
        if (Math.random() < tripletChance) {
          const tripletLane = (lane + 1) % numLanes;
          beats.push({ time: t + stepDur / 3, lane: tripletLane, type: 'tap' });
          beats.push({ time: t + stepDur * 2 / 3, lane: (tripletLane + 1) % numLanes, type: 'tap' });
        }
      }

      t += stepDur;
      patternCounter++;
    }

    time = phraseEnd;
    phraseIndex++;
  }

  return beats.sort((a, b) => a.time - b.time);
}

// ---- Improved Drum Generation ----

export function generateStructuredDrums(
  bpm: number,
  duration: number,
  difficulty: string
): { kick: boolean[]; snare: boolean[]; hihat: boolean[] } {
  const structure = getStructure(difficulty);
  const beatDur = 60 / bpm;
  const stepDur = beatDur / 4; // 16th notes
  const totalSteps = Math.ceil(duration / stepDur);

  const kick: boolean[] = new Array(totalSteps).fill(false);
  const snare: boolean[] = new Array(totalSteps).fill(false);
  const hihat: boolean[] = new Array(totalSteps).fill(false);

  let step = 0;
  let phraseIndex = 0;

  while (step < totalSteps) {
    const phrase = structure[phraseIndex % structure.length];
    const phraseSteps = phrase.bars * 16;
    const phraseEnd = Math.min(step + phraseSteps, totalSteps);

    for (let s = step; s < phraseEnd; s++) {
      const localStep = (s - step) % 16;

      if (phrase.hasKick) {
        // Four-on-the-floor with variations
        if (localStep === 0 || localStep === 8) kick[s] = true;
        if (phrase.dropFeel && (localStep === 6 || localStep === 14)) kick[s] = Math.random() < 0.4;
      }

      if (phrase.hasSnare) {
        if (localStep === 4 || localStep === 12) snare[s] = true;
        if (phrase.dropFeel && localStep === 10) snare[s] = Math.random() < 0.3;
      }

      if (phrase.hasHihat) {
        if (phrase.dropFeel) {
          hihat[s] = localStep % 2 === 0;
          if (localStep % 4 === 2) hihat[s] = Math.random() < 0.7; // offbeat variation
        } else {
          hihat[s] = localStep % 4 === 0; // quarter notes
        }
      }
    }

    step = phraseEnd;
    phraseIndex++;
  }

  return { kick, snare, hihat };
}

// ---- Improved Bass Generation ----

export function generateStructuredBass(
  bpm: number,
  duration: number,
  root: number,
  difficulty: string
): number[] {
  const structure = getStructure(difficulty);
  const beatDur = 60 / bpm;
  const totalBeats = Math.ceil(duration / beatDur);
  const bass: number[] = new Array(totalBeats).fill(0);

  const progression = difficulty === 'hard' || difficulty === 'expert' ? PROGRESSIONS.dark : PROGRESSIONS.driving;

  let beat = 0;
  let phraseIndex = 0;

  while (beat < totalBeats) {
    const phrase = structure[phraseIndex % structure.length];
    const phraseBeats = phrase.bars * 4;
    const phraseEnd = Math.min(beat + phraseBeats, totalBeats);

    if (phrase.hasBass) {
      for (let b = beat; b < phraseEnd; b++) {
        const localBeat = (b - beat) % 4;
        const chord = progression[Math.floor((b - beat) / 4) % progression.length];
        const noteFreq = 440 * Math.pow(2, (root + chord[0] - 69) / 12) / 4; // 2 octaves down

        if (phrase.dropFeel) {
          // Driving 8th note bass during drops
          bass[b] = noteFreq;
        } else {
          // Half notes during build
          if (localBeat === 0 || localBeat === 2) bass[b] = noteFreq;
        }
      }
    }

    beat = phraseEnd;
    phraseIndex++;
  }

  return bass;
}

// ---- Improved Melody ----

const PENTATONIC_MINOR = [0, 3, 5, 7, 10];
const BLUES_SCALE = [0, 3, 5, 6, 7, 10];

export function generateStructuredMelody(
  bpm: number,
  duration: number,
  root: number,
  difficulty: string
): number[] {
  const structure = getStructure(difficulty);
  const stepDur = 60 / bpm / 2; // 8th notes
  const totalSteps = Math.ceil(duration / stepDur);
  const melody: number[] = new Array(totalSteps).fill(0);
  const scale = difficulty === 'hard' || difficulty === 'expert' ? BLUES_SCALE : PENTATONIC_MINOR;

  let step = 0;
  let phraseIndex = 0;
  let prevNoteIdx = 2;

  while (step < totalSteps) {
    const phrase = structure[phraseIndex % structure.length];
    const phraseSteps = phrase.bars * 8;
    const phraseEnd = Math.min(step + phraseSteps, totalSteps);

    if (phrase.hasMelody || phrase.hasArp) {
      for (let s = step; s < phraseEnd; s++) {
        const localStep = s - step;
        let shouldPlay = false;

        if (phrase.hasMelody) {
          // Melodic phrases - play on strong beats with occasional fills
          shouldPlay = localStep % 4 === 0 || (localStep % 2 === 0 && Math.random() < 0.3);
        }
        if (phrase.hasArp) {
          // Arpeggio - continuous 8th notes
          shouldPlay = shouldPlay || Math.random() < 0.7;
        }

        if (shouldPlay) {
          // Step-wise motion with occasional leaps
          const leap = Math.random() < 0.2;
          if (leap) {
            prevNoteIdx = Math.floor(Math.random() * scale.length);
          } else {
            prevNoteIdx = Math.max(0, Math.min(scale.length - 1,
              prevNoteIdx + (Math.random() < 0.5 ? 1 : -1)));
          }
          const interval = scale[prevNoteIdx];
          const octave = phrase.hasArp ? 5 : 4;
          melody[s] = 440 * Math.pow(2, (root + interval - 69 + (octave - 4) * 12) / 12);
        }
      }
    }

    step = phraseEnd;
    phraseIndex++;
  }

  return melody;
}
