// ============================================================
// Neon Beats VR — Song Library
// Pre-designed songs with procedural generation
// Per-song difficulty override support
// ============================================================

import { generateSong, type Song } from './audio';

export interface SongInfo {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  color: string; // Primary neon color
  description: string;
  unlockCondition?: string; // What unlocks this song
}

export const SONG_LIBRARY: SongInfo[] = [
  // --- Original 7 songs ---
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    artist: 'SynthGrid',
    bpm: 120,
    duration: 90,
    difficulty: 'easy',
    color: '#00ffff',
    description: 'Warm up with this chill synthwave groove',
  },
  {
    id: 'digital-rush',
    name: 'Digital Rush',
    artist: 'ByteWave',
    bpm: 130,
    duration: 100,
    difficulty: 'medium',
    color: '#ff00ff',
    description: 'Pick up the pace with driving beats',
  },
  {
    id: 'circuit-breaker',
    name: 'Circuit Breaker',
    artist: 'VoltLine',
    bpm: 140,
    duration: 110,
    difficulty: 'medium',
    color: '#ff6600',
    description: 'Electrifying rhythms that test your reflexes',
  },
  {
    id: 'laser-storm',
    name: 'Laser Storm',
    artist: 'PhotonX',
    bpm: 150,
    duration: 100,
    difficulty: 'hard',
    color: '#ff0066',
    description: 'Intense patterns in a storm of light',
  },
  {
    id: 'quantum-flux',
    name: 'Quantum Flux',
    artist: 'HyperNode',
    bpm: 160,
    duration: 90,
    difficulty: 'hard',
    color: '#9933ff',
    description: 'Reality bends at 160 BPM',
  },
  {
    id: 'void-protocol',
    name: 'Void Protocol',
    artist: 'DarkSync',
    bpm: 170,
    duration: 100,
    difficulty: 'expert',
    color: '#ff0000',
    description: 'Only the fastest survive the void',
  },
  {
    id: 'infinite-loop',
    name: 'Infinite Loop',
    artist: 'RecurSys',
    bpm: 180,
    duration: 120,
    difficulty: 'expert',
    color: '#ffff00',
    description: 'The ultimate test — endless recursion',
  },

  // --- New songs ---
  {
    id: 'midnight-drive',
    name: 'Midnight Drive',
    artist: 'RetroWave',
    bpm: 95,
    duration: 120,
    difficulty: 'easy',
    color: '#4488ff',
    description: 'A slow, atmospheric cruise through neon streets',
  },
  {
    id: 'crystal-rain',
    name: 'Crystal Rain',
    artist: 'GlassHarp',
    bpm: 108,
    duration: 100,
    difficulty: 'easy',
    color: '#66ffdd',
    description: 'Gentle cascading melodies like falling crystals',
  },
  {
    id: 'electric-heart',
    name: 'Electric Heart',
    artist: 'PulseCode',
    bpm: 145,
    duration: 95,
    difficulty: 'hard',
    color: '#ff3388',
    description: 'Feel the beat pulsing through your veins',
  },
  {
    id: 'data-storm',
    name: 'Data Storm',
    artist: 'BinaryGhost',
    bpm: 190,
    duration: 80,
    difficulty: 'expert',
    color: '#ff8800',
    description: 'Blazing fast — prepare for sensory overload',
  },

  // --- More songs: varied genres & tempos ---
  {
    id: 'starlight-waltz',
    name: 'Starlight Waltz',
    artist: 'CosmicDust',
    bpm: 100,
    duration: 130,
    difficulty: 'easy',
    color: '#aaccff',
    description: 'A gentle 3/4 drift through the cosmos',
  },
  {
    id: 'neon-samurai',
    name: 'Neon Samurai',
    artist: 'KatanaByte',
    bpm: 135,
    duration: 105,
    difficulty: 'medium',
    color: '#ff2244',
    description: 'Sharp precision cuts at a warrior\'s pace',
  },
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    artist: 'SubOcean',
    bpm: 85,
    duration: 140,
    difficulty: 'easy',
    color: '#0066cc',
    description: 'Ambient underwater vibes at 85 BPM',
  },
  {
    id: 'chrome-fury',
    name: 'Chrome Fury',
    artist: 'MetalGrid',
    bpm: 175,
    duration: 85,
    difficulty: 'expert',
    color: '#cccccc',
    description: 'Relentless industrial beats at breakneck speed',
  },
  {
    id: 'pixel-paradise',
    name: 'Pixel Paradise',
    artist: '8BitCloud',
    bpm: 115,
    duration: 100,
    difficulty: 'easy',
    color: '#44ff44',
    description: 'Chiptune-inspired melodies in a retro dreamscape',
  },
  {
    id: 'thunder-pulse',
    name: 'Thunder Pulse',
    artist: 'StormCore',
    bpm: 155,
    duration: 95,
    difficulty: 'hard',
    color: '#ffdd00',
    description: 'Feel the electricity crackle through every beat',
  },
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    artist: 'ShadowNet',
    bpm: 125,
    duration: 115,
    difficulty: 'medium',
    color: '#8866ff',
    description: 'Mysterious sequences that appear and vanish',
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    artist: 'HelioSync',
    bpm: 165,
    duration: 90,
    difficulty: 'hard',
    color: '#ff9900',
    description: 'Explosive eruptions of rhythm and light',
  },
  {
    id: 'zero-gravity',
    name: 'Zero Gravity',
    artist: 'VoidFloat',
    bpm: 110,
    duration: 120,
    difficulty: 'medium',
    color: '#33ddff',
    description: 'Weightless grooves floating in space',
  },
  {
    id: 'cyber-dragon',
    name: 'Cyber Dragon',
    artist: 'DragonByte',
    bpm: 185,
    duration: 95,
    difficulty: 'expert',
    color: '#ff3300',
    description: 'Breathe fire at 185 BPM — the dragon awakens',
  },
  {
    id: 'aurora-dreams',
    name: 'Aurora Dreams',
    artist: 'NorthLight',
    bpm: 92,
    duration: 150,
    difficulty: 'easy',
    color: '#44ffaa',
    description: 'Slow, shimmering patterns like the northern lights',
  },
  {
    id: 'hyperdrive',
    name: 'Hyperdrive',
    artist: 'WarpEngine',
    bpm: 200,
    duration: 75,
    difficulty: 'expert',
    color: '#ffffff',
    description: 'Maximum velocity. Hold on tight.',
  },
];

const songCache = new Map<string, Song>();

// Get a song, optionally overriding its native difficulty
export function getSong(id: string, numLanes: number = 4, difficultyOverride?: string): Song {
  const info = SONG_LIBRARY.find(s => s.id === id);
  if (!info) throw new Error(`Song not found: ${id}`);

  const difficulty = (difficultyOverride || info.difficulty) as 'easy' | 'medium' | 'hard' | 'expert';
  const key = `${id}-${numLanes}-${difficulty}`;
  if (songCache.has(key)) return songCache.get(key)!;

  const song = generateSong(info.name, info.bpm, difficulty, info.duration, numLanes);
  songCache.set(key, song);
  return song;
}

export function getSongInfo(id: string): SongInfo | undefined {
  return SONG_LIBRARY.find(s => s.id === id);
}

export function getDifficultyColor(diff: string): string {
  switch (diff) {
    case 'easy': return '#00ff88';
    case 'medium': return '#ffcc00';
    case 'hard': return '#ff6600';
    case 'expert': return '#ff0044';
    default: return '#ffffff';
  }
}

export function getDifficultyLabel(diff: string): string {
  switch (diff) {
    case 'easy': return 'EASY';
    case 'medium': return 'MEDIUM';
    case 'hard': return 'HARD';
    case 'expert': return 'EXPERT';
    default: return diff.toUpperCase();
  }
}

export const ALL_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;

// Clear cached songs (useful when changing difficulty)
export function clearSongCache() {
  songCache.clear();
}

// Get the default difficulty for a song
export function getDefaultDifficulty(id: string): string {
  const info = SONG_LIBRARY.find(s => s.id === id);
  return info?.difficulty || 'medium';
}
