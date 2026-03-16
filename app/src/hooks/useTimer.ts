// T5.17 — Countdown and elapsed timer hook

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseTimerOptions {
  mode: 'countdown' | 'elapsed';
  durationSeconds?: number;
  autoStart?: boolean;
  onExpire?: () => void;
}

interface UseTimerResult {
  seconds: number;
  isRunning: boolean;
  isExpired: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  formatted: string;
}

export function useTimer({
  mode,
  durationSeconds = 0,
  autoStart = false,
  onExpire,
}: UseTimerOptions): UseTimerResult {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (mode === 'countdown' && next >= durationSeconds) {
          setIsRunning(false);
          onExpireRef.current?.();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, durationSeconds]);

  const displaySeconds = mode === 'countdown'
    ? Math.max(0, durationSeconds - elapsed)
    : elapsed;

  const isExpired = mode === 'countdown' && elapsed >= durationSeconds;

  const minutes = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
  }, []);

  return {
    seconds: displaySeconds,
    isRunning,
    isExpired,
    start,
    stop,
    reset,
    formatted,
  };
}
