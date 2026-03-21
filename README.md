# Honeywell Anthem Cockpit — Pilot Training Prototype

A browser-based functional prototype that replicates Honeywell Anthem's touch-first cockpit interface, combining AI-driven ATC voice communication with decision-making drills to accelerate pilot proficiency on the next-generation flight deck.

## What It Does

- **Touch-first cockpit interface** — Flight plan editing, frequency tuning, mode selection, and PilotPredict interaction via touch
- **AI-generated ATC voice communication** — Claude API generates contextual ATC instructions; ElevenLabs provides realistic voice via LiveKit; pilots respond via push-to-talk
- **Real-time voice assessment** — Deepgram Nova-2 STT (via LiveKit agent) with word-level timestamps measures readback accuracy, response latency, and phraseology adherence
- **Voice biomarker analysis** — Python agent extracts F0, RMS, MFCC, and spectral features via librosa for cognitive load measurement
- **Decision drills** — Timed scenario based decisions (traffic conflicts, weather diversions, PilotPredict traps) mapped to ICAO CBTA competencies
- **Competency dashboard** — shadcn/ui Charts radar visualization of six CBTA competencies (COM, WLM, SAW, KNO, PSD, FPM) with drill history and cohort comparison

## Problem

The EPIC-to-Anthem transition is not incremental — it is an architectural generation change: touch interfaces replace physical knobs and buttons, AI-driven features (PilotPredict) anticipate pilot inputs, customizable display layouts replace fixed arrangements, and always-on cloud connectivity redefines cockpit workflows. 73% of pilots have inadvertently selected wrong automation modes, and insufficient crew knowledge of automated systems contributed to over one-third of accidents and serious incidents. Dedicated avionics only transition training is poorly standardized.

## Approach

This project was designed through a **multi-agent adversarial debate** (three Claude Code agents) that stress-tested regulatory, infrastructure, and assessment perspectives to produce an integrated training solution. The prototype implements the key concepts from that synthesis.

See [`Final_Synthesis.md`](brain_StormDocuments/Final_Synthesis.md) for the complete training solution design.

## Repository Structure

```
.
├── CLAUDE.md                  # Project development instructions
├── ARCHITECTURE.md            # Full technical architecture
├── Metrics_research.md        # Empirical evidence for assessment metrics
├── brain_StormDocuments/      # Research reports and synthesis
│   ├── Report_A.md            # FAA frameworks, industry practices, AI frontier
│   ├── Report_B.md            # AI-driven ATC voice analysis for pilot evaluation
│   └── Final_Synthesis.md     # Integrated training solution from multi-agent debate
│
├── agent/                     # LiveKit Agent Worker (Python)
│   ├── worker.py              # Agent entry point + room lifecycle
│   ├── stt.py                 # Deepgram Nova-2 via LiveKit STT plugin
│   ├── tts.py                 # ElevenLabs via LiveKit TTS plugin
│   ├── voice_analysis.py      # F0, RMS, MFCC, spectral (librosa)
│   ├── assessment.py          # Confidence-weighted scoring
│   └── prompts/               # ATC controller persona prompt
│
├── supabase/                  # Supabase project config
│   ├── migrations/            # PostgreSQL schema migrations
│   └── functions/             # Edge Functions (Claude API proxy, LiveKit tokens)
│
└── app/                       # Frontend (React + TypeScript)
    └── src/
        ├── components/        # Cockpit panels, voice, drills, assessment
        ├── services/          # ATC engine, LiveKit client, assessment
        ├── stores/            # Zustand state stores
        ├── hooks/             # React hooks (useLiveKit, useDrillRunner, etc.)
        ├── data/              # Drill definitions, flight plans, phraseology
        └── types/             # TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS 4 + CSS variables (Anthem dark theme) |
| State | Zustand |
| Audio infra | LiveKit Cloud + JS SDK (WebRTC) |
| Agent runtime | LiveKit Agents (Python) |
| Voice STT | Deepgram Nova-2 (LiveKit plugin) |
| Voice TTS | ElevenLabs (LiveKit plugin) |
| Voice analysis | librosa + numpy (Python agent) |
| LLM | Claude API |
| Charts | shadcn/ui Charts (Recharts) |
| Backend | Supabase (Postgres + Edge Functions) |

## Getting Started

```bash
# Frontend
cd app
cp .env.example .env       # Add Supabase + LiveKit URLs
pnpm install

# Agent
pip install -r agent/requirements.txt

# Development (3 processes)
supabase start             # Local Supabase (Postgres + Edge Functions)
pnpm dev                   # Starts: Vite (:5173) + LiveKit Agent Worker
```

### Required Configuration

**Client-side** (`app/.env`):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (safe for browser) |
| `VITE_LIVEKIT_URL` | LiveKit Cloud WebSocket URL |

**Server-side** (Supabase Edge Function secrets, set via `supabase secrets set`):

| Secret | Service | Purpose |
|--------|---------|---------|
| `ANTHROPIC_API_KEY` | Anthropic | ATC instruction generation via Claude |
| `ELEVENLABS_API_KEY` | ElevenLabs | Realistic ATC voice synthesis |
| `DEEPGRAM_API_KEY` | Deepgram | Streaming speech-to-text with word timestamps |
| `LIVEKIT_API_KEY` | LiveKit | Room token generation |
| `LIVEKIT_API_SECRET` | LiveKit | Room token signing |

The app degrades gracefully without voice keys — TTS falls back to browser speech synthesis, and drills can run without voice features.

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
