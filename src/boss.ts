// ============================================================
// Neon Beats VR — Boss Battle Mode
// Musical duel against an AI opponent
// Boss sends attack patterns, player must match them
// Boss has health bar, defeated by sustained combos
// ============================================================

import type { Song, BeatEvent } from './audio';
import { Color } from '@iwsdk/core';

// ---- Boss Types ----

export interface BossConfig {
  id: string;
  name: string;
  title: string;
  health: number;
  color: string;
  attackPatterns: AttackPattern[];
  enrageThreshold: number;  // health % where boss gets harder
  bpm: number;
  duration: number;
}

export interface AttackPattern {
  name: string;
  beats: BeatEvent[];
  difficulty: number;
}

export interface BossState {
  active: boolean;
  config: BossConfig | null;
  health: number;
  maxHealth: number;
  phase: 'intro' | 'battle' | 'enraged' | 'defeated';
  currentAttack: number;
  attackTimer: number;
  playerDamage: number;   // damage dealt by sustained combos
  comboAccumulator: number;
  damagePerCombo: number;
  bossAttackCooldown: number;
}

// ---- Boss Definitions ----

export const BOSSES: BossConfig[] = [
  {
    id: 'dj-phantom',
    name: 'DJ Phantom',
    title: 'The Ghost of Rhythm Past',
    health: 1000,
    color: '#8866ff',
    attackPatterns: [],
    enrageThreshold: 0.3,
    bpm: 140,
    duration: 180,
  },
  {
    id: 'neon-serpent',
    name: 'Neon Serpent',
    title: 'Coiled in Light',
    health: 1500,
    color: '#00ff88',
    attackPatterns: [],
    enrageThreshold: 0.25,
    bpm: 155,
    duration: 200,
  },
  {
    id: 'void-maestro',
    name: 'Void Maestro',
    title: 'Conductor of Silence',
    health: 2000,
    color: '#ff0066',
    attackPatterns: [],
    enrageThreshold: 0.2,
    bpm: 170,
    duration: 240,
  },
];

// ---- Boss State Management ----

export function createBossState(): BossState {
  return {
    active: false,
    config: null,
    health: 0,
    maxHealth: 0,
    phase: 'intro',
    currentAttack: 0,
    attackTimer: 0,
    playerDamage: 0,
    comboAccumulator: 0,
    damagePerCombo: 2,
    bossAttackCooldown: 0,
  };
}

export function startBoss(state: BossState, bossId: string) {
  const boss = BOSSES.find(b => b.id === bossId);
  if (!boss) return;

  state.active = true;
  state.config = boss;
  state.health = boss.health;
  state.maxHealth = boss.health;
  state.phase = 'intro';
  state.currentAttack = 0;
  state.attackTimer = 0;
  state.playerDamage = 0;
  state.comboAccumulator = 0;
  state.bossAttackCooldown = 4;  // 4 seconds before first attack
}

export function updateBoss(state: BossState, dt: number, combo: number, misses: number): BossEvent | null {
  if (!state.active || !state.config) return null;

  // Intro phase
  if (state.phase === 'intro') {
    state.attackTimer += dt;
    if (state.attackTimer >= 3) {
      state.phase = 'battle';
      state.attackTimer = 0;
      return { type: 'phase_change', message: `${state.config.name} attacks!` };
    }
    return null;
  }

  // Player combo deals damage to boss
  if (combo > 0) {
    state.comboAccumulator += dt;
    if (state.comboAccumulator >= 0.5) {  // Every 0.5s of sustained combo
      const damage = Math.floor(combo * state.damagePerCombo * 0.1);
      state.health = Math.max(0, state.health - damage);
      state.playerDamage += damage;
      state.comboAccumulator = 0;

      // Check for enrage
      if (state.phase === 'battle' && state.health / state.maxHealth <= state.config.enrageThreshold) {
        state.phase = 'enraged';
        return { type: 'phase_change', message: `${state.config.name} is ENRAGED!` };
      }

      // Check for defeat
      if (state.health <= 0) {
        state.phase = 'defeated';
        state.active = false;
        return { type: 'defeated', message: `${state.config.name} DEFEATED!` };
      }
    }
  } else {
    state.comboAccumulator = 0;
  }

  // Boss attacks (sends harder patterns periodically)
  state.bossAttackCooldown -= dt;
  if (state.bossAttackCooldown <= 0) {
    const cooldown = state.phase === 'enraged' ? 3 : 5;
    state.bossAttackCooldown = cooldown;
    state.currentAttack++;

    return {
      type: 'attack',
      message: state.phase === 'enraged'
        ? `${state.config.name}: FURY BLAST!`
        : `${state.config.name}: Attack wave ${state.currentAttack}!`
    };
  }

  return null;
}

export function onBossMiss(state: BossState) {
  if (!state.active) return;
  // Boss heals slightly on player miss
  if (state.config) {
    state.health = Math.min(state.maxHealth, state.health + 10);
  }
}

export interface BossEvent {
  type: 'phase_change' | 'attack' | 'defeated';
  message: string;
}

// ---- Boss Song Generation ----

export function generateBossSong(boss: BossConfig, numLanes: number, difficulty: string): Song {
  const beats: BeatEvent[] = [];
  const beatDur = 60 / boss.bpm;
  let time = 3;  // 3s intro

  // Generate waves of increasing difficulty
  const numWaves = Math.ceil(boss.duration / 15);
  for (let wave = 0; wave < numWaves; wave++) {
    const waveEnd = time + 12;
    const density = 0.4 + wave * 0.05;
    const isAttackWave = wave % 3 === 2;

    let t = time;
    while (t < waveEnd && t < boss.duration - 2) {
      if (Math.random() < density) {
        const lane = Math.floor(Math.random() * numLanes);
        beats.push({
          time: t,
          lane,
          type: 'tap',
          duration: 0,
        });

        // Attack waves have doubles
        if (isAttackWave && Math.random() < 0.3) {
          const otherLane = (lane + 1 + Math.floor(Math.random() * (numLanes - 1))) % numLanes;
          beats.push({
            time: t,
            lane: otherLane,
            type: 'tap',
            duration: 0,
          });
        }
      }

      t += beatDur / (isAttackWave ? 2 : 1);
    }

    time = waveEnd + 3;  // gap between waves
  }

  return {
    name: boss.name,
    bpm: boss.bpm,
    duration: boss.duration,
    beats: beats.sort((a, b) => a.time - b.time),
  };
}

// ---- Boss HUD ----

let bossHUDEl: HTMLDivElement | null = null;

export function createBossHUD(): HTMLDivElement {
  if (bossHUDEl) return bossHUDEl;

  const el = document.createElement('div');
  el.id = 'boss-hud';
  el.style.cssText = `
    position: fixed; top: 15px; left: 50%; transform: translateX(-50%);
    width: 400px; max-width: 80vw; z-index: 80; pointer-events: none;
    font-family: monospace; text-align: center;
    display: none;
  `;
  el.innerHTML = `
    <div id="boss-name" style="color: #ff0066; font-size: 14px; margin-bottom: 4px; text-shadow: 0 0 5px #ff0066;">BOSS NAME</div>
    <div style="background: rgba(0,0,0,0.5); border: 1px solid #ff0066; border-radius: 3px; height: 10px; overflow: hidden;">
      <div id="boss-hp-bar" style="height: 100%; background: linear-gradient(90deg, #ff0066, #ff4488); width: 100%; transition: width 0.3s;"></div>
    </div>
    <div id="boss-phase" style="color: #888; font-size: 11px; margin-top: 2px;">BATTLE</div>
  `;
  document.body.appendChild(el);
  bossHUDEl = el;
  return el;
}

export function updateBossHUD(state: BossState) {
  if (!bossHUDEl || !state.config) return;

  const nameEl = bossHUDEl.querySelector('#boss-name') as HTMLElement;
  const hpBar = bossHUDEl.querySelector('#boss-hp-bar') as HTMLElement;
  const phaseEl = bossHUDEl.querySelector('#boss-phase') as HTMLElement;

  if (nameEl) {
    nameEl.textContent = `${state.config.name} — ${state.config.title}`;
    nameEl.style.color = state.config.color;
  }

  if (hpBar) {
    const pct = Math.max(0, (state.health / state.maxHealth) * 100);
    hpBar.style.width = `${pct}%`;
    if (state.phase === 'enraged') {
      hpBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4400)';
    }
  }

  if (phaseEl) {
    phaseEl.textContent = state.phase.toUpperCase();
    phaseEl.style.color = state.phase === 'enraged' ? '#ff0000' : '#888';
  }
}

export function showBossHUD() {
  if (bossHUDEl) bossHUDEl.style.display = 'block';
}

export function hideBossHUD() {
  if (bossHUDEl) bossHUDEl.style.display = 'none';
}
