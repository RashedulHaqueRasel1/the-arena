# The Voidline // Arena Prime

[![Next.js](https://img.shields.io/badge/Next.js-16.3.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Synthesizer-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Lenis Scroll](https://img.shields.io/badge/Lenis-Smooth_Scroll-black?style=for-the-badge)](https://lenis.darkroom.engineering/)

> An ultra-high-performance, immersive 3D WebGL & Web Audio transmedia gaming universe built with **Next.js 16**, **React 19**, **Three.js**, and custom multi-pass GLSL shaders. Inspired by [enterthearena.com](https://enterthearena.com/), [briizz-lanuch.vercel.app](https://briizz-lanuch.vercel.app/), and [digitaldropouts.net](https://digitaldropouts.net/).

---

## 🌌 Overview

**The Voidline // Arena Prime** is a cinematic interactive experience celebrating 35 years of legendary action gaming lineage—encompassing iconic franchises such as **Fatal Fury**, **The King of Fighters**, **Metal Slug**, and **Samurai Shodown**. 

Through a continuous, spline-driven hyperspace camera trajectory, users dive through volumetric starfields, orbit reflective chrome portals, inspect holographic CRT terminals, and dock at the **Nexus Citadel** founder terminal.

---

## ⚡ Key Highlights

- **Pure Cinematic Black Void (`#000000`)**: Deep cosmic contrast engineered to maximize neon volumetric bloom and chromatic chrome reflections.
- **Physical "HardAudioEngine" Synthesizer**: Zero-asset, zero-latency procedural Web Audio engine featuring breathing sub-bass drones, velocity-modulated warp whooshes, and visceral **"Dam Dam" double sub-bass impacts** on every click.
- **Minimalist Cyberpunk Telemetry HUD**: Clean, non-intrusive bottom coordinate telemetry that preserves 100% of the visual field without bulky card clutter.
- **Nexus Citadel Command Terminal**: Multi-tab interactive modal featuring a 3D fighter hologram roster, VIP credential minting, Cyberpunk synth player, and real-time Faction War pledging.

---

## 🕹️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Lenis Smooth Scroll Engine          │
                  │      (Velocity & Spline Progress State)      │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌──────────────────────────┐                    ┌───────────────────────────┐
   │    Three.js Pipeline     │                    │      HardAudioEngine      │
   │  - 3D Spline Traversal   │                    │  - Master Compressor Bus  │
   │  - Chrome Portal Orbits  │                    │  - 27.5Hz Sub-Bass Drone  │
   │  - Volumetric Stars      │                    │  - Warp Velocity Whoosh   │
   │  - 3-Pass GLSL Pipeline  │                    │  - "Dam Dam" Click Punch  │
   └─────────────┬────────────┘                    └─────────────┬─────────────┘
                 │                                               │
                 ▼                                               ▼
   ┌──────────────────────────┐                    ┌───────────────────────────┐
   │      WebGL Passes        │                    │    Tactile UI Audio       │
   │  1. Main Render Target   │                    │  - Micro-Chirp Hover      │
   │  2. Dual-Kawase Bloom    │                    │  - Fanfare Chord Chimes   │
   │  3. Post-Process Screen  │                    │  - Seismic Thunder Blast  │
   └─────────────┬────────────┘                    └─────────────┬─────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      Interactive React 19 Client Canvas      │
                  │    - Minimalist HUD Telemetry Strip          │
                  │    - Real-Time Animated Equalizer Pill       │
                  │    - Citadel Founder Command Terminal        │
                  └──────────────────────────────────────────────┘
```

---

## 🔊 Sound Design: HardAudioEngine

Inspired by modern reference sound architectures from *Briizz Launch* and *Digital Dropouts*, the audio system does not rely on static MP3 files. Instead, it is 100% procedurally synthesized in real-time via the **Web Audio API**:

| Feature | Synthesis Architecture |
|---|---|
| **Master Bus Compressor** | Dynamic compression (`threshold: -16dB`, `knee: 24`, `ratio: 10:1`, `attack: 3ms`) prevents distortion while ensuring thunderous, punchy dynamics. |
| **Sub-Bass Ambient Drone** | Dual-oscillator engine (`27.5 Hz A0 sine` + `55.0 Hz A1 sawtooth`) through a resonant `95 Hz` lowpass filter modulated by a slow `0.08 Hz` sine LFO. |
| **"Dam Dam" Click Punch** | Visceral double-thud on **every single click**: Hit 1 (`155 Hz → 36 Hz` kick + `82 Hz` sub) followed at `+80ms` by Hit 2 (`125 Hz → 30 Hz` kick + `62 Hz` rolling sub). |
| **Velocity Warp Whoosh** | Pink/white noise buffer swept dynamically from `220 Hz` to `2400 Hz` based on real-time scroll velocity (`Math.abs(velocity)`). |
| **Thunder / Gate Strike** | Highpass noise burst transient (`1500 Hz`) combined with rolling sub-frequency rumble (`80 Hz → 24 Hz`). |
| **Instant Gesture Auto-Wake** | Automatically initializes `AudioContext` and triggers awakening sub-drop on the user's first touch, wheel scroll, or click. |

---

## 🛸 Transmedia Sectors

| Sector | Title | Lineage & Highlights |
|---|---|---|
| **Sector 01** | *The Voidline Prime* | Transmedia action universe, Unreal Engine 5, 35-year fighting legacy. |
| **Sector 02** | *Fatal Fury: City of the Wolves* | REV System, Terry Bogard, Rock Howard, Just Defend parry mechanics. |
| **Sector 03** | *King of Fighters: Nexus Prime* | 3v3 team elimination, global esports championship, Max Mode combos. |
| **Sector 04** | *Samurai Shodown: Blood & Steel* | 1-hit lethal tension, Just Parry, Haohmaru vs Nakoruru blade clash. |
| **Sector 05** | *Metal Slug: Heavy Artillery* | SV-001 tank, cooperative arcade action, hand-crafted military animations. |
| **Citadel** | *Nexus Citadel Terminus* | Founder Access Terminal, VIP credentials, fighter roster, and global faction war. |

---

## 📂 Project Structure

```
.
├── app/
│   ├── arena-scene.tsx        # Master WebGL 3D scene & HardAudioEngine implementation
│   ├── globals.css            # Cyberpunk design system, HUD styles, and animations
│   ├── layout.tsx             # Root HTML layout with Geist font variables & metadata
│   ├── page.tsx               # Main client entry point rendering ArenaScene
│   ├── privacy-policy/        # Legal policy route
│   └── terms/                 # Terms of service route
├── public/
│   ├── buckets/               # Sector character textures & visual art assets
│   ├── poc-overlay/           # Vector branding SVGs & icons
│   └── end-station.png        # Citadel arrival background plate
├── package.json               # Dependencies and build scripts
├── tsconfig.json              # TypeScript strict configuration
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or later (v20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/the-arena.git
   cd the-arena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Build

To test and compile an optimized production build:
```bash
npm run build
npm run start
```

---

## 🎮 Controls & Interactions

- **Scroll (Mouse Wheel / Touchpad)**: Traverses camera forward and backward along the 3D hyperspace tunnel.
- **Touch & Drag (Mobile / Tablet)**: Smooth touch-momentum warp progression.
- **Left Click (Anywhere)**: Triggers the physical **"Dam Dam" double sub-bass punch impact**.
- **Right Scrubber Dots**: Instant jump to any of the 5 transmedia sectors.
- **Citadel Docking Button**: Decelerates and opens the **Nexus Citadel Terminal**.
- **Top-Right Audio Pill**: Toggles between `CINEMA AUDIO // LIVE [ACT]` and `MUTED`.

---

## 🛠️ Performance Optimizations

1. **Zero Garbage Collection in Render Loop**: All vectors, uniforms, and matrices are pre-allocated outside `requestAnimationFrame`.
2. **Dynamic Device Pixel Ratio (DPR)**: Clamped to `Math.min(window.devicePixelRatio, 2.0)` to ensure sustained 60 FPS on high-density Retina displays.
3. **Multi-Pass Framebuffers**: Off-screen bloom target rendered at quarter-resolution (`1/4 dpr`) for cinematic glow with minimal GPU fill-rate cost.
4. **Procedural Sound Buffers**: Zero network roundtrips for audio; sound buffers are synthesized on client boot for instant latency-free feedback.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

*Disclaimer: "The Arena", "The Voidline", "Fatal Fury", "King of Fighters", "Samurai Shodown", and "Metal Slug" are trademarks and copyright of their respective owners. This implementation is an inspired interactive demonstration.*
