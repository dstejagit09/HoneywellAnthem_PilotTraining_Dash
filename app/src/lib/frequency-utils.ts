// Shared frequency helpers for numpad, cockpit action validation, and event routing.

import { frequencyList } from '@/data/frequencies';
import type { CockpitAction, Frequency } from '@/types';

/** Check if a CockpitAction is frequency-related (set_frequency or swap_frequencies) */
export function isFrequencyAction(action: CockpitAction): boolean {
  return action.type === 'set_frequency' || action.type === 'swap_frequencies';
}

/** Validate a frequency is in the aviation VHF COM range */
export function isValidComFrequency(value: number): boolean {
  return value >= 118.0 && value <= 136.975;
}

/** Find frequencies whose value string starts with the given input */
export function findMatchingFrequencies(input: string, maxResults = 3): Frequency[] {
  if (!input || input === '.') return [];
  return frequencyList
    .filter((f) => f.value.toFixed(3).startsWith(input))
    .slice(0, maxResults);
}

/** Check if an entered frequency matches the expected value (within floating-point tolerance) */
export function frequencyMatchesExpected(entered: number, expected: number): boolean {
  return Math.abs(entered - expected) < 0.002;
}
