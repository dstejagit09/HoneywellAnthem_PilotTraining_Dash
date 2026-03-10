# Honeywell Anthem Cockpit — Pilot Training Prototype

## Project Overview

A browser-based functional prototype that replicates Honeywell Anthem's touch-first cockpit interface combined with AI-driven ATC voice communication and decision-making drills. Demonstrates how AI-based assessment, voice-based cognitive load monitoring, and competency-based training concepts can accelerate pilot proficiency on the Anthem flight deck.

**Target users:** Business aviation pilots (Part 91/135) transitioning from legacy Primus EPIC to Anthem.

**This is a prototype** — localStorage persistence, no auth, no database. Designed to demonstrate the concept, not serve as production training software.

## Research Foundation

- `Report_A.md` — FAA regulatory architecture, industry training ecosystem, and structural gaps blocking AI-driven training credit
- `Report_B.md` — AI-driven voice analysis for pilot assessment, cognitive load biomarkers, CBTA competency mapping
- `Final_Synthesis.md` — Integrated training solution produced by multi-agent adversarial debate (completed)

The multi-agent debate protocol that produced the synthesis has been retired. This file now serves as development instructions.

## Architecture

See `ARCHITECTURE.md` for the full technical architecture including system diagrams, data flows, store design, drill schema, assessment engine, and Deepgram/ElevenLabs/Claude API integration details.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bundler | Vite 6 |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS 4 + CSS variables |
| State | Zustand |
| Voice STT | Deepgram (Nova-2 streaming) |
| Voice TTS | ElevenLabs (Web SpeechSynthesis fallback) |
| LLM | Claude API (@anthropic-ai/sdk) |
| Charts | Recharts |
| Package manager | pnpm |
| API proxy | Express |

## Development Rules

### TypeScript
- Strict mode — no `any` types
- All types in `src/types/` directory
- Export types from barrel files

### State Management
- Zustand for all shared state — no prop drilling, no React Context for shared state
- Domain-sliced stores: cockpit, scenario, voice, assessment, ui
- Components subscribe via selectors for surgical re-renders
- Services use `getState()` for snapshot reads

### API Keys
- All API keys server-side in Express proxy — never exposed in browser code
- Deepgram uses temporary token pattern (server provisions short-lived token, browser connects directly)
- `.env` for keys, `.env.example` documents required variables without values

### Voice / STT
- Deepgram Nova-2 for speech-to-text — use keyword boosting for aviation terms per drill
- Keyword lists are dynamic: base aviation vocabulary + drill-specific terms (callsigns, waypoints, frequencies)
- Account for STT imperfection — readback scoring uses fuzzy matching, not exact comparison

### UI / Touch
- Every interactive element minimum 44x44px touch target
- Anthem visual fidelity — dark theme with cyan/green/magenta palette (see `globals.css` and `ARCHITECTURE.md`)
- Monospace font for data (frequencies, altitudes, waypoints), sans-serif for labels
- No light mode

### Drills
- Drill definitions are declarative data objects in `src/data/drills/` — not imperative code
- Each drill: 3-5 minutes, 1 primary decision point, 1-2 ATC voice exchanges, 1-2 cockpit touch actions
- PilotPredict traps are intentionally wrong suggestions — tests whether pilot blindly trusts AI

### Assessment
- Scoring uses fuzzy token matching with critical-element weighting (altitudes, headings, frequencies weighted 2x)
- CBTA competencies: COM, WLM, SAW, KNO, PSD, FPM — each 0-100
- Response latency measured via Deepgram word-level timestamps
- Instructor authority is non-negotiable — AI assessment is decision-support, never autonomous grading

## Approved Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Start frontend (Vite) + API proxy (Express) via concurrently
pnpm build         # Production build
pnpm test          # Run tests
pnpm lint          # Lint check
```

## Domain Context

### What is Honeywell Anthem?

Anthem is a clean-sheet, cloud-native integrated flight deck — Honeywell's first new core avionics architecture in over two decades:

- **Touch-first interface** replacing traditional knobs, buttons, and mode selection panels
- **Always-on cloud connectivity** via Integrated Network Server Unit (SATCOM, cellular, Wi-Fi, Bluetooth)
- **Pilot-customizable display layouts** replacing fixed OEM-defined arrangements
- **PilotPredict** AI-driven smart scratchpad anticipating pilot inputs
- **Connected Mission Manager** proactively pushing information by flight phase

Anthem is **not yet FAA-certified** as of March 2026. **Primus Epic 3.0** (launching 2026) is the bridging product incorporating Anthem-like features into the existing Epic architecture.

### Why Training Matters

The EPIC-to-Anthem transition is an architectural generation change. 73% of pilots have inadvertently selected wrong automation modes, and insufficient crew knowledge of automated systems contributed to over one-third of accidents and serious incidents. The accent problem in pilot speech recognition (8-10% WER vs 3-5% for controllers) must be honestly addressed — keyword boosting helps but doesn't solve it.

## Key Terms

| Term | Definition |
|------|-----------|
| **AQP** | Advanced Qualification Program (Part 121 Subpart Y) |
| **CBTA** | Competency-Based Training and Assessment (ICAO/IATA) |
| **EBT** | Evidence-Based Training (ICAO Doc 9995) |
| **FSB** | Flight Standardization Board |
| **FSTD** | Flight Simulation Training Device |
| **WER** | Word Error Rate — STT accuracy metric |
| **Epic 3.0** | Honeywell's bridging product (Anthem features in Epic architecture) |
| **PilotPredict** | Anthem's AI-driven smart scratchpad |
| **F0** | Fundamental frequency — primary voice indicator of cognitive load |
| **COM** | Communication competency |
| **WLM** | Workload Management competency |
| **SAW** | Situational Awareness competency |
| **KNO** | Knowledge competency |
| **PSD** | Problem Solving & Decision Making competency |
| **FPM** | Flight Path Management competency |

## Constraints

- Must work for **Part 91 and Part 135 operators** — AQP (Part 121 only) is not the default pathway
- **Instructor authority is non-negotiable** — AI assessment is decision-support only
- Anthem is **not yet certified** — no FSB activity, qualified FTD, or formal transition syllabus exists
- Training approach should build progressively: **Epic → Epic 3.0 → Anthem**
- This is a **prototype** — localStorage for persistence, no authentication, no backend database
- Must work on **touch screens** (large monitors + tablets)
- Be **technically honest** about what is achievable today vs. what requires further development
