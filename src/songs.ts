// ============================================================
// Neon Beats VR — Song Library
// Pre-designed songs with procedural generation
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
}

export const SONG_LIBRARY: SongInfo[] = [
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
];

const songCache = new Map<string, Song>();

export function getSong(id: string, numLanes: number = 4): Song {
  const key = `${id}-${numLanes}`;
  if (songCache.has(key)) return songCache.get(key)!;

  const info = SONG_LIBRARY.find(s => s.id === id);
  if (!info) throw new Error(`Song not found: ${id}`);

  const song = generateSong(info.name, info.bpm, info.difficulty, info.duration, numLanes);
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
