// T3.9 — AI suggestion chip area, accept/reject

import { PredictSuggestion } from './PredictSuggestion';

interface PilotPredictProps {
  suggestions: { id: string; text: string; isTrap?: boolean }[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function PilotPredict({ suggestions, onAccept, onReject }: PilotPredictProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-anthem-magenta/30 bg-anthem-bg-tertiary">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-anthem-magenta font-sans font-semibold">
          PilotPredict
        </span>
        <span className="text-[10px] text-anthem-text-muted">AI Suggestion</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <PredictSuggestion
            key={s.id}
            id={s.id}
            text={s.text}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}
