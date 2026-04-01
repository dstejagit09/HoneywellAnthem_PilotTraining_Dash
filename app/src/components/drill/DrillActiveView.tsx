// Active drill view — renders current event, handles interaction
// Read-only consumer of store state. All progression logic lives in scenario-store.

import { useDrillRunner } from '@/hooks/useDrillRunner';
import { DrillTimer } from './DrillTimer';
import { DecisionPrompt } from './DecisionPrompt';
import { AnthemButton } from '@/components/shared/AnthemButton';
import { evaluatePredictResponse } from '@/services/pilot-predict';
import { evaluateCockpitAction } from '@/lib/cockpit-action-utils';
import { VoicePanel } from '@/components/voice/VoicePanel';
import { useVoiceStore } from '@/stores/voice-store';
import { useCockpitStore } from '@/stores/cockpit-store';
import { useScenarioStore } from '@/stores/scenario-store';
import { useATCEngine } from '@/hooks/useATCEngine';
import type { DecisionPointEvent, PredictSuggestionEvent, ATCInstructionEvent, CockpitActionEvent } from '@/types';
import { useState, useEffect, useRef } from 'react';

export function DrillActiveView() {
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

  const livekitConnected = useVoiceStore((s) => s.livekitConnected);
  const { speakATCInstruction } = useATCEngine();
  const [predictHandled, setPredictHandled] = useState(false);
  const atcSpokenRef = useRef<number>(-1);

  // Read store state for display
  const cockpitVerification = useScenarioStore((s) => s.cockpitVerification);
  const handleKeyboardReadback = useScenarioStore((s) => s.handleKeyboardReadback);

  // Trigger ATC TTS when an atc_instruction event becomes active and LiveKit is connected
  useEffect(() => {
    if (currentEvent?.type === 'atc_instruction') {
      console.info('[DrillActiveView] ATC event detected — index=%d, livekit=%s, alreadySpoken=%s',
        currentEventIndex, livekitConnected, atcSpokenRef.current === currentEventIndex);
    }

    if (
      currentEvent?.type === 'atc_instruction' &&
      livekitConnected &&
      atcSpokenRef.current !== currentEventIndex
    ) {
      atcSpokenRef.current = currentEventIndex;
      const atcEvent = currentEvent as ATCInstructionEvent;
      console.info('[DrillActiveView] Triggering speakATCInstruction for event %d', currentEventIndex);
      speakATCInstruction(atcEvent.prompt, atcEvent.keywords).catch((err) =>
        console.error('[DrillActiveView] speakATCInstruction failed:', err),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent, currentEventIndex, livekitConnected]);

  // Voice auto-advance is handled entirely by the store's setReadbackReceived().
  // No useEffect needed here — the store owns the readback → verification → advance flow.

  if (!activeDrill || !currentEvent || !startTime) return null;

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

  // Decision point handled via DecisionPrompt overlay
  if (phase === 'decision' && currentEvent.type === 'decision_point') {
    const decisionEvent = currentEvent as DecisionPointEvent;
    return (
      <div className="flex-1 relative">
        <DrillHUD
          drill={activeDrill.title}
          eventIndex={currentEventIndex}
          totalEvents={totalEvents}
          startTime={startTime}
          duration={activeDrill.duration}
        />
        <DecisionPrompt
          event={decisionEvent}
          onDecide={(optionId, timedOut) => {
            recordResult({
              eventType: 'decision_point',
              success: optionId === decisionEvent.correctOptionId,
              details: { optionId, timedOut, correct: decisionEvent.correctOptionId },
            });
            handleAdvanceOrComplete();
          }}
        />
      </div>
    );
  }

  // ATC Instruction event — voice mode or keyboard fallback
  if (currentEvent.type === 'atc_instruction') {
    // Pending cockpit verification overlay — read-only display from store
    if (cockpitVerification?.status === 'pending') {
      const elapsed = Date.now() - cockpitVerification.startedAt;
      const remaining = Math.max(0, Math.ceil((cockpitVerification.timeoutMs - elapsed) / 1000));
      return (
        <div className="flex-1 flex flex-col">
          <DrillHUD
            drill={activeDrill.title}
            eventIndex={currentEventIndex}
            totalEvents={totalEvents}
            startTime={startTime}
            duration={activeDrill.duration}
          />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-lg border border-[var(--anthem-amber)]/30 bg-[var(--anthem-bg-secondary)] p-6">
              <div className="text-xs text-[var(--anthem-amber)] font-mono uppercase mb-2">
                Awaiting Cockpit Action
              </div>
              <p className="text-sm text-[var(--anthem-text-primary)] mb-4">
                Perform the required cockpit actions to comply with the ATC instruction.
              </p>
              <div className="space-y-2 mb-4">
                {cockpitVerification.actionResults.map((ar, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono">
                    <span className={ar.met ? 'text-[var(--anthem-green)]' : 'text-[var(--anthem-text-secondary)]'}>
                      {ar.met ? '✓' : '○'}
                    </span>
                    <span className="text-[var(--anthem-text-primary)]">
                      {ar.action.type}: {ar.action.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-[var(--anthem-text-secondary)]">
                Time remaining: {remaining}s
              </div>
            </div>
          </div>
        </div>
      );
    }

    // When LiveKit is connected, show voice panel alongside the ATC prompt
    if (livekitConnected) {
      return (
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <DrillHUD
              drill={activeDrill.title}
              eventIndex={currentEventIndex}
              totalEvents={totalEvents}
              startTime={startTime}
              duration={activeDrill.duration}
            />
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-6">
                <div className="text-xs text-[var(--anthem-cyan)] font-mono uppercase mb-2">
                  ATC Communication
                </div>
                <p className="text-sm text-[var(--anthem-text-primary)] mb-4">
                  {currentEvent.prompt}
                </p>
                <p className="text-xs text-[var(--anthem-text-secondary)]">
                  Use PTT (spacebar) to respond via voice.
                </p>
              </div>
            </div>
          </div>
          <VoicePanel />
        </div>
      );
    }

    // Keyboard fallback when voice is unavailable
    // Button handlers signal intent — store owns progression logic.
    return (
      <div className="flex-1 flex flex-col">
        <DrillHUD
          drill={activeDrill.title}
          eventIndex={currentEventIndex}
          totalEvents={totalEvents}
          startTime={startTime}
          duration={activeDrill.duration}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-6">
            <div className="text-xs text-[var(--anthem-cyan)] font-mono uppercase mb-2">
              ATC Communication
            </div>
            <p className="text-sm text-[var(--anthem-text-primary)] mb-4">
              {currentEvent.prompt}
            </p>
            <p className="text-xs text-[var(--anthem-text-secondary)] mb-4">
              Voice unavailable — click to simulate readback response.
            </p>
            <div className="flex gap-3">
              <AnthemButton
                variant="success"
                className="flex-1"
                onClick={() => handleKeyboardReadback(true)}
              >
                Readback Correct
              </AnthemButton>
              <AnthemButton
                variant="danger"
                onClick={() => handleKeyboardReadback(false)}
              >
                Skip
              </AnthemButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PilotPredict trap event
  if (currentEvent.type === 'predict_suggestion') {
    const predictEvent = currentEvent as PredictSuggestionEvent;
    return (
      <div className="flex-1 flex flex-col">
        <DrillHUD
          drill={activeDrill.title}
          eventIndex={currentEventIndex}
          totalEvents={totalEvents}
          startTime={startTime}
          duration={activeDrill.duration}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg border border-[var(--anthem-magenta)]/30 bg-[var(--anthem-bg-secondary)] p-6">
            <div className="text-xs text-[var(--anthem-magenta)] font-mono uppercase mb-2">
              PilotPredict Suggestion
            </div>
            <div className="rounded-lg bg-[var(--anthem-magenta)]/10 border border-[var(--anthem-magenta)]/20 p-3 mb-4">
              <p className="text-sm text-[var(--anthem-text-primary)] font-mono">
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
              <AnthemButton
                variant="primary"
                className="w-full"
                onClick={handleAdvanceOrComplete}
              >
                Continue
              </AnthemButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interactive cockpit event — handled by AmbientCockpitView
  if (currentEvent.type === 'interactive_cockpit') {
    return null;
  }

  // Cockpit action event — cockpit-aware, auto-detects action via store subscription
  if (currentEvent.type === 'cockpit_action') {
    return (
      <CockpitActionView
        event={currentEvent as CockpitActionEvent}
        drillTitle={activeDrill.title}
        eventIndex={currentEventIndex}
        totalEvents={totalEvents}
        startTime={startTime}
        duration={activeDrill.duration}
        onComplete={(cockpitVerified) => {
          recordResult({
            eventType: 'cockpit_action',
            success: true,
            details: {
              cockpitVerified,
              mode: cockpitVerified ? 'cockpit-verified' : 'keyboard-fallback',
              action: currentEvent.expectedAction,
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
    );
  }

  return null;
}

// Cockpit-aware action view — subscribes to cockpit store, auto-detects pilot action
function CockpitActionView({
  event,
  drillTitle,
  eventIndex,
  totalEvents,
  startTime,
  duration,
  onComplete,
  onSkip,
}: {
  event: CockpitActionEvent;
  drillTitle: string;
  eventIndex: number;
  totalEvents: number;
  startTime: number;
  duration: number;
  onComplete: (cockpitVerified: boolean) => void;
  onSkip: () => void;
}) {
  const baselineRef = useRef(useCockpitStore.getState());

  // Auto-detect when the expected action is performed on the cockpit
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
    <div className="flex-1 flex flex-col">
      <DrillHUD
        drill={drillTitle}
        eventIndex={eventIndex}
        totalEvents={totalEvents}
        startTime={startTime}
        duration={duration}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-[var(--anthem-green)]/30 bg-[var(--anthem-bg-secondary)] p-6">
          <div className="text-xs text-[var(--anthem-green)] font-mono uppercase mb-2">
            Cockpit Action Required
          </div>
          <p className="text-sm text-[var(--anthem-text-primary)] mb-4">
            {event.instruction}
          </p>
          <p className="text-xs text-[var(--anthem-text-secondary)] mb-4">
            Perform the action on the cockpit controls, or use the buttons below.
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
      </div>
    </div>
  );
}

// HUD bar showing drill progress
function DrillHUD({
  drill,
  eventIndex,
  totalEvents,
  startTime,
  duration,
}: {
  drill: string;
  eventIndex: number;
  totalEvents: number;
  startTime: number;
  duration: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)]">
      <div className="text-xs font-semibold text-[var(--anthem-text-primary)]">
        {drill}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--anthem-text-secondary)]">
          Event {eventIndex + 1}/{totalEvents}
        </span>
        <div className="w-24 h-1.5 rounded-full bg-[var(--anthem-bg-tertiary)] overflow-hidden">
          <div
            className="h-full bg-[var(--anthem-cyan)] rounded-full transition-all"
            style={{ width: `${((eventIndex + 1) / totalEvents) * 100}%` }}
          />
        </div>
        <DrillTimer startTime={startTime} durationSeconds={duration} mode="elapsed" />
      </div>
    </div>
  );
}
