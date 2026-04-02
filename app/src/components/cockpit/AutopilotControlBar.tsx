// Flight Control Panel — mode buttons (VNAV/FLCH/VS/ALT/AP/AUTO) + altitude display
// Restyled to match avionics PFD design with Graduate font and PFD color palette.

import { useCockpitStore } from '@/stores/cockpit-store';
import type { CockpitMode } from '@/types';

interface AutopilotControlBarProps {
  onModeChange?: (mode: CockpitMode) => void;
}

const MODE_BUTTONS: { mode: CockpitMode; label: string }[] = [
  { mode: 'FLCH', label: 'FLC' },
  { mode: 'VNAV', label: 'VNAV' },
  { mode: 'ALT', label: 'ALT' },
  { mode: 'VS', label: 'V/S' },
];

export function AutopilotControlBar({ onModeChange }: AutopilotControlBarProps) {
  const selectedMode = useCockpitStore((s) => s.selectedMode);
  const autopilot = useCockpitStore((s) => s.autopilot);
  const autoThrottle = useCockpitStore((s) => s.autoThrottle);
  const desiredAltitude = useCockpitStore((s) => s.desiredAltitude);
  const desiredSpeed = useCockpitStore((s) => s.desiredSpeed);
  const selectedHeading = useCockpitStore((s) => s.selectedHeading);
  const activeFrequency = useCockpitStore((s) => s.activeFrequency);
  const vnavConstraint = useCockpitStore((s) => s.vnavConstraint);
  const lastViolation = useCockpitStore((s) => s.lastConstraintViolation);
  const setMode = useCockpitStore((s) => s.setMode);
  const setAutopilot = useCockpitStore((s) => s.setAutopilot);
  const setAutoThrottle = useCockpitStore((s) => s.setAutoThrottle);

  const isVnavConstrained = selectedMode === 'VNAV' && vnavConstraint > 0;
  const hasViolation = lastViolation !== null;

  const handleModeClick = (mode: CockpitMode) => {
    setMode(mode);
    onModeChange?.(mode);
  };

  // Anthem signature: solid teal active, transparent inactive
  const activeStyle = 'bg-[#0d7377] text-white border-[#0d7377]';
  const inactiveStyle = 'bg-transparent text-white/35 border-white/10 hover:bg-white/5 hover:text-white/60';
  // 34px height, 13px — readable at cockpit distance without squinting
  const pillBase = 'h-[34px] px-3.5 flex items-center text-[13px] font-bold rounded border transition-all font-graduate';

  return (
    <div
      className="border-b px-4 py-2 flex items-center justify-between"
      style={{ backgroundColor: 'rgba(6,16,26,0.95)', borderBottomColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Left: 3 semantic groups with grouped containers and dividers */}
      <div className="flex items-center gap-2">

        {/* Group 1 — AP engagement: AUTO · AT · AFDS · AP */}
        <div
          className="flex items-center gap-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '3px 6px' }}
        >
          <button
            onClick={() => setAutoThrottle(!autoThrottle)}
            className={`${pillBase} ${autoThrottle ? activeStyle : inactiveStyle}`}
          >
            AUTO
          </button>
          <button className={`${pillBase} ${activeStyle}`}>AT</button>
          <button className={`${pillBase} ${inactiveStyle}`}>AFDS</button>
          <button
            onClick={() => setAutopilot(!autopilot)}
            className={`${pillBase} ${autopilot ? activeStyle : inactiveStyle}`}
          >
            AP
          </button>
        </div>

        <div className="w-px h-[22px] mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />

        {/* Group 2 — Mode selection: FLC · VNAV · ALT · V/S */}
        <div
          className="flex items-center gap-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '3px 6px' }}
        >
          {MODE_BUTTONS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => handleModeClick(mode)}
              className={`${pillBase} ${selectedMode === mode ? activeStyle : inactiveStyle} relative`}
            >
              {label}
              {/* Amber constraint dot on VNAV when constraint is active */}
              {mode === 'VNAV' && isVnavConstrained && selectedMode === 'VNAV' && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#f59e0b' }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="w-px h-[22px] mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />

        {/* Group 3 — Target value readouts: SPD · ALT (data display, not toggles) */}
        <div
          className="h-[34px] flex items-center gap-2 px-3.5"
          style={{ background: 'rgba(13,115,119,0.2)', border: '1px solid rgba(13,115,119,0.5)', borderRadius: 6 }}
        >
          <span className="text-[10px] font-medium text-white/40 font-graduate">SPD</span>
          <span className="text-[14px] font-semibold font-graduate tabular-nums" style={{ color: '#67e8f9' }}>{Math.round(desiredSpeed)}</span>
        </div>
        <div
          className="h-[34px] flex items-center gap-2 px-3.5"
          style={{ background: 'rgba(13,115,119,0.2)', border: '1px solid rgba(13,115,119,0.5)', borderRadius: 6 }}
        >
          <span className="text-[10px] font-medium text-white/40 font-graduate">HDG</span>
          <span className="text-[14px] font-semibold font-graduate tabular-nums" style={{ color: '#67e8f9' }}>{String(Math.round(selectedHeading)).padStart(3, '0')}</span>
        </div>
        <div
          className={`h-[34px] flex items-center gap-2 px-3.5 transition-all duration-200 ${hasViolation ? 'animate-pulse' : ''}`}
          style={{
            background: hasViolation ? 'rgba(245,158,11,0.25)' : 'rgba(13,115,119,0.2)',
            border: `1px solid ${hasViolation ? 'rgba(245,158,11,0.7)' : 'rgba(13,115,119,0.5)'}`,
            borderRadius: 6,
          }}
        >
          <span className="text-[10px] font-medium text-white/40 font-graduate">ALT</span>
          <span
            className="text-[14px] font-semibold font-graduate tabular-nums transition-colors duration-200"
            style={{ color: hasViolation ? '#fbbf24' : '#67e8f9' }}
          >
            {desiredAltitude.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Right: active frequency */}
      <div className="flex items-center gap-2">
        <div className="font-bold font-graduate">
          <span className="text-[14px] font-semibold" style={{ color: '#22d3ee' }}>{activeFrequency.value.toFixed(3)}</span>{' '}
          <span className="text-[12px] text-white/50">{activeFrequency.label}</span>
        </div>
      </div>
    </div>
  );
}
