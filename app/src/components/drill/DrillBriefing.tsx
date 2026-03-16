// T5.10 — Full-screen briefing, scenario setup, "Begin Drill" button

import { useScenarioStore } from '@/stores/scenario-store';
import { AnthemButton } from '@/components/shared/AnthemButton';

export function DrillBriefing() {
  const drill = useScenarioStore((s) => s.activeDrill);
  const startDrill = useScenarioStore((s) => s.startDrill);
  const reset = useScenarioStore((s) => s.reset);

  if (!drill) return null;

  const durationMin = Math.ceil(drill.duration / 60);
  const eventSummary = drill.events.map((e) => {
    switch (e.type) {
      case 'atc_instruction': return 'ATC Communication';
      case 'decision_point': return 'Decision Point';
      case 'predict_suggestion': return 'PilotPredict Check';
      case 'cockpit_action': return 'Cockpit Action';
    }
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
      <div className="max-w-lg w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-8">
        <h2 className="text-xl font-bold text-[var(--anthem-text-primary)] mb-2">
          {drill.title}
        </h2>

        <p className="text-sm text-[var(--anthem-text-secondary)] mb-6">
          {drill.description}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--anthem-text-secondary)]">Duration</span>
            <span className="font-mono text-[var(--anthem-text-primary)]">{durationMin} min</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--anthem-text-secondary)]">Difficulty</span>
            <span className="font-mono text-[var(--anthem-text-primary)] capitalize">{drill.difficulty}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--anthem-text-secondary)]">Competencies</span>
            <span className="font-mono text-[var(--anthem-cyan)]">{drill.competencies.join(', ')}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--anthem-text-secondary)]">Callsign</span>
            <span className="font-mono text-[var(--anthem-text-primary)]">{drill.atcContext.callsign}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--anthem-text-secondary)]">Facility</span>
            <span className="font-mono text-[var(--anthem-text-primary)]">{drill.atcContext.facility}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[var(--anthem-text-secondary)] mb-2 uppercase tracking-wider">
            Drill Events
          </h3>
          <ol className="space-y-1">
            {eventSummary.map((label, i) => (
              <li key={i} className="text-xs text-[var(--anthem-text-primary)] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--anthem-cyan)]/10 text-[var(--anthem-cyan)] flex items-center justify-center text-[10px] font-mono shrink-0">
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3">
          <AnthemButton variant="primary" className="flex-1" onClick={startDrill}>
            Begin Drill
          </AnthemButton>
          <AnthemButton variant="danger" onClick={reset}>
            Cancel
          </AnthemButton>
        </div>
      </div>
    </div>
  );
}
