// Horizontal heading tape — replaces circular compass rose.
// Honeywell Anthem style: scrolling tape with callout box, cardinal labels, tick marks.

interface HeadingTapeProps {
  heading: number;
}

const TAPE_W = 400;
const TAPE_H = 28;           // Tick + label area
const CALLOUT_H = 34;        // Callout box height above tape
const PX_PER_DEG = 5;        // 5px per degree → 80° visible range
const HALF_RANGE = TAPE_W / PX_PER_DEG / 2; // 40°

function normalDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

const FONT_MONO = "'JetBrains Mono', 'Consolas', monospace";
const FONT_UI = "'Inter', system-ui, sans-serif";

export function HeadingTape({ heading }: HeadingTapeProps) {
  const hdg = heading; // may be fractional — that's fine

  // Build visible tick array
  const minDeg = Math.floor(hdg - HALF_RANGE - 1);
  const maxDeg = Math.ceil(hdg + HALF_RANGE + 1);

  const ticks: { x: number; normalD: number; isMajor10: boolean; label: string | null; isCardinal: boolean }[] = [];

  for (let d = minDeg; d <= maxDeg; d++) {
    const nd = normalDeg(d);
    if (nd % 5 !== 0) continue;

    const x = TAPE_W / 2 + (d - hdg) * PX_PER_DEG;
    if (x < -20 || x > TAPE_W + 20) continue;

    const isMajor10 = nd % 10 === 0;
    const isCardinal = nd === 0 || nd === 90 || nd === 180 || nd === 270;

    let label: string | null = null;
    if (isCardinal) {
      label = nd === 0 ? 'N' : nd === 90 ? 'E' : nd === 180 ? 'S' : 'W';
    } else if (isMajor10) {
      label = String(nd / 10).padStart(2, '0');
    }

    ticks.push({ x, normalD: nd, isMajor10, label, isCardinal });
  }

  const displayHdg = String(Math.round(normalDeg(heading))).padStart(3, '0');

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
      style={{ bottom: 8, width: TAPE_W }}
    >
      {/* Callout box — current heading */}
      <div
        style={{
          height: CALLOUT_H,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderBottom: 'none',
          borderRadius: '5px 5px 0 0',
          fontFamily: FONT_MONO,
          fontSize: 22,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.06em',
          lineHeight: 1,
          minWidth: 70,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {displayHdg}
        {/* Inverted triangle pointer below callout */}
        <div
          style={{
            position: 'absolute',
            bottom: -7,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '7px solid rgba(255,255,255,0.7)',
            zIndex: 1,
          }}
        />
      </div>

      {/* Tape strip */}
      <svg
        width={TAPE_W}
        height={TAPE_H}
        viewBox={`0 0 ${TAPE_W} ${TAPE_H}`}
        style={{ display: 'block' }}
      >
        {/* Background */}
        <rect
          x={0} y={0}
          width={TAPE_W} height={TAPE_H}
          fill="rgba(0,0,0,0.45)"
          rx={0}
        />

        {/* Center line cap */}
        <rect x={TAPE_W / 2 - 1} y={0} width={2} height={4} fill="rgba(255,255,255,0.5)" />

        {/* Ticks and labels */}
        {ticks.map(({ x, normalD, isMajor10, isCardinal, label }) => {
          const tickH = isCardinal ? 12 : isMajor10 ? 10 : 6;
          const strokeColor = isCardinal ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)';
          const strokeW = isCardinal ? 2 : 1;
          return (
            <g key={normalD}>
              <line
                x1={x} y1={0}
                x2={x} y2={tickH}
                stroke={strokeColor}
                strokeWidth={strokeW}
              />
              {label && (
                <text
                  x={x}
                  y={TAPE_H - 2}
                  textAnchor="middle"
                  fill={isCardinal ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)'}
                  fontSize={isCardinal ? 13 : 11}
                  fontWeight={isCardinal ? 600 : 400}
                  fontFamily={isCardinal ? FONT_UI : FONT_MONO}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
