// T5.11 — Countdown/elapsed timer overlay

import { useEffect, useState } from 'react';

interface DrillTimerProps {
  startTime: number;
  durationSeconds: number;
  mode?: 'elapsed' | 'countdown';
}

export function DrillTimer({ startTime, durationSeconds, mode = 'elapsed' }: DrillTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSec = Math.floor((now - startTime) / 1000);
  const displaySec = mode === 'countdown'
    ? Math.max(0, durationSeconds - elapsedSec)
    : elapsedSec;

  const minutes = Math.floor(displaySec / 60);
  const seconds = displaySec % 60;
  const isExpiring = mode === 'countdown' && displaySec <= 10;

  return (
    <div
      className={`font-mono text-sm tabular-nums ${
        isExpiring
          ? 'text-red-400 animate-pulse'
          : 'text-[var(--anthem-text-secondary)]'
      }`}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
