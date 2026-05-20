// ============================================================
// Neon Beats VR — Main Entry Point (v0.3)
// Full game with modifiers, stats, visualizers, tunnel rings
// ============================================================

import {
  World,
  Color,
  AmbientLight,
  PointLight,
  Fog,
  Group,
  Vector3,
} from '@iwsdk/core';
import {
  createEnvironment,
  updateEnvironment,
  updateHitMarkerFlash,
  flashHitMarker,
  LANE_COLORS,
  HIT_ZONE_Z,
  LANE_SPACING,
} from './environment';
import { BlockManager, type ActiveBlock } from './blocks';
import {
  createInitialState,
  resetGameplay,
  getHitQuality,
  scoreHit,
  scoreMiss,
  getAccuracy,
  getGrade,
  saveHighScore,
  loadAllHighScores,
  type GameState,
} from './game';
import { getSong, getSongInfo, SONG_LIBRARY } from './songs';
import {
  initAudio,
  startMusic,
  stopMusic,
  getMusicTime,
  playHitSound,
  playMissSound,
  playComboSound,
  playCountdownBeep,
  playMenuSelect,
  type Song,
} from './audio';
import {
  ParticleSystem,
  HitFlashManager,
  ScreenShake,
  ComboPopupManager,
  BackgroundPulse,
  createLaneFlashEffect,
} from './effects';
import { SpeedLineManager, BeatPulseManager, StreakFire } from './trails';
import { WaveformVisualizer, TunnelRingManager } from './visualizer';
import {
  createHUD,
  updateHUD,
  showTimingFeedback,
  flashLaneKey,
  showHUD,
  hideHUD,
  type HUDElements,
} from './hud';
import {
  showTitleScreen,
  hideTitleScreen,
  showSongSelectScreen,
  hideSongSelectScreen,
  showCountdown,
  hideCountdown,
  showResultsScreen,
  hideResultsScreen,
  showPauseOverlay,
  hidePauseOverlay,
} from './ui';
import {
  createEndlessState,
  generateNextPhase,
  getEndlessDifficultyLabel,
  getEndlessPhaseColor,
  type EndlessState,
} from './endless';
import {
  createDefaultModifiers,
  getScoreMultiplier,
  loadStats,
  updateStatsAfterSong,
  type Modifiers,
  type PlayerStats,
} from './modifiers';
import {
  loadAchievements,
  checkAchievements,
  queueAchievementNotification,
  type Achievement,
  type AchievementContext,
} from './achievements';
import { calculateStars } from './rating';
import {
  showModifiersScreen,
  hideModifiersScreen,
  showStatsScreen,
  hideStatsScreen,
} from './screens';
import { TitleVisuals, FPSCounter, getComboColor } from './titlevisuals';
import { getHypeLevel, checkHypeLevelChange, resetHypeLevel } from './hype';
import { NeonTubeSystem, HolodeckHorizon } from './neontubes';

// ---- Globals ----
const container = document.getElementById('scene-container') as HTMLDivElement;
let world: World;
let state: GameState;
let hud: HUDElements;
let environment: Group;
let blockContainer: Group;
let effectsGroup: Group;
let blockManager: BlockManager;
let particles: ParticleSystem;
let hitFlash: HitFlashManager;
let screenShake: ScreenShake;
let comboPopups: ComboPopupManager;
let bgPulse: BackgroundPulse;
let speedLines: SpeedLineManager;
let beatPulse: BeatPulseManager;
let streakFire: StreakFire;
let waveformLeft: WaveformVisualizer;
let waveformRight: WaveformVisualizer;
let tunnelRings: TunnelRingManager;
let laneFlashes: { mesh: any; update: (dt: number) => boolean }[] = [];
let currentSong: Song | null = null;
let nextBeatIndex = 0;
let paused = false;
let pauseStartTime = 0;
let totalPausedTime = 0;
let lastFrameTime = 0;
let beatIntensity = 0;
let lastBeatTime = 0;
let endlessState: EndlessState;
let sceneLight1: PointLight;
let sceneLight2: PointLight;
let modifiers: Modifiers;
let playerStats: PlayerStats;
let songStartRealTime = 0;
let autoPlayIndex = 0;
let achievements: Achievement[];
let titleVisuals: TitleVisuals;
let fpsCounter: FPSCounter;
let neonTubes: NeonTubeSystem;
let holoHorizon: HolodeckHorizon;

// Key mapping
const LANE_KEYS_4 = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
let laneKeys = LANE_KEYS_4;
const keyState = new Map<string, boolean>();

// ---- Init ----

async function init() {
  let xrAvailable = false;
  try {
    if ((navigator as any).xr) {
      xrAvailable = await (navigator as any).xr.isSessionSupported('immersive-vr');
    }
  } catch {}

  world = await World.create(container, {
    xr: xrAvailable,
    render: {
      near: 0.01,
      far: 200,
      camera: {
        position: [0, 1.6, 0],
        lookAt: [0, 1.0, HIT_ZONE_Z],
      },
    },
    input: {
      canvasPointerEvents: !xrAvailable,
    },
    features: {
      grabbing: xrAvailable,
      locomotion: xrAvailable ? true : { browserControls: false },
      physics: false,
      spatialUI: false,
    },
  });

  // Scene setup
  world.scene.fog = new Fog(0x000008, 8, 35);
  world.scene.add(new AmbientLight(0x222244, 0.4));

  sceneLight1 = new PointLight(0x00ffff, 2.5, 20);
  sceneLight1.position.set(0, 5, HIT_ZONE_Z);
  world.scene.add(sceneLight1);

  sceneLight2 = new PointLight(0xff00ff, 2, 20);
  sceneLight2.position.set(0, 3, HIT_ZONE_Z - 12);
  world.scene.add(sceneLight2);

  // State
  state = createInitialState();
  state.highScores = loadAllHighScores();
  endlessState = createEndlessState();
  modifiers = createDefaultModifiers();
  playerStats = loadStats();
  achievements = loadAchievements();

  // Title visuals & FPS
  titleVisuals = new TitleVisuals();
  fpsCounter = new FPSCounter();

  // Neon decorations
  neonTubes = new NeonTubeSystem(effectsGroup);
  holoHorizon = new HolodeckHorizon(effectsGroup);

  // Environment
  environment = createEnvironment(state.numLanes);
  world.scene.add(environment);

  // Blocks
  blockContainer = new Group();
  blockContainer.name = 'blocks';
  world.scene.add(blockContainer);

  // Effects
  effectsGroup = new Group();
  effectsGroup.name = 'effects';
  world.scene.add(effectsGroup);

  particles = new ParticleSystem(effectsGroup);
  hitFlash = new HitFlashManager(effectsGroup);
  screenShake = new ScreenShake();
  comboPopups = new ComboPopupManager();
  bgPulse = new BackgroundPulse();
  speedLines = new SpeedLineManager(effectsGroup);
  beatPulse = new BeatPulseManager(effectsGroup);
  streakFire = new StreakFire(effectsGroup);
  tunnelRings = new TunnelRingManager(effectsGroup);

  // Waveform visualizers
  waveformLeft = new WaveformVisualizer(effectsGroup, 'left', 24);
  waveformRight = new WaveformVisualizer(effectsGroup, 'right', 24);

  // HUD
  hud = createHUD(state.numLanes);
  hideHUD(hud);

  // Block manager
  blockManager = new BlockManager(blockContainer, state.numLanes);
  laneKeys = LANE_KEYS_4;

  setupInput();
  showTitle();

  lastFrameTime = performance.now();
  world.onUpdate(gameLoop);
}

// ---- Input ----

function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (keyState.get(e.code)) return;
    keyState.set(e.code, true);

    if (state.phase === 'playing' && !paused) {
      const laneIndex = laneKeys.indexOf(e.code);
      if (laneIndex >= 0 && !modifiers.autoPlay) {
        handleLaneHit(laneIndex);
      }
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    } else if (state.phase === 'playing' && paused) {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keyState.set(e.code, false);
  });

  container.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'playing' || paused || modifiers.autoPlay) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const lane = Math.floor(x * state.numLanes);
    if (lane >= 0 && lane < state.numLanes) {
      handleLaneHit(lane);
    }
  });
}

// ---- Phase Management ----

function showTitle() {
  state.phase = 'title';
  hideHUD(hud);
  hideSongSelectScreen();
  hideResultsScreen();
  hideModifiersScreen();
  hideStatsScreen();
  showTitleScreen(() => {
    titleVisuals.stop();
    hideTitleScreen();
    showSongSelect();
  });
  titleVisuals.start();
}

function showSongSelect() {
  state.phase = 'songSelect';
  state.endless = false;
  showSongSelectScreen(
    state.selectedSongIndex,
    state.highScores,
    (songId: string) => {
      if (songId === 'endless') {
        state.endless = true;
        state.songId = 'endless';
      } else if (songId === '_modifiers') {
        hideSongSelectScreen();
        showModifiersScreen(modifiers,
          (newMods) => { modifiers = newMods; hideModifiersScreen(); showSongSelect(); },
          () => { hideModifiersScreen(); showSongSelect(); }
        );
        return;
      } else if (songId === '_stats') {
        hideSongSelectScreen();
        showStatsScreen(playerStats, () => { hideStatsScreen(); showSongSelect(); });
        return;
      } else {
        state.songId = songId;
      }
      hideSongSelectScreen();
      startCountdown();
    },
    () => {
      hideSongSelectScreen();
      showTitle();
    }
  );
}

function startCountdown() {
  state.phase = 'countdown';
  resetGameplay(state);
  blockManager.clear();
  particles.clear();
  hitFlash.clear();
  comboPopups.clear();
  speedLines.clear();
  beatPulse.clear();
  streakFire.clear();
  tunnelRings.clear();
  laneFlashes = [];
  nextBeatIndex = 0;
  autoPlayIndex = 0;
  totalPausedTime = 0;
  resetHypeLevel();

  // Apply modifiers
  if (modifiers.noFail) state.maxHealth = 999;

  if (state.endless) {
    endlessState = createEndlessState(modifiers.halfSpeed ? 80 : 120);
    const { song } = generateNextPhase(endlessState, state.numLanes);
    currentSong = song;
    state.songDuration = 9999;
  } else {
    currentSong = getSong(state.songId, state.numLanes);
    state.songDuration = currentSong.duration;
    state.totalNotes = currentSong.beats.length;
  }

  // Mirror modifier
  if (modifiers.mirror && currentSong) {
    currentSong.beats = currentSong.beats.map(b => ({
      ...b,
      lane: state.numLanes - 1 - b.lane,
    }));
  }

  let count = 3;
  showCountdown(count);
  initAudio();
  playCountdownBeep(false);

  const countInterval = setInterval(() => {
    count--;
    hideCountdown();
    if (count > 0) {
      showCountdown(count);
      playCountdownBeep(false);
    } else if (count === 0) {
      showCountdown(0);
      playCountdownBeep(true);
    } else {
      clearInterval(countInterval);
      hideCountdown();
      startPlaying();
    }
  }, 800);
}

function startPlaying() {
  state.phase = 'playing';
  paused = false;
  showHUD(hud);
  speedLines.setActive(true);
  tunnelRings.setActive(true);
  songStartRealTime = performance.now();
  if (currentSong) startMusic(currentSong);
}

function finishSong() {
  state.phase = 'results';
  stopMusic();
  hideHUD(hud);
  blockManager.clear();
  speedLines.setActive(false);
  speedLines.clear();
  tunnelRings.setActive(false);
  tunnelRings.clear();

  const playTime = (performance.now() - songStartRealTime) / 1000;
  const cleared = state.health > 0;

  // Update persistent stats
  playerStats = updateStatsAfterSong(
    playerStats, state.score, state.perfects, state.greats, state.goods,
    state.misses, state.maxCombo, playTime, state.songId, cleared
  );

  // Check achievements at song end
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  const achCtx: AchievementContext = {
    totalScore: playerStats.totalScore,
    bestCombo: playerStats.bestCombo,
    totalPerfects: playerStats.totalPerfects,
    totalSongsCleared: playerStats.totalSongsCleared,
    totalPlayTime: playerStats.totalPlayTime,
    currentCombo: state.maxCombo,
    currentScore: state.score,
    currentPerfects: state.perfects,
    accuracy,
    grade,
    songDifficulty: getSongInfo(state.songId)?.difficulty || '',
    endlessPhase: endlessState.phase,
  };
  const newAch = checkAchievements(achievements, achCtx);
  for (const a of newAch) queueAchievementNotification(a);

  if (state.endless) {
    const fakeSongInfo = {
      id: 'endless', name: 'ENDLESS MODE', artist: 'Infinite',
      bpm: endlessState.bpm,
      duration: Math.floor(endlessState.totalElapsed),
      difficulty: 'expert' as const,
      color: getEndlessPhaseColor(endlessState.phase),
      description: `Survived ${endlessState.phase} phases`,
    };
    const isNew = saveHighScore('endless', state.score);
    if (isNew) state.highScores.set('endless', state.score);
    showResultsScreen(state, fakeSongInfo, isNew,
      () => { hideResultsScreen(); startCountdown(); },
      () => { hideResultsScreen(); showSongSelect(); }
    );
  } else {
    const songInfo = getSongInfo(state.songId)!;
    const isNew = saveHighScore(state.songId, state.score);
    if (isNew) state.highScores.set(state.songId, state.score);
    showResultsScreen(state, songInfo, isNew,
      () => { hideResultsScreen(); startCountdown(); },
      () => { hideResultsScreen(); showSongSelect(); }
    );
  }
}

function togglePause() {
  if (state.phase !== 'playing') return;
  paused = !paused;
  if (paused) {
    pauseStartTime = performance.now();
    stopMusic();
    speedLines.setActive(false);
    tunnelRings.setActive(false);
    showPauseOverlay(
      () => togglePause(),
      () => {
        paused = false;
        hidePauseOverlay();
        stopMusic();
        blockManager.clear();
        hideHUD(hud);
        speedLines.setActive(false);
        tunnelRings.setActive(false);
        showSongSelect();
      }
    );
  } else {
    totalPausedTime += performance.now() - pauseStartTime;
    hidePauseOverlay();
    speedLines.setActive(true);
    tunnelRings.setActive(true);
    if (currentSong) startMusic(currentSong);
  }
}

// ---- Lane Hit Logic ----

function handleLaneHit(lane: number) {
  if (!currentSong) return;
  const songTime = getMusicTime();
  const result = blockManager.tryHitLane(lane, songTime);
  flashLaneKey(hud, lane, !!result);

  if (result) {
    const quality = getHitQuality(result.timeDiff);
    if (quality === 'miss') { handleMiss(result.block); return; }

    // Apply score multiplier from modifiers
    const origScore = state.score;
    scoreHit(state, quality);
    const gained = state.score - origScore;
    const modMult = getScoreMultiplier(modifiers);
    if (modMult !== 1) {
      state.score = origScore + Math.round(gained * modMult);
    }

    playHitSound(quality);
    showTimingFeedback(hud, quality);

    // Visuals (hype-aware)
    const hype = getHypeLevel(state.combo);
    const pos = result.block.mesh.position.clone();
    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const basePCount = quality === 'perfect' ? 30 : quality === 'great' ? 18 : 10;
    const pCount = Math.round(basePCount * hype.particleMultiplier);
    particles.emit(pos, color, pCount, quality === 'perfect' ? 5 : 3);
    hitFlash.flash(pos, color, quality);
    flashHitMarker(environment, lane, quality === 'perfect' ? '#ffffff' : color.getStyle());

    const lf = createLaneFlashEffect(lane, state.numLanes, color);
    world.scene.add(lf.mesh);
    laneFlashes.push(lf);

    if (quality === 'perfect') beatPulse.pulse(color);
    if (state.combo > 10) {
      const totalWidth = (state.numLanes - 1) * LANE_SPACING;
      const x = -totalWidth / 2 + lane * LANE_SPACING;
      streakFire.emit(x, color);
    }

    if (state.combo > 0 && state.combo % 25 === 0) {
      playComboSound(state.combo);
      comboPopups.show(`${state.combo} COMBO!`, '#ffff00');
      screenShake.trigger(0.6);
      bgPulse.pulse('#ffff00', 0.8);
    } else if (state.combo > 0 && state.combo % 10 === 0) {
      comboPopups.show(`×${state.multiplier}`, '#ff00ff', 50, 45);
    }

    if (quality === 'perfect') {
      screenShake.trigger(0.12);
      bgPulse.pulse(color.getStyle(), 0.3);
    }

    blockManager.removeBlock(result.block);

    // Check hype level change
    const hypeChange = checkHypeLevelChange(state.combo);
    if (hypeChange.changed && hypeChange.direction === 'up' && hypeChange.level.name) {
      comboPopups.show(hypeChange.level.name, getComboColor(state.combo), 50, 28);
    }

    // Check achievements on combo milestones
    if (state.combo % 10 === 0) {
      const achCtx: AchievementContext = {
        totalScore: playerStats.totalScore,
        bestCombo: Math.max(playerStats.bestCombo, state.maxCombo),
        totalPerfects: playerStats.totalPerfects + state.perfects,
        totalSongsCleared: playerStats.totalSongsCleared,
        totalPlayTime: playerStats.totalPlayTime,
        currentCombo: state.combo,
        currentScore: state.score,
        currentPerfects: state.perfects,
        accuracy: getAccuracy(state),
        grade: '',
        songDifficulty: getSongInfo(state.songId)?.difficulty || '',
        endlessPhase: endlessState.phase,
      };
      const newAch = checkAchievements(achievements, achCtx);
      for (const a of newAch) queueAchievementNotification(a);
    }
  }
}

function handleMiss(block: ActiveBlock) {
  if (modifiers.noFail) {
    state.combo = 0;
    state.multiplier = 1;
    state.misses++;
  } else {
    scoreMiss(state);
  }
  playMissSound();
  showTimingFeedback(hud, 'miss');
  screenShake.trigger(0.25);
  bgPulse.pulse('#ff0044', 0.4);
}

// ---- Game Loop ----

function gameLoop() {
  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  if (state.phase !== 'playing' || paused) {
    updateEnvironment(environment, now / 1000, 0);
    particles.update(dt);
    hitFlash.update(dt);
    comboPopups.update(dt);
    speedLines.update(dt, 0.1);
    beatPulse.update(dt);
    streakFire.update(dt);
    tunnelRings.update(dt, 0);
    waveformLeft.update(dt, 0, now / 1000);
    waveformRight.update(dt, 0, now / 1000);
    neonTubes.update(now / 1000, 0, 1);
    holoHorizon.update(now / 1000, 0);
    fpsCounter.update();
    return;
  }

  const songTime = getMusicTime();
  state.songTime = songTime;

  // Beat detection
  if (currentSong) {
    const beatDuration = 60 / currentSong.bpm;
    const beatPhase = (songTime % beatDuration) / beatDuration;
    beatIntensity = Math.max(0, 1 - beatPhase * 3);

    const currentBeat = Math.floor(songTime / beatDuration);
    if (currentBeat !== lastBeatTime) {
      lastBeatTime = currentBeat;
      const pulseColor = LANE_COLORS[currentBeat % LANE_COLORS.length];
      sceneLight1.color.copy(pulseColor);
      sceneLight1.intensity = 4;
    }
  }

  sceneLight1.intensity = Math.max(2.5, sceneLight1.intensity * 0.95);

  // Spawn blocks
  if (currentSong) {
    const spawnAhead = 2.5;
    while (nextBeatIndex < currentSong.beats.length) {
      const beat = currentSong.beats[nextBeatIndex];
      if (beat.time - songTime > spawnAhead) break;
      blockManager.spawnBlock(beat, songTime);
      nextBeatIndex++;
    }

    // Endless: generate next phase
    if (state.endless && nextBeatIndex >= currentSong.beats.length - 5) {
      const { song } = generateNextPhase(endlessState, state.numLanes);
      currentSong.beats.push(...song.beats);
      comboPopups.show(`PHASE ${endlessState.phase}`, getEndlessPhaseColor(endlessState.phase), 50, 25);
      comboPopups.show(getEndlessDifficultyLabel(endlessState), '#ffffff', 50, 32);
    }
  }

  // Auto-play
  if (modifiers.autoPlay && currentSong) {
    while (autoPlayIndex < currentSong.beats.length) {
      const beat = currentSong.beats[autoPlayIndex];
      if (beat.time > songTime + 0.02) break;
      if (beat.time >= songTime - 0.02) {
        handleLaneHit(beat.lane);
      }
      autoPlayIndex++;
    }
  }

  // Update blocks (apply hidden/fadeIn modifiers)
  const missed = blockManager.update(songTime, dt);
  for (const block of missed) {
    if (!modifiers.autoPlay) handleMiss(block);
  }

  // Update visuals
  updateEnvironment(environment, now / 1000, beatIntensity);
  updateHitMarkerFlash(environment, state.numLanes);
  particles.update(dt);
  hitFlash.update(dt);
  screenShake.update(dt);
  comboPopups.update(dt);
  speedLines.update(dt, beatIntensity + (state.combo > 10 ? 0.3 : 0));
  beatPulse.update(dt);
  streakFire.update(dt);
  tunnelRings.update(dt, beatIntensity);
  waveformLeft.update(dt, beatIntensity, songTime);
  waveformRight.update(dt, beatIntensity, songTime);
  neonTubes.update(songTime, beatIntensity, state.multiplier);
  holoHorizon.update(songTime, beatIntensity);

  // Lane flashes
  for (let i = laneFlashes.length - 1; i >= 0; i--) {
    if (!laneFlashes[i].update(dt)) {
      world.scene.remove(laneFlashes[i].mesh);
      laneFlashes.splice(i, 1);
    }
  }

  // Screen shake
  if (!world.isInXR) {
    environment.position.x = screenShake.offset.x;
    environment.position.y = screenShake.offset.y;
    blockContainer.position.x = screenShake.offset.x;
    blockContainer.position.y = screenShake.offset.y;
  }

  // HUD
  const songName = state.endless ?
    `∞ Phase ${endlessState.phase} • ${endlessState.bpm} BPM` :
    getSongInfo(state.songId)?.name || '';
  updateHUD(hud, state.score, state.combo, state.multiplier, state.health,
    state.maxHealth, state.endless ? 1 : (currentSong ? songTime / currentSong.duration : 0), songName);

  // Game over / complete
  if (state.health <= 0 && !modifiers.noFail) { finishSong(); return; }
  if (!state.endless && currentSong && songTime >= currentSong.duration + 1) finishSong();
  fpsCounter.update();
}

// ---- Start ----
init().catch(console.error);
