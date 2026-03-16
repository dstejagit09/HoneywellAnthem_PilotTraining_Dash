// T5.16 — React hook wrapping scenario-runner

import { useEffect } from 'react';
import { useScenarioStore } from '@/stores/scenario-store';
import * as runner from '@/services/scenario-runner';
import type { EventResult } from '@/types';

export function useDrillRunner() {
  const phase = useScenarioStore((s) => s.phase);
  const activeDrill = useScenarioStore((s) => s.activeDrill);
  const currentEventIndex = useScenarioStore((s) => s.currentEventIndex);
  const eventResults = useScenarioStore((s) => s.eventResults);
  const startTime = useScenarioStore((s) => s.startTime);
  const availableDrills = useScenarioStore((s) => s.availableDrills);

  // Initialize drills on mount
  useEffect(() => {
    if (availableDrills.length === 0) {
      runner.initializeDrills();
    }
  }, [availableDrills.length]);

  const currentEvent = activeDrill?.events[currentEventIndex] ?? null;

  return {
    phase,
    activeDrill,
    currentEvent,
    currentEventIndex,
    eventResults,
    startTime,

    startDrill: runner.startDrill,

    recordResult: (result: Omit<EventResult, 'eventIndex' | 'timestamp'>) => {
      runner.recordEventResult({
        ...result,
        eventIndex: currentEventIndex,
        timestamp: Date.now(),
      });
    },

    advance: () => {
      runner.advanceEvent();
    },

    complete: () => {
      runner.completeDrill();
    },

    reset: () => {
      runner.resetDrill();
    },
  };
}
