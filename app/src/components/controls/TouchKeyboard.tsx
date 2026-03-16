// T3.8 — QWERTY layout for waypoint ID entry

import { useState } from 'react';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '←'],
];

interface TouchKeyboardProps {
  open: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  initialValue?: string;
  label?: string;
}

export function TouchKeyboard({
  open,
  onConfirm,
  onCancel,
  initialValue = '',
  label = 'Enter waypoint ID',
}: TouchKeyboardProps) {
  const [value, setValue] = useState(initialValue);

  const handleKey = (key: string) => {
    if (key === '←') {
      setValue((v) => v.slice(0, -1));
    } else {
      setValue((v) => (v + key).toUpperCase().slice(0, 5));
    }
  };

  const handleConfirm = () => {
    onConfirm(value);
    setValue('');
  };

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-anthem-bg-secondary border border-anthem-border rounded-lg p-4 w-[420px] shadow-xl">
        {/* Display */}
        <div className="mb-3 px-3 py-2 rounded bg-anthem-bg-input border border-anthem-border">
          <span className="text-xl font-mono text-anthem-cyan tracking-widest">
            {value || '-----'}
          </span>
        </div>

        <div className="mb-3 text-xs text-anthem-text-muted font-sans">{label}</div>

        {/* Keyboard rows */}
        <div className="flex flex-col gap-1.5 mb-3">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="min-h-[44px] min-w-[36px] px-2 rounded border border-anthem-border bg-anthem-bg-tertiary text-anthem-text-primary text-sm font-mono hover:bg-anthem-bg-secondary hover:border-anthem-text-muted active:scale-[0.97] transition-all"
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Confirm / Cancel */}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 min-h-[44px] rounded border border-anthem-border text-anthem-text-muted text-sm font-sans hover:text-anthem-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 min-h-[44px] rounded border border-anthem-cyan text-anthem-cyan text-sm font-sans font-medium hover:bg-anthem-bg-tertiary"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
