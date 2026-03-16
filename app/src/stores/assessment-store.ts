// T1.14 — Assessment store: metrics, CBTA scores, cognitive load baseline

import { create } from 'zustand';
import type {
  DrillMetrics,
  DrillResult,
  CBTAScores,
  CBTACompetency,
  ReadbackScore,
  DecisionScore,
  TouchScore,
  CognitiveLoadBaseline,
  CognitiveLoadScore,
} from '@/types';

interface AssessmentStore {
  currentDrillMetrics: DrillMetrics | null;
  sessionHistory: DrillResult[];
  cbta: CBTAScores;
  cognitiveLoadBaseline: CognitiveLoadBaseline | null;
  currentEventCognitiveLoad: CognitiveLoadScore[];
  activePilotId: string | null;

  recordReadbackScore: (score: ReadbackScore) => void;
  recordCognitiveLoadScore: (score: CognitiveLoadScore) => void;
  recordDecisionScore: (score: DecisionScore) => void;
  recordTouchScore: (score: TouchScore) => void;
  initDrillMetrics: (drillId: string) => void;
  finalizeDrillMetrics: () => void;
  setCBTA: (scores: CBTAScores) => void;
  setCognitiveLoadBaseline: (baseline: CognitiveLoadBaseline) => void;
  setActivePilotId: (pilotId: string | null) => void;
  loadFromServer: (pilotId: string) => Promise<void>;
  saveToServer: () => Promise<void>;
  reset: () => void;
}

const defaultCBTA: CBTAScores = {
  COM: 0,
  WLM: 0,
  SAW: 0,
  KNO: 0,
  PSD: 0,
  FPM: 0,
};

const CBTA_KEYS: CBTACompetency[] = ['COM', 'WLM', 'SAW', 'KNO', 'PSD', 'FPM'];

// Keep lint happy — keys used in future phases
void CBTA_KEYS;

const defaultState = {
  currentDrillMetrics: null as DrillMetrics | null,
  sessionHistory: [] as DrillResult[],
  cbta: { ...defaultCBTA },
  cognitiveLoadBaseline: null as CognitiveLoadBaseline | null,
  currentEventCognitiveLoad: [] as CognitiveLoadScore[],
  activePilotId: null as string | null,
};

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  ...defaultState,

  initDrillMetrics: (drillId) =>
    set({
      currentDrillMetrics: {
        drillId,
        readbackScores: [],
        decisionScores: [],
        trapScores: [],
        touchScores: [],
        cognitiveLoadScores: [],
        overallScore: 0,
        completedAt: 0,
      },
      currentEventCognitiveLoad: [],
    }),

  recordReadbackScore: (score) =>
    set((state) => {
      if (!state.currentDrillMetrics) return state;
      return {
        currentDrillMetrics: {
          ...state.currentDrillMetrics,
          readbackScores: [...state.currentDrillMetrics.readbackScores, score],
        },
      };
    }),

  recordCognitiveLoadScore: (score) =>
    set((state) => {
      if (!state.currentDrillMetrics) return state;
      return {
        currentDrillMetrics: {
          ...state.currentDrillMetrics,
          cognitiveLoadScores: [
            ...state.currentDrillMetrics.cognitiveLoadScores,
            score,
          ],
        },
        currentEventCognitiveLoad: [
          ...state.currentEventCognitiveLoad,
          score,
        ],
      };
    }),

  recordDecisionScore: (score) =>
    set((state) => {
      if (!state.currentDrillMetrics) return state;
      return {
        currentDrillMetrics: {
          ...state.currentDrillMetrics,
          decisionScores: [
            ...state.currentDrillMetrics.decisionScores,
            score,
          ],
        },
      };
    }),

  recordTouchScore: (score) =>
    set((state) => {
      if (!state.currentDrillMetrics) return state;
      return {
        currentDrillMetrics: {
          ...state.currentDrillMetrics,
          touchScores: [...state.currentDrillMetrics.touchScores, score],
        },
      };
    }),

  finalizeDrillMetrics: () =>
    set((state) => {
      if (!state.currentDrillMetrics) return state;
      return {
        currentDrillMetrics: {
          ...state.currentDrillMetrics,
          completedAt: Date.now(),
        },
      };
    }),

  setCBTA: (scores) => set({ cbta: scores }),

  setCognitiveLoadBaseline: (baseline) =>
    set({ cognitiveLoadBaseline: baseline }),

  setActivePilotId: (pilotId) => set({ activePilotId: pilotId }),

  // Stub — wired to Supabase in Phase 4
  loadFromServer: async (pilotId: string) => {
    set({ activePilotId: pilotId });
    // TODO: fetch from Supabase via api-client (T4.12)
    void get();
  },

  // Stub — wired to Supabase in Phase 4
  saveToServer: async () => {
    // TODO: persist to Supabase via api-client (T4.12)
    void get();
  },

  reset: () => set(defaultState),
}));
