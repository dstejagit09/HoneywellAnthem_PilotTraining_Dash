# Task Tracker: VNAV Escalation Voice & Agent Grading Loop

> **Plan**: [plan-vnav-escalation.md](plan-vnav-escalation.md)
> **Created**: 2026-03-27
> **Instructions**: Mark tasks `[x]` only after the validation loop passes (tsc + lint + build).
> Tasks are ordered by dependency. Each phase ends with a commit point.

---

## Progress Summary

| Phase | Tasks | Done | Status |
|-------|-------|------|--------|
| Phase A: Types & Data | 3 | 3 | Complete |
| Phase B: Data Channel Messages | 4 | 4 | Complete |
| Phase C: Tracker Hook — Escalation TTS | 5 | 5 | Complete |
| Phase D: Tracker Hook — Result Delivery | 3 | 3 | Complete |
| Phase E: Python Agent Handlers | 6 | 6 | Complete |
| Phase F: Documentation | 3 | 3 | Complete |
| Phase G: Integration Testing | 7 | 0 | Not started |
| **Total** | **31** | **24** | **In progress** |

---

## Phase A: Types & Data Layer

**Goal**: Extend the type system and drill definition to support escalation keywords.

- [x] **VA.1** Add `escalationKeywords?: string[]` field to `InteractiveCockpitEvent` in `app/src/types/scenario.ts`
  - Field is optional (backward compatible — existing drills without it still work)
  - Add after the existing `escalationDelaySeconds` field

- [x] **VA.2** Add `escalationKeywords` to the `interactive_cockpit` event in `app/src/data/drills/descent-conflict.ts`
  - Value: `['expedite', 'eight thousand', '8000', 'descent', 'traffic']`
  - These match the escalation prompt: "Expedite descent to 8,000, traffic below."

- [x] **VA.3** Validation: `cd app && npx tsc --noEmit && pnpm lint && pnpm build`
  - All existing drills must still compile (no breaking changes)

**Commit A**: `feat(types): add escalationKeywords to InteractiveCockpitEvent for readback scoring`

---

## Phase B: Data Channel Message Types

**Goal**: Define the two new browser→agent message types and convenience senders.

- [x] **VB.1** Add message type constants to `app/src/services/livekit-client.ts`
  ```typescript
  // Browser → Agent: new message types for interactive cockpit events
  export const MSG_ATC_ESCALATION = 'ATC_ESCALATION';
  export const MSG_INTERACTIVE_COCKPIT_RESULT = 'INTERACTIVE_COCKPIT_RESULT';
  ```
  - Place after existing `MSG_ATC_INSTRUCTION` constant

- [x] **VB.2** Add `sendATCEscalation()` convenience sender to `app/src/services/livekit-client.ts`
  ```typescript
  export function sendATCEscalation(
    text: string,
    expectedReadback: string,
    keywords: string[],
  ): void {
    void sendDataMessage(MSG_ATC_ESCALATION, { text, expectedReadback, keywords });
  }
  ```
  - Mirrors the pattern of `sendATCInstruction()` but fire-and-forget (no async/await)

- [x] **VB.3** Add `sendInteractiveCockpitResult()` convenience sender to `app/src/services/livekit-client.ts`
  ```typescript
  export function sendInteractiveCockpitResult(
    score: Record<string, unknown>,
  ): void {
    void sendDataMessage(MSG_INTERACTIVE_COCKPIT_RESULT, { score });
  }
  ```
  - Fire-and-forget — the browser already has the score in assessment-store

- [x] **VB.4** Validation: `cd app && npx tsc --noEmit && pnpm lint && pnpm build`

**Commit B**: `feat(livekit): add ATC_ESCALATION and INTERACTIVE_COCKPIT_RESULT data channel messages`

---

## Phase C: Tracker Hook — Voice Escalation

**Goal**: When the escalation timer fires during an interactive cockpit event, send the escalation text to the Python agent for TTS playback instead of only displaying text.

### Changes to `app/src/hooks/useInteractiveCockpitTracker.ts`:

- [x] **VC.1** Import `sendATCEscalation` and `isConnected` from `@/services/livekit-client`
  - Conditional send: only call `sendATCEscalation` if `isConnected()` returns true
  - Graceful degradation: if disconnected, escalation still shows as text via ATCCommunicationOverlay

- [x] **VC.2** Modify the escalation timer `useEffect` to send `ATC_ESCALATION` when triggered
  - Current behavior: sets `escalationTriggered: true` in state
  - New behavior: ALSO calls `sendATCEscalation(event.escalationPrompt, event.escalationPrompt, event.escalationKeywords ?? [])` if connected
  - The `expectedReadback` is the escalation prompt itself (pilot should read it back)
  - `escalationKeywords` defaults to `[]` if not provided in the drill definition
  - The text overlay in ATCCommunicationOverlay continues to work unchanged (driven by `escalationTriggered` state)

- [x] **VC.3** Add `onEscalation` optional callback to the hook signature
  ```typescript
  export function useInteractiveCockpitTracker(
    event: InteractiveCockpitEvent,
    onComplete: (score: InteractiveCockpitScore) => void,
    onEscalation?: (prompt: string) => void,  // NEW
  )
  ```
  - Call `onEscalation?.(event.escalationPrompt!)` when escalation fires
  - This allows parent components (InteractiveCockpitView) to react to escalation (e.g., add to voice transcript history)

- [x] **VC.4** Verify that PTT remains functional during interactive cockpit events
  - Escalation TTS uses the persistent ATC audio track (same as regular ATC speech)
  - PTT captures pilot mic audio on a separate track — no conflict
  - Confirm no store-level lock prevents cockpit mode buttons during PTT

- [x] **VC.5** Validation: `cd app && npx tsc --noEmit && pnpm lint && pnpm build`

**Commit C**: `feat(drill-engine): send ATC_ESCALATION to agent for TTS playback during interactive cockpit events`

---

## Phase D: Tracker Hook — Result Delivery to Agent

**Goal**: When an interactive cockpit event completes (success or timeout), send the final `InteractiveCockpitScore` to the Python agent.

### Changes to `app/src/hooks/useInteractiveCockpitTracker.ts`:

- [x] **VD.1** Import `sendInteractiveCockpitResult` and `isConnected` from `@/services/livekit-client` (may already be imported from Phase C)

- [x] **VD.2** In the completion paths (both "all conditions met" and "time limit"), send the score to the agent
  - In the `allMet` effect: after calling `onComplete(score)`, call `sendInteractiveCockpitResult(scoreAsRecord)` if connected
  - In the timeout effect: after calling `onComplete(score)`, call `sendInteractiveCockpitResult(scoreAsRecord)` if connected
  - Serialize the `InteractiveCockpitScore` to a plain object (it's already a plain object — no class instances)
  - Fire-and-forget: don't await, don't check result

- [x] **VD.3** Validation: `cd app && npx tsc --noEmit && pnpm lint && pnpm build`

**Commit D**: `feat(drill-engine): send INTERACTIVE_COCKPIT_RESULT to agent on event completion`

---

## Phase E: Python Agent Handlers

**Goal**: The Python agent handles the two new message types — speaks escalations via TTS and logs interactive cockpit results.

### Changes to `agent/worker.py`:

- [x] **VE.1** Add new message type constants
  ```python
  # Browser → Agent: interactive cockpit event messages
  MSG_ATC_ESCALATION = "ATC_ESCALATION"
  MSG_INTERACTIVE_COCKPIT_RESULT = "INTERACTIVE_COCKPIT_RESULT"
  ```
  - Place after existing `MSG_SET_BASELINE` constant

- [x] **VE.2** Add dispatch cases in `_on_data_received`
  ```python
  elif msg_type == MSG_ATC_ESCALATION:
      self._handle_atc_escalation(payload)
  elif msg_type == MSG_INTERACTIVE_COCKPIT_RESULT:
      self._handle_interactive_cockpit_result(payload)
  ```
  - Place before the `else: logger.warning("Unknown message type")` fallthrough

- [x] **VE.3** Implement `_handle_atc_escalation(self, payload: dict) -> None`
  - Extract `text = payload.get("text", "")`, `expected_readback = payload.get("expectedReadback", "")`, `keywords = payload.get("keywords", [])`
  - Guard: if `not text`, log warning and return
  - Set `self._expected_readback = expected_readback` (so next PTT readback is scored against escalation text)
  - Update STT keywords: `self._stt_config.drill_keywords = keywords`, `self._stt = create_stt(self._stt_config)`
  - Call `asyncio.ensure_future(self._speak_atc(text))` — reuses the existing TTS pipeline
  - Log: `logger.info("[ESCALATION] Speaking: '%s', keywords=%d", text[:80], len(keywords))`

- [x] **VE.4** Implement `_handle_interactive_cockpit_result(self, payload: dict) -> None`
  - Extract `score = payload.get("score", {})`
  - Log key metrics:
    ```python
    logger.info(
        "[COCKPIT-RESULT] allMet=%s, totalTimeMs=%d, timedOut=%s, escalation=%s, modeChanges=%d",
        score.get("allConditionsMet", False),
        score.get("totalTimeMs", 0),
        score.get("timedOut", False),
        score.get("escalationTriggered", False),
        len(score.get("modeChanges", [])),
    )
    ```
  - Store: `self._last_interactive_score = score` (instance variable, initialized to `None` in `__init__`)
  - No message sent back — this is fire-and-forget from the browser's perspective

- [x] **VE.5** Add `self._last_interactive_score: dict | None = None` to `__init__`

- [x] **VE.6** Manual verification (not automated — requires running agent):
  - Confirm `worker.py` has no Python syntax errors: `python -c "from agent.worker import ATCAgentWorker"`
  - Confirm new handler methods exist on the class
  - Confirm message dispatch includes both new types

**Commit E**: `feat(agent): handle ATC_ESCALATION (TTS) and INTERACTIVE_COCKPIT_RESULT (logging) messages`

---

## Phase F: Documentation Updates

**Goal**: Keep architecture docs in sync with the new data channel messages and type changes.

- [x] **VF.1** Update `docs/arch-data-flows.md` — Add two new rows to the Data Channel Message Types table:
  | Message | Direction | Purpose |
  |---------|-----------|---------|
  | `ATC_ESCALATION` | Browser → Agent | Escalation text for TTS playback during interactive cockpit events |
  | `INTERACTIVE_COCKPIT_RESULT` | Browser → Agent | Final interactive cockpit score sent to agent for drill evaluation |

- [x] **VF.2** Update `docs/arch-drill-system.md` — Add `escalationKeywords` to the `InteractiveCockpitEvent` interface listing and mention the voice escalation flow in the Interactive Cockpit Subsystem section:
  - Under "Data Flow", add step between 4 and 5: "4b. **Escalation voice:** If escalation fires and LiveKit is connected, `ATC_ESCALATION` message triggers agent TTS playback of the escalation prompt. Pilot may optionally read back."
  - Under the type definition, add `escalationKeywords?: string[]` with comment

- [x] **VF.3** Update `ARCHITECTURE.md` — No file changes needed (no new files created). Verify the directory structure listing is still accurate.

**Commit F**: `docs: add ATC_ESCALATION and INTERACTIVE_COCKPIT_RESULT to architecture documentation`

---

## Phase G: Integration Testing

**Goal**: Verify the complete flow works end-to-end. These are manual verification tasks (run the app + agent).

> **Prerequisite**: LiveKit Cloud room available, Deepgram + ElevenLabs API keys configured, Supabase running.

- [ ] **VG.1** **Happy path — fast pilot**: Start descent-conflict drill. On event 4, immediately switch to FLCH and set altitude 8,000. Verify:
  - No `ATC_ESCALATION` sent (check browser console)
  - `INTERACTIVE_COCKPIT_RESULT` sent with `allConditionsMet: true`, `escalationTriggered: false`
  - Agent log shows received cockpit result with correct metrics
  - Assessment dashboard FPM score reflects success

- [ ] **VG.2** **Escalation path — slow pilot**: Start descent-conflict drill. On event 4, wait 30+ seconds without acting. Verify:
  - `ATC_ESCALATION` sent at ~30s (check browser console)
  - Escalation text appears in ATCCommunicationOverlay (red border, "ATC URGENT")
  - Agent speaks "Expedite descent to 8,000, traffic below." via room audio with radio static
  - Agent sends `ATC_SPEAK_END` after speech completes
  - Then switch modes and set altitude. Verify `INTERACTIVE_COCKPIT_RESULT` shows `escalationTriggered: true`
  - FPM score reflects -5 escalation penalty

- [ ] **VG.3** **Escalation readback**: After hearing escalation in VG.2, press PTT and read back "Expediting descent to 8,000." Verify:
  - Agent sends `ASSESSMENT_RESULT` with readback score
  - Readback scored against escalation text, not original ATC instruction
  - COM competency receives the escalation readback score

- [ ] **VG.4** **Timeout path**: Start descent-conflict drill. On event 4, do nothing for 60 seconds. Verify:
  - Escalation fires at 30s (text + voice)
  - Timeout fires at 60s
  - `INTERACTIVE_COCKPIT_RESULT` sent with `timedOut: true`, `allConditionsMet: false`
  - Agent log shows timeout result

- [ ] **VG.5** **Disconnected fallback**: Disconnect LiveKit before starting event 4. Verify:
  - Escalation still shows as text in ATCCommunicationOverlay at 30s
  - No console errors from failed `sendATCEscalation` (isConnected guard)
  - No console errors from failed `sendInteractiveCockpitResult`
  - Interactive cockpit scoring still works locally (assessment-store still receives score)

- [ ] **VG.6** **No regression — other drills**: Run weather-diversion and holding-pattern drills. Verify:
  - No errors related to missing `escalationKeywords` (field is optional)
  - Existing drill flows unaffected
  - Assessment scoring unchanged for drills without interactive cockpit events

- [ ] **VG.7** **Concurrent PTT + cockpit interaction**: During event 4, hold PTT while simultaneously clicking mode buttons. Verify:
  - Mode buttons remain clickable during PTT
  - No UI freeze or state lock
  - PTT audio captured correctly
  - Mode change tracked correctly by useInteractiveCockpitTracker

**No commit for Phase G** — these are verification tasks, not code changes.

---

## Commit Sequence Summary

| Order | Commit | Scope | Files Modified |
|-------|--------|-------|----------------|
| 1 | **Commit A** | Types + drill data | `scenario.ts`, `descent-conflict.ts` |
| 2 | **Commit B** | Data channel messages | `livekit-client.ts` |
| 3 | **Commit C** | Escalation TTS trigger | `useInteractiveCockpitTracker.ts` |
| 4 | **Commit D** | Result delivery | `useInteractiveCockpitTracker.ts` |
| 5 | **Commit E** | Agent handlers | `worker.py` |
| 6 | **Commit F** | Documentation | `arch-data-flows.md`, `arch-drill-system.md` |

> **Note**: Commits C and D both modify `useInteractiveCockpitTracker.ts`. They are separated because they serve different purposes (escalation voice vs. result delivery) and can be independently validated. If preferred, they can be combined into a single commit.

---

## Dependencies

```
Phase A (types) ──→ Phase B (messages) ──→ Phase C (escalation) ──→ Phase D (result) ──→ Phase G (testing)
                                                                                              ↑
Phase E (agent) ──────────────────────────────────────────────────────────────────────────────┘
                                                                                              ↑
Phase F (docs) ───────────────────────────────────────────────────────────────────────────────┘
```

- **A → B**: Message senders reference the type changes
- **B → C, D**: Hook imports the new senders from livekit-client
- **E is independent**: Agent changes don't depend on frontend compilation (different language/runtime)
- **F is independent**: Docs can be written anytime after the design is finalized
- **G depends on all**: Integration testing requires both frontend and agent changes deployed

Phases A+B can be done together. Phases C+D can be done together. Phase E can run in parallel with C+D. Phase F can run anytime.
