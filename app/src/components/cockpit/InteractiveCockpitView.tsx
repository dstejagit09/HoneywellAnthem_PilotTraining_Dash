// Top-level interactive cockpit view — rendered during interactive_cockpit drill events.
// Composes: AutopilotControlBar + InteractivePFD + InteractiveMFD + ATC overlay.

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useCockpitStore } from '@/stores/cockpit-store';
import { useAssessmentStore } from '@/stores/assessment-store';
import { useUIStore } from '@/stores/ui-store';
import { useInteractiveCockpitTracker } from '@/hooks/useInteractiveCockpitTracker';
import { AutopilotControlBar } from './AutopilotControlBar';
import { InteractivePFD } from './pfd';
import { InteractiveMFD } from './InteractiveMFD';
import { ResizeHandle } from './ResizeHandle';
import type { InteractiveCockpitEvent, InteractiveCockpitScore, CockpitMode, DrillDefinition } from '@/types';

interface InteractiveCockpitViewProps {
  event: InteractiveCockpitEvent;
  drill: DrillDefinition;
  eventIndex: number;
  totalEvents: number;
  startTime: number;
  onComplete: (score: InteractiveCockpitScore) => void;
}

export function InteractiveCockpitView({
  event,
  onComplete,
}: InteractiveCockpitViewProps) {
  const overridesAppliedRef = useRef(false);
  const modeChangeStartRef = useRef<number | null>(null);

  // Apply initial cockpit overrides on mount (once, bypasses hostile constraints)
  useEffect(() => {
    if (overridesAppliedRef.current) return;
    overridesAppliedRef.current = true;
    useCockpitStore.getState().applyCockpitOverrides(event.initialCockpitOverrides);
  }, [event.initialCockpitOverrides]);

  // Altitude simulation is handled by AmbientCockpitView's useAltitudeSimulation(true)
  // which remains active even when this component is rendered (hooks run before early returns).

  // Stable onComplete callback
  const handleComplete = useCallback(
    (score: InteractiveCockpitScore) => {
      useAssessmentStore.getState().recordInteractiveCockpitScore(score);
      onComplete(score);
    },
    [onComplete],
  );

  // Track pilot actions and evaluate conditions
  const trackerState = useInteractiveCockpitTracker(event, handleComplete);

  // Derive scenario status
  const scenarioStatus = trackerState.allMet ? 'resolved' : 'conflict';

  // Track mode selection timing
  const handleModeChange = useCallback((_mode: CockpitMode) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!modeChangeStartRef.current) {
      modeChangeStartRef.current = Date.now();
    }
  }, []);

  // Derive metrics for MFD display
  const modeSelectionCorrect = useMemo(() => {
    const modeCond = trackerState.conditionStatus.get(
      event.successConditions.find((c) => c.field === 'selectedMode')?.label ?? '',
    );
    return modeCond ?? false;
  }, [trackerState.conditionStatus, event.successConditions]);

  const atcCompliance = trackerState.allMet;
  const firstModeChange = trackerState.modeChanges[0];
  const responseTimeMs = firstModeChange ? firstModeChange.timeMs : 0;

  const mfdWidth = useUIStore((s) => s.mfdWidth);
  const setMfdWidth = useUIStore((s) => s.setMfdWidth);

  const handleDrag = useCallback(
    (deltaX: number) => {
      setMfdWidth(mfdWidth - deltaX);
    },
    [mfdWidth, setMfdWidth],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070c14]">
      {/* Top control bar */}
      <AutopilotControlBar onModeChange={handleModeChange} />

      {/* Main display area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Primary Flight Display (left) */}
        <InteractivePFD />

        {/* Resize handle */}
        <ResizeHandle onDrag={handleDrag} />

        {/* Multi-Function Display (right) */}
        <InteractiveMFD
          scenarioStatus={scenarioStatus as 'conflict' | 'resolved'}
          responseTimeMs={responseTimeMs}
          modeSelectionCorrect={modeSelectionCorrect}
          atcCompliance={atcCompliance}
          conditionStatus={trackerState.conditionStatus}
          width={mfdWidth}
        />

      </div>
    </div>
  );
}
