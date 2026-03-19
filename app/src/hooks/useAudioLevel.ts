// Real-time audio level monitoring via Web Audio API AnalyserNode
// Returns a ref (not state) to avoid 30fps re-renders

import { useRef, useEffect, useCallback } from 'react';

interface UseAudioLevelResult {
  levelRef: React.RefObject<number>;
  start: (stream: MediaStream) => Promise<void>;
  stop: () => void;
}

export function useAudioLevel(): UseAudioLevelResult {
  const levelRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    levelRef.current = 0;
  }, []);

  const start = useCallback(
    async (stream: MediaStream) => {
      // Clean up any prior session
      stop();

      const ctx = new AudioContext();
      ctxRef.current = ctx;

      // Must await resume — Chrome suspends AudioContext by default
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.3; // Lower smoothing for faster response
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      // No destination — passive tap
      sourceRef.current = source;

      const buffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      bufferRef.current = buffer;

      const tick = () => {
        if (!analyserRef.current || !bufferRef.current) return;

        const buf = bufferRef.current;
        analyserRef.current.getFloatTimeDomainData(buf);

        // Compute RMS
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = buf[i] ?? 0;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);

        // Normalize to 0-1 range (speech RMS is typically 0.01-0.15)
        levelRef.current = Math.min(1, rms / 0.15);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  // Cleanup on unmount
  useEffect(() => {
    return stop;
  }, [stop]);

  return { levelRef, start, stop };
}
