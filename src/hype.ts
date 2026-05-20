// ============================================================
// Neon Beats VR — Combo Hype System
// Visual intensity scales with combo
// ============================================================

import { Color } from '@iwsdk/core';

export interface ComboHypeLevel {
  name: string;
  minCombo: number;
  envColor: Color;
  particleMultiplier: number;
  shakeMultiplier: number;
  speedLineIntensity: number;
  bgPulseIntensity: number;
}

const HYPE_LEVELS: ComboHypeLevel[] = [
  {
    name: '', minCombo: 0,
    envColor: new Color(0x222244),
    particleMultiplier: 1, shakeMultiplier: 1,
    speedLineIntensity: 0.2, bgPulseIntensity: 0.3,
  },
  {
    name: 'WARMING UP', minCombo: 10,
    envColor: new Color(0x002244),
    particleMultiplier: 1.2, shakeMultiplier: 1.1,
    speedLineIntensity: 0.4, bgPulseIntensity: 0.4,
  },
  {
    name: 'HEATING UP', minCombo: 25,
    envColor: new Color(0x004444),
    particleMultiplier: 1.5, shakeMultiplier: 1.2,
    speedLineIntensity: 0.6, bgPulseIntensity: 0.5,
  },
  {
    name: 'ON FIRE', minCombo: 50,
    envColor: new Color(0x224400),
    particleMultiplier: 2, shakeMultiplier: 1.4,
    speedLineIntensity: 0.8, bgPulseIntensity: 0.6,
  },
  {
    name: 'BLAZING', minCombo: 75,
    envColor: new Color(0x443300),
    particleMultiplier: 2.5, shakeMultiplier: 1.5,
    speedLineIntensity: 1.0, bgPulseIntensity: 0.7,
  },
  {
    name: 'INFERNO', minCombo: 100,
    envColor: new Color(0x440022),
    particleMultiplier: 3, shakeMultiplier: 1.7,
    speedLineIntensity: 1.2, bgPulseIntensity: 0.8,
  },
  {
    name: 'SUPERNOVA', minCombo: 150,
    envColor: new Color(0x440044),
    particleMultiplier: 4, shakeMultiplier: 2,
    speedLineIntensity: 1.5, bgPulseIntensity: 1.0,
  },
  {
    name: 'TRANSCENDENT', minCombo: 200,
    envColor: new Color(0x444400),
    particleMultiplier: 5, shakeMultiplier: 2.5,
    speedLineIntensity: 2, bgPulseIntensity: 1.2,
  },
];

export function getHypeLevel(combo: number): ComboHypeLevel {
  let level = HYPE_LEVELS[0];
  for (const l of HYPE_LEVELS) {
    if (combo >= l.minCombo) level = l;
    else break;
  }
  return level;
}

export function getHypeLevelIndex(combo: number): number {
  let idx = 0;
  for (let i = 0; i < HYPE_LEVELS.length; i++) {
    if (combo >= HYPE_LEVELS[i].minCombo) idx = i;
    else break;
  }
  return idx;
}

let lastHypeIndex = 0;

export function checkHypeLevelChange(combo: number): { changed: boolean; level: ComboHypeLevel; direction: 'up' | 'down' | 'none' } {
  const idx = getHypeLevelIndex(combo);
  if (idx !== lastHypeIndex) {
    const dir = idx > lastHypeIndex ? 'up' : 'down';
    lastHypeIndex = idx;
    return { changed: true, level: HYPE_LEVELS[idx], direction: dir };
  }
  return { changed: false, level: HYPE_LEVELS[idx], direction: 'none' };
}

export function resetHypeLevel() {
  lastHypeIndex = 0;
}
