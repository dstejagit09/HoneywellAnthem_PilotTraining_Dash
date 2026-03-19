// Pre-drill baseline calibration flow with VU meter
// Pilot reads 5 standard ATC phrases to establish voice biomarker baseline

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnthemButton } from '@/components/shared/AnthemButton';
import { VUMeter } from '@/components/voice/VUMeter';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { useAssessmentStore } from '@/stores/assessment-store';
import { usePilotStore } from '@/stores/pilot-store';
import { sendDataMessage } from '@/services/livekit-client';
import type { CognitiveLoadBaseline } from '@/types';

const CALIBRATION_PHRASES = [
  'November-five-six-seven-eight-bravo, climb and maintain flight level three-five-zero.',
  'Roger, descend and maintain one-two-thousand, altimeter two-niner-niner-two.',
  'Contact Washington Center on one-three-two-point-four-five, good day.',
  'Hold as published at KINGS intersection, expect further clearance at one-five-three-zero zulu.',
  'Cleared ILS runway two-eight-left approach, maintain one-seven-zero knots until FIXXX.',
];

const REQUIRED_PHRASES = CALIBRATION_PHRASES.length;

interface CalibrationViewProps {
  onComplete: () => void;
}

export function CalibrationView({ onComplete }: CalibrationViewProps) {
  const [started, setStarted] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [levelFeedback, setLevelFeedback] = useState<'quiet' | 'good' | 'loud' | null>(null);

  const { levelRef, start: startAudio, stop: stopAudio } = useAudioLevel();
  const streamRef = useRef<MediaStream | null>(null);
  const feedbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activePilot = usePilotStore((s) => s.activePilot);
  const setCognitiveLoadBaseline = useAssessmentStore((s) => s.setCognitiveLoadBaseline);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      stopAudio();
      if (feedbackIntervalRef.current) {
        clearInterval(feedbackIntervalRef.current);
      }
    };
  }, [stopAudio]);

  const handleStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      await startAudio(stream);
      setStarted(true);

      // Monitor level for feedback
      feedbackIntervalRef.current = setInterval(() => {
        const level = levelRef.current ?? 0;
        if (level < 0.05) setLevelFeedback('quiet');
        else if (level > 0.85) setLevelFeedback('loud');
        else setLevelFeedback('good');
      }, 200);
    } catch {
      console.error('[CalibrationView] Microphone access denied');
    }
  }, [startAudio, levelRef]);

  const handleRecordStart = useCallback(() => {
    if (isRecording || currentPhrase >= REQUIRED_PHRASES) return;
    setIsRecording(true);

    // Send PTT_START to agent for audio capture
    void sendDataMessage('PTT_START', { timestamp: Date.now() / 1000 });
  }, [isRecording, currentPhrase]);

  const handleRecordEnd = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);

    // Send PTT_END to agent
    void sendDataMessage('PTT_END', { timestamp: Date.now() / 1000 });

    const next = currentPhrase + 1;
    if (next >= REQUIRED_PHRASES) {
      // Calibration complete — create partial baseline
      const baseline: CognitiveLoadBaseline = {
        pilotId: activePilot?.id ?? 'unknown',
        sampleCount: REQUIRED_PHRASES,
        f0Mean: 0,
        f0Std: 0,
        f0RangeMean: 0,
        intensityMean: 0,
        intensityStd: 0,
        speechRateMean: 0,
        speechRateStd: 0,
        disfluencyRateMean: 0,
        disfluencyRateStd: 0,
        isCalibrated: false, // partial — will become true after 10+ samples
      };
      setCognitiveLoadBaseline(baseline);
      setCompleted(true);

      // Cleanup mic
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      stopAudio();
      if (feedbackIntervalRef.current) {
        clearInterval(feedbackIntervalRef.current);
      }
    } else {
      setCurrentPhrase(next);
    }
  }, [isRecording, currentPhrase, activePilot, setCognitiveLoadBaseline, stopAudio]);

  // Spacebar PTT for calibration
  useEffect(() => {
    if (!started || completed) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isRecording) {
        e.preventDefault();
        handleRecordStart();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        handleRecordEnd();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [started, completed, isRecording, handleRecordStart, handleRecordEnd]);

  if (!started) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-8 text-center">
          <div className="text-xs text-[var(--anthem-cyan)] font-mono uppercase tracking-wider mb-3">
            Voice Calibration Required
          </div>
          <h2 className="text-lg font-semibold text-[var(--anthem-text-primary)] mb-4">
            Baseline Voice Calibration
          </h2>
          <p className="text-sm text-[var(--anthem-text-secondary)] mb-6 leading-relaxed">
            Before your first drill, we need to calibrate the system to your voice.
            You&apos;ll read {REQUIRED_PHRASES} standard ATC phrases while we measure your
            vocal characteristics. This takes about 2 minutes.
          </p>
          <AnthemButton variant="primary" onClick={() => void handleStart()}>
            Start Calibration
          </AnthemButton>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border border-[var(--anthem-green)]/30 bg-[var(--anthem-bg-secondary)] p-8 text-center">
          <div className="text-xs text-[var(--anthem-green)] font-mono uppercase tracking-wider mb-3">
            Calibration Complete
          </div>
          <h2 className="text-lg font-semibold text-[var(--anthem-text-primary)] mb-4">
            Voice Baseline Established
          </h2>
          <p className="text-sm text-[var(--anthem-text-secondary)] mb-6">
            {REQUIRED_PHRASES} phrases recorded. The baseline will continue refining
            during drills for improved accuracy.
          </p>
          <AnthemButton variant="success" onClick={onComplete}>
            Continue to Drills
          </AnthemButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-lg border border-[var(--anthem-border)] bg-[var(--anthem-bg-secondary)] p-6">
        <div className="text-xs text-[var(--anthem-cyan)] font-mono uppercase tracking-wider mb-4">
          Voice Calibration
        </div>

        {/* Phrase display */}
        <div className="mb-5">
          <div className="text-xs text-[var(--anthem-text-muted)] mb-2">
            Read aloud the following ATC instruction:
          </div>
          <div className="rounded-lg bg-[var(--anthem-bg-primary)] border border-[var(--anthem-border)] p-4">
            <p className="text-sm text-[var(--anthem-text-primary)] font-mono leading-relaxed">
              &ldquo;{CALIBRATION_PHRASES[currentPhrase]}&rdquo;
            </p>
          </div>
        </div>

        {/* VU Meter */}
        <div className="mb-4">
          <VUMeter levelRef={levelRef} />
        </div>

        {/* Level feedback */}
        <div className="text-xs text-center mb-4 h-4">
          {levelFeedback === 'quiet' && (
            <span className="text-[var(--anthem-amber)]">Too quiet — speak louder</span>
          )}
          {levelFeedback === 'good' && (
            <span className="text-[var(--anthem-green)]">Good — speak naturally at your normal volume</span>
          )}
          {levelFeedback === 'loud' && (
            <span className="text-[var(--anthem-red)]">Too loud — move mic further away</span>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--anthem-bg-tertiary)] overflow-hidden">
            <div
              className="h-full bg-[var(--anthem-cyan)] rounded-full transition-all duration-300"
              style={{ width: `${(currentPhrase / REQUIRED_PHRASES) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--anthem-text-secondary)] font-mono whitespace-nowrap">
            {currentPhrase}/{REQUIRED_PHRASES} phrases
          </span>
        </div>

        {/* Record button */}
        <button
          onMouseDown={handleRecordStart}
          onMouseUp={handleRecordEnd}
          onMouseLeave={() => { if (isRecording) handleRecordEnd(); }}
          onTouchStart={(e) => { e.preventDefault(); handleRecordStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); handleRecordEnd(); }}
          className={[
            'w-full min-h-[64px] rounded-lg border-2 font-mono text-sm font-bold',
            'transition-all duration-100 select-none touch-none',
            'flex flex-col items-center justify-center gap-1',
            isRecording
              ? 'border-anthem-red bg-anthem-red/10 text-anthem-red shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              : 'border-anthem-cyan bg-anthem-bg-tertiary text-anthem-cyan hover:bg-anthem-bg-secondary',
          ].join(' ')}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <span>{isRecording ? 'RECORDING...' : 'HOLD TO RECORD'}</span>
          {!isRecording && (
            <span className="text-[10px] text-anthem-text-muted">
              Hold SPACE or press and hold
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
