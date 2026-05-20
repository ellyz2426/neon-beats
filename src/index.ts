// ============================================================
// Neon Beats VR — Main Entry Point (v1.0)
// Full game with special blocks, challenges, settings, themes,
// practice mode, tutorials, leaderboard, and audio effects
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
import { getSong, getSongInfo, SONG_LIBRARY, getDefaultDifficulty } from './songs';
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
import { TimingMeter, ScreenFlash, getTimingLabel } from './feedback';

// New v1.0 imports
import {
  loadSettings,
  saveSettings,
  applyAudioSettings,
  showSettingsScreen,
  hideSettingsScreen,
  getKeyDisplayName,
  type Settings,
} from './settings';
import { getTheme, type ThemeConfig } from './themes';
import {
  ChallengeManager,
  createChallengeHUD,
  updateChallengeHUD,
  hideChallengeHUD,
} from './challenges';
import {
  showLeaderboardScreen,
  hideLeaderboardScreen,
  saveToLeaderboard,
  createLeaderboardEntry,
} from './leaderboard';
import { showTutorial, hideTutorial, TipSystem } from './tutorial';
import {
  createDefaultPracticeConfig,
  showPracticeControls,
  hidePracticeControls,
  playMetronomeClick,
  type PracticeConfig,
} from './practice';
import { startPreview, stopPreview } from './preview';
import {
  InputRecorder,
  saveReplay,
  loadBestReplay,
  GhostPlayer,
  createGhostHUD,
  updateGhostHUD,
  hideGhostHUD,
} from './replay';
import {
  ComboTrail,
  MultiplierRing,
  BeatGraph,
  LaneAura,
  StreakCounter,
} from './combovisuals';
import {
  initAccessibility,
  announce,
  triggerHaptic,
  PerformanceMonitor,
} from './accessibility';
import { XRInputManager } from './xrinput';
import { VRSaberManager } from './sabers';
import { VRMenuController, injectVRMenuStyles } from './vrmenu';
import { HitAnimationSystem } from './hitanims';
import { VRAimIndicator } from './vrlaneindicator';
import { DynamicMusicEngine } from './music';
import { CrowdSystem } from './crowd';
import { MusicalHitSounds } from './musicalhits';
import { ScoreCardGenerator } from './scorecard';
import {
  createLivesState, checkMilestones, loseLife, useBomb,
  createSurvivalState, startSurvival, updateSurvival,
  onSurvivalBlockHit, getSurvivalSpeedMultiplier,
  getDailyChallenge, hasDailyChallengeBeenPlayed,
  saveDailyChallengeScore, type LivesState, type SurvivalState,
} from './lives';
import {
  ReactiveWalls, FloorGrid, SkyParticles,
  StageManager, MissScreenEffect, PerfectStreakGlow,
} from './reactive';
import {
  createBossState, startBoss, updateBoss, onBossMiss,
  generateBossSong, BOSSES,
  createBossHUD, updateBossHUD, showBossHUD, hideBossHUD,
  type BossState,
} from './boss';
import { FrameRateMonitor, getQualitySettings } from './pool';
import { BeatEditor, loadCustomSongs, customSongToPlayable, customSongToSongInfo } from './editor';
import { showLoadingScreen, updateLoadingProgress, hideLoadingScreen, setupErrorBoundary } from './loading';
import {
  loadExtendedStats, saveExtendedStats, updateExtendedStats,
  showStatsDashboard, hideStatsDashboard, type ExtendedStats,
} from './dashboard';
import {
  CHALLENGE_LIBRARY, loadChallengeProgress, evaluateChallenges,
  showChallengeList, type ChallengeProgress,
} from './challengemode';
import { createZenModeState, updateZenMode, ZenParticleField, showZenHUD, updateZenHUD, hideZenHUD, type ZenModeState } from './zen';
import { SFXPool } from './sfx';
import {
  createMultiplayerSession, recordPlayerResult, isSessionComplete,
  showMultiplayerResults, showPlayerSetup, type MultiplayerSession,
} from './multiplayer';
import { ComfortVignette, loadVRComfort, saveVRComfort } from './vrcomfort';
import { LaneBurstSystem, AnimatedComboCounter, ScorePopupSystem } from './combofx';

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
let ambientLight: AmbientLight;
let modifiers: Modifiers;
let playerStats: PlayerStats;
let songStartRealTime = 0;
let autoPlayIndex = 0;
let achievements: Achievement[];
let titleVisuals: TitleVisuals;
let fpsCounter: FPSCounter;
let neonTubes: NeonTubeSystem;
let holoHorizon: HolodeckHorizon;
let timingMeter: TimingMeter;
let screenFlash: ScreenFlash;

// v1.0 globals
let settings: Settings;
let currentTheme: ThemeConfig;
let challengeManager: ChallengeManager;
let tipSystem: TipSystem;
let practiceConfig: PracticeConfig;
let selectedDifficulty: string = ''; // per-song difficulty override
let lastMetronomeClick = -1;
let inputRecorder: InputRecorder;
let ghostPlayer: GhostPlayer;
let comboTrail: ComboTrail;
let multiplierRing: MultiplierRing;
let beatGraph: BeatGraph;
let laneAura: LaneAura;
let streakCounter: StreakCounter;
let perfMonitor: PerformanceMonitor;

// XR Controller input
let xrInput: XRInputManager;
let saberManager: VRSaberManager;
let vrMenu: VRMenuController;
let wasInXR = false;

// New systems
let hitAnims: HitAnimationSystem;
let vrAimIndicator: VRAimIndicator;
let dynamicMusic: DynamicMusicEngine;
let crowdSystem: CrowdSystem;
let musicalHits: MusicalHitSounds;
let scoreCard: ScoreCardGenerator;
let livesState: LivesState;
let survivalState: SurvivalState;
let reactiveWalls: ReactiveWalls;
let floorGrid: FloorGrid;
let skyParticles: SkyParticles;
let stageManager: StageManager;
let missEffect: MissScreenEffect;
let perfectStreakGlow: PerfectStreakGlow;
let bossState: BossState;
let frameMonitor: FrameRateMonitor;
let beatEditor: BeatEditor;
let extendedStats: ExtendedStats;
let challengeProgress: Map<string, ChallengeProgress>;
let zenState: ZenModeState;
let zenParticles: ZenParticleField;
let sfxPool: SFXPool;
let multiplayerSession: MultiplayerSession | null = null;
let noMissStreakTime = 0;  // tracks how long since last miss (seconds)
let comfortVignette: ComfortVignette;
let laneBursts: LaneBurstSystem;
let animCombo: AnimatedComboCounter;
let scorePopups: ScorePopupSystem;

// Key mapping
let laneKeys: string[] = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
const keyState = new Map<string, boolean>();

// ---- Init ----

async function init() {
  // Load settings
  settings = loadSettings();
  currentTheme = getTheme(settings.theme);
  applyAudioSettings(settings);
  laneKeys = [...settings.laneKeys];

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

  // Scene setup — theme-aware
  world.scene.fog = new Fog(currentTheme.fogColor, currentTheme.fogNear, currentTheme.fogFar);
  ambientLight = new AmbientLight(currentTheme.ambientColor, currentTheme.ambientIntensity);
  world.scene.add(ambientLight);

  sceneLight1 = new PointLight(currentTheme.light1Color, 2.5, 20);
  sceneLight1.position.set(0, 5, HIT_ZONE_Z);
  world.scene.add(sceneLight1);

  sceneLight2 = new PointLight(currentTheme.light2Color, 2, 20);
  sceneLight2.position.set(0, 3, HIT_ZONE_Z - 12);
  world.scene.add(sceneLight2);

  // State
  state = createInitialState();
  state.highScores = loadAllHighScores();
  endlessState = createEndlessState();
  modifiers = createDefaultModifiers();
  playerStats = loadStats();
  achievements = loadAchievements();
  practiceConfig = createDefaultPracticeConfig();

  // Challenge manager
  challengeManager = new ChallengeManager();
  tipSystem = new TipSystem();
  inputRecorder = new InputRecorder();
  ghostPlayer = new GhostPlayer();
  perfMonitor = new PerformanceMonitor();

  // Accessibility
  initAccessibility();

  // Title visuals & FPS
  titleVisuals = new TitleVisuals();
  fpsCounter = new FPSCounter();

  // Effects group (must be before neon decorations)
  effectsGroup = new Group();
  effectsGroup.name = 'effects';
  world.scene.add(effectsGroup);

  // Neon decorations
  neonTubes = new NeonTubeSystem(effectsGroup);
  holoHorizon = new HolodeckHorizon(effectsGroup);
  timingMeter = new TimingMeter();
  screenFlash = new ScreenFlash();
  timingMeter.hide();

  // Environment
  environment = createEnvironment(state.numLanes);
  world.scene.add(environment);

  // Blocks
  blockContainer = new Group();
  blockContainer.name = 'blocks';
  world.scene.add(blockContainer);

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

  // Combo visuals
  comboTrail = new ComboTrail(effectsGroup);
  multiplierRing = new MultiplierRing(effectsGroup, 0.02, HIT_ZONE_Z);
  beatGraph = new BeatGraph();
  beatGraph.hide();
  laneAura = new LaneAura(effectsGroup, state.numLanes, LANE_SPACING, HIT_ZONE_Z);
  streakCounter = new StreakCounter();

  // HUD
  hud = createHUD(state.numLanes);
  hideHUD(hud);

  // Block manager
  blockManager = new BlockManager(blockContainer, state.numLanes);

  // XR Controller Input
  xrInput = new XRInputManager();
  xrInput.init(world, state.numLanes, LANE_SPACING, HIT_ZONE_Z);

  saberManager = new VRSaberManager();
  saberManager.init(world);

  vrMenu = new VRMenuController();
  vrMenu.init(world);
  injectVRMenuStyles();

  // Hit animations
  hitAnims = new HitAnimationSystem();
  world.scene.add(hitAnims.getGroup());

  // VR aim indicator
  vrAimIndicator = new VRAimIndicator();
  vrAimIndicator.init(world, state.numLanes, LANE_SPACING, HIT_ZONE_Z, LANE_COLORS);

  // Dynamic music engine
  dynamicMusic = new DynamicMusicEngine();

  // Crowd system
  crowdSystem = new CrowdSystem();
  crowdSystem.init();

  // Musical hit sounds
  musicalHits = new MusicalHitSounds();
  musicalHits.init();

  // Score card generator
  scoreCard = new ScoreCardGenerator();

  // Lives & survival
  livesState = createLivesState(!modifiers.noFail);
  survivalState = createSurvivalState();

  // Reactive environment
  reactiveWalls = new ReactiveWalls();
  world.scene.add(reactiveWalls.getGroup());

  floorGrid = new FloorGrid();
  world.scene.add(floorGrid.getGroup());

  skyParticles = new SkyParticles();
  world.scene.add(skyParticles.getGroup());

  stageManager = new StageManager();
  missEffect = new MissScreenEffect();
  perfectStreakGlow = new PerfectStreakGlow();
  bossState = createBossState();
  frameMonitor = new FrameRateMonitor();
  beatEditor = new BeatEditor();
  extendedStats = loadExtendedStats();
  challengeProgress = loadChallengeProgress();
  zenState = createZenModeState();
  zenParticles = new ZenParticleField();
  world.scene.add(zenParticles.getGroup());
  zenParticles.hide();
  sfxPool = new SFXPool();
  sfxPool.init();

  comfortVignette = new ComfortVignette();
  laneBursts = new LaneBurstSystem();
  world.scene.add(laneBursts.getGroup());
  animCombo = new AnimatedComboCounter();
  scorePopups = new ScorePopupSystem();

  createBossHUD();
  setupErrorBoundary();

  setupInput();

  // Show tutorial on first launch, then title
  if (!settings.tutorialCompleted) {
    showTutorial(() => {
      settings.tutorialCompleted = true;
      saveSettings(settings);
      showTitle();
    });
  } else {
    showTitle();
  }

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
      if (e.code === settings.pauseKey || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    } else if (state.phase === 'playing' && paused) {
      if (e.code === settings.pauseKey || e.code === 'Escape') {
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

// ---- Theme Application ----

function applyTheme(theme: ThemeConfig) {
  currentTheme = theme;
  if (world.scene.fog instanceof Fog) {
    world.scene.fog.color.setHex(theme.fogColor);
    world.scene.fog.near = theme.fogNear;
    world.scene.fog.far = theme.fogFar;
  }
  ambientLight.color.setHex(theme.ambientColor);
  ambientLight.intensity = theme.ambientIntensity;
  sceneLight1.color.setHex(theme.light1Color);
  sceneLight2.color.setHex(theme.light2Color);
}

// ---- Phase Management ----

function showTitle() {
  state.phase = 'title';
  hideHUD(hud);
  hideSongSelectScreen();
  hideResultsScreen();
  hideModifiersScreen();
  hideStatsScreen();
  hideSettingsScreen();
  hideLeaderboardScreen();
  hideChallengeHUD();
  hidePracticeControls();
  hideGhostHUD();
  ghostPlayer.stop();
  beatGraph.hide();
  streakCounter.clear();

  // Stop recording and save replay
  const accuracy = getAccuracy(state);
  const grade = getGrade(accuracy);
  if (inputRecorder.isRecording()) {
    const replay = inputRecorder.stopRecording(state.score, grade);
    if (!modifiers.autoPlay) saveReplay(replay);
  }
  showTitleScreen(() => {
    titleVisuals.stop();
    hideTitleScreen();
    showSongSelect();
  });
  titleVisuals.start();
  // Scan for VR menu buttons after a frame
  setTimeout(() => vrMenu.scanButtons(), 100);
}

function showSongSelect() {
  state.phase = 'songSelect';
  state.endless = false;
  selectedDifficulty = '';
  stopPreview();
  showSongSelectScreen(
    state.selectedSongIndex,
    state.highScores,
    (songId: string) => {
      stopPreview();
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
      } else if (songId === '_settings') {
        hideSongSelectScreen();
        showSettingsScreen(settings,
          (newSettings) => {
            settings = newSettings;
            laneKeys = [...settings.laneKeys];
            applyTheme(getTheme(settings.theme));
            hideSettingsScreen();
            showSongSelect();
          },
          () => { hideSettingsScreen(); showSongSelect(); }
        );
        return;
      } else if (songId === '_leaderboard') {
        hideSongSelectScreen();
        showLeaderboardScreen('neon-pulse', () => { hideLeaderboardScreen(); showSongSelect(); });
        return;
      } else if (songId === '_tutorial') {
        hideSongSelectScreen();
        showTutorial(() => { hideTutorial(); showSongSelect(); });
        return;
      } else if (songId.startsWith('_diff:')) {
        // Difficulty change
        selectedDifficulty = songId.replace('_diff:', '');
        return;
      } else {
        state.songId = songId;
      }
      hideSongSelectScreen();
      startCountdown();
    },
    () => {
      stopPreview();
      hideSongSelectScreen();
      showTitle();
    }
  );
  // Scan for VR menu buttons after song select renders
  setTimeout(() => vrMenu.scanButtons(), 100);
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
  lastMetronomeClick = -1;
  resetHypeLevel();
  hideChallengeHUD();
  hidePracticeControls();

  // Apply modifiers
  if (modifiers.noFail) state.maxHealth = 999;

  // Apply note speed from settings
  blockManager.setSpeedMultiplier(settings.noteSpeed);

  if (state.endless) {
    endlessState = createEndlessState(modifiers.halfSpeed ? 80 : 120);
    const { song } = generateNextPhase(endlessState, state.numLanes);
    currentSong = song;
    state.songDuration = 9999;
  } else {
    const diff = selectedDifficulty || getDefaultDifficulty(state.songId);
    currentSong = getSong(state.songId, state.numLanes, diff);
    state.songDuration = currentSong.duration;
    state.totalNotes = currentSong.beats.length;

    // Prepare special blocks
    blockManager.prepareSpecialBlocks(currentSong.bpm, currentSong.duration, diff);
  }

  // Mirror modifier
  if (modifiers.mirror && currentSong) {
    currentSong.beats = currentSong.beats.map(b => ({
      ...b,
      lane: state.numLanes - 1 - b.lane,
    }));
  }

  // Initialize challenges
  const songDiff = selectedDifficulty || getSongInfo(state.songId)?.difficulty || 'medium';
  challengeManager.reset(0);
  challengeManager.selectChallenges(songDiff, state.endless);
  createChallengeHUD();

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
  if (settings.showTimingMeter) timingMeter.show();
  speedLines.setActive(true);
  tunnelRings.setActive(true);
  songStartRealTime = performance.now();
  if (currentSong) startMusic(currentSong);

  // Start recording input for replay
  const diff = selectedDifficulty || getSongInfo(state.songId)?.difficulty || 'medium';
  const modNames: string[] = [];
  if (modifiers.noFail) modNames.push('NF');
  if (modifiers.autoPlay) modNames.push('AP');
  inputRecorder.startRecording(state.songId, diff, modNames);

  // Load ghost replay
  const bestReplay = loadBestReplay(state.songId);
  if (bestReplay && !modifiers.autoPlay) {
    ghostPlayer.load(bestReplay);
    createGhostHUD();
  }

  // Show combo visuals
  beatGraph.show();
  beatGraph.clear();
  streakCounter.clear();
  comboTrail.clear();
  laneAura.clear();

  // Announce to screen readers
  announce(`Starting ${state.endless ? 'Endless Mode' : getSongInfo(state.songId)?.name || 'song'}`);

  // Show first-time tips
  tipSystem.showTip('controls', `Lane keys: ${laneKeys.map(k => getKeyDisplayName(k)).join(' ')} • ${getKeyDisplayName(settings.pauseKey)} to pause`);
}

function finishSong() {
  state.phase = 'results';
  stopMusic();
  hideHUD(hud);
  timingMeter.hide();
  blockManager.clear();
  speedLines.setActive(false);
  speedLines.clear();
  tunnelRings.setActive(false);
  tunnelRings.clear();
  hideChallengeHUD();
  hidePracticeControls();

  const playTime = (performance.now() - songStartRealTime) / 1000;
  const cleared = state.health > 0;

  // Add challenge bonus to score
  const challengeBonus = challengeManager.getTotalBonus();
  state.score += challengeBonus;

  // Update persistent stats
  playerStats = updateStatsAfterSong(
    playerStats, state.score, state.perfects, state.greats, state.goods,
    state.misses, state.maxCombo, playTime, state.songId, cleared
  );

  // Update extended stats
  const accuracyForStats = getAccuracy(state);
  const gradeForStats = getGrade(accuracyForStats);
  updateExtendedStats(
    extendedStats, state, state.songId,
    selectedDifficulty || getSongInfo(state.songId)?.difficulty || 'medium',
    accuracyForStats, gradeForStats, playTime
  );

  // Evaluate challenge objectives
  const difficulty = selectedDifficulty || getSongInfo(state.songId)?.difficulty || 'medium';
  const completedChallenges = evaluateChallenges(state, difficulty, challengeProgress, noMissStreakTime);
  for (const cId of completedChallenges) {
    const challenge = CHALLENGE_LIBRARY.find(c => c.id === cId);
    if (challenge) {
      comboPopups.show(`${challenge.icon} ${challenge.name} Complete!`, '#ffd700', 60, 20);
    }
  }

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

  // Save to leaderboard
  const modNames: string[] = [];
  if (modifiers.noFail) modNames.push('NF');
  if (modifiers.halfSpeed) modNames.push('HS');
  if (modifiers.autoPlay) modNames.push('AP');
  if (modifiers.mirror) modNames.push('MR');
  if (modifiers.hidden) modNames.push('HD');
  if (modifiers.fadeIn) modNames.push('FI');
  const lbEntry = createLeaderboardEntry(
    state, modNames,
    selectedDifficulty || getSongInfo(state.songId)?.difficulty || 'medium'
  );
  const lbSongId = state.endless ? 'endless' : state.songId;
  saveToLeaderboard(lbSongId, lbEntry);

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
        timingMeter.hide();
        hideChallengeHUD();
        hidePracticeControls();
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

  // Check for slide target hits first
  const slideResult = blockManager.tryHitSlideTarget(lane, songTime);
  if (slideResult) {
    handleSlideComplete(slideResult.block);
    return;
  }

  const result = blockManager.tryHitLane(lane, songTime);
  flashLaneKey(hud, lane, !!result);

  if (result) {
    // Check if it's a special block
    if (result.block.isSpecial) {
      if (result.block.specialType === 'bomb') {
        handleBombHit(result.block);
        return;
      } else if (result.block.specialType === 'slide') {
        handleSlideStart(result.block);
        return;
      }
    }

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
    timingMeter.showTiming(result.timeDiff, quality);

    // Musical hit sounds (play notes that build a melody)
    if (quality === 'perfect' || quality === 'great' || quality === 'good') {
      musicalHits.playHit(lane, quality, state.numLanes);
    }

    // Hit animations based on quality
    const blockPos = result.block.mesh.position;
    const laneColor = LANE_COLORS[lane % LANE_COLORS.length];
    if (quality === 'perfect') {
      hitAnims.spawnPerfect(blockPos.x, blockPos.y, blockPos.z);
    } else if (result.block.specialType === 'double') {
      hitAnims.spawnExplode(blockPos.x, blockPos.y, blockPos.z, laneColor);
    } else if (result.block.isHold) {
      hitAnims.spawnDissolve(blockPos.x, blockPos.y, blockPos.z, laneColor);
    } else {
      hitAnims.spawnShatter(blockPos.x, blockPos.y, blockPos.z, laneColor);
    }

    // Survival mode tracking
    if (survivalState.active) {
      onSurvivalBlockHit(survivalState);
    }

    // Lane burst particles
    const burstColor = LANE_COLORS[lane % LANE_COLORS.length];
    laneBursts.burst(blockPos.x, blockPos.y, blockPos.z, burstColor, quality === 'perfect' ? 12 : 6);

    // Animated combo counter
    animCombo.setCombo(state.combo);

    // Score popup
    const scoreGain = state.score - origScore;
    if (scoreGain > 0) {
      const laneX = lane / state.numLanes;
      scorePopups.show(scoreGain, laneX, quality);
    }

    // Crowd reaction on combo milestones
    if (state.combo > 0 && state.combo % 25 === 0) {
      crowdSystem.cheer();
    }

    // Check for life/bomb milestones
    const rewards = checkMilestones(livesState, state.combo, state.score);
    for (const r of rewards) {
      comboPopups.show(r, '#ffd700', 55, 20);
    }

    // Record for replay
    inputRecorder.recordEvent(songTime, lane, quality, state.score, state.combo);

    // Update combo visuals
    beatGraph.addHit(quality);
    streakCounter.addHit(quality);
    laneAura.flash(lane);
    if (quality === 'perfect') {
      multiplierRing.pulse();
      perfectStreakGlow.onPerfect();
    } else {
      perfectStreakGlow.onNonPerfect();
    }

    // Haptic feedback
    const hapticIntensity = quality === 'perfect' ? 0.8 : quality === 'great' ? 0.5 : 0.3;
    triggerHaptic(hapticIntensity, quality === 'perfect' ? 60 : 40);
    // XR-specific haptic on the hand that hit
    if (xrInput.isActive()) {
      const hitHand = xrInput.getHitHand();
      if (hitHand) {
        xrInput.triggerHaptic(hitHand, hapticIntensity, quality === 'perfect' ? 60 : 40);
        // Flash saber on hit
        saberManager.pulseBeat(hapticIntensity);
      }
    }

    // Update challenges
    const accuracy = getAccuracy(state);
    challengeManager.onHit(quality, state.combo, state.score, songTime, accuracy);

    // Check challenge completions
    const notifications = challengeManager.popNotifications();
    for (const n of notifications) {
      comboPopups.show(`${n.name} +${n.bonus}`, n.color, 60, 22);
      state.score += 0; // bonus already tracked in manager
    }

    // Visuals (hype-aware)
    const hype = getHypeLevel(state.combo);
    const pos = result.block.mesh.position.clone();
    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const particleMult = settings.particleDensity;
    const basePCount = quality === 'perfect' ? 30 : quality === 'great' ? 18 : 10;
    const pCount = Math.round(basePCount * hype.particleMultiplier * particleMult);
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
      screenShake.trigger(0.6 * settings.screenShakeIntensity);
      bgPulse.pulse('#ffff00', 0.8);
    } else if (state.combo > 0 && state.combo % 10 === 0) {
      comboPopups.show(`×${state.multiplier}`, '#ff00ff', 50, 45);
    }

    if (quality === 'perfect') {
      screenShake.trigger(0.12 * settings.screenShakeIntensity);
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

function handleBombHit(block: ActiveBlock) {
  // Hitting a bomb = damage + penalty
  const bombDamage = 20;
  if (!modifiers.noFail) {
    state.health = Math.max(0, state.health - bombDamage);
  }
  state.combo = 0;
  state.multiplier = 1;
  state.misses++;

  // Red explosion effect
  const pos = block.mesh.position.clone();
  particles.emit(pos, new Color('#ff0000'), 40, 6);
  screenShake.trigger(0.8 * settings.screenShakeIntensity);
  screenFlash.flash('#ff000066', 0.3, 200);
  bgPulse.pulse('#ff0000', 0.6);
  comboPopups.show('💣 BOMB!', '#ff0000', 60, 30);
  playMissSound();

  const accuracy = getAccuracy(state);
  challengeManager.onMiss(getMusicTime(), accuracy);

  blockManager.removeBlock(block);
}

function handleSlideStart(block: ActiveBlock) {
  // Player hit the start of a slide — now they need to hit the target lane
  block.slidePhase = 'target';
  // Visual feedback: change the slide block appearance
  const pos = block.mesh.position.clone();
  const color = LANE_COLORS[block.lane % LANE_COLORS.length];
  particles.emit(pos, color, 15, 3);
  playHitSound('good');
  comboPopups.show('SLIDE →', '#ffcc00', 40, 16);
  // Don't remove the block yet — it stays until target is hit or it passes
}

function handleSlideComplete(block: ActiveBlock) {
  // Player completed the slide!
  const slideBonus = 500;
  state.score += slideBonus * state.multiplier;
  state.combo++;
  if (state.combo > state.maxCombo) state.maxCombo = state.combo;
  state.notesHit++;
  state.perfects++;

  const pos = block.mesh.position.clone();
  const targetColor = LANE_COLORS[block.targetLane! % LANE_COLORS.length];
  particles.emit(pos, targetColor, 35, 5);
  hitFlash.flash(pos, targetColor, 'perfect');
  screenShake.trigger(0.3 * settings.screenShakeIntensity);
  comboPopups.show(`SLIDE +${slideBonus * state.multiplier}`, '#ffff00', 50, 22);
  playHitSound('perfect');

  const accuracy = getAccuracy(state);
  challengeManager.onHit('perfect', state.combo, state.score, getMusicTime(), accuracy);

  blockManager.removeBlock(block);
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
  screenFlash.flash('#ff004440', 0.2, 150);
  screenShake.trigger(0.25 * settings.screenShakeIntensity);
  bgPulse.pulse('#ff0044', 0.4);

  // XR miss feedback
  if (xrInput.isActive()) {
    xrInput.triggerHaptic('both', 0.3, 100);
    saberManager.flashMiss('both');
  }

  // Miss visual effect
  const missPos = block.mesh.position;
  hitAnims.spawnMissEffect(missPos.x, missPos.y, missPos.z);
  musicalHits.playMiss();

  // Screen darken on miss
  missEffect.triggerDarken(0.3);
  if (state.health <= state.maxHealth * 0.3) {
    missEffect.triggerCrack();
  }
  perfectStreakGlow.onNonPerfect();

  // Boss heals on player miss
  if (bossState.active) {
    onBossMiss(bossState);
  }

  // Reset no-miss streak
  noMissStreakTime = 0;
  animCombo.setCombo(0);

  // Crowd gasp on miss during high combo
  if (state.combo >= 15) {
    crowdSystem.gasp();
  }

  // Varied miss sounds
  sfxPool.playMissVariant();

  // Update combo visuals
  beatGraph.addHit('miss');
  streakCounter.onMiss();
  inputRecorder.recordEvent(getMusicTime(), -1, 'miss', state.score, state.combo);

  const accuracy = getAccuracy(state);
  challengeManager.onMiss(getMusicTime(), accuracy);
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
    if (settings.showFPS) fpsCounter.update();
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

    // Practice mode metronome
    if (practiceConfig.enabled && practiceConfig.metronomeEnabled) {
      if (currentBeat !== lastMetronomeClick) {
        lastMetronomeClick = currentBeat;
        const ctx = initAudio();
        const isDownbeat = currentBeat % 4 === 0;
        playMetronomeClick(ctx, ctx.destination, ctx.currentTime, isDownbeat);
      }
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

    // Spawn special blocks
    blockManager.spawnSpecialBlocks(songTime, spawnAhead);

    // Endless: generate next phase
    if (state.endless && nextBeatIndex >= currentSong.beats.length - 5) {
      const { song } = generateNextPhase(endlessState, state.numLanes);
      currentSong.beats.push(...song.beats);
      comboPopups.show(`PHASE ${endlessState.phase}`, getEndlessPhaseColor(endlessState.phase), 50, 25);
      comboPopups.show(getEndlessDifficultyLabel(endlessState), '#ffffff', 50, 32);
    }
  }

  // ---- XR Controller Input ----
  const xrHits = xrInput.update(dt);
  if (xrHits.length > 0 && state.phase === 'playing' && !paused && !modifiers.autoPlay) {
    for (const lane of xrHits) {
      handleLaneHit(lane);
    }
    // Haptic feedback for hits
    const hitHand = xrInput.getHitHand();
    if (hitHand) {
      xrInput.triggerHaptic(hitHand, 0.6, 40);
    }
  }

  // Update sabers (attach/detach, color by aimed lane, pulse)
  saberManager.update(dt);
  if (xrInput.isActive()) {
    const xrState = xrInput.getState();
    saberManager.updateLaneColors(LANE_COLORS, xrState.leftLane, xrState.rightLane);

    // Pulse sabers on beat
    if (beatIntensity > 0.5) {
      saberManager.pulseBeat(beatIntensity * 0.4);
    }

    // XR-enter transition detection
    if (!wasInXR) {
      wasInXR = true;
      announce('VR mode activated — use controllers to hit blocks');
    }
  } else if (wasInXR) {
    wasInXR = false;
  }

  // VR Menu navigation (when not playing)
  if (xrInput.isActive() && state.phase !== 'playing') {
    vrMenu.setEnabled(true);
    vrMenu.update(dt, xrInput.getState());
  } else {
    vrMenu.setEnabled(false);
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

  // Update challenges
  challengeManager.update(dt);
  updateChallengeHUD(challengeManager);

  // Update visuals
  const shouldAnimate = !settings.reducedMotion;
  updateEnvironment(environment, now / 1000, beatIntensity);
  updateHitMarkerFlash(environment, state.numLanes);
  particles.update(dt);
  hitFlash.update(dt);
  screenShake.update(dt);
  comboPopups.update(dt);

  if (shouldAnimate) {
    speedLines.update(dt, beatIntensity + (state.combo > 10 ? 0.3 : 0));
    beatPulse.update(dt);
    streakFire.update(dt);
    tunnelRings.update(dt, beatIntensity);
  }

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
  if (!world.isInXR && settings.screenShakeIntensity > 0) {
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

  // Update combo visuals
  comboTrail.update(dt);
  laneAura.update(dt);
  multiplierRing.setMultiplier(state.multiplier, LANE_COLORS[state.combo % LANE_COLORS.length]);
  multiplierRing.update(dt);

  // Update ghost player
  if (ghostPlayer.isActive()) {
    ghostPlayer.update(songTime);
    updateGhostHUD(ghostPlayer, state.score);
  }

  // Performance monitor
  perfMonitor.addFrame(dt);

  // Update new systems
  hitAnims.update(dt);
  dynamicMusic.updateCombo(state.combo);
  dynamicMusic.update(dt);
  crowdSystem.updatePerformance(state.combo, state.health, state.maxHealth);
  crowdSystem.update(dt);

  // VR aim indicator
  if (xrInput.isActive()) {
    const xrState = xrInput.getState();
    vrAimIndicator.updateAimedLanes(xrState.leftLane, xrState.rightLane, LANE_COLORS);
    vrAimIndicator.setVisible(true);
  } else {
    vrAimIndicator.setVisible(false);
  }
  vrAimIndicator.update(dt);

  // Reactive environment
  reactiveWalls.setBeatIntensity(beatIntensity);
  reactiveWalls.update(dt, now / 1000);
  floorGrid.update(dt, beatIntensity, state.combo);
  skyParticles.update(dt, now / 1000, beatIntensity, state.combo);
  missEffect.update(dt);
  perfectStreakGlow.update(dt);

  // Stage transitions based on combo
  const stageChange = stageManager.update(state.combo, dt);
  if (stageChange) {
    reactiveWalls.setColor(stageChange.wallColor);
    skyParticles.setColor(stageChange.skyColor);
  }

  // Survival mode
  if (survivalState.active) {
    const waveMsg = updateSurvival(survivalState, dt, state.combo, state.score);
    if (waveMsg) {
      comboPopups.show(waveMsg, '#ffdd00', 55, 25);
    }
  }

  // Boss battle
  if (bossState.active) {
    const bossEvent = updateBoss(bossState, dt, state.combo, state.misses);
    if (bossEvent) {
      const color = bossEvent.type === 'defeated' ? '#ffd700' : '#ff0066';
      comboPopups.show(bossEvent.message, color, 60, 28);
      if (bossEvent.type === 'defeated') {
        // Boss defeated — big celebration
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            hitAnims.spawnPerfect(
              (Math.random() - 0.5) * 2,
              1 + Math.random(),
              HIT_ZONE_Z + Math.random() * 2
            );
          }, i * 200);
        }
        hideBossHUD();
      }
    }
    updateBossHUD(bossState);
  }

  // Dynamic quality monitoring
  frameMonitor.addFrame(dt);

  // Track no-miss streak time
  if (state.misses === 0 || state.combo > 0) {
    noMissStreakTime += dt;
  }

  // Zen mode updates
  if (zenState.active) {
    const zenResult = updateZenMode(zenState, dt);
    zenParticles.update(dt, now / 1000, zenResult.breathIntensity, zenResult.color);
    updateZenHUD(zenState.timeAlive);
  }

  // Lane burst particles
  laneBursts.update(dt);

  // Animated combo counter
  animCombo.update(dt);

  // Comfort vignette
  comfortVignette.update(dt);

  if (settings.showFPS) fpsCounter.update();
}

// ---- Start ----
init().catch(console.error);
