# 🎵 Neon Beats VR

A neon-drenched VR rhythm game built with [IWSDK](https://iwsdk.dev) 0.4.1. Slash through glowing blocks in time with procedural synthwave music in a holodeck-style environment.

**[▶ Play Now](https://ellyz2426.github.io/neon-beats/)**

## Features

- 🎮 **Dual Runtime** — Works in VR headsets AND desktop browsers (WASD + keys)
- 🎵 **7 Songs + Endless Mode** — Procedural music from 120 to 180 BPM
- 🏆 **Achievement System** — 17 milestones to unlock
- ⚙️ **Game Modifiers** — No Fail, Half Speed, Auto Play, Mirror, Hidden, Fade In
- 📊 **Persistent Stats** — Track your performance across sessions
- ⭐ **Star Rating** — Earn up to 3 stars per song
- 🎨 **Holodeck Aesthetic** — Neon wireframes, particle explosions, beat-reactive lighting
- 🔊 **Procedural Audio** — Full synthwave soundtrack generated in real-time
- ∞ **Endless Mode** — Escalating difficulty with infinite procedural phases

## Controls

### Browser Mode
| Key | Action |
|-----|--------|
| D, F, J, K | Hit lanes 1-4 |
| Space | Pause/Resume |
| Escape | Pause |
| Mouse click | Hit nearest lane |

### VR Mode
- Use controllers to slash blocks in the hit zone
- Trigger buttons to hit lanes

## Songs

| Track | BPM | Difficulty |
|-------|-----|-----------|
| Neon Pulse | 120 | Easy |
| Digital Rush | 130 | Medium |
| Circuit Breaker | 140 | Medium |
| Laser Storm | 150 | Hard |
| Quantum Flux | 160 | Hard |
| Void Protocol | 170 | Expert |
| Infinite Loop | 180 | Expert |

## Scoring

- **Perfect** (±50ms): 300 × multiplier
- **Great** (±100ms): 200 × multiplier
- **Good** (±180ms): 100 × multiplier
- **Miss**: Combo reset, health -10

Multiplier increases every 10 combo (max ×8).

## Tech Stack

- [IWSDK](https://iwsdk.dev) 0.4.1 — Immersive Web SDK
- TypeScript + Vite
- Web Audio API (procedural music & SFX)
- Zero external assets — everything generated at runtime

## Development

```bash
npm install
npm run dev     # Start dev server with hot reload
npm run build   # Production build
```

## License

MIT
