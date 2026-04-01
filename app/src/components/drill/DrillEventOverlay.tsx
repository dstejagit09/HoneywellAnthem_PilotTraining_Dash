// Floating overlay for non-interactive, non-ATC drill events, rendered on top of the PFD.
// Handles: decision point, predict suggestion, cockpit action (now cockpit-aware).
// ATC instruction events are handled inline in the MFD Radios tab.

import { useState, useEffect, useRef } from 'react';
import { useDrillRunner } from '@/hooks/useDrillRunner';
import { useCockpitStore } from '@/stores/cockpit-store';
import { DrillTimer } from './DrillTimer';
import { DecisionPrompt } from './DecisionPrompt';
import { AnthemButton } from '@/components/shared/AnthemButton';
import { evaluatePredictResponse } from '@/services/pilot-predict';
import { evaluateCockpitAction } from '@/lib/cockpit-action-utils';
import type {
  DecisionPointEvent,
  PredictSuggestionEvent,
  CockpitActionEvent,
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

  // Cockpit action events use a compact non-blocking banner
  const isCockpitAction = currentEvent.type === 'cockpit_action';

  return (
    <div className={`absolute inset-0 z-40 flex flex-col items-center ${
      isCockpitAction
        ? 'justify-start pointer-events-none'
        : 'justify-center bg-black/60 backdrop-blur-sm'
    }`}>
      {/* HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-anthem-bg-secondary/90 border-b border-anthem-border pointer-events-auto">
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
      <div className={`${isCockpitAction ? 'mt-14 pointer-events-auto' : ''} max-w-md w-full mx-4`}>
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

        {/* Cockpit Action — compact banner, auto-detects action via cockpit state */}
        {isCockpitAction && (
          <CockpitActionBanner
            event={currentEvent as CockpitActionEvent}
            onComplete={(cockpitVerified) => {
              recordResult({
                eventType: 'cockpit_action',
                success: true,
                details: {
                  cockpitVerified,
                  mode: cockpitVerified ? 'cockpit-verified' : 'keyboard-fallback',
                  action: (currentEvent as CockpitActionEvent).expectedAction,
                },
              });
              handleAdvanceOrComplete();
            }}
            onSkip={() => {
              recordResult({
                eventType: 'cockpit_action',
                success: false,
                details: { mode: 'keyboard-fallback', timedOut: true },
              });
              handleAdvanceOrComplete();
            }}
          />
        )}
      </div>
    </div>
  );
}

// --- Cockpit Action Banner (non-blocking, auto-verifies against cockpit state) ---

interface CockpitActionBannerProps {
  event: CockpitActionEvent;
  onComplete: (cockpitVerified: boolean) => void;
  onSkip: () => void;
}

function CockpitActionBanner({ event, onComplete, onSkip }: CockpitActionBannerProps) {
  const baselineRef = useRef(useCockpitStore.getState());

  // Subscribe to cockpit state and auto-detect when the expected action is performed
  useEffect(() => {
    const unsubscribe = useCockpitStore.subscribe((state) => {
      if (evaluateCockpitAction(event.expectedAction, state, baselineRef.current)) {
        unsubscribe();
        onComplete(true);
      }
    });
    return () => unsubscribe();
  }, [event.expectedAction, onComplete]);

  return (
    <div className="rounded-lg border border-anthem-green/30 bg-anthem-bg-secondary/95 p-4 backdrop-blur-sm shadow-lg">
      <div className="text-xs text-anthem-green font-mono uppercase mb-2">
        Cockpit Action Required
      </div>
      <p className="text-sm text-anthem-text-primary mb-3">
        {event.instruction}
      </p>
      <div className="flex gap-3">
        <AnthemButton
          variant="success"
          className="flex-1"
          onClick={() => onComplete(false)}
        >
          Action Complete
        </AnthemButton>
        <AnthemButton
          variant="danger"
          onClick={onSkip}
        >
          Skip
        </AnthemButton>
      </div>
    </div>
  );
}
