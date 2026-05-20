// ============================================================
// Neon Beats VR — Main Entry Point
// Core game loop tying all systems together
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

// ---- Globals ----
const container = document.getElementById('scene-container') as HTMLDivElement;
let world: World;
let state: GameState;
let hud: HUDElements;
let environment: Group;
let blockContainer: Group;
let blockManager: BlockManager;
let particles: ParticleSystem;
let hitFlash: HitFlashManager;
let screenShake: ScreenShake;
let comboPopups: ComboPopupManager;
let bgPulse: BackgroundPulse;
let laneFlashes: { mesh: any; update: (dt: number) => boolean }[] = [];
let currentSong: Song | null = null;
let nextBeatIndex = 0;
let paused = false;
let pauseStartTime = 0;
let totalPausedTime = 0;
let lastFrameTime = 0;
let beatIntensity = 0;

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
  world.scene.fog = new Fog(0x000008, 5, 30);
  world.scene.add(new AmbientLight(0x222244, 0.5));

  const pointLight = new PointLight(0x00ffff, 2, 15);
  pointLight.position.set(0, 4, HIT_ZONE_Z);
  world.scene.add(pointLight);

  const accentLight = new PointLight(0xff00ff, 1.5, 15);
  accentLight.position.set(0, 3, HIT_ZONE_Z - 10);
  world.scene.add(accentLight);

  // Create state
  state = createInitialState();
  state.highScores = loadAllHighScores();

  // Create environment
  environment = createEnvironment(state.numLanes);
  world.scene.add(environment);

  // Block container
  blockContainer = new Group();
  blockContainer.name = 'blocks';
  world.scene.add(blockContainer);

  // Effects
  const effectsGroup = new Group();
  effectsGroup.name = 'effects';
  world.scene.add(effectsGroup);

  particles = new ParticleSystem(effectsGroup);
  hitFlash = new HitFlashManager(effectsGroup);
  screenShake = new ScreenShake();
  comboPopups = new ComboPopupManager();
  bgPulse = new BackgroundPulse();

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
    } else if (state.phase === 'playing' && paused) {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keyState.set(e.code, false);
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
  showSongSelectScreen(
    state.selectedSongIndex,
    state.highScores,
    (songId: string) => {
      state.songId = songId;
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
  laneFlashes = [];
  nextBeatIndex = 0;
  totalPausedTime = 0;

  // Load song
  currentSong = getSong(state.songId, state.numLanes);
  state.songDuration = currentSong.duration;
  state.totalNotes = currentSong.beats.length;

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
  if (currentSong) {
    startMusic(currentSong);
  }
}

function finishSong() {
  state.phase = 'results';
  stopMusic();
  hideHUD(hud);
  blockManager.clear();

  const songInfo = getSongInfo(state.songId)!;
  const isNew = saveHighScore(state.songId, state.score);
  if (isNew) state.highScores.set(state.songId, state.score);

  showResultsScreen(
    state,
    songInfo,
    isNew,
    () => {
      hideResultsScreen();
      startCountdown();
    },
    () => {
      hideResultsScreen();
      showSongSelect();
    }
  );
}

function togglePause() {
  if (state.phase !== 'playing') return;
  paused = !paused;
  if (paused) {
    pauseStartTime = performance.now();
    stopMusic();
    showPauseOverlay(
      () => { togglePause(); },
      () => {
        paused = false;
        hidePauseOverlay();
        stopMusic();
        blockManager.clear();
        hideHUD(hud);
        showSongSelect();
      }
    );
  } else {
    totalPausedTime += performance.now() - pauseStartTime;
    hidePauseOverlay();
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
      // Close but not close enough — treat as miss
      handleMiss(result.block);
      return;
    }

    scoreHit(state, quality);
    playHitSound(quality);
    showTimingFeedback(hud, quality);

    // Visual effects
    const pos = result.block.mesh.position.clone();
    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const particleCount = quality === 'perfect' ? 25 : quality === 'great' ? 15 : 8;
    particles.emit(pos, color, particleCount, quality === 'perfect' ? 4 : 2);
    hitFlash.flash(pos, color, quality);
    flashHitMarker(environment, lane, quality === 'perfect' ? '#ffffff' : color.getStyle());

    // Lane flash
    const lf = createLaneFlashEffect(lane, state.numLanes, color);
    world.scene.add(lf.mesh);
    laneFlashes.push(lf);

    // Combo milestones
    if (state.combo > 0 && state.combo % 25 === 0) {
      playComboSound(state.combo);
      comboPopups.show(`${state.combo} COMBO!`, '#ffff00');
      screenShake.trigger(0.5);
      bgPulse.pulse('#ffff00', 0.8);
    } else if (quality === 'perfect') {
      screenShake.trigger(0.1);
      bgPulse.pulse(color.getStyle(), 0.3);
    }

    // Remove hit block with animation
    blockManager.removeBlock(result.block);
  }
}

function handleMiss(block: ActiveBlock) {
  scoreMiss(state);
  playMissSound();
  showTimingFeedback(hud, 'miss');
  screenShake.trigger(0.3);
  bgPulse.pulse('#ff0044', 0.5);
}

// ---- Game Loop ----

function gameLoop() {
  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // cap at 100ms
  lastFrameTime = now;

  if (state.phase !== 'playing' || paused) {
    // Still update visuals in non-playing states
    updateEnvironment(environment, now / 1000, 0);
    particles.update(dt);
    hitFlash.update(dt);
    comboPopups.update(dt);
    return;
  }

  const songTime = getMusicTime();
  state.songTime = songTime;

  // Beat intensity for visual pulsing
  if (currentSong) {
    const beatDuration = 60 / currentSong.bpm;
    const beatPhase = (songTime % beatDuration) / beatDuration;
    beatIntensity = Math.max(0, 1 - beatPhase * 3); // sharp attack, slow decay
  }

  // Spawn new blocks
  if (currentSong) {
    const spawnAhead = 2.5; // seconds before they arrive
    while (nextBeatIndex < currentSong.beats.length) {
      const beat = currentSong.beats[nextBeatIndex];
      if (beat.time - songTime > spawnAhead) break;
      blockManager.spawnBlock(beat, songTime);
      nextBeatIndex++;
    }
  }

  // Update blocks and check for misses
  const missed = blockManager.update(songTime, dt);
  for (const block of missed) {
    handleMiss(block);
  }

  // Update environment
  updateEnvironment(environment, now / 1000, beatIntensity);
  updateHitMarkerFlash(environment, state.numLanes);

  // Update effects
  particles.update(dt);
  hitFlash.update(dt);
  screenShake.update(dt);
  comboPopups.update(dt);

  // Update lane flashes
  for (let i = laneFlashes.length - 1; i >= 0; i--) {
    if (!laneFlashes[i].update(dt)) {
      world.scene.remove(laneFlashes[i].mesh);
      laneFlashes.splice(i, 1);
    }
  }

  // Apply screen shake to camera offset
  if (!world.isInXR) {
    // Browser mode: offset the environment slightly
    environment.position.x = screenShake.offset.x;
    environment.position.y = screenShake.offset.y;
    blockContainer.position.x = screenShake.offset.x;
    blockContainer.position.y = screenShake.offset.y;
  }

  // Update HUD
  const songInfo = getSongInfo(state.songId);
  updateHUD(
    hud,
    state.score,
    state.combo,
    state.multiplier,
    state.health,
    state.maxHealth,
    currentSong ? songTime / currentSong.duration : 0,
    songInfo?.name || ''
  );

  // Check game over conditions
  if (state.health <= 0) {
    finishSong();
    return;
  }

  // Check song complete
  if (currentSong && songTime >= currentSong.duration + 1) {
    finishSong();
  }
}

// ---- Start ----
init().catch(console.error);
