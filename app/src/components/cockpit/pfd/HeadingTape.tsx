// Integrated heading system: horizontal tape + mini circular compass.
// Tape provides precise readout; compass provides spatial orientation.

interface HeadingTapeProps {
  heading: number;
}

const TAPE_W = 380;
const TAPE_H = 26;
const PX_PER_DEG = 5;
const HALF_RANGE = TAPE_W / PX_PER_DEG / 2; // 38°

const FONT_MONO = "'JetBrains Mono', 'Consolas', monospace";
const FONT_UI   = "'Inter', system-ui, sans-serif";

function normalDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

// ── Mini Compass ───────────────────────────────────────────────────────────────

const CX = 50;
const CY = 50;
const R  = 44;

const CARDINALS = [
  { angle: 0,   label: 'N', isN: true },
  { angle: 90,  label: 'E', isN: false },
  { angle: 180, label: 'S', isN: false },
  { angle: 270, label: 'W', isN: false },
];
const INTERCARDINAL_ANGLES = [45, 135, 225, 315];

function MiniCompass({ heading }: { heading: number }) {
  return (
    <svg width={100} height={100} viewBox="0 0 100 100" style={{ display: 'block' }}>
      {/* Background fill */}
      <circle cx={CX} cy={CY} r={R} fill="rgba(0,0,0,0.22)" />
      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {/* Rotating card — ticks + labels */}
      <g transform={`rotate(${-heading}, ${CX}, ${CY})`}>
        {/* Cardinal ticks */}
        {CARDINALS.map(({ angle, label, isN }) => {
          const rad = (angle * Math.PI) / 180;
          const sinA = Math.sin(rad);
          const cosA = Math.cos(rad);
          const x1  = CX + R * sinA;
          const y1  = CY - R * cosA;
          const x2  = CX + (R - 8) * sinA;
          const y2  = CY - (R - 8) * cosA;
          const lx  = CX + (R - 19) * sinA;
          const ly  = CY - (R - 19) * cosA;
          return (
            <g key={angle}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isN ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isN ? 1.5 : 1}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT_UI}
                fontSize={isN ? 10 : 8}
                fontWeight={isN ? 600 : 500}
                fill={isN ? '#22d3ee' : 'rgba(255,255,255,0.3)'}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Intercardinal ticks */}
        {INTERCARDINAL_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1  = CX + R * Math.sin(rad);
          const y1  = CY - R * Math.cos(rad);
          const x2  = CX + (R - 4) * Math.sin(rad);
          const y2  = CY - (R - 4) * Math.cos(rad);
          return (
            <line
              key={angle}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.5}
            />
          );
        })}
      </g>

      {/* Aircraft symbol (fixed) — simple HSI silhouette */}
      <g stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} fill="none" strokeLinecap="round">
        {/* Fuselage */}
        <line x1={CX} y1={CY - 16} x2={CX} y2={CY + 14} />
        {/* Wings */}
        <line x1={CX - 16} y1={CY - 2} x2={CX + 16} y2={CY - 2} />
        {/* Tail */}
        <line x1={CX - 7} y1={CY + 14} x2={CX + 7} y2={CY + 14} />
      </g>

      {/* Dashed center line */}
      <line
        x1={CX} y1={CY - R + 12}
        x2={CX} y2={CY - 18}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
        strokeDasharray="2,2"
      />

      {/* Lubber line — fixed triangle at 12 o'clock */}
      <polygon
        points={`${CX},${CY - R + 1} ${CX - 4},${CY - R + 9} ${CX + 4},${CY - R + 9}`}
        fill="#0d7377"
      />
    </svg>
  );
}

// ── Heading Tape ───────────────────────────────────────────────────────────────

export function HeadingTape({ heading }: HeadingTapeProps) {
  const hdg = heading;

  const minDeg = Math.floor(hdg - HALF_RANGE - 1);
  const maxDeg = Math.ceil(hdg + HALF_RANGE + 1);

  const ticks: {
    x: number;
    normalD: number;
    angDist: number;
    isMajor10: boolean;
    isMajor5: boolean;
    label: string | null;
    isCardinal: boolean;
  }[] = [];

  for (let d = minDeg; d <= maxDeg; d++) {
    const nd = normalDeg(d);
    const angDist = Math.abs(d - hdg);
    const isMajor5  = nd % 5 === 0;
    const isMajor10 = nd % 10 === 0;

    if (!isMajor5) continue;

    const x = TAPE_W / 2 + (d - hdg) * PX_PER_DEG;
    if (x < -20 || x > TAPE_W + 20) continue;

    const isCardinal = nd === 0 || nd === 90 || nd === 180 || nd === 270;

    let label: string | null = null;
    if (isCardinal) {
      label = nd === 0 ? 'N' : nd === 90 ? 'E' : nd === 180 ? 'S' : 'W';
    } else if (isMajor10) {
      label = String(nd / 10).padStart(2, '0');
    }

    ticks.push({ x, normalD: nd, angDist, isMajor10, isMajor5, label, isCardinal });
  }

  const displayHdg = String(Math.round(normalDeg(heading))).padStart(3, '0');

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
      style={{ bottom: 16 }}
    >
      {/* Callout box */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            padding: '2px 14px',
            background: 'rgba(6,16,26,0.9)',
            border: '1.5px solid rgba(13,115,119,0.5)',
            borderBottom: 'none',
            borderRadius: '3px 3px 0 0',
            fontFamily: FONT_MONO,
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.05em',
            lineHeight: '1.4',
            minWidth: 64,
            textAlign: 'center',
          }}
        >
          {displayHdg}
        </div>
        {/* Teal pointer triangle */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '6px solid #0d7377',
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
        <rect x={0} y={0} width={TAPE_W} height={TAPE_H} fill="rgba(0,0,0,0.4)" />

        {/* Baseline */}
        <line x1={0} y1={0} x2={TAPE_W} y2={0} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />

        {/* Ticks and labels */}
        {ticks.map(({ x, normalD, angDist, isMajor10, label, isCardinal }) => {
          if (isCardinal) {
            return (
              <g key={normalD}>
                <line
                  x1={x} y1={0} x2={x} y2={12}
                  stroke="rgba(13,115,119,0.5)"
                  strokeWidth={1.5}
                />
                {label && (
                  <text
                    x={x} y={TAPE_H - 2}
                    textAnchor="middle"
                    fontFamily={FONT_UI}
                    fontSize={11}
                    fontWeight={600}
                    fill="rgba(13,115,119,0.7)"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          }

          // Distance-based opacity for non-cardinal ticks
          const tickH    = angDist <= 10 ? 10 : angDist <= 20 ? 9 : 7;
          const tickStroke = angDist <= 10
            ? 'rgba(255,255,255,0.25)'
            : angDist <= 20
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(255,255,255,0.15)';
          const tickW = isMajor10 ? 1 : 0.5;

          const labelFill = angDist <= 10
            ? 'rgba(255,255,255,0.5)'
            : angDist <= 25
              ? 'rgba(255,255,255,0.35)'
              : 'rgba(255,255,255,0.25)';

          return (
            <g key={normalD}>
              <line
                x1={x} y1={0} x2={x} y2={tickH}
                stroke={tickStroke}
                strokeWidth={tickW}
              />
              {label && isMajor10 && (
                <text
                  x={x} y={TAPE_H - 2}
                  textAnchor="middle"
                  fontFamily={FONT_MONO}
                  fontSize={10}
                  fontWeight={400}
                  fill={labelFill}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Mini compass */}
      <div style={{ marginTop: 8 }}>
        <MiniCompass heading={heading} />
      </div>
    </div>
  );
}
