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

  const pendingBorderStyle = isPending
    ? { borderTopColor: '#22d3ee' }
    : { borderTopColor: 'rgba(13,115,119,0.4)' };

  const baseStyle = {
    background: 'rgba(6,16,26,0.98)',
    borderTop: '2px solid',
    ...pendingBorderStyle,
  };

  const numBtnStyle = {
    minHeight: 40,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.12s',
    cursor: 'pointer',
  };

  // Collapsed view
  if (collapsed) {
    return (
      <div style={{ ...baseStyle, padding: '10px 12px', cursor: 'pointer' }} onClick={toggleCollapse}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-graduate uppercase" style={{ fontSize: 11, color: '#22d3ee', letterSpacing: '0.08em' }}>
              Numpad
            </span>
            <span style={{ color: 'rgba(34,211,238,0.4)', fontSize: 10 }}>&#9660;</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-graduate" style={{ color: '#22d3ee', fontSize: 13 }}>
              {standbyFrequency.value.toFixed(3)} MHz
            </span>
            {isPending && pendingActionType === 'swap_frequencies' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwap();
                }}
                className="font-graduate font-bold"
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(13,115,119,0.6)',
                  background: 'rgba(13,115,119,0.25)',
                  color: '#22d3ee',
                  fontSize: 12,
                  minHeight: 32,
                  cursor: 'pointer',
                }}
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
    <div style={{ ...baseStyle, padding: '10px 12px' }}>
      {/* Header with collapse toggle */}
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="font-graduate uppercase" style={{ fontSize: 11, color: '#22d3ee', letterSpacing: '0.08em' }}>
            Frequency
          </span>
          <span style={{ color: 'rgba(34,211,238,0.4)', fontSize: 10 }}>&#9650;</span>
        </div>
        {instructionText && isPending && (
          <span className="font-graduate truncate ml-2" style={{ fontSize: 10, color: 'rgba(252,211,77,0.85)', maxWidth: '60%' }}>
            {instructionText}
          </span>
        )}
      </div>

      {/* Frequency display field */}
      <div
        className="mb-2 flex items-center gap-1"
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(13,115,119,0.35)',
        }}
      >
        <span
          className="font-graduate flex-1"
          style={{ fontSize: 18, color: '#22d3ee', minHeight: 28 }}
        >
          {value || (
            <span style={{ color: 'rgba(34,211,238,0.25)' }}>
              {targetFrequencyHint ? targetFrequencyHint.toFixed(3) : '----.---'}
            </span>
          )}
        </span>
        <button
          onClick={handleBackspace}
          style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
              className="shrink-0 font-graduate"
              style={{
                padding: '3px 8px',
                borderRadius: 5,
                border: '1px solid rgba(13,115,119,0.4)',
                background: 'rgba(13,115,119,0.1)',
                color: '#22d3ee',
                fontSize: 10,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {freq.label} {freq.value.toFixed(3)}
            </button>
          ))}
        </div>
      )}

      {/* Digit grid — 4 rows x 3 columns */}
      <div className="grid grid-cols-3 mb-2" style={{ gap: 6 }}>
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className="font-graduate active:scale-[0.97]"
            style={{
              ...numBtnStyle,
              ...(key === 'CLR'
                ? {
                    color: 'rgba(252,176,69,0.85)',
                    border: '1px solid rgba(252,176,69,0.2)',
                    background: 'rgba(252,176,69,0.06)',
                  }
                : {}),
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSwap}
          className="font-graduate font-bold"
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 6,
            border: isPending && pendingActionType === 'swap_frequencies'
              ? '1px solid rgba(13,115,119,0.7)'
              : '1px solid rgba(13,115,119,0.35)',
            background: isPending && pendingActionType === 'swap_frequencies'
              ? 'rgba(13,115,119,0.3)'
              : 'rgba(13,115,119,0.1)',
            color: '#22d3ee',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          SWAP &#8644;
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValidEntry}
          className="font-graduate font-bold"
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 6,
            border: isValidEntry
              ? '1px solid rgba(13,115,119,0.7)'
              : '1px solid rgba(255,255,255,0.06)',
            background: isValidEntry
              ? '#0d7377'
              : 'rgba(255,255,255,0.03)',
            color: isValidEntry ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: 12,
            cursor: isValidEntry ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          CONFIRM
        </button>
      </div>
    </div>
  );
}
