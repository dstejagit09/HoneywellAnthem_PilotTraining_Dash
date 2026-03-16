// T3.7 — Overlay numpad, 44x44px buttons, confirm/cancel

import { useState, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useCockpitStore } from '@/stores/cockpit-store';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '←'];

export function TouchNumpad() {
  const numpadOpen = useUIStore((s) => s.numpadOpen);
  const numpadTarget = useUIStore((s) => s.numpadTarget);
  const closeNumpad = useUIStore((s) => s.closeNumpad);
  const setFrequency = useCockpitStore((s) => s.setFrequency);
  const standbyFrequency = useCockpitStore((s) => s.standbyFrequency);
  const updateWaypoint = useCockpitStore((s) => s.updateWaypoint);

  const [value, setValue] = useState('');

  const handleKey = useCallback((key: string) => {
    if (key === '←') {
      setValue((v) => v.slice(0, -1));
    } else {
      setValue((v) => v + key);
    }
  }, []);

  const handleConfirm = () => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      closeNumpad();
      setValue('');
      return;
    }

    if (numpadTarget === 'standby-frequency') {
      if (num >= 118.0 && num <= 136.975) {
        setFrequency({ ...standbyFrequency, value: num }, 'standby');
      }
    } else if (numpadTarget?.startsWith('waypoint-altitude-')) {
      const index = parseInt(numpadTarget.replace('waypoint-altitude-', ''), 10);
      if (!isNaN(index)) {
        updateWaypoint(index, { altitude: num });
      }
    }

    setValue('');
    closeNumpad();
  };

  const handleCancel = () => {
    setValue('');
    closeNumpad();
  };

  if (!numpadOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-anthem-bg-secondary border border-anthem-border rounded-lg p-4 w-72 shadow-xl">
        {/* Display */}
        <div className="mb-3 px-3 py-2 rounded bg-anthem-bg-input border border-anthem-border">
          <span className="text-xl font-mono text-anthem-cyan">
            {value || '0'}
          </span>
        </div>

        {/* Target label */}
        <div className="mb-3 text-xs text-anthem-text-muted font-sans">
          {numpadTarget === 'standby-frequency'
            ? 'Enter frequency (118.000 – 136.975)'
            : 'Enter altitude'}
        </div>

        {/* Key grid */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="min-h-[44px] min-w-[44px] rounded border border-anthem-border bg-anthem-bg-tertiary text-anthem-text-primary text-lg font-mono hover:bg-anthem-bg-secondary hover:border-anthem-text-muted active:scale-[0.97] transition-all"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Confirm / Cancel */}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 min-h-[44px] rounded border border-anthem-border text-anthem-text-muted text-sm font-sans hover:text-anthem-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 min-h-[44px] rounded border border-anthem-cyan text-anthem-cyan text-sm font-sans font-medium hover:bg-anthem-bg-tertiary transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
