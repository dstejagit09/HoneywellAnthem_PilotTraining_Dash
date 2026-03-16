# Demo Script — Anthem Cockpit Pilot Training Prototype

> Approximately 8 minutes. Designed for Honeywell leadership audience.

## Setup

1. Open browser to `localhost:5173`
2. Ensure dark theme is visible (Anthem UI)
3. Have seed data pre-loaded (4 pilots with drill history)

## Act 1: The Cockpit (1 min)

**Goal**: Show Anthem visual fidelity and touch-first design.

1. **Cockpit tab** is active by default
2. Point out the dark theme with cyan/green/magenta palette — matches Anthem design language
3. Show **Flight Plan panel** — scrollable waypoint list with touch editing
4. Show **Radios panel** — active/standby frequencies with swap
5. Show **Mode Selection bar** — NAV/APR/HDG/ALT/VS touch targets
6. Note: "Every element meets 44x44px touch target minimum"

## Act 2: Start a Drill (2 min)

**Goal**: Demonstrate drill selection and ATC voice interaction.

1. Click **Drills tab**
2. Show drill cards with difficulty badges and CBTA competency chips
3. Select **"Descent Conflict - TCAS Traffic Advisory"** (intermediate)
4. Read the **briefing**: scenario description, competencies tested, ATC context
5. Click **Begin Drill**
6. First event: ATC gives descent clearance
   - If LiveKit connected: hear ATC speak with radio static effect
   - If offline: see keyboard fallback with "Readback Correct" button
7. Second event: Decision point — "TCAS traffic advisory, what do you do?"
   - Show countdown timer
   - Select "Query ATC for revised clearance" (correct answer)
8. Complete the drill

## Act 3: PilotPredict Trap (1 min)

**Goal**: Show AI suggestion testing — a unique differentiator.

1. Start **"Wrong Frequency PilotPredict"** drill
2. PilotPredict suggests Jacksonville Center 134.1
3. But ATC said Washington Center 128.35
4. **Rejecting** the wrong suggestion = PASS (pilot caught the trap)
5. **Accepting** the wrong suggestion = FAIL
6. Point out: "This tests whether pilots blindly trust AI recommendations"

## Act 4: Assessment Dashboard (2 min)

**Goal**: Show the data visualization — the demo centerpiece.

1. Click **Assessment tab**
2. **CBTA Radar** — 6 competencies with population overlay
   - "Cyan line is this pilot, gray band is fleet P25-P75"
3. **Session Summary** — KPI cards with calibration status
4. **Drill History** — bar chart showing readback/decision/touch scores
5. **Competency Trends** — line chart with exponential decay
6. **Cohort Comparison** — pilot vs population percentiles
7. **Cognitive Load** — area chart with biomarker deviations
8. Point out: "Estimated WER displayed alongside every score for transparency"
9. Show **Export** — JSON/CSV for external analysis

## Act 5: Key Differentiators (2 min)

**Goal**: Connect technical features to strategic value.

Walk through the 7 strategic dimensions:

1. **Anthem Telemetry Abstraction** — Every cockpit interaction generates telemetry events compatible with Anthem's architecture
2. **Forge Data Pipeline** — Supabase schema maps directly to Forge entities (show `docs/forge-mapping.md`)
3. **Progressive Training** — Epic → Epic 3.0 → Anthem pathway (show `docs/progression-story.md`)
4. **CBTA Framework** — 6 competencies assessed per ICAO Doc 9995
5. **Voice Biomarker Analysis** — F0, disfluency, speech rate for cognitive load measurement
6. **Confidence-Weighted Assessment** — Low-confidence STT words don't penalize pilots
7. **AI Concordance Rate** — Tracks AI-vs-instructor agreement for continuous improvement

## Closing Points

- "This is a functional prototype, not a production system"
- "Per-speaker baseline calibration — no cross-pilot comparison of raw biomarkers"
- "Instructor authority is non-negotiable — AI assessment is decision-support only"
- "Training approach works for Part 91/135 operators without AQP"
- "Accent-aware: keyword boosting + WER estimation + confidence-weighted scoring"
