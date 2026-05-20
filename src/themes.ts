// ============================================================
// Neon Beats VR — Background Visual Themes
// Multiple holodeck visual themes with distinct color palettes
// and environment modifications
// ============================================================

import { Color, Fog } from '@iwsdk/core';
import type { ThemeId } from './settings';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;

  // Colors
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientColor: number;
  ambientIntensity: number;
  light1Color: number;
  light2Color: number;
  gridColor: string;
  wallColor: string;
  floorOpacity: number;

  // Lane colors (can override defaults)
  laneColors?: string[];

  // Background gradient for UI screens
  bgGradientInner: string;
  bgGradientOuter: string;

  // Neon tube colors
  tubeColor1: string;
  tubeColor2: string;
  tubeColor3: string;

  // Particle colors
  particleColors: string[];

  // Skybox tint
  skyTint: number;

  // Beat pulse base color
  beatPulseColor: string;

  // Speed line color
  speedLineColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  neon: {
    id: 'neon',
    name: 'Neon',
    description: 'Classic cyberpunk neon aesthetic',
    fogColor: 0x000008,
    fogNear: 8,
    fogFar: 35,
    ambientColor: 0x222244,
    ambientIntensity: 0.4,
    light1Color: 0x00ffff,
    light2Color: 0xff00ff,
    gridColor: '#00ffff',
    wallColor: '#ff00ff',
    floorOpacity: 0.15,
    bgGradientInner: 'rgba(10,5,30,0.95)',
    bgGradientOuter: 'rgba(0,0,0,0.98)',
    tubeColor1: '#00ffff',
    tubeColor2: '#ff00ff',
    tubeColor3: '#ffff00',
    particleColors: ['#00ffff', '#ff00ff', '#ffff00', '#ff0066'],
    skyTint: 0x050510,
    beatPulseColor: '#00ffff',
    speedLineColor: '#00ffff',
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Dark red and orange dystopian city vibes',
    fogColor: 0x0a0005,
    fogNear: 6,
    fogFar: 30,
    ambientColor: 0x331111,
    ambientIntensity: 0.3,
    light1Color: 0xff2200,
    light2Color: 0xff6600,
    gridColor: '#ff4400',
    wallColor: '#ff2200',
    floorOpacity: 0.12,
    bgGradientInner: 'rgba(30,5,5,0.95)',
    bgGradientOuter: 'rgba(0,0,0,0.98)',
    tubeColor1: '#ff2200',
    tubeColor2: '#ff6600',
    tubeColor3: '#ffaa00',
    particleColors: ['#ff2200', '#ff6600', '#ffaa00', '#ff0066'],
    skyTint: 0x100505,
    beatPulseColor: '#ff4400',
    speedLineColor: '#ff6600',
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea bioluminescent glow',
    fogColor: 0x000a14,
    fogNear: 10,
    fogFar: 40,
    ambientColor: 0x112244,
    ambientIntensity: 0.5,
    light1Color: 0x0088ff,
    light2Color: 0x00ffaa,
    gridColor: '#0066cc',
    wallColor: '#004488',
    floorOpacity: 0.1,
    bgGradientInner: 'rgba(5,15,30,0.95)',
    bgGradientOuter: 'rgba(0,0,5,0.98)',
    tubeColor1: '#0088ff',
    tubeColor2: '#00ffaa',
    tubeColor3: '#00ccff',
    particleColors: ['#0088ff', '#00ffaa', '#00ccff', '#66ddff'],
    skyTint: 0x010a14,
    beatPulseColor: '#00aaff',
    speedLineColor: '#0088ff',
  },

  space: {
    id: 'space',
    name: 'Space',
    description: 'Deep purple cosmic nebula',
    fogColor: 0x080010,
    fogNear: 12,
    fogFar: 45,
    ambientColor: 0x220044,
    ambientIntensity: 0.35,
    light1Color: 0x9933ff,
    light2Color: 0xff33cc,
    gridColor: '#6600cc',
    wallColor: '#4400aa',
    floorOpacity: 0.08,
    bgGradientInner: 'rgba(15,5,30,0.95)',
    bgGradientOuter: 'rgba(0,0,5,0.98)',
    tubeColor1: '#9933ff',
    tubeColor2: '#ff33cc',
    tubeColor3: '#cc66ff',
    particleColors: ['#9933ff', '#ff33cc', '#cc66ff', '#ff99ff'],
    skyTint: 0x080010,
    beatPulseColor: '#9933ff',
    speedLineColor: '#cc66ff',
  },

  sakura: {
    id: 'sakura',
    name: 'Sakura',
    description: 'Soft pink cherry blossom spring',
    fogColor: 0x100810,
    fogNear: 10,
    fogFar: 38,
    ambientColor: 0x332233,
    ambientIntensity: 0.45,
    light1Color: 0xff88cc,
    light2Color: 0xffaadd,
    gridColor: '#ff66aa',
    wallColor: '#cc4488',
    floorOpacity: 0.1,
    bgGradientInner: 'rgba(25,10,20,0.95)',
    bgGradientOuter: 'rgba(5,0,5,0.98)',
    tubeColor1: '#ff88cc',
    tubeColor2: '#ffaadd',
    tubeColor3: '#ff66aa',
    particleColors: ['#ff88cc', '#ffaadd', '#ff66aa', '#ffccee'],
    skyTint: 0x100810,
    beatPulseColor: '#ff88cc',
    speedLineColor: '#ffaadd',
  },

  inferno: {
    id: 'inferno',
    name: 'Inferno',
    description: 'Blazing flames and molten metal',
    fogColor: 0x120400,
    fogNear: 10,
    fogFar: 35,
    ambientColor: 0x331100,
    ambientIntensity: 0.3,
    light1Color: 0xff4400,
    light2Color: 0xff8800,
    gridColor: '#ff3300',
    wallColor: '#cc2200',
    floorOpacity: 0.12,
    bgGradientInner: 'rgba(25,5,0,0.95)',
    bgGradientOuter: 'rgba(10,0,0,0.98)',
    tubeColor1: '#ff4400',
    tubeColor2: '#ff8800',
    tubeColor3: '#ffcc00',
    particleColors: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'],
    skyTint: 0x120400,
    beatPulseColor: '#ff4400',
    speedLineColor: '#ff8800',
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic',
    description: 'Ice cold crystalline blue',
    fogColor: 0x040810,
    fogNear: 12,
    fogFar: 40,
    ambientColor: 0x112233,
    ambientIntensity: 0.5,
    light1Color: 0x88ccff,
    light2Color: 0xaaddff,
    gridColor: '#4488cc',
    wallColor: '#336699',
    floorOpacity: 0.1,
    bgGradientInner: 'rgba(5,10,20,0.95)',
    bgGradientOuter: 'rgba(0,2,8,0.98)',
    tubeColor1: '#88ccff',
    tubeColor2: '#aaddff',
    tubeColor3: '#66aadd',
    particleColors: ['#88ccff', '#aaddff', '#ffffff', '#66aadd'],
    skyTint: 0x040810,
    beatPulseColor: '#88ccff',
    speedLineColor: '#aaddff',
  },

  synthwave: {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Classic 80s retrowave sunset',
    fogColor: 0x0a0418,
    fogNear: 10,
    fogFar: 36,
    ambientColor: 0x220044,
    ambientIntensity: 0.35,
    light1Color: 0xff00ff,
    light2Color: 0xff6600,
    gridColor: '#ff00ff',
    wallColor: '#cc00cc',
    floorOpacity: 0.12,
    bgGradientInner: 'rgba(20,5,30,0.95)',
    bgGradientOuter: 'rgba(5,0,10,0.98)',
    tubeColor1: '#ff00ff',
    tubeColor2: '#ff6600',
    tubeColor3: '#ff0066',
    particleColors: ['#ff00ff', '#ff6600', '#ff0066', '#cc00ff'],
    skyTint: 0x0a0418,
    beatPulseColor: '#ff00ff',
    speedLineColor: '#ff6600',
  },

  void: {
    id: 'void',
    name: 'Void',
    description: 'Deep nothingness — minimal and dark',
    fogColor: 0x000000,
    fogNear: 8,
    fogFar: 25,
    ambientColor: 0x080808,
    ambientIntensity: 0.15,
    light1Color: 0x444444,
    light2Color: 0x222222,
    gridColor: '#222222',
    wallColor: '#111111',
    floorOpacity: 0.05,
    bgGradientInner: 'rgba(5,5,5,0.98)',
    bgGradientOuter: 'rgba(0,0,0,1)',
    tubeColor1: '#333333',
    tubeColor2: '#555555',
    tubeColor3: '#111111',
    particleColors: ['#333333', '#555555', '#222222', '#444444'],
    skyTint: 0x000000,
    beatPulseColor: '#444444',
    speedLineColor: '#333333',
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Emerald green bioluminescent grove',
    fogColor: 0x001a08,
    fogNear: 10,
    fogFar: 38,
    ambientColor: 0x003300,
    ambientIntensity: 0.4,
    light1Color: 0x00ff44,
    light2Color: 0x88ff00,
    gridColor: '#00cc33',
    wallColor: '#009922',
    floorOpacity: 0.1,
    bgGradientInner: 'rgba(0,15,5,0.95)',
    bgGradientOuter: 'rgba(0,5,0,0.98)',
    tubeColor1: '#00ff44',
    tubeColor2: '#88ff00',
    tubeColor3: '#00cc66',
    particleColors: ['#00ff44', '#88ff00', '#00cc66', '#44ff88'],
    skyTint: 0x001a08,
    beatPulseColor: '#00ff44',
    speedLineColor: '#88ff00',
  },
};

export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES[id] || THEMES.neon;
}

export function createFogForTheme(theme: ThemeConfig): Fog {
  return new Fog(theme.fogColor, theme.fogNear, theme.fogFar);
}

export function getThemeList(): { id: ThemeId; name: string; description: string; color: string }[] {
  return Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    color: t.tubeColor1,
  }));
}

// Interpolate between two theme configs for smooth transitions
export function lerpThemeColor(from: number, to: number, t: number): number {
  const fr = (from >> 16) & 0xff, fg = (from >> 8) & 0xff, fb = from & 0xff;
  const tr = (to >> 16) & 0xff, tg = (to >> 8) & 0xff, tb = to & 0xff;
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return (r << 16) | (g << 8) | b;
}

// Get all theme IDs
export function getThemeIds(): ThemeId[] {
  return Object.keys(THEMES) as ThemeId[];
}
