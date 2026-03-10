# Honeywell Anthem Cockpit Training Prototype — Technical Architecture

## System Overview

A browser-based functional prototype that replicates Anthem's touch-first cockpit interface and combines it with AI-driven ATC voice communication and discrete decision-making drills. The system demonstrates how AI-driven assessment, voice-based cognitive load monitoring, and adaptive training concepts from the Final Synthesis can work in practice.

**What this is:** A combined touch-interface procedure trainer + AI-generated ATC voice system + decision drill engine.

**What this is NOT:** A production training product, a certified simulator, or a replacement for instructor-led training.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (React)                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Cockpit  │  │  Voice   │  │  Drill   │  │   Assessment     │   │
│  │  Shell   │  │  Panel   │  │  System  │  │   Dashboard      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │             │                  │             │
│  ┌────┴──────────────┴─────────────┴──────────────────┴─────────┐  │
│  │                     Zustand Stores                            │  │
│  │  cockpit-store │ voice-store │ scenario-store │ assessment    │  │
│  └────┬──────────────┬─────────────┴──────────────────┬─────────┘  │
│       │              │                                │             │
│  ┌────┴──────┐  ┌────┴─────────┐  ┌──────────────────┴─────────┐  │
│  │ Services  │  │    Voice     │  │     Assessment Engine      │  │
│  │ pilot-    │  │ recognition  │  │  readback scoring, CBTA    │  │
│  │ predict   │  │ synthesis    │  │  mapping, latency calc     │  │
│  └───────────┘  └──────┬───────┘  └────────────────────────────┘  │
│                        │                                           │
└────────────────────────┼───────────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────┼───────────────────────────────────────────┐
│              Express API Proxy (localhost:3001)                     │
│                        │                                           │
│  ┌─────────────┐  ┌────┴────────┐  ┌───────────────────────────┐  │
│  │ /api/atc    │  │ /api/tts    │  │ /api/stt/token            │  │
│  │ Claude API  │  │ ElevenLabs  │  │ Deepgram temp auth token  │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┬─────────────┘  │
│         │                │                        │                │
└─────────┼────────────────┼────────────────────────┼────────────────┘
          │                │                        │
          ▼                ▼                        ▼
   Anthropic API    ElevenLabs API          Deepgram API
   (Claude 4.5)    (Text-to-Speech)   (Nova-2 Streaming STT)
```

---

## Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Bundler | Vite 6 | Instant HMR, zero-config for React+TS |
| UI | React 18 + TypeScript | Component model maps naturally to panel-based cockpit layout |
| Styling | Tailwind CSS 4 + CSS variables | Rapid dark aviation theme with design tokens |
| State | Zustand | Domain-sliced stores, surgical re-renders for cockpit panels |
| Voice STT | Deepgram (Nova-2) | Streaming WebSocket, word-level timestamps, keyword boosting |
| Voice TTS | ElevenLabs (Web SpeechSynthesis fallback) | Realistic ATC voice quality |
| LLM | Claude API (@anthropic-ai/sdk) | Contextual ATC instruction generation with scenario awareness |
| Charts | Recharts | Radar chart for CBTA competency visualization |
| Package manager | pnpm | Fast, strict dependency resolution |
| API proxy | Express (minimal) | Keeps API keys server-side |
| Persistence | localStorage | Prototype-grade; same data shapes can lift into DB later |

---

## Directory Structure

```
app/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.example              # ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, DEEPGRAM_API_KEY
├── .gitignore
│
├── server/                   # Express API proxy (runs on :3001)
│   ├── index.ts              # Server entry point, CORS, middleware
│   ├── routes/
│   │   ├── atc.ts            # POST /api/atc — Claude API proxy for ATC generation
│   │   ├── tts.ts            # POST /api/tts — ElevenLabs text-to-speech proxy
│   │   └── stt.ts            # GET /api/stt/token — Deepgram temporary auth token
│   └── prompts/
│       └── atc-system.ts     # ATC controller persona system prompt
│
├── public/
│   └── audio/                # PTT click sound, radio static effect
│
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Root component with tab routing
    ├── globals.css           # Anthem CSS variables and base styles
    │
    ├── types/                # TypeScript type definitions
    │   ├── scenario.ts       # Drill definitions, events, phases
    │   ├── assessment.ts     # Scores, CBTA metrics, session history
    │   ├── cockpit.ts        # Waypoints, frequencies, modes, flight plan
    │   ├── voice.ts          # Transcript entries, voice state, Deepgram types
    │   └── atc.ts            # ATC instruction, expected readback, context
    │
    ├── stores/               # Zustand state stores
    │   ├── cockpit-store.ts  # Active flight plan, frequencies, selected mode
    │   ├── scenario-store.ts # Active drill, current phase, event queue
    │   ├── voice-store.ts    # Transcripts, PTT state, interim results
    │   ├── assessment-store.ts # Scores, session history, CBTA aggregates
    │   └── ui-store.ts       # Active tab, panel visibility, modal state
    │
    ├── services/             # Core business logic (no React dependency)
    │   ├── atc-engine.ts     # Claude API integration for ATC generation
    │   ├── voice-recognition.ts  # Deepgram streaming STT wrapper
    │   ├── voice-synthesis.ts    # ElevenLabs + fallback TTS wrapper
    │   ├── assessment-engine.ts  # Scoring logic (readback, decision, CBTA)
    │   ├── scenario-runner.ts    # Drill lifecycle manager
    │   └── pilot-predict.ts      # Predictive input suggestion logic
    │
    ├── hooks/                # React hooks wrapping services
    │   ├── useATCEngine.ts       # ATC generation + streaming response
    │   ├── useDeepgram.ts        # WebSocket lifecycle + interim results
    │   ├── useVoiceSynthesis.ts  # TTS playback with completion callback
    │   ├── useDrillRunner.ts     # Drill lifecycle orchestration
    │   ├── useTimer.ts           # Countdown / elapsed timer
    │   └── usePilotPredict.ts    # Suggestion trigger + accept/reject
    │
    ├── lib/                  # Pure utilities
    │   ├── anthem-theme.ts   # Theme constants and helpers
    │   ├── scoring.ts        # Fuzzy match, LCS, token comparison
    │   ├── audio-utils.ts    # Audio context, PTT click, radio static
    │   └── storage.ts        # localStorage wrapper with typed keys
    │
    ├── data/                 # Static data (drills are data, not code)
    │   ├── drills/           # 6 drill scenario definitions
    │   │   ├── descent-conflict.ts
    │   │   ├── weather-diversion.ts
    │   │   ├── predict-wrong-freq.ts
    │   │   ├── runway-change.ts
    │   │   ├── holding-pattern.ts
    │   │   └── comms-handoff.ts
    │   ├── flight-plans/     # Sample routes
    │   │   ├── kjfk-kbos.ts
    │   │   └── kteb-kpbi.ts
    │   ├── frequencies.ts    # ATC frequencies by facility
    │   ├── waypoints.ts      # Waypoint database
    │   └── phraseology.ts    # ICAO standard templates for scoring
    │
    └── components/
        ├── layout/           # Page-level structure
        │   ├── CockpitShell.tsx   # Main cockpit frame (dark bg, panel grid)
        │   ├── TopNavBar.tsx      # Tab navigation + session info
        │   └── StatusBar.tsx      # Clock, active freq, drill status
        │
        ├── panels/           # Cockpit instrument panels
        │   ├── FlightPlanPanel.tsx   # Flight plan display + editing
        │   ├── RadiosPanel.tsx       # Frequency tuning + COM/NAV
        │   ├── WaypointRow.tsx       # Single waypoint in flight plan
        │   ├── WaypointEditor.tsx    # Inline waypoint constraint editor
        │   └── FrequencyTuner.tsx    # Touch-based frequency selector
        │
        ├── controls/         # Cockpit control elements
        │   ├── ModeSelectionBar.tsx    # NAV/APR/HDG/ALT mode buttons
        │   ├── TouchNumpad.tsx        # Numeric input overlay
        │   ├── TouchKeyboard.tsx      # Alpha input overlay
        │   ├── PilotPredict.tsx       # Predictive scratchpad
        │   └── PredictSuggestion.tsx  # Individual suggestion chip
        │
        ├── voice/            # Voice communication interface
        │   ├── VoicePanel.tsx         # Voice section container
        │   ├── PTTButton.tsx          # Push-to-talk button
        │   ├── TranscriptDisplay.tsx  # Scrolling conversation log
        │   └── VoiceStatus.tsx        # Connection/recording indicator
        │
        ├── drill/            # Drill execution interface
        │   ├── DrillSelector.tsx      # Drill picker grid
        │   ├── DrillCard.tsx          # Individual drill summary card
        │   ├── DrillBriefing.tsx      # Pre-drill briefing screen
        │   ├── DrillTimer.tsx         # Countdown / elapsed timer display
        │   ├── DecisionPrompt.tsx     # Timed decision-point modal
        │   └── DrillOutcome.tsx       # Post-drill results screen
        │
        ├── assessment/       # Assessment and scoring views
        │   ├── AssessmentDashboard.tsx  # Main assessment view
        │   ├── CompetencyRadar.tsx      # CBTA radar chart (Recharts)
        │   ├── DrillMetricsCard.tsx     # Metrics for a single drill run
        │   └── SessionSummary.tsx       # Aggregate session stats
        │
        └── shared/           # Reusable UI primitives
            ├── AnthemButton.tsx   # Styled button (touch-optimized)
            ├── AnthemCard.tsx     # Styled card container
            └── AnthemInput.tsx    # Styled input field
```

---

## Deepgram STT Integration

### Why Deepgram Over Web Speech API

| Criterion | Deepgram Nova-2 | Web Speech API |
|-----------|-----------------|----------------|
| Accuracy | ~8% WER general, improved with keyword boosting | ~15-20% WER, no tuning |
| Streaming | WebSocket with interim + final results | Event-based, inconsistent timing |
| Word timestamps | Per-word ms-level timestamps | Not available |
| Keyword boosting | Boost aviation terms (callsigns, waypoints) | Not supported |
| Browser support | All browsers (WebSocket) | Chrome-only reliable |
| API key security | Server-side token provisioning | N/A (browser-native) |

### Connection Flow

```
1. Pilot presses PTT button
       ↓
2. Browser calls GET /api/stt/token on Express proxy
       ↓
3. Express proxy calls Deepgram API to create temporary auth token
   (scoped, short-lived, limited permissions)
       ↓
4. Token returned to browser
       ↓
5. Browser opens WebSocket directly to Deepgram using temp token
   wss://api.deepgram.com/v1/listen?model=nova-2&...
       ↓
6. Browser captures mic audio via MediaRecorder API (16kHz, mono, linear16)
       ↓
7. Audio chunks streamed to Deepgram via WebSocket
       ↓
8. Deepgram returns messages:
   - { type: "Results", is_final: false, ... } → interim transcript
   - { type: "Results", is_final: true, ... }  → final transcript with word timestamps
       ↓
9. voice-recognition.ts processes results → updates voice-store
       ↓
10. Pilot releases PTT → WebSocket closed → final transcript committed
       ↓
11. assessment-engine.ts scores readback using final transcript + timestamps
```

### Deepgram Connection Configuration

```typescript
// Options passed when opening the Deepgram WebSocket
const deepgramOptions = {
  model: "nova-2",
  language: "en",
  smart_format: true,
  punctuate: false,          // Aviation comms don't use punctuation
  interim_results: true,     // Show live transcript as pilot speaks
  utterance_end_ms: 1500,    // Detect end of utterance for auto-commit
  channels: 1,
  sample_rate: 16000,
  encoding: "linear16",
  // Dynamic per-drill keyword boosting:
  keywords: [
    "flight level",
    "descend and maintain",
    "climb and maintain",
    "roger",
    "wilco",
    "squawk",
    "approach",
    "departure",
    "tower",
    "ground",
    // + injected per drill: callsign, active frequencies, waypoint IDs
  ],
};
```

### Latency Measurement

Deepgram provides per-word timestamps in its final transcript response. This enables precise response latency measurement:

```typescript
// After TTS plays ATC instruction:
const atcSpeakEnd: number = Date.now(); // When TTS audio finishes

// After Deepgram returns final transcript:
const firstWordStart: number = deepgramResult.channel.alternatives[0].words[0].start;
// firstWordStart is relative to the start of the audio stream

// Combined with the PTT press timestamp:
const pttPressTime: number = voiceStore.pttPressTimestamp;
const responseLatency: number = pttPressTime - atcSpeakEnd;
// Plus: time from PTT press to first word (Deepgram word[0].start) for speech onset

// Assessment thresholds (from Report B):
// > 400ms onset after PTT: normal
// < 400ms: possibly pre-rehearsed or overlapping
// > 3000ms: elevated cognitive load indicator
```

---

## ElevenLabs TTS Integration

### Architecture

```
atc-engine.ts generates instruction text
       ↓
voice-synthesis.ts sends text to Express proxy
       ↓
POST /api/tts { text, voice_id }
       ↓
Express proxy calls ElevenLabs API with server-side key
       ↓
Returns audio/mpeg stream
       ↓
Browser plays via AudioContext
       ↓
On playback complete → triggers PTT availability + starts latency timer
```

### Fallback

If ElevenLabs API is unavailable or no API key configured, falls back to `window.speechSynthesis` (Web Speech API TTS). Quality is lower but functional for development and demo without API keys.

### Voice Selection

Uses a male voice with moderate pace and slightly clipped cadence to simulate ATC radio communication style. Radio static audio overlay applied before and after speech to reinforce the communication context.

---

## Claude API — ATC Generation

### System Prompt Design

The ATC persona prompt (`server/prompts/atc-system.ts`) establishes:

- **Role:** TRACON or Center controller for the scenario's airspace
- **Facility and sector:** Derived from the drill's geographic context
- **Callsign format:** Standard FAA format (e.g., "November-one-two-three-four-alpha")
- **Phraseology rules:** ICAO/FAA standard phrases only, no conversational language
- **Scenario constraints:** What the controller knows (traffic, weather, runway status) passed per drill
- **Expected behavior:** Issue one instruction at a time, wait for readback, correct errors

### Request Flow

```typescript
// atc-engine.ts
async function generateATCInstruction(context: ATCContext): Promise<ATCInstruction> {
  const response = await fetch('/api/atc', {
    method: 'POST',
    body: JSON.stringify({
      systemPrompt: buildSystemPrompt(context.facility, context.sector),
      messages: context.conversationHistory,
      drillConstraints: context.drill.atcConstraints,
      pilotCallsign: context.callsign,
      currentState: {
        altitude: context.altitude,
        heading: context.heading,
        frequency: context.frequency,
        phase: context.flightPhase,
      },
    }),
  });
  // Returns: { instruction: string, expectedReadback: string, requiredActions: Action[] }
}
```

### Expected Readback Generation

Claude generates both the ATC instruction and the expected pilot readback. The expected readback is used by the assessment engine for scoring — it is NOT shown to the pilot. The assessment engine uses fuzzy matching against it, accounting for STT transcription errors.

---

## Zustand Store Design

### Store Slices

```typescript
// cockpit-store.ts — Aircraft and cockpit instrument state
interface CockpitStore {
  flightPlan: Waypoint[];
  activeFrequency: Frequency;
  standbyFrequency: Frequency;
  selectedMode: CockpitMode; // NAV | APR | HDG | ALT | VS
  altitude: number;
  heading: number;
  speed: number;
  // Actions
  setFrequency: (freq: Frequency, slot: 'active' | 'standby') => void;
  swapFrequencies: () => void;
  updateWaypoint: (index: number, waypoint: Partial<Waypoint>) => void;
  setMode: (mode: CockpitMode) => void;
  setAltitude: (alt: number) => void;
}

// scenario-store.ts — Active drill state
interface ScenarioStore {
  availableDrills: DrillDefinition[];
  activeDrill: DrillDefinition | null;
  phase: DrillPhase; // 'idle' | 'briefing' | 'active' | 'decision' | 'outcome'
  currentEventIndex: number;
  eventResults: EventResult[];
  startTime: number | null;
  // Actions
  selectDrill: (drillId: string) => void;
  startDrill: () => void;
  advanceEvent: () => void;
  recordEventResult: (result: EventResult) => void;
  completeDrill: () => void;
}

// voice-store.ts — Voice communication state
interface VoiceStore {
  isPTTPressed: boolean;
  isRecording: boolean;
  isATCSpeaking: boolean;
  interimTranscript: string;
  transcriptHistory: TranscriptEntry[];
  pttPressTimestamp: number | null;
  atcSpeakEndTimestamp: number | null;
  deepgramConnected: boolean;
  // Actions
  pressPTT: () => void;
  releasePTT: () => void;
  setInterimTranscript: (text: string) => void;
  commitTranscript: (entry: TranscriptEntry) => void;
  setATCSpeaking: (speaking: boolean) => void;
}

// assessment-store.ts — Scoring and metrics
interface AssessmentStore {
  currentDrillMetrics: DrillMetrics | null;
  sessionHistory: DrillResult[];
  cbta: CBTAScores; // COM, WLM, SAW, KNO, PSD, FPM — each 0-100
  // Actions
  recordReadbackScore: (score: ReadbackScore) => void;
  recordDecisionScore: (score: DecisionScore) => void;
  recordTouchScore: (score: TouchScore) => void;
  finalizeDrillMetrics: () => void;
  loadFromStorage: () => void;
}

// ui-store.ts — UI state
interface UIStore {
  activeTab: 'cockpit' | 'drills' | 'assessment';
  activePanel: 'flight-plan' | 'radios';
  numpadOpen: boolean;
  numpadTarget: string | null;
  // Actions
  setActiveTab: (tab: string) => void;
  setActivePanel: (panel: string) => void;
  openNumpad: (target: string) => void;
  closeNumpad: () => void;
}
```

### Store Interaction Pattern

Stores are independent slices. Services read from stores directly (Zustand's `getState()`), and components subscribe to specific fields via selectors to avoid unnecessary re-renders.

```
Component → useStore(selector) → reactive to specific field
Service  → store.getState()   → reads snapshot, no subscription
Service  → store.setState()   → writes update, triggers subscriptions
```

---

## Drill Scenario Schema

### Type Definition

```typescript
interface DrillDefinition {
  id: string;
  title: string;
  description: string;
  duration: number;              // Expected duration in seconds (180-300)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  competencies: CBTACompetency[]; // Which CBTA areas this drill tests
  flightPlan: string;            // Reference to flight plan data file
  initialState: CockpitState;    // Cockpit state at drill start
  events: DrillEvent[];          // Ordered sequence of events
  atcContext: {
    facility: string;            // e.g., "New York TRACON"
    sector: string;              // e.g., "Approach Control"
    callsign: string;            // Pilot's callsign
    traffic: string[];           // Other traffic for context
    weather: string;             // METAR or description
  };
}

type DrillEvent =
  | ATCInstructionEvent
  | DecisionPointEvent
  | PredictSuggestionEvent
  | CockpitActionEvent;

interface ATCInstructionEvent {
  type: 'atc_instruction';
  prompt: string;                // Context hint for Claude to generate instruction
  expectedActions: CockpitAction[]; // What pilot should do after readback
  keywords: string[];            // Additional Deepgram keyword boosts for this event
}

interface DecisionPointEvent {
  type: 'decision_point';
  prompt: string;                // Situation description shown to pilot
  options: DecisionOption[];     // 2-4 choices
  correctOptionId: string;
  timeLimitSeconds: number;      // Decision timer (15-30s typical)
}

interface PredictSuggestionEvent {
  type: 'predict_suggestion';
  suggestion: string;            // What PilotPredict suggests (intentionally wrong)
  correctAction: string;         // What pilot should actually do
  context: string;               // Why the suggestion is wrong
}

interface CockpitActionEvent {
  type: 'cockpit_action';
  instruction: string;           // What to tell the pilot to do
  expectedAction: CockpitAction; // The correct touch action
  timeLimitSeconds: number;
}
```

### Example Drill: Descent with Traffic Conflict

```typescript
const descentConflict: DrillDefinition = {
  id: 'descent-conflict',
  title: 'Descent with Traffic Conflict',
  description: 'ATC clears descent to FL240 while TCAS shows traffic at FL340. ' +
    'Tests situational awareness, problem solving, and communication.',
  duration: 240,
  difficulty: 'intermediate',
  competencies: ['SAW', 'PSD', 'COM'],
  flightPlan: 'kjfk-kbos',
  initialState: {
    altitude: 36000,
    heading: 045,
    speed: 280,
    activeFrequency: { value: 124.35, label: 'Boston Center' },
    selectedMode: 'NAV',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt: 'Clear the aircraft to descend and maintain FL240. ' +
        'There is traffic at FL340 that the pilot should be aware of.',
      expectedActions: [
        { type: 'set_altitude', value: 24000 },
      ],
      keywords: ['flight level two four zero', 'FL240', 'traffic'],
    },
    {
      type: 'decision_point',
      prompt: 'TCAS shows traffic at FL340, 12nm ahead, same track. ' +
        'ATC has cleared you to FL240. What do you do?',
      options: [
        { id: 'a', text: 'Begin descent immediately as cleared' },
        { id: 'b', text: 'Query ATC about traffic before descending' },
        { id: 'c', text: 'Ignore ATC clearance and maintain FL360' },
        { id: 'd', text: 'Request a lateral offset to avoid traffic' },
      ],
      correctOptionId: 'b',
      timeLimitSeconds: 20,
    },
    {
      type: 'atc_instruction',
      prompt: 'Confirm traffic is no factor and re-clear the descent to FL240.',
      expectedActions: [
        { type: 'set_altitude', value: 24000 },
        { type: 'set_mode', value: 'VS' },
      ],
      keywords: ['traffic no factor', 'FL240'],
    },
  ],
  atcContext: {
    facility: 'Boston Center',
    sector: 'Sector 33',
    callsign: 'November-one-two-three-four-alpha',
    traffic: ['Delta 1492 at FL340, 12nm ahead, same track'],
    weather: 'VMC, clear skies, winds 270/35',
  },
};
```

---

## Assessment Engine

### Readback Scoring

Uses fuzzy token comparison with critical-element weighting. Even with Deepgram's improved accuracy, STT isn't perfect — the scoring algorithm accounts for transcription errors.

```typescript
interface ReadbackScore {
  accuracy: number;         // 0-100, weighted token match
  latency: number;          // ms, from ATC speak end to pilot first word
  phraseology: number;      // 0-100, ICAO standard phrase adherence
  callsignCorrect: boolean; // Did pilot include correct callsign?
  criticalElements: {       // Per-element scoring
    element: string;        // e.g., "FL240", "descend and maintain"
    matched: boolean;
    weight: number;         // Critical elements weighted higher
  }[];
}
```

**Scoring algorithm:**
1. Tokenize expected readback and actual transcript
2. Identify critical elements (altitudes, headings, frequencies, callsign) — weight 2x
3. Run longest common subsequence (LCS) on token sequences
4. Calculate weighted match percentage
5. Apply phraseology bonus for standard ICAO phrasing
6. Deduct for incorrect or omitted callsign

### CBTA Competency Mapping

Each drill maps to 2-3 CBTA competencies. Individual event scores roll up into competency scores:

| Competency | Code | Measured By |
|-----------|------|-------------|
| Communication | COM | Readback accuracy, phraseology, callsign usage, response latency |
| Workload Management | WLM | Task completion time, sequential task ordering, multitask performance |
| Situational Awareness | SAW | Decision correctness when given conflicting information, PilotPredict trap detection |
| Knowledge | KNO | Procedural correctness, PilotPredict trap detection, holding pattern entry |
| Problem Solving & Decision Making | PSD | Decision correctness, time-to-decision, option quality |
| Flight Path Management | FPM | Flight plan modifications, altitude/heading selections, mode selections |

**Aggregation:** Weighted rolling average across drill attempts, stored in localStorage. Radar chart displays all six competencies on a 0-100 scale.

### Decision Scoring

```typescript
interface DecisionScore {
  correct: boolean;
  timeToDecision: number;    // ms from prompt display to selection
  timedOut: boolean;         // Did the timer expire?
  optionSelected: string;    // Which option was chosen
}
```

### PilotPredict Trap Scoring

```typescript
interface TrapScore {
  detected: boolean;         // Did pilot reject the wrong suggestion?
  timeToReject: number;      // ms (if rejected)
  acceptedWrong: boolean;    // Did pilot accept the trap?
}
```

---

## Anthem CSS Theme

Derived from Anthem cockpit visual design — dark background with cyan, green, and magenta accent colors.

```css
:root {
  /* Background layers */
  --anthem-bg-primary: #0a0e17;      /* Main cockpit background */
  --anthem-bg-secondary: #111827;    /* Panel background */
  --anthem-bg-tertiary: #1a2235;     /* Card/elevated surface */
  --anthem-bg-input: #0d1321;        /* Input field background */

  /* Primary accent — Cyan (active elements, selected state) */
  --anthem-cyan: #00d4ff;
  --anthem-cyan-dim: #0891b2;
  --anthem-cyan-glow: rgba(0, 212, 255, 0.15);

  /* Secondary accent — Green (positive/confirmed state) */
  --anthem-green: #22c55e;
  --anthem-green-dim: #16a34a;

  /* Tertiary accent — Magenta (warnings, attention) */
  --anthem-magenta: #e040fb;
  --anthem-magenta-dim: #ab47bc;

  /* Alert — Amber (cautions) */
  --anthem-amber: #f59e0b;

  /* Alert — Red (warnings) */
  --anthem-red: #ef4444;

  /* Text hierarchy */
  --anthem-text-primary: #e2e8f0;    /* Primary text */
  --anthem-text-secondary: #94a3b8;  /* Secondary/label text */
  --anthem-text-muted: #475569;      /* Disabled/inactive text */

  /* Borders */
  --anthem-border: #1e293b;
  --anthem-border-active: #00d4ff;

  /* Touch targets */
  --anthem-touch-min: 44px;          /* Minimum touch target size */

  /* Typography */
  --anthem-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --anthem-font-sans: 'Inter', system-ui, sans-serif;
}
```

### Design Principles

- **Dark-first:** All backgrounds are dark navy/charcoal. No light mode.
- **High contrast text:** Primary text is near-white on dark backgrounds.
- **Color-coded states:** Cyan = active/selected, Green = confirmed/correct, Magenta = attention/highlight, Amber = caution, Red = warning/error.
- **Touch-optimized:** All interactive elements minimum 44x44px. Generous padding. Ripple feedback on touch.
- **Monospace data:** Frequencies, altitudes, waypoint IDs displayed in monospace font. Labels in sans-serif.
- **Glow effects:** Active elements use subtle cyan glow (box-shadow) to simulate avionics display aesthetic.

---

## API Proxy Server

### Express Server Design

Minimal Express server running on port 3001 alongside Vite dev server on 5173. Started together via `concurrently` in `pnpm dev`.

```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import { atcRouter } from './routes/atc';
import { ttsRouter } from './routes/tts';
import { sttRouter } from './routes/stt';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/atc', atcRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/stt', sttRouter);

app.listen(3001, () => console.log('API proxy running on :3001'));
```

### Routes

**POST /api/atc** — Proxies to Claude API. Accepts scenario context, returns ATC instruction + expected readback.

**POST /api/tts** — Proxies to ElevenLabs. Accepts text, returns audio stream (audio/mpeg).

**GET /api/stt/token** — Calls Deepgram's API to provision a short-lived temporary authentication token. Returns the token to the browser, which then opens a direct WebSocket to Deepgram. The token is scoped and expires quickly, so even if intercepted, exposure is minimal.

### Security

- All API keys stored in `.env` file (server-side only, never bundled by Vite)
- `.env` is in `.gitignore`
- `.env.example` documents required keys without values
- Deepgram uses temporary token pattern — the actual API key never reaches the browser
- CORS restricted to localhost in development

---

## Data Flow Diagrams

### ATC Drill Cycle

```
┌─────────────┐
│ DrillStart  │
└──────┬──────┘
       ▼
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│ ScenarioRunner│────▶│  atc-engine  │────▶│  Claude API   │
│ reads next   │     │  builds ctx  │     │  (via proxy)  │
│ event        │     └──────┬───────┘     └───────┬───────┘
└──────────────┘            │                     │
                            ▼                     ▼
                   ┌────────────────┐    ATC instruction +
                   │ voice-synthesis│    expected readback
                   │ (ElevenLabs)  │
                   └───────┬────────┘
                           ▼
                   Audio plays through speakers
                   atcSpeakEnd timestamp recorded
                           │
                           ▼
                   ┌────────────────┐
                   │  Pilot hears,  │
                   │  presses PTT   │
                   └───────┬────────┘
                           ▼
                   ┌────────────────┐     ┌──────────────┐
                   │ voice-recog    │────▶│   Deepgram   │
                   │ (WebSocket)    │◀────│   Nova-2     │
                   └───────┬────────┘     └──────────────┘
                           │
                    interim transcripts
                    + final with timestamps
                           │
                           ▼
                   ┌────────────────┐
                   │  assessment    │
                   │  engine scores │
                   │  readback      │
                   └───────┬────────┘
                           ▼
                   ┌────────────────┐
                   │ Next event or  │
                   │ drill complete │
                   └────────────────┘
```

### PilotPredict Flow

```
ScenarioRunner triggers predict_suggestion event
       ↓
pilot-predict service generates suggestion
(intentionally wrong for training trap)
       ↓
PilotPredict component shows suggestion chip
       ↓
       ├── Pilot REJECTS → assessment: trap detected ✓
       │                    correct action prompted
       │
       └── Pilot ACCEPTS → assessment: trap missed ✗
                            feedback shown, correct action explained
```

### Assessment Pipeline

```
Event scores (per-event)
  ├── ReadbackScore (accuracy, latency, phraseology)
  ├── DecisionScore (correct, time, timed_out)
  ├── TrapScore (detected, time_to_reject)
  └── TouchScore (correct, task_time, errors)
       │
       ▼
DrillMetrics (per-drill aggregate)
  ├── Overall score (0-100)
  ├── Per-event breakdown
  └── Per-competency scores
       │
       ▼
CBTAScores (rolling session aggregate)
  ├── COM: 0-100
  ├── WLM: 0-100
  ├── SAW: 0-100
  ├── KNO: 0-100
  ├── PSD: 0-100
  └── FPM: 0-100
       │
       ▼
localStorage persistence
  ├── Session history (last 50 drill results)
  └── CBTA running averages
```

---

## Component Hierarchy

```
App
├── TopNavBar (tabs: Cockpit | Drills | Assessment)
├── StatusBar (clock, active freq, drill status)
│
├── [tab: cockpit]
│   └── CockpitShell
│       ├── ModeSelectionBar
│       ├── [panel: flight-plan]
│       │   └── FlightPlanPanel
│       │       ├── WaypointRow (×N)
│       │       └── WaypointEditor (inline)
│       ├── [panel: radios]
│       │   └── RadiosPanel
│       │       └── FrequencyTuner
│       ├── PilotPredict
│       │   └── PredictSuggestion (×N)
│       ├── VoicePanel
│       │   ├── TranscriptDisplay
│       │   ├── PTTButton
│       │   └── VoiceStatus
│       └── TouchNumpad (overlay, conditional)
│
├── [tab: drills]
│   ├── DrillSelector
│   │   └── DrillCard (×6)
│   ├── DrillBriefing (when drill selected)
│   ├── [during active drill — switches to cockpit tab with overlay]
│   │   ├── DrillTimer
│   │   └── DecisionPrompt (modal, conditional)
│   └── DrillOutcome (when drill complete)
│
└── [tab: assessment]
    └── AssessmentDashboard
        ├── CompetencyRadar
        ├── DrillMetricsCard (×N, recent drills)
        └── SessionSummary
```

---

## Build and Dev Commands

```bash
# Install dependencies
pnpm install

# Development (starts both Vite and Express proxy via concurrently)
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

The Vite dev server proxies `/api` requests to the Express server, so the browser only talks to one origin (localhost:5173) and API calls transparently route to Express on 3001.

---

## Key Architectural Decisions

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| STT provider | Deepgram Nova-2 | Web Speech API | Word timestamps for latency, keyword boosting for aviation terms, cross-browser |
| TTS provider | ElevenLabs + fallback | Web Speech API only | Realistic ATC voice; fallback keeps prototype functional without API key |
| ATC generation | Claude API (live) | Pre-scripted responses | Natural variation per drill run; drill definitions constrain scope |
| State management | Zustand | Redux / React Context | Surgical re-renders needed; minimal boilerplate; no provider nesting |
| Persistence | localStorage | SQLite / Postgres | Prototype-grade; data shapes can lift to DB without refactor |
| API key handling | Server-side proxy | Browser env vars | Security; Deepgram temp token pattern minimizes exposure |
| Readback scoring | Fuzzy LCS match | Exact string match | STT imperfect even with Deepgram; must tolerate transcription variance |
| Drill definitions | Declarative data objects | Imperative code | Easier to author new drills; separates content from execution logic |
| CSS approach | Tailwind + CSS variables | CSS-in-JS / styled-components | Fast iteration; theme variables enable consistent Anthem aesthetic |
