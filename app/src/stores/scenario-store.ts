// T1.12 — Scenario store: drill lifecycle, event sequencing

import { create } from 'zustand';
import type { DrillDefinition, DrillPhase, EventResult } from '@/types';

interface ScenarioStore {
  availableDrills: DrillDefinition[];
  activeDrill: DrillDefinition | null;
  phase: DrillPhase;
  currentEventIndex: number;
  eventResults: EventResult[];
  startTime: number | null;

  setAvailableDrills: (drills: DrillDefinition[]) => void;
  selectDrill: (drillId: string) => void;
  startDrill: () => void;
  advanceEvent: () => void;
  recordEventResult: (result: EventResult) => void;
  completeDrill: () => void;
  reset: () => void;
}

const defaultState = {
  availableDrills: [] as DrillDefinition[],
  activeDrill: null as DrillDefinition | null,
  phase: 'idle' as DrillPhase,
  currentEventIndex: 0,
  eventResults: [] as EventResult[],
  startTime: null as number | null,
};

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  ...defaultState,

  setAvailableDrills: (drills) => set({ availableDrills: drills }),

  selectDrill: (drillId) => {
    const drill = get().availableDrills.find((d) => d.id === drillId) ?? null;
    set({ activeDrill: drill, phase: drill ? 'briefing' : 'idle' });
  },

  startDrill: () =>
    set({
      phase: 'active',
      currentEventIndex: 0,
      eventResults: [],
      startTime: Date.now(),
    }),

  advanceEvent: () =>
    set((state) => {
      const nextIndex = state.currentEventIndex + 1;
      const drill = state.activeDrill;
      if (!drill || nextIndex >= drill.events.length) {
        return { phase: 'outcome' };
      }
      const nextEvent = drill.events[nextIndex];
      if (!nextEvent) return { phase: 'outcome' };
      return {
        currentEventIndex: nextIndex,
        phase: nextEvent.type === 'decision_point' ? 'decision' : 'active',
      };
    }),

  recordEventResult: (result) =>
    set((state) => ({
      eventResults: [...state.eventResults, result],
    })),

  completeDrill: () => set({ phase: 'outcome' }),

  reset: () => set(defaultState),
}));
