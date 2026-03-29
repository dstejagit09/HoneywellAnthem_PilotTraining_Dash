// Mode annunciations — mode/status pills, VNAV constraint warning.

import type { CockpitMode } from '@/types';

interface ModeAnnunciationsProps {
  modeDisplay: string;
  status: string;
  selectedMode: CockpitMode;
  vnavConstraint: number;
  desiredAltitude: number;
  isDescending: boolean;
}

export function ModeAnnunciations({
  modeDisplay,
  status,
  selectedMode,
  vnavConstraint,
  desiredAltitude,
}: ModeAnnunciationsProps) {
  return (
    <>
      {/* Mode annunciations (top center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 14px',
            borderRadius: 4,
            backgroundColor: 'rgba(13,115,119,0.4)',
            border: '1px solid rgba(13,115,119,0.65)',
            color: '#5eead4',
          }}
        >
          {modeDisplay}
        </div>
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 14px',
            borderRadius: 4,
            backgroundColor: 'rgba(6,16,26,0.75)',
            border: '1px solid rgba(13,115,119,0.45)',
            color: '#5eead4',
          }}
        >
          {status}
        </div>
      </div>

      {/* VNAV constraint warning */}
      {selectedMode === 'VNAV' && vnavConstraint > 0 && desiredAltitude < vnavConstraint && (
        <div className="absolute top-3 left-3 z-20">
          <div className="px-2 py-0.5 rounded border text-xs font-semibold animate-pulse font-graduate"
            style={{
              backgroundColor: 'rgba(245,158,11,0.15)',
              borderColor: 'rgba(245,158,11,0.4)',
              color: '#fcd34d',
            }}
          >
            VNAV {vnavConstraint.toLocaleString()} FT
          </div>
        </div>
      )}

    </>
  );
}
