// Floating overlay for non-interactive, non-ATC drill events, rendered on top of the PFD.
// Handles: decision point, predict suggestion, cockpit action.
// ATC instruction events are now handled inline in the MFD Radios tab.

import { useState } from 'react';
import { useDrillRunner } from '@/hooks/useDrillRunner';
import { DrillTimer } from './DrillTimer';
import { DecisionPrompt } from './DecisionPrompt';
import { AnthemButton } from '@/components/shared/AnthemButton';
import { evaluatePredictResponse } from '@/services/pilot-predict';
import type {
  DecisionPointEvent,
  PredictSuggestionEvent,
} from '@/types';

export function DrillEventOverlay() {
  const {
    activeDrill,
    currentEvent,
    currentEventIndex,
    phase,
    startTime,
    recordResult,
    advance,
    complete,
  } = useDrillRunner();

  const [predictHandled, setPredictHandled] = useState(false);

  if (!activeDrill || !currentEvent || !startTime) return null;
  if (currentEvent.type === 'interactive_cockpit') return null;
  if (currentEvent.type === 'atc_instruction') return null;

  const totalEvents = activeDrill.events.length;
  const isLastEvent = currentEventIndex >= totalEvents - 1;

  const handleAdvanceOrComplete = () => {
    if (isLastEvent) {
      complete();
    } else {
      setPredictHandled(false);
      advance();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-anthem-bg-secondary/90 border-b border-anthem-border">
        <div className="text-xs font-semibold text-anthem-text-primary">
          {activeDrill.title}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-anthem-text-secondary">
            Event {currentEventIndex + 1}/{totalEvents}
          </span>
          <div className="w-24 h-1.5 rounded-full bg-anthem-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-anthem-cyan rounded-full transition-all"
              style={{ width: `${((currentEventIndex + 1) / totalEvents) * 100}%` }}
            />
          </div>
          <DrillTimer startTime={startTime} durationSeconds={activeDrill.duration} mode="elapsed" />
        </div>
      </div>

      {/* Event content */}
      <div className="max-w-md w-full mx-4">
        {/* Decision Point */}
        {phase === 'decision' && currentEvent.type === 'decision_point' && (
          <DecisionPrompt
            event={currentEvent as DecisionPointEvent}
            onDecide={(optionId, timedOut) => {
              const decisionEvent = currentEvent as DecisionPointEvent;
              recordResult({
                eventType: 'decision_point',
                success: optionId === decisionEvent.correctOptionId,
                details: { optionId, timedOut, correct: decisionEvent.correctOptionId },
              });
              handleAdvanceOrComplete();
            }}
          />
        )}

        {/* PilotPredict Trap */}
        {currentEvent.type === 'predict_suggestion' && (() => {
          const predictEvent = currentEvent as PredictSuggestionEvent;
          return (
            <div className="rounded-lg border border-anthem-magenta/30 bg-anthem-bg-secondary p-6">
              <div className="text-xs text-anthem-magenta font-mono uppercase mb-2">
                PilotPredict Suggestion
              </div>
              <div className="rounded-lg bg-anthem-magenta/10 border border-anthem-magenta/20 p-3 mb-4">
                <p className="text-sm text-anthem-text-primary font-mono">
                  {predictEvent.suggestion}
                </p>
              </div>
              {!predictHandled ? (
                <div className="flex gap-3">
                  <AnthemButton
                    variant="success"
                    className="flex-1"
                    onClick={() => {
                      const result = evaluatePredictResponse(predictEvent, true);
                      recordResult({
                        eventType: 'predict_suggestion',
                        success: result.detected,
                        details: { accepted: true, ...result },
                      });
                      setPredictHandled(true);
                    }}
                  >
                    Accept
                  </AnthemButton>
                  <AnthemButton
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      const result = evaluatePredictResponse(predictEvent, false);
                      recordResult({
                        eventType: 'predict_suggestion',
                        success: result.detected,
                        details: { accepted: false, ...result },
                      });
                      setPredictHandled(true);
                    }}
                  >
                    Reject
                  </AnthemButton>
                </div>
              ) : (
                <AnthemButton variant="primary" className="w-full" onClick={handleAdvanceOrComplete}>
                  Continue
                </AnthemButton>
              )}
            </div>
          );
        })()}

        {/* Cockpit Action */}
        {currentEvent.type === 'cockpit_action' && (
          <div className="rounded-lg border border-anthem-border bg-anthem-bg-secondary p-6">
            <div className="text-xs text-anthem-green font-mono uppercase mb-2">
              Cockpit Action Required
            </div>
            <p className="text-sm text-anthem-text-primary mb-4">
              {currentEvent.instruction}
            </p>
            <p className="text-xs text-anthem-text-secondary mb-4">
              Expected: {currentEvent.expectedAction.type} &rarr; {currentEvent.expectedAction.value}
            </p>
            <div className="flex gap-3">
              <AnthemButton
                variant="success"
                className="flex-1"
                onClick={() => {
                  recordResult({
                    eventType: 'cockpit_action',
                    success: true,
                    details: { mode: 'keyboard-fallback', action: currentEvent.expectedAction },
                  });
                  handleAdvanceOrComplete();
                }}
              >
                Action Complete
              </AnthemButton>
              <AnthemButton
                variant="danger"
                onClick={() => {
                  recordResult({
                    eventType: 'cockpit_action',
                    success: false,
                    details: { mode: 'keyboard-fallback', timedOut: true },
                  });
                  handleAdvanceOrComplete();
                }}
              >
                Skip
              </AnthemButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
