# Issues & Resolutions Log

Comprehensive log of all issues encountered during development and their resolutions. Organized chronologically by discovery date.

---

## Phase 0-8: Foundation & Feature Build

### ISS-001: MCP `fetch` Server Failing

**Status:** RESOLVED
**Date:** 2026-03-15
**Symptom:** `fetch · ✗ failed` in `/mcp` output.

**Root Cause:** The npm package `@anthropic-ai/mcp-server-fetch` does not exist. The official fetch MCP server is Python-based, published as `mcp-server-fetch` on PyPI.

**Resolution:**
1. Install `uv` (provides `uvx`): `brew install uv`
2. Configure `.mcp.json` to use `uvx mcp-server-fetch`:
```json
{
  "fetch": {
    "command": "/opt/homebrew/bin/uvx",
    "args": ["mcp-server-fetch"]
  }
}
```

---

### ISS-002: MCP `supabase-mcp` Server Failing

**Status:** RESOLVED
**Date:** 2026-03-15
**Symptom:** `supabase-mcp · ✗ failed` in `/mcp` output.

**Root Cause:** `mcp-remote@0.1.38` depends on `undici@7` which requires Node.js >= 20.18.1. The system PATH defaulted to Node v18 via nvm.

**Resolution:** Inject Node v20 into PATH via the `env` field in `.mcp.json`:
```json
{
  "supabase-mcp": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.supabase.com/mcp"],
    "env": {
      "PATH": "/Users/ashutoshpranjal/.nvm/versions/node/v20.20.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
    }
  }
}
```
`mcp-remote` handles OAuth authentication on first connection (opens browser window).

---

### ISS-003: Recharts Infinite Scroll / Resize Loop

**Status:** RESOLVED
**Date:** 2026-03-17
**Symptom:** Dashboard charts cause infinite layout recalculation and page freeze.

**Root Cause:** `ResponsiveContainer` with `height="100%"` inside flex/grid cells without a fixed height constraint triggers an infinite resize observer loop.

**Resolution:** All 5 chart components (CBTARadar, CognitiveLoadIndicator, TrendChart, DrillHistory, CohortCompare) now use fixed pixel heights instead of percentage-based heights.

---

### ISS-004: useLiveKit Not Mounted

**Status:** RESOLVED
**Date:** 2026-03-17
**Symptom:** LiveKit never connects — no audio, no data channel, drills can't communicate with agent.

**Root Cause:** `useLiveKit()` hook was not called in any mounted component, so the LiveKit room was never initialized.

**Resolution:** `useLiveKit()` is now mounted in `App.tsx` to ensure LiveKit auto-connects when drills start.

---

### ISS-005: useATCEngine Not Wired

**Status:** RESOLVED
**Date:** 2026-03-17
**Symptom:** ATC instructions from the agent never trigger TTS playback in the browser.

**Root Cause:** `useATCEngine` hook was not called in `DrillActiveView.tsx`.

**Resolution:** Added `useATCEngine()` call in `DrillActiveView.tsx` to trigger TTS on `atc_instruction` events.

---

### ISS-006: Agent AudioStream Not Created

**Status:** RESOLVED
**Date:** 2026-03-17
**Symptom:** Python agent receives no audio frames from the pilot's microphone.

**Root Cause:** `worker.py` was not creating `rtc.AudioStream` in `_on_track_subscribed()`.

**Resolution:** Added `rtc.AudioStream` creation and `_consume_audio_frames()` async iterator in the track subscription handler.

---

### ISS-007: PilotSelector Not Loading Assessment Data

**Status:** RESOLVED
**Date:** 2026-03-17
**Symptom:** Assessment dashboard shows empty data even when drill results exist in Supabase.

**Root Cause:** `PilotSelector` only called `selectPilot()` but not `assessment-store.loadFromServer(pilotId)`.

**Resolution:** Added `loadFromServer(pilotId)` call in `PilotSelector` on pilot selection and creation.

---

## Phase 9: Bug Fixes & Calibration UI

### ISS-008: Pilot Profiles Lost on Refresh (Bug 3)

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** Selected pilot disappears from dropdown after page refresh; pilots list is empty.

**Root Cause:** `loadPilots()` was never called on app mount. The Zustand store started with `pilots: []` and the active pilot selection was not persisted.

**Resolution:**
- Added `saveActivePilotId()` / `loadActivePilotId()` helpers in `app/src/lib/storage.ts`
- Added `useEffect` in `PilotSelector.tsx` that on mount: calls `loadPilots()`, restores active pilot from localStorage, and calls `loadAssessment(pilotId)`
- Pilot selection changes and new pilot creation now persist the active ID to localStorage

**Files Changed:** `app/src/lib/storage.ts`, `app/src/components/shared/PilotSelector.tsx`

---

### ISS-009: Drill Results Not Reaching Supabase (Bug 5)

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** Completing drills doesn't persist data to Supabase. Assessment dashboard has no historical data.

**Root Cause:** `saveToServer()` in assessment-store never called `api.saveDrillResult()` — only baseline was being POSTed. Also `sessionId: ''` violated the NOT NULL REFERENCES FK constraint on the `sessions` table.

**Resolution:**
- Added `activeSessionId: string | null` to the assessment store interface and default state
- `saveToServer()` now creates a session via `api.createSession()` if none exists, then calls `api.saveDrillResult()` with all required fields (sessionId, pilotId, drillId, overallScore, metrics, cbta, cognitiveLoad, transcriptConfidence, estimatedWer)
- Baseline persistence via `api.saveCognitiveLoadBaseline()` continues after drill result save

**Files Changed:** `app/src/stores/assessment-store.ts`

---

### ISS-010: ATC Audio Not Playing / PTT Locked (Bugs 1+2)

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** No ATC voice audio plays. After a failed TTS attempt, PTT remains disabled (spacebar doesn't work in drills).

**Root Cause:** In `worker.py` `_speak_atc()`, if TTS fails, the `except` block logged but never sent `MSG_ATC_SPEAK_END`. The browser stays in `isATCSpeaking=true`, which disables PTT (`disabled = isATCSpeaking || !livekitConnected`).

**Resolution:**
1. **`worker.py`**: Moved `MSG_ATC_SPEAK_END` dispatch to a `finally` block so it always fires regardless of TTS success/failure
2. **`useATCEngine.ts`**: Added 30-second safety timeout — if `isATCSpeaking` is still true after 30s, it auto-resets to false
3. **`DrillActiveView.tsx`**: Removed `speakATCInstruction` from `useEffect` deps to prevent re-triggers (the `atcSpokenRef` guard already handles deduplication)

**Files Changed:** `agent/worker.py`, `app/src/hooks/useATCEngine.ts`, `app/src/components/drill/DrillActiveView.tsx`

---

### ISS-011: Baseline Calibration Not Persisting (Bug 4)

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** Cognitive load baseline computed during one session is lost when a new session starts or the agent reconnects.

**Root Cause:** The agent created a fresh `CognitiveLoadBaseline(pilot_id="unknown")` each session. No mechanism existed to restore a previously-computed baseline from Supabase or the browser store.

**Resolution:**
1. **New data channel message `SET_BASELINE`**: Browser sends stored baseline to agent when LiveKit connects
2. **`worker.py`**: Added `_handle_set_baseline()` method that restores all baseline fields and reconstructs running sums (`_f0_sum`, `_f0_sq_sum`, `_sr_sum`, `_sr_sq_sum`, `_disf_sum`, `_disf_sq_sum`) from mean/std values
3. **`useLiveKit.ts`**: After `setLivekitConnected(true)`, checks assessment store for existing baseline and sends it via `sendBaseline()`
4. **`livekit-client.ts`**: Added `MSG_SET_BASELINE` constant and `sendBaseline()` convenience function
5. **Track subscription**: Agent updates `pilot_id` from participant identity on track subscribe

**Files Changed:** `agent/worker.py`, `app/src/hooks/useLiveKit.ts`, `app/src/services/livekit-client.ts`

---

### ISS-012: Blank Screen on Tab Switch

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** Switching between Cockpit/Drills/Assessment tabs causes a white screen crash. Page recovers on refresh.

**Root Cause:** Supabase seed data had incomplete `metrics_json` — missing `cognitiveLoadScores`, `decisionScores`, `trapScores`, and `touchScores` fields. Dashboard components called `.filter()` on `undefined`, causing a TypeError that crashed the React tree.

**Resolution:**
- `fetchDrillHistory()` in `api-client.ts` now defensively normalizes `metrics_json`, filling in defaults for all missing fields:
  ```typescript
  const rawMetrics = (row.metrics_json ?? {}) as Partial<DrillMetrics>;
  const metrics: DrillMetrics = {
    drillId: rawMetrics.drillId ?? row.drill_id,
    readbackScores: rawMetrics.readbackScores ?? [],
    decisionScores: rawMetrics.decisionScores ?? [],
    // ... all fields with defaults
  };
  ```
- `SessionSummary.tsx` added a guard on latency access: `.filter((r) => r.latency)` before mapping

**Files Changed:** `app/src/services/api-client.ts`, `app/src/components/assessment/SessionSummary.tsx`

---

### ISS-013: VU Meter Not Responding to Voice

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** During baseline calibration, the VU meter segments stay dark regardless of microphone input.

**Root Cause:** `AudioContext.resume()` was called without `await`. Chrome suspends new AudioContexts by default, so `getFloatTimeDomainData()` returned all zeros until the context actually resumed.

**Resolution:**
- Made `start()` in `useAudioLevel.ts` an async function that `await`s `ctx.resume()`
- Adjusted `smoothingTimeConstant` to 0.3 for faster response
- RMS normalization set to `/ 0.15` (speech RMS is typically 0.01-0.15)
- `Float32Array` ref typed as `Float32Array<ArrayBuffer>` to satisfy TypeScript strict mode

**Files Changed:** `app/src/hooks/useAudioLevel.ts`

---

### ISS-014: `python: command not found` for Agent

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** `pnpm dev:agent` fails with `sh: python: command not found`.

**Root Cause:** macOS does not have `python` on PATH — only `python3` is available.

**Resolution:** Changed `python` to `python3` in the `dev:agent` script in `app/package.json`.

**Files Changed:** `app/package.json`

---

### ISS-015: Duplicate Pilot Profiles in Database

**Status:** RESOLVED
**Date:** 2026-03-19
**Symptom:** Multiple duplicate "Ash" pilot entries visible in the pilot selector dropdown.

**Root Cause:** During testing, `createPilot()` was called multiple times (likely from repeated form submissions or React StrictMode double-mount effects).

**Resolution:** Deleted 4 duplicate pilot rows from Supabase via SQL. The `saveActivePilotId` fix (ISS-008) prevents creating new pilots when one already exists and is restored from localStorage.

**Files Changed:** Database cleanup only (Supabase `pilots` table)

---

## Open / Known Limitations

### LIM-001: Agent Requires Python Virtual Environment

**Status:** OPEN
**Symptom:** `pnpm dev:agent` fails if agent dependencies are not installed in a virtual environment.

**Workaround:** Manually activate the venv before running:
```bash
cd agent && source .venv/bin/activate
cd .. && pnpm dev:agent
```

**Notes:** ATC audio playback and drill-mode PTT depend on the Python agent running. The calibration spacebar works independently because it uses its own `getUserMedia` flow.

### LIM-002: Cognitive Load Scoring Unreliable Without Full Calibration

**Status:** BY DESIGN
**Description:** The first 5 calibration phrases establish a partial baseline. Full calibration (10+ samples) requires completing drills. Until then, cognitive load scores carry a `partial` calibration status badge.

### LIM-003: No Authentication

**Status:** BY DESIGN
**Description:** This is a prototype — pilot identity is trust-based via the pilot selector dropdown. No login, no session tokens, no RLS policies on Supabase tables.
