// T5.15 — PilotPredict suggestion service
// Generates correct suggestions + intentionally wrong trap suggestions

import type { PredictSuggestionEvent } from '@/types';

interface PredictResult {
  suggestion: string;
  isTrap: boolean;
  correctAction: string;
  context: string;
}

/**
 * Generate a suggestion from a PredictSuggestionEvent.
 * Trap events always produce wrong suggestions by design.
 */
export function generatePrediction(event: PredictSuggestionEvent): PredictResult {
  return {
    suggestion: event.suggestion,
    isTrap: true, // PredictSuggestionEvents are always traps in this prototype
    correctAction: event.correctAction,
    context: event.context,
  };
}

/**
 * Evaluate whether the pilot correctly handled a PilotPredict suggestion.
 */
export function evaluatePredictResponse(
  event: PredictSuggestionEvent,
  accepted: boolean,
): { detected: boolean; explanation: string } {
  // For trap events: rejecting is correct, accepting is wrong
  const detected = !accepted;

  return {
    detected,
    explanation: detected
      ? `Correct — the suggestion "${event.suggestion}" was intentionally wrong. ${event.context}`
      : `The suggestion "${event.suggestion}" was a trap. The correct action was: ${event.correctAction}. ${event.context}`,
  };
}
