// T1.15 — Pilot store: active pilot, pilot list

import { create } from 'zustand';
import type { PilotProfile } from '@/types';

interface PilotStore {
  activePilot: PilotProfile | null;
  pilots: PilotProfile[];

  selectPilot: (id: string) => void;
  createPilot: (
    profile: Omit<PilotProfile, 'id' | 'createdAt' | 'lastActiveAt'>,
  ) => Promise<void>;
  loadPilots: () => Promise<void>;
  reset: () => void;
}

const defaultState = {
  activePilot: null as PilotProfile | null,
  pilots: [] as PilotProfile[],
};

export const usePilotStore = create<PilotStore>((set, get) => ({
  ...defaultState,

  selectPilot: (id) => {
    const pilot = get().pilots.find((p) => p.id === id) ?? null;
    set({ activePilot: pilot });
  },

  // Stub — wired to Supabase in Phase 4
  createPilot: async (profile) => {
    const newPilot: PilotProfile = {
      ...profile,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    set((state) => ({
      pilots: [...state.pilots, newPilot],
      activePilot: newPilot,
    }));
    // TODO: persist to Supabase via api-client (T4.11)
  },

  // Stub — wired to Supabase in Phase 4
  loadPilots: async () => {
    // TODO: fetch from Supabase via api-client (T4.11)
  },

  reset: () => set(defaultState),
}));
