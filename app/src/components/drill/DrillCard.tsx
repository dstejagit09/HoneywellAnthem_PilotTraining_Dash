// T5.9 — Drill card with difficulty color, competency chips

import type { DrillDefinition } from '@/types';

const difficultyColors: Record<string, string> = {
  beginner: 'border-green-500 text-green-400',
  intermediate: 'border-amber-500 text-amber-400',
  advanced: 'border-red-500 text-red-400',
};

const difficultyBg: Record<string, string> = {
  beginner: 'bg-green-500/10',
  intermediate: 'bg-amber-500/10',
  advanced: 'bg-red-500/10',
};

interface DrillCardProps {
  drill: DrillDefinition;
  onSelect: (drillId: string) => void;
}

export function DrillCard({ drill, onSelect }: DrillCardProps) {
  const colorClass = difficultyColors[drill.difficulty] ?? '';
  const bgClass = difficultyBg[drill.difficulty] ?? '';
  const durationMin = Math.ceil(drill.duration / 60);

  return (
    <button
      onClick={() => onSelect(drill.id)}
      className={`w-full text-left rounded-lg border p-4 transition-all
        border-[var(--anthem-border)] bg-[var(--anthem-bg-tertiary)]
        hover:border-[var(--anthem-cyan)] hover:shadow-[0_0_12px_rgba(0,200,255,0.15)]
        active:scale-[0.98] min-h-[120px]`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--anthem-text-primary)]">
          {drill.title}
        </h3>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${colorClass} ${bgClass}`}
        >
          {drill.difficulty}
        </span>
      </div>

      <p className="text-xs text-[var(--anthem-text-secondary)] mb-3 line-clamp-2">
        {drill.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {drill.competencies.map((comp) => (
            <span
              key={comp}
              className="rounded bg-[var(--anthem-cyan)]/10 px-1.5 py-0.5 text-[10px] font-mono text-[var(--anthem-cyan)]"
            >
              {comp}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-[var(--anthem-text-secondary)] font-mono">
          {durationMin}min
        </span>
      </div>
    </button>
  );
}
