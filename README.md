# Honeywell Anthem Cockpit — Pilot Training Prototype

A browser-based functional prototype that replicates Honeywell Anthem's touch-first cockpit interface, combining AI-driven ATC voice communication with decision-making drills to accelerate pilot proficiency on the next-generation flight deck.

## What It Does

- **Touch-first cockpit interface** — Flight plan editing, frequency tuning, mode selection, and PilotPredict interaction via touch
- **AI-generated ATC voice communication** — Claude API generates contextual ATC instructions; ElevenLabs provides realistic voice; pilots respond via push-to-talk
- **Real-time voice assessment** — Deepgram Nova-2 streaming STT with word-level timestamps measures readback accuracy, response latency, and phraseology adherence
- **Decision drills** — Timed scenario-based decisions (traffic conflicts, weather diversions, PilotPredict traps) mapped to ICAO CBTA competencies
- **Competency dashboard** — Radar chart visualization of six CBTA competencies (COM, WLM, SAW, KNO, PSD, FPM) with drill history

## Problem

The EPIC-to-Anthem transition is not incremental — it is an architectural generation change: touch interfaces replace physical knobs and buttons, AI-driven features (PilotPredict) anticipate pilot inputs, customizable display layouts replace fixed arrangements, and always-on cloud connectivity redefines cockpit workflows. 73% of pilots have inadvertently selected wrong automation modes, and insufficient crew knowledge of automated systems contributed to over one-third of accidents and serious incidents. Dedicated avionics-only transition training is poorly standardized.

## Approach

This project was designed through a **multi-agent adversarial debate** (three Claude Code agents) that stress-tested regulatory, infrastructure, and assessment perspectives to produce an integrated training solution. The prototype implements the key concepts from that synthesis.

See [`Final_Synthesis.md`](Final_Synthesis.md) for the complete training solution design.

## Repository Structure

```
.
├── CLAUDE.md              # Project development instructions
├── ARCHITECTURE.md        # Full technical architecture
├── README.md              # This file
├── Report_A.md            # Research: FAA frameworks, industry practices, AI frontier
├── Report_B.md            # Research: AI-driven ATC voice analysis for pilot evaluation
├── Final_Synthesis.md     # Integrated training solution from multi-agent debate
│
└── app/                   # Prototype application
    ├── server/            # Express API proxy (Claude, ElevenLabs, Deepgram)
    └── src/               # React + TypeScript frontend
        ├── components/    # Cockpit panels, voice, drills, assessment
        ├── services/      # ATC engine, voice recognition/synthesis, assessment
        ├── stores/        # Zustand state stores
        ├── data/          # Drill definitions, flight plans, phraseology
        └── types/         # TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS 4 + CSS variables (Anthem dark theme) |
| State | Zustand |
| Voice STT | Deepgram Nova-2 (streaming WebSocket) |
| Voice TTS | ElevenLabs (Web SpeechSynthesis fallback) |
| LLM | Claude API |
| Charts | Recharts |
| API proxy | Express |

## Getting Started

```bash
cd app
cp .env.example .env       # Add your API keys
pnpm install
pnpm dev                   # Starts frontend (:5173) + API proxy (:3001)
```

### Required API Keys

| Key | Service | Purpose |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | Anthropic | ATC instruction generation via Claude |
| `ELEVENLABS_API_KEY` | ElevenLabs | Realistic ATC voice synthesis |
| `DEEPGRAM_API_KEY` | Deepgram | Streaming speech-to-text with word timestamps |

The app degrades gracefully without keys — TTS falls back to browser speech synthesis, and drills can run without voice features.

## Six Starter Drills

1. **Descent with Traffic Conflict** — ATC clears descent while TCAS shows traffic. Tests: SAW, PSD, COM
2. **Weather Diversion** — Destination weather drops below minimums mid-approach. Tests: PSD, COM, WLM
3. **PilotPredict Wrong Frequency** — PilotPredict suggests wrong ATC frequency during handoff. Tests: SAW, KNO
4. **Runway Change** — ATC assigns new runway, pilot must update approach. Tests: FPM, COM, WLM
5. **Holding Pattern Entry** — ATC issues hold, pilot determines entry type. Tests: KNO, FPM, COM
6. **Comms Handoff** — Frequency change to approach control with readback. Tests: COM, WLM

## Key Data Points

| Metric | Value | Source |
|--------|-------|--------|
| Pilot inadvertent mode selection rate | 73% | 1999 Australian survey (Report A) |
| Accidents linked to insufficient automation knowledge | >33% | PARC/CAST (Report A) |
| Controller speech recognition WER | 3–5% | HAAWAII (Report B) |
| Pilot speech recognition WER | 8–10% | HAAWAII (Report B) |
| ICAO Communication OBs automatable | 9 of 10 | IATA framework (Report B) |
| Cognitive load F0 shift | +7–12 Hz | Huttunen et al. (Report B) |

## Status

- Research & Debate: Complete
- Final Synthesis: Complete
- Architecture: Complete
- Prototype: In development
