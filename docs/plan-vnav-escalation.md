# Implementation Plan: VNAV Descent Conflict — Voice Escalation & Agent Grading Loop

> **Status**: Proposed
> **Date**: 2026-03-27
> **Scope**: Close the browser↔agent loop during `interactive_cockpit` events so that (1) ATC escalations are spoken via TTS instead of text-only, and (2) the Python agent receives the interactive cockpit score for holistic drill grading.

---

## 1. Problem Statement

The VNAV Descent Conflict drill (`descent-conflict.ts`) already works end-to-end for its 4-event sequence (ATC instruction → decision point → ATC confirmation → interactive cockpit). However, two gaps exist:

1. **Escalation is text-only.** When the pilot hasn't resolved the conflict within 30 seconds, `useInteractiveCockpitTracker` sets `escalationTriggered = true` and `ATCCommunicationOverlay` displays the text. But the pilot never *hears* ATC say "Expedite descent to 8,000, traffic below." In a real cockpit, this would be a radio call — not a silent text popup.

2. **The Python agent is blind during interactive cockpit events.** After speaking the ATC instruction and scoring the readback, the agent has no further involvement. It never learns whether the pilot successfully switched modes, how long it took, or whether escalation was needed. The `InteractiveCockpitScore` is recorded in `assessment-store` on the browser side but never sent to the agent. This means the agent can't build a holistic drill evaluation or incorporate cockpit performance into its cognitive load model.

---

## 2. Design Principles (from the debate)

| Principle | Rationale |
|-----------|-----------|
| **Browser owns the cockpit simulation** | Mode changes, altitude animation, condition tracking must be instant (zero latency). No round-trip to Python for UX feedback. |
| **Agent owns assessment & ATC voice** | Readback scoring, cognitive load, TTS playback — all in Python. The agent is the examiner. |
| **Single-fire messages, not streams** | No real-time cockpit state streaming. The browser sends discrete events (escalation trigger, final score) at the right moments. |
| **Escalation readback is optional but scored if it happens** | If the pilot reads back the escalation, the agent scores it as a normal readback. If they ignore it and just click buttons, no penalty beyond the existing escalation penalty (-5 points). |
| **Graceful degradation** | If LiveKit is disconnected, escalation still shows as text. The `INTERACTIVE_COCKPIT_RESULT` message is fire-and-forget — the browser's assessment-store already has the score. |

---

## 3. Architecture: New Data Channel Messages

Two new message types bridge the browser↔agent gap during interactive cockpit events:

```
┌─────────────────────────────────────────────────────────────────┐
│  EXISTING FLOW (no changes)                                      │
│                                                                   │
│  Browser ──ATC_INSTRUCTION──→ Agent (speaks via TTS)             │
│  Agent ──ATC_SPEAK_END──→ Browser (unlocks PTT)                  │
│  Browser ──PTT_START/PTT_END──→ Agent (records + scores audio)   │
│  Agent ──ASSESSMENT_RESULT──→ Browser (readback score)           │
│                                                                   │
│  NEW: During interactive_cockpit events                           │
│  ─────────────────────────────────────────                        │
│                                                                   │
│  Browser ──ATC_ESCALATION──→ Agent                               │
│    payload: { text, expectedReadback, keywords }                  │
│    When: escalation timer fires (30s), conditions not yet met     │
│    Agent action: _speak_atc(text), set expected readback          │
│    Agent sends: ATC_SPEAK_END when done                           │
│    If pilot reads back: normal readback scoring pipeline          │
│                                                                   │
│  Browser ──INTERACTIVE_COCKPIT_RESULT──→ Agent                   │
│    payload: { InteractiveCockpitScore }                           │
│    When: all conditions met OR time limit expires                  │
│    Agent action: logs score, incorporates into drill evaluation   │
│    Agent sends: nothing (fire-and-forget from browser side)       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Changes by File

### 4.1 Types — `app/src/types/scenario.ts`

Add `escalationKeywords` to `InteractiveCockpitEvent`:

```typescript
export interface InteractiveCockpitEvent {
  type: 'interactive_cockpit';
  description: string;
  initialCockpitOverrides: Partial<CockpitState>;
  successConditions: CockpitSuccessCondition[];
  timeLimitSeconds: number;
  escalationPrompt?: string;
  escalationDelaySeconds?: number;
  escalationKeywords?: string[];     // NEW: keyword boosting for escalation readback scoring
}
```

### 4.2 Drill Definition — `app/src/data/drills/descent-conflict.ts`

Add `escalationKeywords` to the interactive_cockpit event:

```typescript
{
  type: 'interactive_cockpit',
  // ... existing fields
  escalationPrompt: 'Expedite descent to 8,000, traffic below.',
  escalationDelaySeconds: 30,
  escalationKeywords: ['expedite', 'eight thousand', '8000', 'descent', 'traffic'],
}
```

### 4.3 LiveKit Client — `app/src/services/livekit-client.ts`

Add two new message type constants and convenience senders:

```typescript
// New message types (browser → agent)
export const MSG_ATC_ESCALATION = 'ATC_ESCALATION';
export const MSG_INTERACTIVE_COCKPIT_RESULT = 'INTERACTIVE_COCKPIT_RESULT';

// Convenience senders
export function sendATCEscalation(text: string, expectedReadback: string, keywords: string[]): void {
  void sendDataMessage(MSG_ATC_ESCALATION, { text, expectedReadback, keywords });
}

export function sendInteractiveCockpitResult(score: Record<string, unknown>): void {
  void sendDataMessage(MSG_INTERACTIVE_COCKPIT_RESULT, { score });
}
```

### 4.4 Interactive Cockpit Tracker — `app/src/hooks/useInteractiveCockpitTracker.ts`

**Escalation change:** When escalation fires, also send `ATC_ESCALATION` to the agent via data channel so the agent speaks it via TTS. The hook gains an optional `onEscalation` callback parameter.

**Completion change:** When the event completes (all conditions met or timeout), send `INTERACTIVE_COCKPIT_RESULT` to the agent.

Key changes:
- Import `sendATCEscalation`, `sendInteractiveCockpitResult`, `isConnected` from `livekit-client`
- Escalation timer effect: on fire, call `sendATCEscalation(event.escalationPrompt, event.escalationPrompt, event.escalationKeywords ?? [])` if connected
- Completion: call `sendInteractiveCockpitResult(score)` if connected
- Expose `escalationTriggered` in the return value (already exposed via `trackerState`)

### 4.5 ATC Communication Overlay — `app/src/components/cockpit/ATCCommunicationOverlay.tsx`

No structural changes needed. The component already displays `escalationPrompt` when `escalationTriggered` is true. The voice playback from the agent is additive — the text display is the fallback.

### 4.6 Python Agent — `agent/worker.py`

Add two new message handlers in the dispatch:

```python
# New message types (browser → agent)
MSG_ATC_ESCALATION = "ATC_ESCALATION"
MSG_INTERACTIVE_COCKPIT_RESULT = "INTERACTIVE_COCKPIT_RESULT"
```

**`_handle_atc_escalation(payload)`:**
- Extract `text`, `expectedReadback`, `keywords`
- Set `self._expected_readback = expectedReadback`
- Update STT keywords via `self._stt_config.drill_keywords = keywords`
- Recreate STT with updated keywords
- Call `asyncio.ensure_future(self._speak_atc(text))` — reuses the existing TTS pipeline
- After speaking, if pilot presses PTT, the normal readback scoring pipeline handles it

**`_handle_interactive_cockpit_result(payload)`:**
- Extract `score` dict from payload
- Log the score details (conditionsMet, totalTimeMs, timedOut, escalationTriggered, modeChanges)
- Store in `self._last_interactive_score` for potential future use in drill-level evaluation
- No message sent back (fire-and-forget)

**Dispatch addition in `_on_data_received`:**
```python
elif msg_type == MSG_ATC_ESCALATION:
    self._handle_atc_escalation(payload)
elif msg_type == MSG_INTERACTIVE_COCKPIT_RESULT:
    self._handle_interactive_cockpit_result(payload)
```

### 4.7 Documentation — `docs/arch-data-flows.md`

Add the two new messages to the Data Channel Message Types table:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `ATC_ESCALATION` | Browser → Agent | Escalation text for TTS playback during interactive cockpit events |
| `INTERACTIVE_COCKPIT_RESULT` | Browser → Agent | Final interactive cockpit score for agent-side drill evaluation |

---

## 5. Data Flow: Complete VNAV Descent Conflict Sequence

```
EVENT 1: atc_instruction — "Descend and maintain 8,000"
  Browser: scenario-runner sends ATC_INSTRUCTION via data channel
  Agent:   _speak_atc() → ElevenLabs TTS → radio static → room audio
  Agent:   sends ATC_SPEAK_END
  Pilot:   presses PTT, reads back
  Agent:   Deepgram STT → readback scoring → ASSESSMENT_RESULT
  Browser: assessment-store records readback score (COM competency)

EVENT 2: decision_point — "VNAV won't descend below 11,000"
  Browser: DrillEventOverlay shows 4 options, 20s timer
  Pilot:   selects option B (switch to FLCH/VS) ← correct
  Browser: scenario-runner records decision score (SAW, PSD competencies)

EVENT 3: atc_instruction — "Confirm descending to 8,000"
  Same flow as Event 1

EVENT 4: interactive_cockpit — hands-on assessment
  Browser: InteractiveCockpitView mounts
           useAltitudeSimulation starts — VNAV holds at 11,000 constraint
           ModeAnnunciations pulses amber "VNAV 11,000 FT" warning
           useInteractiveCockpitTracker begins monitoring:
             ✓ selectedMode ∈ [FLCH, VS]
             ✓ desiredAltitude == 8000

  [t < 30s] Pilot clicks FLCH/VS → instant mode change
            Sets altitude to 8,000 via AutopilotControlBar
            Tracker detects both conditions → 1s delay → completes
            → sends INTERACTIVE_COCKPIT_RESULT to agent
            → records InteractiveCockpitScore in assessment-store

  [t = 30s] IF conditions NOT met:
            Browser: sends ATC_ESCALATION to agent
            Browser: shows escalation text in ATCCommunicationOverlay (immediate)
            Agent:   _speak_atc(escalation_text) → TTS → room audio
            Agent:   sets expected readback + keywords for escalation
            Agent:   sends ATC_SPEAK_END
            (Pilot may optionally read back → scored as normal readback)

  [t = 60s] IF still not met:
            Timeout → InteractiveCockpitScore.timedOut = true
            → sends INTERACTIVE_COCKPIT_RESULT to agent
            → records score in assessment-store

SCORING (at drill completion):
  COM: readback scores from events 1 + 3 (+ optional escalation readback)
  SAW: decision score from event 2 (conflict recognition)
  PSD: decision time from event 2 (time to recognize + decide)
  FPM: interactive cockpit score from event 4:
       - conditions met → base score
       - time > 30s → -10 penalty
       - escalation triggered → -5 penalty
       - mode correctness (FLCH or VS both valid)
  WLM: cognitive load from voice biomarkers (events 1 + 3)
```

---

## 6. Files NOT Changed

These files need no modifications — the existing architecture handles the scenario correctly:

| File | Why no change |
|------|---------------|
| `useAltitudeSimulation.ts` | VNAV constraint enforcement already works. Compressed rates are intentional. |
| `ModeAnnunciations.tsx` | Amber "VNAV 11,000 FT" pulsing warning already displays correctly. |
| `cockpit-store.ts` | All state fields (mode, desiredAltitude, vnavConstraint) already exist. |
| `scenario-store.ts` | Drill lifecycle and event sequencing unchanged. |
| `assessment-store.ts` | `recordInteractiveCockpitScore()` already exists. |
| `scenario-runner.ts` | Event routing already handles `interactive_cockpit` type. |
| `InteractiveCockpitView.tsx` | Passes tracker state to ATCCommunicationOverlay — no changes needed. |
| `assessment-engine.ts` | Processes ASSESSMENT_RESULT for readbacks — handles escalation readbacks automatically. |

---

## 7. Testing Strategy

| Test | What to verify |
|------|----------------|
| **Escalation TTS playback** | Start descent-conflict drill, wait 30s on event 4 without acting. Verify ATC speaks escalation via room audio AND text appears in overlay. |
| **Escalation readback scoring** | After hearing escalation, press PTT and read back. Verify ASSESSMENT_RESULT received with readback score. |
| **No escalation (fast pilot)** | Complete event 4 within 30s. Verify no ATC_ESCALATION sent, no escalation audio. |
| **INTERACTIVE_COCKPIT_RESULT delivery** | Complete event 4. Verify agent logs show received score with conditionsMet, totalTimeMs, modeChanges. |
| **Timeout path** | Wait 60s on event 4. Verify INTERACTIVE_COCKPIT_RESULT sent with timedOut=true. |
| **Disconnected fallback** | Disconnect LiveKit before event 4. Verify escalation still shows as text. Verify no crash from failed sendDataMessage. |
| **Keywords update** | Verify agent STT keywords update when ATC_ESCALATION arrives (check agent log for keyword count). |

---

## 8. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Escalation TTS overlaps with pilot PTT | Agent already handles concurrent audio correctly — PTT audio buffering is independent of ATC track. Pilot hears ATC on speakers, speaks into mic. |
| Double escalation (timer race) | `completedRef.current` check in tracker prevents actions after completion. Escalation timer is cleared on unmount. |
| Agent crash on malformed INTERACTIVE_COCKPIT_RESULT | Defensive parsing with `.get()` and defaults. Log-and-continue pattern matches existing handlers. |
| Stale expected readback after escalation | `_handle_atc_escalation` overwrites `self._expected_readback`. If pilot reads back the escalation, it's scored against the escalation text, not the original ATC instruction. Correct behavior. |
