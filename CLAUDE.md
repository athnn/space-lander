# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Lander is a browser-based lunar lander game built with vanilla JavaScript, HTML5 Canvas, and CSS. The game features physics-based lander control, terrain generation, particle effects, and a scoring system. It uses ES6 modules and esbuild for bundling.

## Build and Development Commands

- **Build**: `npm run build` - Bundles `scripts/main.js` into `scripts/bundle.js` using esbuild with IIFE format
- **Test**: `npm test` - Runs all tests using Node's built-in test runner
- **Run single test**: `node --test tests/[filename].test.js`

The `index.html` dynamically loads either ES modules (`scripts/main.js`) for development or the bundled script (`scripts/bundle.js`) when served via `file://` protocol.

## Architecture

### Entry Point
- `scripts/main.js` - Main game loop orchestration, mode management, input handling, canvas rendering

### Directory Structure
- **`scripts/entities/`** - Game objects (Lander class with physics, rendering, stats)
- **`scripts/systems/`** - Environmental systems (Starfield, Terrain, ParticleSystem, DebrisField)
- **`scripts/ui/`** - UI controllers (hud, instructions overlay, end overlay, touch controls, toast notifications, physics tuning panel)
- **`scripts/input/`** - Input handling (keyboard controller)
- **`scripts/config/`** - Constants and tuning parameters (WORLD physics constants, game modes, key mappings, tuning multipliers)
- **`scripts/scoring/`** - Mission scoring logic
- **`scripts/utils/`** - Math utilities (angle normalization, rotation, seeded random)

### Game Modes
Three distinct modes defined in `config/constants.js`:
- `Modes.INTRO` - Instructions overlay, control checklist
- `Modes.PLAYING` - Active gameplay with physics simulation
- `Modes.ENDED` - Mission report with stats and meters

### Physics System
The Lander class (`scripts/entities/lander.js`) implements physics simulation:
- Gravity, thrust (main and auxiliary), rotation, fuel consumption
- Delta time scaling via `deltaMultiplier = dt / WORLD.frameInterval`
- Terrain collision detection via foot positions and nozzle position
- Landing criteria: velocity ≤ `WORLD.crashVelocity`, angle deviation ≤ `WORLD.safeAngle`, on landing pad

### Terrain System
`scripts/systems/terrain.js` generates procedural terrain with landing pads of varying difficulty. Surface collision is queried via `getSurfaceAt(x)` which returns `{y, type, padId}`.

### Rendering
Canvas rendering uses device pixel ratio scaling. All game entities implement their own `draw(ctx)` methods. The main animation loop uses `requestAnimationFrame`.

### State Management
No frameworks - all state is managed in `scripts/main.js` via closures and module-level variables (mode, inputState, missionStart, etc.).

### Tuning System
`scripts/config/tuning.js` exposes `getEffectiveThrust()` and `getEffectiveMass()` which apply player-adjustable multipliers to physics calculations. UI sliders in `scripts/ui/physicsControls.js` control these values.

## Reference Implementation
The `lunar-lander-ref/` directory contains the original reference implementation. Do not modify files in this directory unless explicitly instructed.