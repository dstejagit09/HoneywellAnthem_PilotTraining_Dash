// T1.12 — Scenario store: drill lifecycle, event sequencing, cockpit verification
// All state transitions, timer management, and cockpit verification run as pure
// store-to-store logic. React components are read-only consumers.

import { create } from 'zustand';
import type { DrillDefinition, DrillPhase, EventResult, CockpitAction, ATCInstructionEvent } from '@/types';
import { evaluateAllCockpitActions, type CockpitSnapshot } from '@/lib/cockpit-action-utils';
import { useCockpitStore } from '@/stores/cockpit-store';

// ---------------------------------------------------------------------------
// Module-scoped timer/subscription handles (Step 1.3)
// Declared OUTSIDE create() so every store action can reach and clear them.
// ---------------------------------------------------------------------------
let complianceTimerId: ReturnType<typeof setTimeout> | null = null;
let cockpitUnsubscribe: (() => void) | null = null;
let escalationTimerId: ReturnType<typeof setTimeout> | null = null;
let timeLimitTimerId: ReturnType<typeof setTimeout> | null = null;
let readbackAckTimerId: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Cockpit verification state shape (Step 1.4)
// ---------------------------------------------------------------------------
export interface CockpitVerificationState {
  status: 'idle' | 'pending' | 'verified' | 'timed_out';
  expectedActions: CockpitAction[];
  startedAt: number;
  timeoutMs: number;
  actionResults: { action: CockpitAction; met: boolean }[];
  cockpitSnapshot: {
    selectedMode: string;
    desiredAltitude: number;
    constraintViolationCount: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Event timer state shape (Step 2 — declared now, wired in Step 2)
// ---------------------------------------------------------------------------
export interface EventTimersState {
  startedAt: number;
  timeLimitMs: number;
  escalationDelayMs: number;
  escalationTriggered: boolean;
  timedOut: boolean;
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------
interface ScenarioStore {
  availableDrills: DrillDefinition[];
  activeDrill: DrillDefinition | null;
  phase: DrillPhase;
  currentEventIndex: number;
  eventResults: EventResult[];
  startTime: number | null;
  readbackReceived: boolean;
  cockpitVerification: CockpitVerificationState | null;
  eventTimers: EventTimersState | null;

  setAvailableDrills: (drills: DrillDefinition[]) => void;
  selectDrill: (drillId: string) => void;
  startDrill: () => void;
  advanceEvent: () => void;
  recordEventResult: (result: EventResult) => void;
  setReadbackReceived: (received: boolean) => void;
  handleKeyboardReadback: (success: boolean) => void;
  completeDrill: () => void;
  reset: () => void;

  // Cockpit verification (Step 1)
  beginCockpitVerification: (expectedActions: CockpitAction[], timeoutMs: number) => void;
  clearCockpitVerification: () => void;

  // Event timers (Step 2)
  startEventTimers: (config: {
    timeLimitMs: number;
    escalationDelayMs?: number;
    onEscalation?: () => void;
    onTimeout: () => void;
  }) => void;
  clearEventTimers: () => void;
  markEscalationTriggered: () => void;
  markTimedOut: () => void;
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------
const defaultState = {
  availableDrills: [] as DrillDefinition[],
  activeDrill: null as DrillDefinition | null,
  phase: 'idle' as DrillPhase,
  currentEventIndex: 0,
  eventResults: [] as EventResult[],
  startTime: null as number | null,
  readbackReceived: false,
  cockpitVerification: null as CockpitVerificationState | null,
  eventTimers: null as EventTimersState | null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  ...defaultState,

  setAvailableDrills: (drills) => set({ availableDrills: drills }),

  selectDrill: (drillId) => {
    const drill = get().availableDrills.find((d) => d.id === drillId) ?? null;
    set({ activeDrill: drill, phase: drill ? 'briefing' : 'idle' });
  },

  startDrill: () => {
    console.log('🟡 [startDrill] starting drill — resetting to eventIndex=0');
    set({
      phase: 'active',
      currentEventIndex: 0,
      eventResults: [],
      startTime: Date.now(),
      readbackReceived: false,
      cockpitVerification: null,
      eventTimers: null,
    });
    console.log('🟢 [startDrill] state after start: phase=%s eventIndex=%d', get().phase, get().currentEventIndex);
  },

  advanceEvent: () => {
    const before = get();
    console.log('🟡 [advanceEvent] entered — currentIndex=%d totalEvents=%d phase=%s', before.currentEventIndex, before.activeDrill?.events.length, before.phase);
    set((state) => {
      const nextIndex = state.currentEventIndex + 1;
      const drill = state.activeDrill;
      if (!drill || nextIndex >= drill.events.length) {
        console.log('🟢 [advanceEvent] → outcome (no more events)');
        return { phase: 'outcome', readbackReceived: false };
      }
      const nextEvent = drill.events[nextIndex];
      if (!nextEvent) { console.log('🟢 [advanceEvent] → outcome (nextEvent null)'); return { phase: 'outcome', readbackReceived: false }; }
      console.log('🟢 [advanceEvent] → nextIndex=%d nextType=%s', nextIndex, nextEvent.type);
      return {
        currentEventIndex: nextIndex,
        phase: nextEvent.type === 'decision_point' ? 'decision' : 'active',
        readbackReceived: false,
      };
    });
  },

  recordEventResult: (result) =>
    set((state) => ({
      eventResults: [...state.eventResults, result],
    })),

  // ---------------------------------------------------------------------------
  // Headless readback handler — voice path
  // When the assessment pipeline signals readbackReceived = true, the store owns
  // the entire post-readback flow: ack delay → verification or advance.
  // No React component drives this logic.
  // ---------------------------------------------------------------------------
  setReadbackReceived: (received) => {
    set({ readbackReceived: received });
    if (!received) return;

    // Clear any stale ack timer
    if (readbackAckTimerId) { clearTimeout(readbackAckTimerId); readbackAckTimerId = null; }

    const state = get();
    if (state.phase !== 'active') return;

    const event = state.activeDrill?.events[state.currentEventIndex];
    if (!event || event.type !== 'atc_instruction') return;

    const atcEvent = event as ATCInstructionEvent;
    const hasExpectedActions = atcEvent.expectedActions && atcEvent.expectedActions.length > 0;

    // Brief 1500ms delay so pilot sees their transcript acknowledged
    readbackAckTimerId = setTimeout(() => {
      readbackAckTimerId = null;
      // Guard stale callback
      if (get().phase !== 'active') return;

      set({ readbackReceived: false });

      if (hasExpectedActions) {
        // Record readback result (voice mode only — cockpit telemetry recorded by store)
        set((s) => ({
          eventResults: [...s.eventResults, {
            eventIndex: s.currentEventIndex,
            eventType: 'atc_instruction' as const,
            success: true,
            details: { mode: 'voice' },
            timestamp: Date.now(),
          }],
        }));
        // Begin cockpit verification — store handles advancement after verify/timeout
        get().beginCockpitVerification(atcEvent.expectedActions, 15000);
      } else {
        // No expected actions — record result and advance/complete
        const s = get();
        set((prev) => ({
          eventResults: [...prev.eventResults, {
            eventIndex: s.currentEventIndex,
            eventType: 'atc_instruction' as const,
            success: true,
            details: { mode: 'voice' },
            timestamp: Date.now(),
          }],
        }));

        if (!s.activeDrill || s.currentEventIndex >= s.activeDrill.events.length - 1) {
          get().completeDrill();
        } else {
          get().advanceEvent();
        }
      }
    }, 1500);
  },

  // ---------------------------------------------------------------------------
  // Headless readback handler — keyboard fallback path
  // Called directly by button click handlers in DrillActiveView.
  // Click handlers signal user intent; the store owns progression logic.
  // ---------------------------------------------------------------------------
  handleKeyboardReadback: (success) => {
    const state = get();
    console.log('🟡 [handleKeyboardReadback] entered — success=%s phase=%s eventIndex=%d eventType=%s', success, state.phase, state.currentEventIndex, state.activeDrill?.events[state.currentEventIndex]?.type);
    if (state.phase !== 'active') { console.log('🔴 [handleKeyboardReadback] BAILED — phase is not active:', state.phase); return; }

    const event = state.activeDrill?.events[state.currentEventIndex];
    if (!event || event.type !== 'atc_instruction') { console.log('🔴 [handleKeyboardReadback] BAILED — event missing or not atc_instruction'); return; }

    const atcEvent = event as ATCInstructionEvent;
    const hasExpectedActions = atcEvent.expectedActions && atcEvent.expectedActions.length > 0;
    console.log('🔴 [handleKeyboardReadback] expectedActions=%s hasExpectedActions=%s', JSON.stringify(atcEvent.expectedActions), hasExpectedActions);

    if (success && hasExpectedActions) {
      // Record readback, then begin cockpit verification
      set((s) => ({
        eventResults: [...s.eventResults, {
          eventIndex: state.currentEventIndex,
          eventType: 'atc_instruction' as const,
          success: true,
          details: { mode: 'keyboard-fallback' },
          timestamp: Date.now(),
        }],
      }));
      get().beginCockpitVerification(atcEvent.expectedActions, 15000);
    } else {
      // Skip or no expectedActions — record and advance
      console.log('🟢 [handleKeyboardReadback] else-branch — recording result and advancing. eventIndex=%d isLast=%s', state.currentEventIndex, !state.activeDrill || state.currentEventIndex >= state.activeDrill.events.length - 1);
      set((s) => ({
        eventResults: [...s.eventResults, {
          eventIndex: state.currentEventIndex,
          eventType: 'atc_instruction' as const,
          success,
          details: { mode: 'keyboard-fallback', cockpitVerified: false },
          timestamp: Date.now(),
        }],
      }));

      if (!state.activeDrill || state.currentEventIndex >= state.activeDrill.events.length - 1) {
        console.log('🟢 [handleKeyboardReadback] calling completeDrill()');
        get().completeDrill();
      } else {
        console.log('🟢 [handleKeyboardReadback] calling advanceEvent()');
        get().advanceEvent();
      }
    }
  },

  // completeDrill: clears all handles
  completeDrill: () => {
    get().clearCockpitVerification();
    get().clearEventTimers();
    if (readbackAckTimerId) { clearTimeout(readbackAckTimerId); readbackAckTimerId = null; }
    set({ phase: 'outcome' });
  },

  // reset: clears all handles
  reset: () => {
    get().clearCockpitVerification();
    get().clearEventTimers();
    if (readbackAckTimerId) { clearTimeout(readbackAckTimerId); readbackAckTimerId = null; }
    set(defaultState);
  },

  // ---------------------------------------------------------------------------
  // Step 1.5: beginCockpitVerification
  // ---------------------------------------------------------------------------
  beginCockpitVerification: (expectedActions, timeoutMs) => {
    // Clean up any existing verification
    get().clearCockpitVerification();

    const cockpitState = useCockpitStore.getState();
    const baseline: CockpitSnapshot = {
      selectedMode: cockpitState.selectedMode,
      desiredAltitude: cockpitState.desiredAltitude,
      heading: cockpitState.heading,
      speed: cockpitState.speed,
      activeFrequency: cockpitState.activeFrequency,
      standbyFrequency: cockpitState.standbyFrequency,
    };

    // Immediate evaluation — short-circuit if already met
    const initial = evaluateAllCockpitActions(expectedActions, baseline, baseline);
    if (initial.allMet) {
      set({
        cockpitVerification: {
          status: 'verified',
          expectedActions,
          startedAt: Date.now(),
          timeoutMs,
          actionResults: initial.results,
          cockpitSnapshot: {
            selectedMode: cockpitState.selectedMode,
            desiredAltitude: cockpitState.desiredAltitude,
            constraintViolationCount: cockpitState.constraintViolationCount,
          },
        },
      });
      _advanceAfterVerification(get, set, true);
      return;
    }

    // Set pending state
    set({
      cockpitVerification: {
        status: 'pending',
        expectedActions,
        startedAt: Date.now(),
        timeoutMs,
        actionResults: initial.results,
        cockpitSnapshot: null,
      },
    });

    // Subscribe to cockpit store changes (store-to-store subscription)
    cockpitUnsubscribe = useCockpitStore.subscribe((state) => {
      // Guard stale callbacks
      if (get().phase !== 'active' || get().cockpitVerification?.status !== 'pending') return;

      const snapshot: CockpitSnapshot = {
        selectedMode: state.selectedMode,
        desiredAltitude: state.desiredAltitude,
        heading: state.heading,
        speed: state.speed,
        activeFrequency: state.activeFrequency,
        standbyFrequency: state.standbyFrequency,
      };

      const result = evaluateAllCockpitActions(expectedActions, snapshot, baseline);

      // Update action results on every change (for UI display)
      set((s) => ({
        cockpitVerification: s.cockpitVerification
          ? { ...s.cockpitVerification, actionResults: result.results }
          : null,
      }));

      if (result.allMet) {
        // Unsubscribe, clear timer, snapshot state, set verified
        if (cockpitUnsubscribe) { cockpitUnsubscribe(); cockpitUnsubscribe = null; }
        if (complianceTimerId) { clearTimeout(complianceTimerId); complianceTimerId = null; }

        set({
          cockpitVerification: {
            status: 'verified',
            expectedActions,
            startedAt: get().cockpitVerification?.startedAt ?? Date.now(),
            timeoutMs,
            actionResults: result.results,
            cockpitSnapshot: {
              selectedMode: state.selectedMode,
              desiredAltitude: state.desiredAltitude,
              constraintViolationCount: state.constraintViolationCount,
            },
          },
        });

        _advanceAfterVerification(get, set, true);
      }
    });

    // Start compliance timeout
    complianceTimerId = setTimeout(() => {
      // Guard stale callback
      if (get().phase !== 'active' || get().cockpitVerification?.status !== 'pending') return;

      // Unsubscribe
      if (cockpitUnsubscribe) { cockpitUnsubscribe(); cockpitUnsubscribe = null; }
      complianceTimerId = null;

      const cs = useCockpitStore.getState();
      set({
        cockpitVerification: {
          status: 'timed_out',
          expectedActions,
          startedAt: get().cockpitVerification?.startedAt ?? Date.now(),
          timeoutMs,
          actionResults: get().cockpitVerification?.actionResults ?? [],
          cockpitSnapshot: {
            selectedMode: cs.selectedMode,
            desiredAltitude: cs.desiredAltitude,
            constraintViolationCount: cs.constraintViolationCount,
          },
        },
      });

      _advanceAfterVerification(get, set, false);
    }, timeoutMs);
  },

  // ---------------------------------------------------------------------------
  // Step 1.6: clearCockpitVerification
  // ---------------------------------------------------------------------------
  clearCockpitVerification: () => {
    if (complianceTimerId) { clearTimeout(complianceTimerId); complianceTimerId = null; }
    if (cockpitUnsubscribe) { cockpitUnsubscribe(); cockpitUnsubscribe = null; }
    set({ cockpitVerification: null });
  },

  // ---------------------------------------------------------------------------
  // Step 2.2: startEventTimers
  // ---------------------------------------------------------------------------
  startEventTimers: (config) => {
    get().clearEventTimers();

    set({
      eventTimers: {
        startedAt: Date.now(),
        timeLimitMs: config.timeLimitMs,
        escalationDelayMs: config.escalationDelayMs ?? 0,
        escalationTriggered: false,
        timedOut: false,
      },
    });

    if (config.escalationDelayMs && config.onEscalation) {
      const onEsc = config.onEscalation;
      escalationTimerId = setTimeout(() => {
        if (get().phase !== 'active' || !get().eventTimers) return;
        escalationTimerId = null;
        set((s) => ({
          eventTimers: s.eventTimers ? { ...s.eventTimers, escalationTriggered: true } : null,
        }));
        onEsc();
      }, config.escalationDelayMs);
    }

    timeLimitTimerId = setTimeout(() => {
      if (get().phase !== 'active' || !get().eventTimers) return;
      timeLimitTimerId = null;
      set((s) => ({
        eventTimers: s.eventTimers ? { ...s.eventTimers, timedOut: true } : null,
      }));
      config.onTimeout();
    }, config.timeLimitMs);
  },

  // ---------------------------------------------------------------------------
  // Step 2.3: clearEventTimers
  // ---------------------------------------------------------------------------
  clearEventTimers: () => {
    if (escalationTimerId) { clearTimeout(escalationTimerId); escalationTimerId = null; }
    if (timeLimitTimerId) { clearTimeout(timeLimitTimerId); timeLimitTimerId = null; }
    set({ eventTimers: null });
  },

  // ---------------------------------------------------------------------------
  // Step 2.4: setters
  // ---------------------------------------------------------------------------
  markEscalationTriggered: () =>
    set((s) => ({
      eventTimers: s.eventTimers ? { ...s.eventTimers, escalationTriggered: true } : null,
    })),

  markTimedOut: () =>
    set((s) => ({
      eventTimers: s.eventTimers ? { ...s.eventTimers, timedOut: true } : null,
    })),
}));

// ---------------------------------------------------------------------------
// Step 1.7: _advanceAfterVerification (internal helper, not a store action)
// Builds enriched EventResult with cockpit telemetry, records it, then
// advances or completes the drill. Called from within beginCockpitVerification.
// ---------------------------------------------------------------------------
function _advanceAfterVerification(
  get: () => ScenarioStore,
  set: (partial: Partial<ScenarioStore> | ((s: ScenarioStore) => Partial<ScenarioStore>)) => void,
  verified: boolean,
) {
  const state = get();
  const verification = state.cockpitVerification;
  if (!verification) return;

  const complianceTimeMs = verified
    ? Date.now() - verification.startedAt
    : 0;

  // Build enriched EventResult with cockpit telemetry
  const result: EventResult = {
    eventIndex: state.currentEventIndex,
    eventType: 'atc_instruction',
    success: true,
    details: {
      cockpitVerified: verified,
      actionResults: verification.actionResults,
      cockpitSnapshot: verification.cockpitSnapshot,
      complianceTimeMs,
    },
    timestamp: Date.now(),
  };

  // Record the enriched result
  set((s) => ({
    eventResults: [...s.eventResults, result],
  }));

  // Clear verification state
  if (complianceTimerId) { clearTimeout(complianceTimerId); complianceTimerId = null; }
  if (cockpitUnsubscribe) { cockpitUnsubscribe(); cockpitUnsubscribe = null; }
  set({ cockpitVerification: null });

  // Advance or complete
  const drill = state.activeDrill;
  if (!drill || state.currentEventIndex >= drill.events.length - 1) {
    set({ phase: 'outcome' });
  } else {
    const nextIndex = state.currentEventIndex + 1;
    const nextEvent = drill.events[nextIndex];
    set({
      currentEventIndex: nextIndex,
      phase: nextEvent?.type === 'decision_point' ? 'decision' : 'active',
      readbackReceived: false,
    });
  }
}
