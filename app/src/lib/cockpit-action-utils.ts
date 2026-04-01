// Evaluates whether a CockpitAction has been performed by checking actual cockpit state.
// Used by cockpit_action drill events to auto-detect pilot actions on the cockpit.

import type { CockpitAction, Frequency } from '@/types';

export interface CockpitSnapshot {
  selectedMode: string;
  desiredAltitude: number;
  heading: number;
  speed: number;
  activeFrequency: Frequency;
  standbyFrequency: Frequency;
}

export function evaluateCockpitAction(
  expected: CockpitAction,
  state: CockpitSnapshot,
  baseline?: CockpitSnapshot,
): boolean {
  switch (expected.type) {
    case 'set_mode':
      return state.selectedMode === expected.value;
    case 'set_altitude':
      return state.desiredAltitude === Number(expected.value);
    case 'set_heading':
      return state.heading === Number(expected.value);
    case 'set_speed':
      return state.speed === Number(expected.value);
    case 'set_frequency':
      return state.activeFrequency.value === Number(expected.value);
    case 'swap_frequencies':
      // Detect that active/standby swapped from baseline
      if (!baseline) return false;
      return (
        state.activeFrequency.value === baseline.standbyFrequency.value &&
        state.standbyFrequency.value === baseline.activeFrequency.value
      );
    default:
      return false;
  }
}

/**
 * Evaluate multiple CockpitActions against the current cockpit state.
 * Returns aggregate result and per-action breakdown.
 */
export function evaluateAllCockpitActions(
  expected: CockpitAction[],
  state: CockpitSnapshot,
  baseline?: CockpitSnapshot,
): { allMet: boolean; results: { action: CockpitAction; met: boolean }[] } {
  const results = expected.map((action) => ({
    action,
    met: evaluateCockpitAction(action, state, baseline),
  }));
  return {
    allMet: results.every((r) => r.met),
    results,
  };
}
