// Real-time VU meter with 16 CSS segments
// Level driven by ref + direct DOM mutation to avoid re-renders

import { useRef, useEffect } from 'react';

const SEGMENT_COUNT = 16;
const GREEN_END = 10;
const AMBER_END = 13;

function getSegmentColor(index: number): string {
  if (index < GREEN_END) return 'var(--color-anthem-green)';
  if (index < AMBER_END) return 'var(--color-anthem-amber)';
  return 'var(--color-anthem-red)';
}

interface VUMeterProps {
  levelRef: React.RefObject<number>;
}

export function VUMeter({ levelRef }: VUMeterProps) {
  const segmentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const peakRef = useRef<number>(0);
  const peakDecayRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const level = levelRef.current ?? 0;
      const activeCount = Math.round(level * SEGMENT_COUNT);

      // Peak hold with decay
      if (activeCount > peakRef.current) {
        peakRef.current = activeCount;
        peakDecayRef.current = 0;
      } else {
        peakDecayRef.current += 1;
        if (peakDecayRef.current > 30) {
          // ~0.5s at 60fps
          peakRef.current = Math.max(peakRef.current - 1, 0);
        }
      }

      for (let i = 0; i < SEGMENT_COUNT; i++) {
        const el = segmentsRef.current[i];
        if (!el) continue;

        const isActive = i < activeCount;
        const isPeak = i === peakRef.current - 1 && peakRef.current > activeCount;

        el.style.opacity = isActive || isPeak ? '1' : '0.15';
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [levelRef]);

  return (
    <div className="w-full">
      <div className="text-[10px] font-mono text-anthem-text-muted uppercase tracking-wider mb-1">
        Mic Level
      </div>
      <div className="flex gap-[2px] h-6 items-end">
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              segmentsRef.current[i] = el;
            }}
            className="flex-1 rounded-sm transition-opacity duration-75"
            style={{
              backgroundColor: getSegmentColor(i),
              opacity: 0.15,
              height: '100%',
            }}
          />
        ))}
      </div>
    </div>
  );
}
