// T8.9 — Concordance rate display
// AI-vs-instructor agreement from override data (Strategic Dimension 7)

import { useAssessmentStore } from '@/stores/assessment-store';

export function ConcordanceRate() {
  const history = useAssessmentStore((s) => s.sessionHistory);

  // Count drills with instructor overrides
  const overridden = history.filter((r) => r.instructorOverride !== null);
  const accepted = overridden.filter(
    (r) =>
      r.instructorOverride &&
      (r.instructorOverride as Record<string, unknown>).action === 'accept_ai_score',
  );

  if (overridden.length === 0) return null;

  const rate =
    overridden.length > 0
      ? Math.round((accepted.length / overridden.length) * 100)
      : 0;

  return (
    <div className="flex items-center gap-2 rounded border border-anthem-border bg-anthem-bg-tertiary px-3 py-1.5">
      <span className="text-[10px] font-mono text-anthem-text-secondary uppercase">
        AI Concordance
      </span>
      <span
        className={[
          'text-sm font-mono font-bold',
          rate >= 80 ? 'text-anthem-green' : rate >= 60 ? 'text-anthem-amber' : 'text-anthem-red',
        ].join(' ')}
      >
        {rate}%
      </span>
      <span className="text-[9px] text-anthem-text-muted">
        ({accepted.length}/{overridden.length})
      </span>
    </div>
  );
}
