// T3.10 — Individual suggestion chip, magenta accent

interface PredictSuggestionProps {
  id: string;
  text: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function PredictSuggestion({ id, text, onAccept, onReject }: PredictSuggestionProps) {
  return (
    <div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border border-anthem-magenta/50 bg-anthem-bg-secondary">
      <span className="text-sm font-mono text-anthem-magenta">{text}</span>
      <button
        onClick={() => onAccept(id)}
        className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full text-anthem-green hover:bg-anthem-green/10 transition-colors text-lg"
        aria-label="Accept suggestion"
      >
        ✓
      </button>
      <button
        onClick={() => onReject(id)}
        className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full text-anthem-red hover:bg-anthem-red/10 transition-colors text-lg"
        aria-label="Reject suggestion"
      >
        ✕
      </button>
    </div>
  );
}
