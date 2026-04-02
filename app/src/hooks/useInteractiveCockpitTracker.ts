// Tracks pilot actions during an interactive_cockpit event.
// Evaluates success conditions, manages escalation timer, computes final score.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCockpitStore } from '@/stores/cockpit-store';
import { sendATCEscalation, sendInteractiveCockpitResult, isConnected } from '@/services/livekit-client';
import type { InteractiveCockpitEvent, InteractiveCockpitScore, CockpitSuccessCondition } from '@/types';

interface TrackerState {
  conditionStatus: Map<string, boolean>;
  modeChanges: { from: string; to: string; timeMs: number }[];
  altitudeChanges: { from: number; to: number; timeMs: number }[];
  escalationTriggered: boolean;
  elapsedMs: number;
  allMet: boolean;
}

function evaluateCondition(
  condition: CockpitSuccessCondition,
  state: ReturnType<typeof useCockpitStore.getState>,
): boolean {
  let actual: unknown;
  switch (condition.field) {
    case 'selectedMode':
      actual = state.selectedMode;
      break;
    case 'desiredAltitude':
      actual = state.desiredAltitude;
      break;
    case 'altitude':
      actual = state.altitude;
      break;
    case 'heading':
      actual = state.heading;
      break;
    case 'speed':
      actual = state.speed;
      break;
    case 'desiredSpeed':
      actual = state.desiredSpeed;
      break;
    case 'selectedHeading':
      actual = state.selectedHeading;
      break;
    case 'activeFrequency':
      actual = state.activeFrequency.value;
      break;
    default:
      return false;
  }

  switch (condition.operator) {
    case 'eq':
      return actual === condition.value;
    case 'lte':
      return typeof actual === 'number' && actual <= (condition.value as number);
    case 'gte':
      return typeof actual === 'number' && actual >= (condition.value as number);
    case 'neq':
      return actual !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(String(actual));
    default:
      return false;
  }
}

export function useInteractiveCockpitTracker(
  event: InteractiveCockpitEvent,
  onComplete: (score: InteractiveCockpitScore) => void,
  onEscalation?: (prompt: string) => void,
) {
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);
  const prevModeRef = useRef(useCockpitStore.getState().selectedMode);
  const prevAltRef = useRef(useCockpitStore.getState().desiredAltitude);
  const conditionTimesRef = useRef<Map<string, number>>(new Map());

  const [trackerState, setTrackerState] = useState<TrackerState>({
    conditionStatus: new Map(event.successConditions.map((c) => [c.label, false])),
    modeChanges: [],
    altitudeChanges: [],
    escalationTriggered: false,
    elapsedMs: 0,
    allMet: false,
  });

  const buildScore = useCallback(
    (state: TrackerState, timedOut: boolean): InteractiveCockpitScore => ({
      conditionsMet: event.successConditions.map((c) => ({
        label: c.label,
        met: state.conditionStatus.get(c.label) ?? false,
        timeMs: conditionTimesRef.current.get(c.label) ?? state.elapsedMs,
      })),
      allConditionsMet: state.allMet,
      totalTimeMs: Date.now() - startTimeRef.current,
      timedOut,
      modeChanges: state.modeChanges,
      altitudeChanges: state.altitudeChanges,
      escalationTriggered: state.escalationTriggered,
    }),
    [event.successConditions],
  );

  // Subscribe to cockpit-store changes
  useEffect(() => {
    // Evaluate conditions against a cockpit snapshot and update tracker state
    const evaluate = (state: ReturnType<typeof useCockpitStore.getState>) => {
      if (completedRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;

      setTrackerState((prev) => {
        const newStatus = new Map(prev.conditionStatus);
        const newModeChanges = [...prev.modeChanges];
        const newAltChanges = [...prev.altitudeChanges];

        // Track mode changes
        if (state.selectedMode !== prevModeRef.current) {
          newModeChanges.push({
            from: prevModeRef.current,
            to: state.selectedMode,
            timeMs: elapsed,
          });
          prevModeRef.current = state.selectedMode;
        }

        // Track altitude changes
        if (state.desiredAltitude !== prevAltRef.current) {
          newAltChanges.push({
            from: prevAltRef.current,
            to: state.desiredAltitude,
            timeMs: elapsed,
          });
          prevAltRef.current = state.desiredAltitude;
        }

        // Evaluate conditions
        for (const condition of event.successConditions) {
          const met = evaluateCondition(condition, state);
          const wasMet = newStatus.get(condition.label);
          newStatus.set(condition.label, met);
          if (met && !wasMet) {
            conditionTimesRef.current.set(condition.label, elapsed);
          }
        }

        const allMet = event.successConditions.every((c) => newStatus.get(c.label));

        return {
          conditionStatus: newStatus,
          modeChanges: newModeChanges,
          altitudeChanges: newAltChanges,
          escalationTriggered: prev.escalationTriggered,
          elapsedMs: elapsed,
          allMet,
        };
      });
    };

    // Initial evaluation — conditions may already be met from prior events
    evaluate(useCockpitStore.getState());

    // Subscribe to subsequent changes
    const unsubscribe = useCockpitStore.subscribe(evaluate);

    return () => unsubscribe();
  }, [event.successConditions]);

  // Complete when all conditions met
  useEffect(() => {
    if (trackerState.allMet && !completedRef.current) {
      completedRef.current = true;
      // Small delay so the pilot sees the final state
      setTimeout(() => {
        const score = buildScore(trackerState, false);
        onComplete(score);

        // Send result to agent for drill evaluation
        if (isConnected()) {
          sendInteractiveCockpitResult(score as unknown as Record<string, unknown>);
        }
      }, 1000);
    }
  }, [trackerState.allMet, trackerState, onComplete, buildScore]);

  // Escalation timer
  useEffect(() => {
    const prompt = event.escalationPrompt;
    if (!event.escalationDelaySeconds || !prompt) return;

    const keywords = event.escalationKeywords ?? [];
    const timer = setTimeout(() => {
      if (completedRef.current) return;
      setTrackerState((prev) => ({ ...prev, escalationTriggered: true }));

      // Send escalation to agent for TTS playback
      if (isConnected()) {
        sendATCEscalation(prompt, prompt, keywords);
      }

      // Notify parent component
      onEscalation?.(prompt);
    }, event.escalationDelaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [event.escalationDelaySeconds, event.escalationPrompt, event.escalationKeywords, onEscalation]);

  // Time limit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setTrackerState((prev) => {
        const finalState = { ...prev, elapsedMs: event.timeLimitSeconds * 1000 };
        const score = buildScore(finalState, true);
        onComplete(score);

        // Send result to agent for drill evaluation
        if (isConnected()) {
          sendInteractiveCockpitResult(score as unknown as Record<string, unknown>);
        }

        return finalState;
      });
    }, event.timeLimitSeconds * 1000);

    return () => clearTimeout(timer);
  }, [event.timeLimitSeconds, onComplete, buildScore]);

  // Elapsed time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (completedRef.current) return;
      setTrackerState((prev) => ({
        ...prev,
        elapsedMs: Date.now() - startTimeRef.current,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return trackerState;
}
