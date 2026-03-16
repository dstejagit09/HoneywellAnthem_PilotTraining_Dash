// T1.13 — Voice store: PTT state, transcript history, LiveKit connection

import { create } from 'zustand';
import type { TranscriptEntry } from '@/types';

interface VoiceStore {
  isPTTPressed: boolean;
  isRecording: boolean;
  isATCSpeaking: boolean;
  interimTranscript: string;
  transcriptHistory: TranscriptEntry[];
  pttPressTimestamp: number | null;
  atcSpeakEndTimestamp: number | null;
  localSpeechOnsetTimestamp: number | null;
  livekitConnected: boolean;

  pressPTT: () => void;
  releasePTT: () => void;
  setInterimTranscript: (text: string) => void;
  commitTranscript: (entry: TranscriptEntry) => void;
  setATCSpeaking: (speaking: boolean) => void;
  setLocalSpeechOnset: (timestamp: number) => void;
  setLivekitConnected: (connected: boolean) => void;
  clearTranscripts: () => void;
  reset: () => void;
}

const defaultState = {
  isPTTPressed: false,
  isRecording: false,
  isATCSpeaking: false,
  interimTranscript: '',
  transcriptHistory: [] as TranscriptEntry[],
  pttPressTimestamp: null as number | null,
  atcSpeakEndTimestamp: null as number | null,
  localSpeechOnsetTimestamp: null as number | null,
  livekitConnected: false,
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...defaultState,

  pressPTT: () =>
    set({
      isPTTPressed: true,
      isRecording: true,
      pttPressTimestamp: Date.now(),
      localSpeechOnsetTimestamp: null,
    }),

  releasePTT: () =>
    set({
      isPTTPressed: false,
      isRecording: false,
    }),

  setInterimTranscript: (text) => set({ interimTranscript: text }),

  commitTranscript: (entry) =>
    set((state) => ({
      transcriptHistory: [...state.transcriptHistory, entry],
      interimTranscript: '',
    })),

  setATCSpeaking: (speaking) =>
    set({
      isATCSpeaking: speaking,
      atcSpeakEndTimestamp: speaking ? null : Date.now(),
    }),

  setLocalSpeechOnset: (timestamp) =>
    set({ localSpeechOnsetTimestamp: timestamp }),

  setLivekitConnected: (connected) => set({ livekitConnected: connected }),

  clearTranscripts: () =>
    set({ transcriptHistory: [], interimTranscript: '' }),

  reset: () => set(defaultState),
}));
