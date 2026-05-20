# 🎵 Neon Beats VR

**A rhythm game set in a neon holodeck.** Blocks fly toward you — slash them with VR sabers or hit them with keyboard keys, perfectly timed to procedural synthwave music.

🌐 **[Play Now](https://ellyz2426.github.io/neon-beats/)** | Built with [IWSDK](https://github.com/nickslevine/iwsdk)

![Neon Beats VR](https://img.shields.io/badge/Songs-33-00ffff?style=flat-square) ![Modes](https://img.shields.io/badge/Modes-7-ff00ff?style=flat-square) ![Status](https://img.shields.io/badge/Status-Playable-00ff88?style=flat-square)

---

## Features

### 🎮 Gameplay
- **33 procedurally-generated songs** across 5 difficulty levels (78–210 BPM)
- **4 beat types**: Tap, Hold, Double, Bomb, Slide
- **Combo system** with ×1–×8 multiplier
- **Star rating** (0–3 stars per song per difficulty)
- **Health system** with healing on perfect hits

### 🎵 Audio
- **Procedural synthwave music engine** — every song is unique
- Layered drum synthesis (kick sub+click, bandpass snare, filtered hihat)
- Detuned oscillator bass with sub-octave warmth
- PWM-style synth leads with filter sweeps and ADSR envelopes
- Master compressor for punchy, cohesive sound
- 7 chord progressions × 5 scales × 5 song structures = massive variety

### 🥽 VR Support (Quest/PCVR)
- **Dual saber gameplay** — slash blocks with VR controllers
- Controller ray → lane selection for precision aiming
- Trigger to hit, Grip for secondary actions
- Motion-based swing detection (no trigger needed!)
- **Haptic feedback** on hits (intensity varies by quality)
- VR comfort options (snap turn, vignette)
- Spatial UI menu navigation with thumbsticks

### 🏆 Campaign Mode
- **5 themed worlds**: Genesis → Pulse → Storm → The Void → Omega
- **Star gate progression** — earn stars to unlock new worlds
- Story intro sequences with animated narratives
- World completion rewards (themes, modifiers, titles)
- Persistent save across sessions

### 🎯 Game Modes
1. **Free Play** — pick any song, any difficulty
2. **Campaign** — story-driven progression through 5 worlds
3. **Endless/Survival** — infinite blocks with escalating difficulty
4. **Zen Mode** — no health, no score, just vibes
5. **Practice** — guided 5-step tutorial (single lane → combos)
6. **Challenge Mode** — Bronze/Silver/Gold/Diamond objectives per song
7. **Boss Battles** — wave-based boss encounters with attack patterns

### 🎨 Customization
- **10 built-in themes** (Neon, Retro, Ocean, Lava, Crystal, etc.)
- **Custom Theme Builder** — pick colors, neon intensity, fog density
- **Per-lane color customization**
- **6 game modifiers**: No Fail, Half Speed, Auto Play, Mirror, Hidden, Fade In
- Colorblind mode support

### 📊 Stats & Leaderboards
- Per-song, per-difficulty local leaderboards (top 10)
- Personal best tracking with dates
- Lifetime stats: total score, play time, accuracy, songs cleared
- Achievement system (30+ achievements)

---

## Controls

### ⌨️ Keyboard
| Key | Action |
|-----|--------|
| **D** | Hit Lane 1 (Red) |
| **F** | Hit Lane 2 (Green) |
| **J** | Hit Lane 3 (Blue) |
| **K** | Hit Lane 4 (Orange) |
| **Space** | Pause |
| **Escape** | Pause / Back |
| **←/→** | Navigate menus |
| **Enter** | Select |

### 🎮 VR Controllers
| Input | Action |
|-------|--------|
| **Trigger** | Hit block in aimed lane |
| **Swing Motion** | Hit block (no trigger needed) |
| **Grip** | Secondary action (bomb dodge) |
| **Thumbstick** | Menu navigation |
| **Thumbstick Click** | Select/Confirm |

---

## Tech Stack

- **IWSDK 0.4.x** — Immersive Web SDK for WebXR
- **Three.js** (via @iwsdk/core re-exports)
- **Web Audio API** — procedural music & SFX synthesis
- **TypeScript** — full type safety
- **Vite** — blazing fast builds

### Architecture

```
src/
├── index.ts          — Main game loop, world setup, input handling
├── audio.ts          — Audio engine, procedural SFX, music playback
├── songgen.ts        — Procedural beat/drum/bass/melody generation
├── songs.ts          — 33-song library with metadata
├── blocks.ts         — Block spawning, movement, hit detection
├── xrinput.ts        — VR controller input (triggers, tracking, haptics)
├── sabers.ts         — VR saber rendering and attachment
├── campaign.ts       — 5-world campaign with star gates
├── patterns.ts       — Hand-crafted beat pattern library
├── effects.ts        — Particle system with object pooling
├── hitanims.ts       — Per-type hit animations (shatter, dissolve, explode)
├── reactive.ts       — Beat-reactive walls, floor grid, sky particles
├── laneflash.ts      — Lane flash + approach beam + hit zone ring
├── themes.ts         — 10 visual themes
├── customtheme.ts    — Custom theme builder
├── ui.ts             — Menu screens (title, song select, results, pause)
├── tutorial.ts       — 12-step tutorial with keyboard navigation
├── practice.ts       — Interactive practice mode
├── leaderboard.ts    — Per-song per-difficulty leaderboards
├── achievements.ts   — 30+ achievement definitions
├── boss.ts           — Boss battle system
├── endless.ts        — Endless/survival mode
├── zen.ts            — Zen mode (no health/score)
├── settings.ts       — Persistent settings
├── game.ts           — Core game state management
└── ... (60+ files total)
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (auto-detects headless/GPU)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build
```

### Deploy to GitHub Pages

```bash
npm run build
cd dist
git init && git checkout -b gh-pages
git add -A && git commit -m "Deploy"
git remote add origin https://github.com/YOUR_USER/neon-beats.git
git push -f origin gh-pages
```

---

## Song Library

| Song | BPM | Difficulty | Description |
|------|-----|-----------|-------------|
| Neon Pulse | 120 | Easy | Chill synthwave groove |
| Midnight Drive | 95 | Easy | Atmospheric neon cruise |
| Crystal Rain | 108 | Easy | Cascading crystal melodies |
| Deep Dive | 85 | Easy | Ambient underwater vibes |
| Pixel Paradise | 115 | Easy | Chiptune retro dreamscape |
| Aurora Dreams | 92 | Easy | Northern lights shimmer |
| Vapor Sunset | 88 | Easy | Dreamy vaporwave |
| Frozen Circuit | 78 | Easy | Sub-zero ambient tones |
| Digital Rush | 130 | Medium | Driving beats |
| Circuit Breaker | 140 | Medium | Electrifying rhythms |
| Neon Samurai | 135 | Medium | Precision warrior pace |
| Ghost Protocol | 125 | Medium | Mysterious sequences |
| Zero Gravity | 110 | Medium | Weightless grooves |
| Moonwalk | 112 | Medium | Lunar groove |
| Neon Highway | 128 | Medium | Light-speed cruising |
| Quantum Echo | 138 | Medium | Superposition beats |
| Laser Storm | 150 | Hard | Intense light patterns |
| Quantum Flux | 160 | Hard | Reality bends |
| Electric Heart | 145 | Hard | Pulse-pounding |
| Thunder Pulse | 155 | Hard | Electric crackle |
| Solar Flare | 165 | Hard | Explosive eruptions |
| Steel Rain | 148 | Hard | Industrial pelting |
| Plasma Core | 158 | Hard | Reactor rhythms |
| Void Protocol | 170 | Expert | Only the fastest survive |
| Infinite Loop | 180 | Expert | Ultimate recursion |
| Data Storm | 190 | Expert | Sensory overload |
| Chrome Fury | 175 | Expert | Relentless industrial |
| Cyber Dragon | 185 | Expert | Dragon fire at 185 BPM |
| Hyperdrive | 200 | Expert | Maximum velocity |
| Binary Storm | 172 | Expert | Torrent of data |
| Omega Protocol | 210 | Expert | No mercy. |
| Starlight Waltz | 100 | Easy | Cosmic 3/4 drift |
| Crystal Cave | 102 | Easy | Digital cavern sparkles |

---

## License

MIT

---

*Built with 🎵 and ⚡ using IWSDK*
