// T5.13 — Post-drill summary with per-event results

import { useScenarioStore } from '@/stores/scenario-store';
import { useUIStore } from '@/stores/ui-store';
import { AnthemButton } from '@/components/shared/AnthemButton';

export function DrillOutcome() {
  const drill = useScenarioStore((s) => s.activeDrill);
  const eventResults = useScenarioStore((s) => s.eventResults);
  const startTime = useScenarioStore((s) => s.startTime);
  const reset = useScenarioStore((s) => s.reset);
  const setTab = useUIStore((s) => s.setActiveTab);

  if (!drill) return null;

  const totalEvents = drill.events.length;
  const successCount = eventResults.filter((r) => r.success).length;
  const elapsedSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  const eventTypeLabel = (type: string) => {
    switch (type) {
      case 'atc_instruction': return 'ATC Communication';
      case 'decision_point': return 'Decision Point';
      case 'predict_suggestion': return 'PilotPredict Check';
      case 'cockpit_action': return 'Cockpit Action';
      default: return type;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
      <div className="max-w-lg w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-8">
        <h2 className="text-xl font-bold text-[var(--anthem-text-primary)] mb-1">
          Drill Complete
        </h2>
        <p className="text-sm text-[var(--anthem-text-secondary)] mb-6">
          {drill.title}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-[var(--anthem-bg-tertiary)] p-3 text-center">
            <div className="text-2xl font-mono font-bold text-[var(--anthem-cyan)]">
              {successCount}/{totalEvents}
            </div>
            <div className="text-[10px] text-[var(--anthem-text-secondary)] uppercase">Events Passed</div>
          </div>
          <div className="rounded-lg bg-[var(--anthem-bg-tertiary)] p-3 text-center">
            <div className="text-2xl font-mono font-bold text-[var(--anthem-text-primary)]">
              {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-[var(--anthem-text-secondary)] uppercase">Elapsed</div>
          </div>
          <div className="rounded-lg bg-[var(--anthem-bg-tertiary)] p-3 text-center">
            <div className="text-2xl font-mono font-bold text-[var(--anthem-text-primary)]">
              {drill.competencies.join(', ')}
            </div>
            <div className="text-[10px] text-[var(--anthem-text-secondary)] uppercase">Competencies</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[var(--anthem-text-secondary)] mb-3 uppercase tracking-wider">
            Event Results
          </h3>
          <div className="space-y-2">
            {drill.events.map((event, i) => {
              const result = eventResults.find((r) => r.eventIndex === i);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border border-[var(--anthem-border)] bg-[var(--anthem-bg-tertiary)] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--anthem-cyan)]/10 text-[var(--anthem-cyan)] flex items-center justify-center text-[10px] font-mono shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-[var(--anthem-text-primary)]">
                      {eventTypeLabel(event.type)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono ${
                      result?.success
                        ? 'text-[var(--anthem-green)]'
                        : result
                          ? 'text-red-400'
                          : 'text-[var(--anthem-text-secondary)]'
                    }`}
                  >
                    {result?.success ? 'PASS' : result ? 'FAIL' : 'SKIP'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <AnthemButton
            variant="primary"
            className="flex-1"
            onClick={() => {
              setTab('assessment');
              reset();
            }}
          >
            View Dashboard
          </AnthemButton>
          <AnthemButton
            variant="warning"
            className="flex-1"
            onClick={reset}
          >
            Try Again
          </AnthemButton>
        </div>
      </div>
    </div>
  );
}
