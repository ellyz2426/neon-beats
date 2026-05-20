// ============================================================
// Neon Beats VR — Main Entry Point
// Complete game loop with all systems integrated
// ============================================================

import {
  World,
  Color,
  AmbientLight,
  PointLight,
  DirectionalLight,
  Fog,
  Group,
  Vector3,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
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
  saveHighScore,
  loadAllHighScores,
  type GameState,
  type GamePhase,
} from './game';
import { getSong, getSongInfo, SONG_LIBRARY } from './songs';
import {
  initAudio,
  startMusic,
  stopMusic,
  getMusicTime,
  isMusicPlaying,
  playHitSound,
  playMissSound,
  playComboSound,
  playCountdownBeep,
  playMenuSelect,
  type BeatEvent,
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

// ---- Key mapping ----
const LANE_KEYS_4 = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
const LANE_KEYS_5 = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];
let laneKeys = LANE_KEYS_4;
const keyState = new Map<string, boolean>();

// ---- Init ----

async function init() {
  // Detect XR availability
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

  const ambientLight = new AmbientLight(0x222244, 0.4);
  world.scene.add(ambientLight);

  sceneLight1 = new PointLight(0x00ffff, 2.5, 20);
  sceneLight1.position.set(0, 5, HIT_ZONE_Z);
  world.scene.add(sceneLight1);

  sceneLight2 = new PointLight(0xff00ff, 2, 20);
  sceneLight2.position.set(0, 3, HIT_ZONE_Z - 12);
  world.scene.add(sceneLight2);

  // Create state
  state = createInitialState();
  state.highScores = loadAllHighScores();
  endlessState = createEndlessState();

  // Create environment
  environment = createEnvironment(state.numLanes);
  world.scene.add(environment);

  // Block container
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

  // Create HUD
  hud = createHUD(state.numLanes);
  hideHUD(hud);

  // Block manager
  blockManager = new BlockManager(blockContainer, state.numLanes);
  laneKeys = state.numLanes === 4 ? LANE_KEYS_4 : LANE_KEYS_5;

  // Input handlers
  setupInput();

  // Start at title screen
  showTitle();

  // Game loop
  lastFrameTime = performance.now();
  world.onUpdate(gameLoop);
}

// ---- Input ----

function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (keyState.get(e.code)) return; // prevent repeat
    keyState.set(e.code, true);

    if (state.phase === 'playing' && !paused) {
      const laneIndex = laneKeys.indexOf(e.code);
      if (laneIndex >= 0) {
        handleLaneHit(laneIndex);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
      // Escape also pauses
      if (e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    } else if (state.phase === 'playing' && paused) {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    }

    // Title screen - any key starts
    if (state.phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
      hideTitleScreen();
      showSongSelect();
    }
  });

  window.addEventListener('keyup', (e) => {
    keyState.set(e.code, false);
  });

  // Mouse/touch click - hit the closest lane
  container.addEventListener('pointerdown', (e) => {
    if (state.phase !== 'playing' || paused) return;
    // Map click position to lane
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const numLanes = state.numLanes;
    const lane = Math.floor(x * numLanes);
    if (lane >= 0 && lane < numLanes) {
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
  showTitleScreen(() => {
    hideTitleScreen();
    showSongSelect();
  });
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
  laneFlashes = [];
  nextBeatIndex = 0;
  totalPausedTime = 0;

  if (state.endless) {
    endlessState = createEndlessState(120);
    const { song } = generateNextPhase(endlessState, state.numLanes);
    currentSong = song;
    state.songDuration = 9999;
    state.totalNotes = 0;
  } else {
    currentSong = getSong(state.songId, state.numLanes);
    state.songDuration = currentSong.duration;
    state.totalNotes = currentSong.beats.length;
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
  if (currentSong) {
    startMusic(currentSong);
  }
}

function finishSong() {
  state.phase = 'results';
  stopMusic();
  hideHUD(hud);
  blockManager.clear();
  speedLines.setActive(false);
  speedLines.clear();

  if (state.endless) {
    const fakeSongInfo = {
      id: 'endless',
      name: 'ENDLESS MODE',
      artist: 'Infinite',
      bpm: endlessState.bpm,
      duration: Math.floor(endlessState.totalElapsed),
      difficulty: 'expert' as const,
      color: getEndlessPhaseColor(endlessState.phase),
      description: `Survived ${endlessState.phase} phases`,
    };

    const isNew = saveHighScore('endless', state.score);
    if (isNew) state.highScores.set('endless', state.score);

    showResultsScreen(
      state,
      fakeSongInfo,
      isNew,
      () => { hideResultsScreen(); startCountdown(); },
      () => { hideResultsScreen(); showSongSelect(); }
    );
  } else {
    const songInfo = getSongInfo(state.songId)!;
    const isNew = saveHighScore(state.songId, state.score);
    if (isNew) state.highScores.set(state.songId, state.score);

    showResultsScreen(
      state,
      songInfo,
      isNew,
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
    showPauseOverlay(
      () => { togglePause(); },
      () => {
        paused = false;
        hidePauseOverlay();
        stopMusic();
        blockManager.clear();
        hideHUD(hud);
        speedLines.setActive(false);
        showSongSelect();
      }
    );
  } else {
    totalPausedTime += performance.now() - pauseStartTime;
    hidePauseOverlay();
    speedLines.setActive(true);
    if (currentSong) {
      startMusic(currentSong);
    }
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
    if (quality === 'miss') {
      handleMiss(result.block);
      return;
    }

    scoreHit(state, quality);
    playHitSound(quality);
    showTimingFeedback(hud, quality);

    // Visual effects
    const pos = result.block.mesh.position.clone();
    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const particleCount = quality === 'perfect' ? 30 : quality === 'great' ? 18 : 10;
    particles.emit(pos, color, particleCount, quality === 'perfect' ? 5 : 3);
    hitFlash.flash(pos, color, quality);
    flashHitMarker(environment, lane, quality === 'perfect' ? '#ffffff' : color.getStyle());

    // Lane flash
    const lf = createLaneFlashEffect(lane, state.numLanes, color);
    world.scene.add(lf.mesh);
    laneFlashes.push(lf);

    // Beat pulse ring on perfect
    if (quality === 'perfect') {
      beatPulse.pulse(color);
    }

    // Streak fire on high combos
    if (state.combo > 10) {
      const totalWidth = (state.numLanes - 1) * LANE_SPACING;
      const x = -totalWidth / 2 + lane * LANE_SPACING;
      streakFire.emit(x, color);
    }

    // Combo milestones
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

    // Remove block
    blockManager.removeBlock(result.block);
  }
}

function handleMiss(block: ActiveBlock) {
  scoreMiss(state);
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
    return;
  }

  const songTime = getMusicTime();
  state.songTime = songTime;

  // Beat intensity
  if (currentSong) {
    const beatDuration = 60 / currentSong.bpm;
    const beatPhase = (songTime % beatDuration) / beatDuration;
    beatIntensity = Math.max(0, 1 - beatPhase * 3);

    // Detect new beat
    const currentBeat = Math.floor(songTime / beatDuration);
    if (currentBeat !== lastBeatTime) {
      lastBeatTime = currentBeat;
      // Pulse lights on beat
      const pulseColor = LANE_COLORS[currentBeat % LANE_COLORS.length];
      sceneLight1.color.copy(pulseColor);
      sceneLight1.intensity = 4;
    }
  }

  // Decay light intensity
  sceneLight1.intensity = Math.max(2.5, sceneLight1.intensity * 0.95);

  // Spawn new blocks
  if (currentSong) {
    const spawnAhead = 2.5;
    while (nextBeatIndex < currentSong.beats.length) {
      const beat = currentSong.beats[nextBeatIndex];
      if (beat.time - songTime > spawnAhead) break;
      blockManager.spawnBlock(beat, songTime);
      nextBeatIndex++;
    }

    // Endless mode: generate next phase when approaching the end
    if (state.endless && nextBeatIndex >= currentSong.beats.length - 5) {
      const { song } = generateNextPhase(endlessState, state.numLanes);
      // Append new beats to current song
      const newBeats = song.beats;
      currentSong.beats.push(...newBeats);
      // Show phase notification
      comboPopups.show(
        `PHASE ${endlessState.phase}`,
        getEndlessPhaseColor(endlessState.phase),
        50, 25
      );
      comboPopups.show(
        getEndlessDifficultyLabel(endlessState),
        '#ffffff',
        50, 32
      );
    }
  }

  // Update blocks
  const missed = blockManager.update(songTime, dt);
  for (const block of missed) {
    handleMiss(block);
  }

  // Update all visual systems
  updateEnvironment(environment, now / 1000, beatIntensity);
  updateHitMarkerFlash(environment, state.numLanes);
  particles.update(dt);
  hitFlash.update(dt);
  screenShake.update(dt);
  comboPopups.update(dt);
  speedLines.update(dt, beatIntensity + (state.combo > 10 ? 0.3 : 0));
  beatPulse.update(dt);
  streakFire.update(dt);

  // Update lane flashes
  for (let i = laneFlashes.length - 1; i >= 0; i--) {
    if (!laneFlashes[i].update(dt)) {
      world.scene.remove(laneFlashes[i].mesh);
      laneFlashes.splice(i, 1);
    }
  }

  // Apply screen shake
  if (!world.isInXR) {
    environment.position.x = screenShake.offset.x;
    environment.position.y = screenShake.offset.y;
    blockContainer.position.x = screenShake.offset.x;
    blockContainer.position.y = screenShake.offset.y;
  }

  // Update HUD
  const songName = state.endless ?
    `∞ Phase ${endlessState.phase} • ${endlessState.bpm} BPM` :
    getSongInfo(state.songId)?.name || '';
  updateHUD(
    hud,
    state.score,
    state.combo,
    state.multiplier,
    state.health,
    state.maxHealth,
    state.endless ? 1 : (currentSong ? songTime / currentSong.duration : 0),
    songName
  );

  // Check game over
  if (state.health <= 0) {
    finishSong();
    return;
  }

  // Check song complete (non-endless)
  if (!state.endless && currentSong && songTime >= currentSong.duration + 1) {
    finishSong();
  }
}

// ---- Start ----
init().catch(console.error);
