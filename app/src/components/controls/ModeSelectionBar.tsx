// T3.6 — NAV/APR/HDG/ALT/VS mode buttons, active mode cyan glow

import { useCockpitStore } from '@/stores/cockpit-store';
import type { CockpitMode } from '@/types';

const MODES: { id: CockpitMode; label: string }[] = [
  { id: 'NAV', label: 'NAV' },
  { id: 'APR', label: 'APR' },
  { id: 'HDG', label: 'HDG' },
  { id: 'ALT', label: 'ALT' },
  { id: 'VS', label: 'VS' },
];

export function ModeSelectionBar() {
  const selectedMode = useCockpitStore((s) => s.selectedMode);
  const setMode = useCockpitStore((s) => s.setMode);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-anthem-border">
      <span className="text-[10px] uppercase tracking-wider text-anthem-text-muted font-sans mr-2">
        Mode
      </span>
      {MODES.map((mode) => {
        const isActive = selectedMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={[
              'min-h-[44px] min-w-[44px] px-4 py-2 rounded border text-sm font-mono font-bold',
              'transition-all duration-150 active:scale-[0.97]',
              isActive
                ? 'border-anthem-cyan text-anthem-cyan bg-anthem-bg-secondary shadow-[0_0_12px_var(--anthem-cyan-glow)]'
                : 'border-anthem-border text-anthem-text-muted bg-anthem-bg-tertiary hover:text-anthem-text-secondary hover:border-anthem-text-muted',
            ].join(' ')}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
