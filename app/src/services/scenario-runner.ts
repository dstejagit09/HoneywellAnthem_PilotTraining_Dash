// T5.14 — Drill lifecycle manager: startDrill, advanceEvent, recordEventResult, completeDrill

import { useScenarioStore } from '@/stores/scenario-store';
import { useCockpitStore } from '@/stores/cockpit-store';
import { useAssessmentStore } from '@/stores/assessment-store';
import type { DrillDefinition, EventResult } from '@/types';
import { allDrills } from '@/data/drills';

export function initializeDrills(): void {
  useScenarioStore.getState().setAvailableDrills(allDrills);
}

export function startDrill(drillId: string): void {
  const scenario = useScenarioStore.getState();
  const cockpit = useCockpitStore.getState();
  const assessment = useAssessmentStore.getState();

  // Find and select the drill
  scenario.selectDrill(drillId);
  const drill = useScenarioStore.getState().activeDrill;
  if (!drill) return;

  // Set cockpit to drill's initial state
  cockpit.loadFlightPlan(drill.initialState.flightPlan);
  cockpit.setAltitude(drill.initialState.altitude);
  cockpit.setHeading(drill.initialState.heading);
  cockpit.setSpeed(drill.initialState.speed);
  cockpit.setFrequency(drill.initialState.activeFrequency, 'active');
  cockpit.setFrequency(drill.initialState.standbyFrequency, 'standby');
  cockpit.setMode(drill.initialState.selectedMode);

  // Initialize assessment metrics
  assessment.initDrillMetrics(drill.id);

  // Start the drill
  scenario.startDrill();
}

export function recordEventResult(result: EventResult): void {
  useScenarioStore.getState().recordEventResult(result);
}

export function advanceEvent(): void {
  useScenarioStore.getState().advanceEvent();
}

export function completeDrill(): void {
  const scenario = useScenarioStore.getState();
  const assessment = useAssessmentStore.getState();

  scenario.completeDrill();
  assessment.finalizeDrillMetrics();
  // Save to server (async, fire-and-forget)
  assessment.saveToServer().catch((err: unknown) => {
    console.warn('[scenario-runner] Failed to save to server:', err);
  });
}

export function getCurrentDrill(): DrillDefinition | null {
  return useScenarioStore.getState().activeDrill;
}

export function resetDrill(): void {
  useScenarioStore.getState().reset();
}
