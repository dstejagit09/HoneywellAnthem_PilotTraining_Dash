// Inline frequency numpad embedded in the MFD panel.
// Replaces the "Training Status" div during frequency cockpit_action events.
// Features: digit grid, predictive frequency suggestions, SWAP button, collapse/expand.

import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useCockpitStore } from '@/stores/cockpit-store';
import {
  isValidComFrequency,
  findMatchingFrequencies,
} from '@/lib/frequency-utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'CLR'] as const;

interface InlineFrequencyNumpadProps {
  isPending: boolean;
  pendingActionType: 'set_frequency' | 'swap_frequencies' | null;
  targetFrequencyHint?: number;
  instructionText?: string;
  onFrequencyConfirmed: (value: number) => void;
  onSwapConfirmed: () => void;
}

export function InlineFrequencyNumpad({
  isPending,
  pendingActionType,
  targetFrequencyHint,
  instructionText,
  onFrequencyConfirmed,
  onSwapConfirmed,
}: InlineFrequencyNumpadProps) {
  const collapsed = useUIStore((s) => s.inlineNumpadCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleInlineNumpad);
  const setCollapsed = useUIStore((s) => s.setInlineNumpadCollapsed);

  const setFrequency = useCockpitStore((s) => s.setFrequency);
  const swapFrequencies = useCockpitStore((s) => s.swapFrequencies);
  const standbyFrequency = useCockpitStore((s) => s.standbyFrequency);

  const [value, setValue] = useState('');

  // Auto-expand when a frequency action becomes pending
  useEffect(() => {
    if (isPending) {
      setCollapsed(false);
    }
  }, [isPending, setCollapsed]);

  // Clear input when pending state changes (new event)
  useEffect(() => {
    setValue('');
  }, [isPending, pendingActionType]);

  const handleKey = useCallback((key: string) => {
    if (key === 'CLR') {
      setValue('');
    } else {
      setValue((v) => v + key);
    }
  }, []);

  const handleBackspace = useCallback(() => {
    setValue((v) => v.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    const num = parseFloat(value);
    if (isNaN(num) || !isValidComFrequency(num)) return;

    setFrequency({ value: num, label: '' }, 'standby');
    onFrequencyConfirmed(num);
    setValue('');
  }, [value, setFrequency, onFrequencyConfirmed]);

  const handleSwap = useCallback(() => {
    swapFrequencies();
    onSwapConfirmed();
  }, [swapFrequencies, onSwapConfirmed]);

  const handleSuggestionTap = useCallback(
    (freq: { value: number; label: string }) => {
      setFrequency(freq, 'standby');
      onFrequencyConfirmed(freq.value);
      setValue('');
    },
    [setFrequency, onFrequencyConfirmed],
  );

  const suggestions = findMatchingFrequencies(value);
  const parsedValue = parseFloat(value);
  const isValidEntry = !isNaN(parsedValue) && isValidComFrequency(parsedValue);

  const pendingBorder = isPending
    ? 'border-cyan-400 animate-pulse shadow-lg shadow-cyan-500/30'
    : 'border-cyan-700/50';

  // Collapsed view
  if (collapsed) {
    return (
      <div
        className={`bg-gradient-to-b from-[#1a2736] to-[#151f2b] border-t-2 ${pendingBorder} p-3 cursor-pointer`}
        onClick={toggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase">
              Numpad
            </span>
            <span className="text-cyan-400/50 text-xs">&#9660;</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-300 font-mono text-sm">
              {standbyFrequency.value.toFixed(3)} MHz
            </span>
            {isPending && pendingActionType === 'swap_frequencies' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwap();
                }}
                className="px-3 py-1 rounded bg-green-600/20 border border-green-500/50 text-green-300 font-bold text-xs hover:bg-green-600/30 transition-colors min-h-[32px]"
              >
                SWAP &#8644;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      className={`bg-gradient-to-b from-[#1a2736] to-[#151f2b] border-t-2 ${pendingBorder} p-3`}
    >
      {/* Header with collapse toggle */}
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase">
            Frequency
          </span>
          <span className="text-cyan-400/50 text-xs">&#9650;</span>
        </div>
        {instructionText && isPending && (
          <span className="text-amber-300 text-[10px] font-mono truncate ml-2 max-w-[60%]">
            {instructionText}
          </span>
        )}
      </div>

      {/* Frequency display field */}
      <div className="mb-2 flex items-center gap-1 px-2 py-1.5 rounded bg-slate-900/60 border border-cyan-600/40">
        <span className="text-lg font-mono text-cyan-300 flex-1 min-h-[28px]">
          {value || (
            <span className="text-cyan-600/40">
              {targetFrequencyHint
                ? targetFrequencyHint.toFixed(3)
                : '----.---'}
            </span>
          )}
        </span>
        <button
          onClick={handleBackspace}
          className="w-8 h-8 rounded bg-slate-800/60 border border-slate-600/40 text-cyan-400/70 text-sm hover:bg-slate-700/60 hover:text-cyan-300 transition-colors flex items-center justify-center"
        >
          &#9003;
        </button>
      </div>

      {/* Predictive suggestions */}
      {suggestions.length > 0 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto">
          {suggestions.map((freq) => (
            <button
              key={freq.value}
              onClick={() => handleSuggestionTap(freq)}
              className="shrink-0 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-600/30 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/40 hover:border-cyan-500/50 transition-colors"
            >
              {freq.label} {freq.value.toFixed(3)}
            </button>
          ))}
        </div>
      )}

      {/* Digit grid — 4 rows x 3 columns */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className="min-h-[40px] rounded border border-slate-600/50 bg-slate-800/50 text-cyan-200 text-base font-mono hover:bg-slate-700/60 hover:border-cyan-500/40 active:scale-[0.97] transition-all flex items-center justify-center"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSwap}
          className={`flex-1 min-h-[40px] rounded border font-bold text-xs transition-all flex items-center justify-center gap-1 ${
            isPending && pendingActionType === 'swap_frequencies'
              ? 'bg-green-600/30 border-green-400 text-green-300 animate-pulse hover:bg-green-600/40'
              : 'bg-green-600/10 border-green-600/40 text-green-400/70 hover:bg-green-600/20 hover:border-green-500/50'
          }`}
        >
          SWAP &#8644;
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValidEntry}
          className={`flex-1 min-h-[40px] rounded border font-bold text-xs transition-all flex items-center justify-center ${
            isValidEntry
              ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/30'
              : 'bg-slate-800/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
