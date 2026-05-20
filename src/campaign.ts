// ============================================================
// Neon Beats VR — Campaign Mode
// Story-driven progression through themed worlds:
//   - 5 worlds, each with 6-7 songs
//   - Star gates between worlds (need X stars to unlock)
//   - Story intro text for each world
//   - Special boss at end of each world
//   - Unlockable songs, themes, and modifiers
// ============================================================

import { SONG_LIBRARY, type SongInfo } from './songs';
import { playMenuSelect } from './audio';

// ---- World Definitions ----

export interface CampaignWorld {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgGradient: [string, string];
  starsRequired: number; // Stars needed to unlock this world
  story: string;         // Intro narrative
  songIds: string[];     // Songs in this world (in order)
  bossId?: string;       // Optional boss song at end
  unlocks: string[];     // What completing this world unlocks
}

export const CAMPAIGN_WORLDS: CampaignWorld[] = [
  {
    id: 'genesis',
    name: 'GENESIS',
    subtitle: 'The Grid Awakens',
    color: '#00ffff',
    bgGradient: ['#000a1a', '#001133'],
    starsRequired: 0,
    story: 'The Grid flickers to life. You are the first consciousness to emerge from the digital void. '
      + 'Faint pulses of light guide your way as rhythms begin to form around you. '
      + 'Learn the language of beats. Find your rhythm.',
    songIds: ['neon-pulse', 'crystal-rain', 'midnight-drive', 'deep-dive', 'pixel-paradise', 'vapor-sunset', 'frozen-circuit'],
    unlocks: ['theme:neon', 'achievement:genesis_complete'],
  },
  {
    id: 'pulse',
    name: 'PULSE',
    subtitle: 'The Heart of the Machine',
    color: '#00ff88',
    bgGradient: ['#001a0a', '#003322'],
    starsRequired: 8,
    story: 'The Grid pulses with energy now. Mechanical hearts beat in perfect synchronization. '
      + 'The rhythms grow stronger, more complex. You feel the machine\'s heartbeat '
      + 'merging with your own. Match its tempo. Become one with the pulse.',
    songIds: ['digital-rush', 'zero-gravity', 'moonwalk', 'ghost-protocol', 'neon-highway', 'quantum-echo', 'aurora-dreams'],
    unlocks: ['theme:pulse', 'modifier:hidden'],
  },
  {
    id: 'storm',
    name: 'STORM',
    subtitle: 'Chaos Rises',
    color: '#ff6600',
    bgGradient: ['#1a0800', '#332200'],
    starsRequired: 20,
    story: 'A digital storm tears through the Grid. Lightning arcs between data towers as '
      + 'the rhythm fragments into chaotic patterns. Only the sharpest reflexes survive here. '
      + 'Ride the storm. Master the chaos.',
    songIds: ['circuit-breaker', 'neon-samurai', 'electric-heart', 'steel-rain', 'plasma-core', 'thunder-pulse', 'solar-flare'],
    unlocks: ['theme:storm', 'modifier:fadeIn'],
  },
  {
    id: 'void',
    name: 'THE VOID',
    subtitle: 'Beyond the Edge',
    color: '#9933ff',
    bgGradient: ['#0a001a', '#1a0033'],
    starsRequired: 36,
    story: 'Beyond the Grid\'s boundary lies the Void — a place where data dissolves and '
      + 'reality bends. The beats come faster, harder, from impossible directions. '
      + 'The Void tests not just your skill, but your will to continue.',
    songIds: ['laser-storm', 'quantum-flux', 'void-protocol', 'data-storm', 'chrome-fury', 'binary-storm', 'cyber-dragon'],
    unlocks: ['theme:void', 'achievement:void_conquered'],
  },
  {
    id: 'omega',
    name: 'OMEGA',
    subtitle: 'The Final Protocol',
    color: '#ff0044',
    bgGradient: ['#1a0004', '#330011'],
    starsRequired: 50,
    story: 'The Omega Protocol activates. This is the Grid\'s ultimate challenge — '
      + 'a gauntlet of the most intense rhythms ever compiled. Every beat is a test. '
      + 'Every note matters. There is no margin for error. Prove you are worthy.',
    songIds: ['infinite-loop', 'hyperdrive', 'omega-protocol'],
    bossId: 'omega-final',
    unlocks: ['theme:omega', 'achievement:grid_master', 'title:Grid Master'],
  },
];

// ---- Campaign Progress ----

export interface CampaignProgress {
  currentWorld: string;
  worldProgress: Record<string, WorldProgress>;
  totalStars: number;
  unlockedWorlds: string[];
  unlockedSongs: string[];
  unlockedThemes: string[];
  unlockedModifiers: string[];
  achievements: string[];
  titles: string[];
}

export interface WorldProgress {
  songStars: Record<string, number>; // songId → stars earned (0-3)
  bossDefeated: boolean;
  storyViewed: boolean;
  completed: boolean;
}

const CAMPAIGN_STORAGE_KEY = 'neonbeats_campaign';

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return createFreshProgress();
}

export function saveCampaignProgress(progress: CampaignProgress) {
  try {
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
  } catch { /* ignore */ }
}

function createFreshProgress(): CampaignProgress {
  const worldProgress: Record<string, WorldProgress> = {};
  for (const w of CAMPAIGN_WORLDS) {
    worldProgress[w.id] = {
      songStars: {},
      bossDefeated: false,
      storyViewed: false,
      completed: false,
    };
  }

  return {
    currentWorld: 'genesis',
    worldProgress,
    totalStars: 0,
    unlockedWorlds: ['genesis'],
    unlockedSongs: [...CAMPAIGN_WORLDS[0].songIds],
    unlockedThemes: [],
    unlockedModifiers: [],
    achievements: [],
    titles: [],
  };
}

export function updateCampaignAfterSong(
  progress: CampaignProgress,
  worldId: string,
  songId: string,
  stars: number
): { newStars: number; worldJustCompleted: boolean; newUnlocks: string[] } {
  const wp = progress.worldProgress[worldId];
  if (!wp) return { newStars: 0, worldJustCompleted: false, newUnlocks: [] };

  const oldStars = wp.songStars[songId] || 0;
  const gained = Math.max(0, stars - oldStars);
  wp.songStars[songId] = Math.max(oldStars, stars);
  progress.totalStars += gained;

  const newUnlocks: string[] = [];

  // Check if world is now completed
  const world = CAMPAIGN_WORLDS.find(w => w.id === worldId);
  if (world && !wp.completed) {
    const allSongsPlayed = world.songIds.every(sid => (wp.songStars[sid] || 0) >= 1);
    const bossOk = !world.bossId || wp.bossDefeated;
    if (allSongsPlayed && bossOk) {
      wp.completed = true;
      for (const unlock of world.unlocks) {
        newUnlocks.push(unlock);
        if (unlock.startsWith('theme:')) progress.unlockedThemes.push(unlock.split(':')[1]);
        if (unlock.startsWith('modifier:')) progress.unlockedModifiers.push(unlock.split(':')[1]);
        if (unlock.startsWith('achievement:')) progress.achievements.push(unlock.split(':')[1]);
        if (unlock.startsWith('title:')) progress.titles.push(unlock.split(':')[1]);
      }
    }
  }

  // Check if new worlds are unlocked
  for (const w of CAMPAIGN_WORLDS) {
    if (!progress.unlockedWorlds.includes(w.id) && progress.totalStars >= w.starsRequired) {
      progress.unlockedWorlds.push(w.id);
      for (const sid of w.songIds) {
        if (!progress.unlockedSongs.includes(sid)) {
          progress.unlockedSongs.push(sid);
        }
      }
      newUnlocks.push(`world:${w.id}`);
    }
  }

  saveCampaignProgress(progress);
  return { newStars: gained, worldJustCompleted: wp.completed && gained > 0, newUnlocks };
}

// ---- Campaign World Select Screen ----

let campaignScreen: HTMLDivElement | null = null;

export function showCampaignWorldSelect(
  progress: CampaignProgress,
  onSelectWorld: (worldId: string) => void,
  onBack: () => void
): HTMLDivElement {
  hideCampaignScreen();

  const screen = document.createElement('div');
  screen.id = 'campaignWorldSelect';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(5,2,15,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; overflow-y: auto;
  `;

  const worldCards = CAMPAIGN_WORLDS.map((w, i) => {
    const unlocked = progress.unlockedWorlds.includes(w.id);
    const wp = progress.worldProgress[w.id];
    const worldStars = Object.values(wp?.songStars || {}).reduce((a, b) => a + b, 0);
    const maxStars = w.songIds.length * 3;
    const pct = maxStars > 0 ? Math.round((worldStars / maxStars) * 100) : 0;
    const completed = wp?.completed || false;

    return `
      <div class="worldCard" data-world="${w.id}" style="
        background: linear-gradient(135deg, ${w.bgGradient[0]}, ${w.bgGradient[1]});
        border: 2px solid ${unlocked ? w.color : '#333'};
        border-radius: 10px; padding: 20px; cursor: ${unlocked ? 'pointer' : 'default'};
        opacity: ${unlocked ? '1' : '0.4'}; transition: all 0.2s;
        min-width: 200px; text-align: center; position: relative;
        ${completed ? 'box-shadow: 0 0 20px ' + w.color + '40;' : ''}
      ">
        ${!unlocked ? `
          <div style="position: absolute; top: 8px; right: 8px; font-size: 11px; color: #666;">
            🔒 ${w.starsRequired}★
          </div>
        ` : ''}
        ${completed ? `
          <div style="position: absolute; top: 8px; right: 8px; font-size: 14px;">✅</div>
        ` : ''}
        <div style="font-size: 11px; opacity: 0.5; letter-spacing: 2px; margin-bottom: 3px;">
          WORLD ${i + 1}
        </div>
        <div style="font-size: 22px; color: ${w.color}; letter-spacing: 3px;
          text-shadow: 0 0 15px ${w.color}; margin-bottom: 4px;">${w.name}</div>
        <div style="font-size: 11px; opacity: 0.5; margin-bottom: 10px;">${w.subtitle}</div>
        <div style="font-size: 12px; color: #ffd700;">
          ${'★'.repeat(Math.min(worldStars, 99))}${'☆'.repeat(Math.max(0, maxStars - worldStars))} 
          <span style="opacity: 0.5;">${worldStars}/${maxStars}</span>
        </div>
        <div style="margin-top: 6px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px;">
          <div style="height: 100%; width: ${pct}%; background: ${w.color}; border-radius: 2px;"></div>
        </div>
        <div style="font-size: 10px; opacity: 0.3; margin-top: 4px;">${w.songIds.length} tracks</div>
      </div>
    `;
  }).join('');

  screen.innerHTML = `
    <div style="text-align: center; max-width: 700px; width: 90%; padding: 20px 0;">
      <h2 style="font-size: 32px; letter-spacing: 4px; margin-bottom: 5px;
        background: linear-gradient(135deg, #ff0066, #00ffff, #ff00ff);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;">CAMPAIGN</h2>
      <div style="font-size: 13px; opacity: 0.4; margin-bottom: 5px;">
        Total Stars: <span style="color: #ffd700;">${progress.totalStars}★</span>
      </div>
      <div style="font-size: 11px; opacity: 0.25; margin-bottom: 25px;">
        ${progress.unlockedWorlds.length}/${CAMPAIGN_WORLDS.length} worlds unlocked
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px; margin-bottom: 25px;">
        ${worldCards}
      </div>

      <button id="campaignBackBtn" style="
        background: transparent; border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.4); padding: 10px 30px; font-size: 13px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
      ">BACK</button>
    </div>
  `;

  // Wire events
  screen.querySelectorAll('.worldCard').forEach(card => {
    const worldId = (card as HTMLElement).dataset.world!;
    if (progress.unlockedWorlds.includes(worldId)) {
      card.addEventListener('click', () => {
        playMenuSelect();
        onSelectWorld(worldId);
      });
      card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'scale(1.03)';
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'scale(1)';
      });
    }
  });

  document.getElementById('campaignBackBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  document.body.appendChild(screen);
  campaignScreen = screen;
  return screen;
}

// ---- World Story Screen ----

export function showWorldStory(
  world: CampaignWorld,
  onContinue: () => void
): HTMLDivElement {
  hideCampaignScreen();

  const screen = document.createElement('div');
  screen.id = 'worldStory';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, ${world.bgGradient[0]}, ${world.bgGradient[1]});
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; animation: storyFadeIn 1s ease-out;
  `;

  screen.innerHTML = `
    <div style="text-align: center; max-width: 550px; width: 90%;">
      <div style="font-size: 11px; opacity: 0.4; letter-spacing: 3px; margin-bottom: 10px;">
        ENTERING
      </div>
      <h1 style="font-size: 48px; color: ${world.color}; letter-spacing: 5px;
        text-shadow: 0 0 30px ${world.color}; margin-bottom: 5px;
        animation: storyGlow 2s ease-in-out infinite;">${world.name}</h1>
      <div style="font-size: 14px; opacity: 0.5; letter-spacing: 2px; margin-bottom: 35px;">
        ${world.subtitle}
      </div>
      <div style="
        font-size: 15px; line-height: 2; opacity: 0.7; text-align: center;
        padding: 0 20px; animation: storyTextIn 1.5s ease-out 0.5s both;
      ">
        ${world.story}
      </div>
      <button id="storyContinue" style="
        margin-top: 40px; background: transparent; border: 2px solid ${world.color};
        color: ${world.color}; padding: 12px 40px; font-size: 16px;
        font-family: 'Courier New', monospace; cursor: pointer;
        letter-spacing: 2px; border-radius: 4px;
        text-shadow: 0 0 10px ${world.color};
        animation: storyBtnIn 1s ease-out 1.5s both;
      ">BEGIN</button>
    </div>
    <style>
      @keyframes storyFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes storyGlow {
        0%, 100% { text-shadow: 0 0 30px ${world.color}; }
        50% { text-shadow: 0 0 60px ${world.color}, 0 0 100px ${world.color}40; }
      }
      @keyframes storyTextIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 0.7; transform: translateY(0); } }
      @keyframes storyBtnIn { from { opacity: 0; } to { opacity: 1; } }
      #storyContinue:hover { background: ${world.color}22; transform: scale(1.05); }
    </style>
  `;

  document.getElementById('storyContinue')!.addEventListener('click', () => {
    playMenuSelect();
    onContinue();
  });

  document.body.appendChild(screen);
  campaignScreen = screen;
  return screen;
}

// ---- Campaign Song Select (within a world) ----

export function showCampaignSongSelect(
  world: CampaignWorld,
  progress: CampaignProgress,
  onSelectSong: (songId: string) => void,
  onBack: () => void
): HTMLDivElement {
  hideCampaignScreen();

  const wp = progress.worldProgress[world.id];
  const screen = document.createElement('div');
  screen.id = 'campaignSongSelect';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, ${world.bgGradient[0]}, ${world.bgGradient[1]});
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; overflow-y: auto;
  `;

  const songCards = world.songIds.map((sid, i) => {
    const info = SONG_LIBRARY.find(s => s.id === sid);
    if (!info) return '';
    const stars = wp?.songStars[sid] || 0;

    return `
      <div class="campaignSongCard" data-song="${sid}" style="
        background: rgba(255,255,255,0.03); border: 1px solid ${stars > 0 ? info.color : 'rgba(255,255,255,0.1)'};
        border-radius: 8px; padding: 15px; cursor: pointer;
        display: flex; align-items: center; gap: 15px; transition: all 0.2s;
      ">
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          background: ${info.color}22; border: 2px solid ${info.color};
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: ${info.color};
        ">${i + 1}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; color: ${info.color};">${info.name}</div>
          <div style="font-size: 11px; opacity: 0.4;">${info.artist} • ${info.bpm} BPM • ${info.difficulty.toUpperCase()}</div>
        </div>
        <div style="font-size: 16px; color: #ffd700;">
          ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}
        </div>
      </div>
    `;
  }).join('');

  screen.innerHTML = `
    <div style="text-align: center; max-width: 600px; width: 90%; padding: 20px 0;">
      <div style="font-size: 11px; opacity: 0.4; letter-spacing: 2px;">WORLD</div>
      <h2 style="font-size: 28px; color: ${world.color}; letter-spacing: 3px;
        text-shadow: 0 0 15px ${world.color}; margin-bottom: 20px;">${world.name}</h2>
      
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
        ${songCards}
      </div>

      <button id="campaignSongBackBtn" style="
        background: transparent; border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.4); padding: 10px 30px; font-size: 13px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
      ">BACK TO WORLDS</button>
    </div>
  `;

  screen.querySelectorAll('.campaignSongCard').forEach(card => {
    card.addEventListener('click', () => {
      const songId = (card as HTMLElement).dataset.song!;
      playMenuSelect();
      onSelectSong(songId);
    });
    card.addEventListener('mouseenter', () => {
      (card as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
      (card as HTMLElement).style.transform = 'translateX(5px)';
    });
    card.addEventListener('mouseleave', () => {
      (card as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
      (card as HTMLElement).style.transform = 'translateX(0)';
    });
  });

  document.getElementById('campaignSongBackBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  document.body.appendChild(screen);
  campaignScreen = screen;
  return screen;
}

// ---- Star Gate Screen ----

export function showStarGate(
  world: CampaignWorld,
  currentStars: number,
  onBack: () => void
): HTMLDivElement {
  hideCampaignScreen();

  const screen = document.createElement('div');
  screen.id = 'starGate';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at center, rgba(10,0,20,0.97) 0%, rgba(0,0,0,0.99) 100%);
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto;
  `;

  const starsNeeded = world.starsRequired - currentStars;

  screen.innerHTML = `
    <div style="text-align: center; max-width: 450px; width: 90%;">
      <div style="font-size: 60px; margin-bottom: 15px;">🌟</div>
      <h2 style="font-size: 24px; color: ${world.color}; letter-spacing: 3px; margin-bottom: 10px;">
        STAR GATE</h2>
      <div style="font-size: 14px; opacity: 0.6; margin-bottom: 20px;">
        ${world.name} requires <span style="color: #ffd700;">${world.starsRequired}★</span> to unlock
      </div>
      <div style="font-size: 18px; margin-bottom: 10px;">
        You have: <span style="color: #ffd700;">${currentStars}★</span>
      </div>
      <div style="font-size: 14px; color: #ff6600; margin-bottom: 25px;">
        Earn ${starsNeeded} more star${starsNeeded !== 1 ? 's' : ''} to pass
      </div>
      <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-bottom: 25px;">
        <div style="height: 100%; width: ${Math.min(100, (currentStars / world.starsRequired) * 100)}%;
          background: linear-gradient(90deg, #ffd700, ${world.color}); border-radius: 4px;
          transition: width 0.5s;"></div>
      </div>
      <button id="gateBackBtn" style="
        background: transparent; border: 1px solid rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.5); padding: 10px 30px; font-size: 13px;
        font-family: 'Courier New', monospace; cursor: pointer; border-radius: 4px;
      ">BACK</button>
    </div>
  `;

  document.getElementById('gateBackBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onBack();
  });

  document.body.appendChild(screen);
  campaignScreen = screen;
  return screen;
}

// ---- World Complete Screen ----

export function showWorldComplete(
  world: CampaignWorld,
  unlocks: string[],
  onContinue: () => void
): HTMLDivElement {
  hideCampaignScreen();

  const screen = document.createElement('div');
  screen.id = 'worldComplete';
  screen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, ${world.bgGradient[0]}, ${world.bgGradient[1]});
    z-index: 200; font-family: 'Courier New', monospace; color: #fff;
    pointer-events: auto; animation: storyFadeIn 1s ease-out;
  `;

  const unlockList = unlocks.map(u => {
    const [type, name] = u.split(':');
    const icon = type === 'theme' ? '🎨' : type === 'modifier' ? '⚙' : type === 'achievement' ? '🏆' : type === 'title' ? '👑' : '🌟';
    return `<div style="padding: 5px 0;">${icon} ${name.charAt(0).toUpperCase() + name.slice(1)}</div>`;
  }).join('');

  screen.innerHTML = `
    <div style="text-align: center; max-width: 500px; width: 90%;">
      <div style="font-size: 40px; margin-bottom: 10px; animation: completeBounce 0.6s ease-out;">🎉</div>
      <h1 style="font-size: 36px; color: ${world.color}; letter-spacing: 4px;
        text-shadow: 0 0 30px ${world.color}; margin-bottom: 5px;">${world.name}</h1>
      <div style="font-size: 18px; color: #00ff88; letter-spacing: 2px; margin-bottom: 25px;">
        WORLD COMPLETE!</div>
      ${unlocks.length > 0 ? `
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px;
          margin-bottom: 25px; text-align: left;">
          <div style="font-size: 12px; opacity: 0.5; letter-spacing: 1px; margin-bottom: 8px;">UNLOCKED</div>
          <div style="font-size: 14px;">${unlockList}</div>
        </div>
      ` : ''}
      <button id="worldContinueBtn" style="
        background: transparent; border: 2px solid ${world.color}; color: ${world.color};
        padding: 12px 40px; font-size: 16px; font-family: 'Courier New', monospace;
        cursor: pointer; letter-spacing: 2px; border-radius: 4px;
        text-shadow: 0 0 10px ${world.color};
      ">CONTINUE</button>
    </div>
    <style>
      @keyframes completeBounce {
        0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); }
      }
    </style>
  `;

  document.getElementById('worldContinueBtn')!.addEventListener('click', () => {
    playMenuSelect();
    onContinue();
  });

  document.body.appendChild(screen);
  campaignScreen = screen;
  return screen;
}

export function hideCampaignScreen() {
  if (campaignScreen) {
    campaignScreen.remove();
    campaignScreen = null;
  }
  ['campaignWorldSelect', 'worldStory', 'campaignSongSelect', 'starGate', 'worldComplete'].forEach(id => {
    document.getElementById(id)?.remove();
  });
}
