// T5.12 — Modal overlay with decision options and countdown

import { useEffect, useState, useCallback } from 'react';
import type { DecisionPointEvent } from '@/types';

interface DecisionPromptProps {
  event: DecisionPointEvent;
  onDecide: (optionId: string, timedOut: boolean) => void;
}

export function DecisionPrompt({ event, onDecide }: DecisionPromptProps) {
  const [remaining, setRemaining] = useState(event.timeLimitSeconds);
  const [selected, setSelected] = useState<string | null>(null);

  const handleTimeout = useCallback(() => {
    if (!selected) {
      onDecide('', true);
    }
  }, [selected, onDecide]);

  useEffect(() => {
    if (remaining <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, handleTimeout]);

  const handleSelect = (optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    onDecide(optionId, false);
  };

  const isExpiring = remaining <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-md w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[var(--anthem-magenta)] uppercase tracking-wider">
            Decision Required
          </h3>
          <span
            className={`font-mono text-lg tabular-nums ${
              isExpiring ? 'text-red-400 animate-pulse' : 'text-[var(--anthem-text-primary)]'
            }`}
          >
            {remaining}s
          </span>
        </div>

        <p className="text-sm text-[var(--anthem-text-primary)] mb-6">
          {event.prompt}
        </p>

        <div className="space-y-2">
          {event.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-all min-h-[44px]
                ${
                  selected === option.id
                    ? 'border-[var(--anthem-cyan)] bg-[var(--anthem-cyan)]/10 text-[var(--anthem-text-primary)]'
                    : selected !== null
                      ? 'border-[var(--anthem-border)] bg-[var(--anthem-bg-tertiary)] text-[var(--anthem-text-secondary)] opacity-50'
                      : 'border-[var(--anthem-border)] bg-[var(--anthem-bg-tertiary)] text-[var(--anthem-text-primary)] hover:border-[var(--anthem-cyan)]'
                }`}
            >
              <span className="font-mono text-xs text-[var(--anthem-cyan)] mr-2">
                {option.id.toUpperCase()}.
              </span>
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
