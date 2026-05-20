# Neon Beats VR 🎵

A neon holodeck rhythm game built with [IWSDK](https://github.com/nickreynolds/immersive-web-sdk) — the Immersive Web SDK for WebXR.

**[▶ Play Live](https://ellyz2426.github.io/neon-beats/)**

## About

Neon Beats VR is a full-featured rhythm game where blocks fly toward you along 4 neon lanes. Hit them in time with procedurally-generated synthwave music. The game runs in both browser (keyboard/mouse) and VR mode (headset + controllers).

## Features

### Core Gameplay
- **11 songs** spanning easy to expert difficulty (95-190 BPM)
- **Endless Mode** with infinite procedural phases that escalate in difficulty
- **4-lane gameplay** using keyboard (D/F/J/K), mouse click, or VR controllers
- **Procedural synthwave music** — full drum kit, bass, melody, and arpeggios via Web Audio API
- **Per-song difficulty selector** — play any song at any difficulty level

### Special Blocks
- 💣 **Bombs** (red octahedron) — avoid these! Hitting them deals damage
- 💎 **Slides** (diamond with arrow) — hit the start lane, then swipe to the target lane for bonus points

### Scoring & Progression
- **Perfect/Great/Good/Miss** timing windows with combo multiplier (up to ×8)
- **17 achievements** with toast notifications
- **Star rating system** (0-3 stars per song)
- **Per-song leaderboard** with top 10 scores, grades, and dates
- **Input replay & ghost system** — compete against your best performance

### Combo Challenges
- Random mini-objectives during songs (e.g. "10 perfects in a row", "No misses for 30 seconds")
- Bronze/Silver/Gold/Diamond difficulty tiers with bonus score rewards

### Game Modifiers
- **No Fail** — health can't reach zero
- **Half Speed** — notes approach at 50% speed
- **Auto Play** — watch the AI play
- **Mirror** — lanes are reversed
- **Hidden** / **Fade In** — visibility changes

### Visual Effects
- Neon holodeck environment with grid floor, walls, ceiling
- Particle explosions, beat pulse rings, speed lines, streak fire
- 8-level hype system that escalates visual intensity with combo
- Waveform visualizers, tunnel rings, neon tube decorations
- Combo trail, multiplier ring, lane auras, streak counter, beat graph

### Audio
- Full procedural music engine with structured phrase-based generation
- Song preview on hover in the select screen
- Per-song audio with buildups, drops, and transitions
- Hit/miss/combo sound effects

### Settings & Accessibility
- **Volume controls** (master, music, SFX)
- **Key binding configuration** — rebind lane keys
- **Visual settings** — screen shake intensity, particle density
- **5 visual themes** — Neon, Cyberpunk, Ocean, Space, Sakura
- **Colorblind modes** — Deuteranopia, Protanopia, Tritanopia palettes
- **Reduced motion** mode
- **Screen reader** announcements
- **Practice mode** — adjustable speed, section looping, metronome, timing guides
- **Tutorial** — interactive first-time player onboarding

### Technical
- Dual runtime — browser-first (`{ xr: false }`) with automatic VR detection
- ~8,500 lines of TypeScript across 33 source files
- Persistent stats and high scores via localStorage
- FPS counter and performance monitoring
- Built with IWSDK + Vite + Three.js

## Controls

| Action | Keyboard | VR |
|--------|----------|-----|
| Lane 1 | D | Left trigger |
| Lane 2 | F | Left grip |
| Lane 3 | J | Right trigger |
| Lane 4 | K | Right grip |
| Pause | Space/Esc | Menu button |

## Development

```bash
# Prerequisites: Node.js 20+, IWSDK
npm run dev    # Development server
npm run build  # Production build
```

## Architecture

```
src/
├── index.ts           — Main entry, game loop orchestration
├── audio.ts           — Audio engine, music playback
├── audioeffects.ts    — Reverb, delay, compressor chain
├── blocks.ts          — Block spawning, movement, hit detection
├── specialblocks.ts   — Bomb/slide block types
├── songgen.ts         — Structured song generation
├── songs.ts           — Song library (11 tracks)
├── preview.ts         — Song preview audio
├── game.ts            — Game state, scoring, timing
├── environment.ts     — Holodeck environment, lanes
├── effects.ts         — Particles, hit flash, screen shake
├── trails.ts          — Speed lines, beat pulses, streak fire
├── visualizer.ts      — Waveform bars, tunnel rings
├── neontubes.ts       — Neon tube decorations
├── combovisuals.ts    — Combo trail, multiplier ring, beat graph
├── hud.ts             — Score/combo/health/progress HUD
├── ui.ts              — Title/song select/results/pause screens
├── screens.ts         — Modifiers & stats screens
├── settings.ts        — Settings system with persistence
├── themes.ts          — 5 visual themes
├── challenges.ts      — Combo challenges during gameplay
├── leaderboard.ts     — Per-song local leaderboard
├── replay.ts          — Input recording & ghost replay
├── endless.ts         — Endless mode logic
├── modifiers.ts       — Game modifiers & persistent stats
├── achievements.ts    — 17 achievements with notifications
├── rating.ts          — Star rating calculation
├── hype.ts            — Combo hype level system
├── feedback.ts        — Timing meter, screen flash
├── titlevisuals.ts    — Title screen animation, FPS counter
├── tutorial.ts        — Interactive tutorial system
├── practice.ts        — Practice mode with speed control
└── accessibility.ts   — Screen reader, haptics, contrast
```

## IWSDK Daily Build

This project was built as part of the **IWSDK Daily Build** series — daily VR/MR projects built from scratch using the Immersive Web SDK.

- **Build #3** — May 20, 2026
- **Previous builds:** [VR Pong](https://github.com/ellyz2426/vr-pong), [Galaga VR](https://github.com/ellyz2426/galaga-vr)
