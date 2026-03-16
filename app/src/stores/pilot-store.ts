// T1.15 + T4.11 — Pilot store: wired to Supabase via api-client

import { create } from 'zustand';
import type { PilotProfile } from '@/types';
import * as api from '@/services/api-client';
import { isOnline, loadLocalPilots, saveLocalPilots } from '@/lib/storage';

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

  createPilot: async (profile) => {
    if (isOnline()) {
      try {
        const newPilot = await api.createPilot(profile);
        set((state) => ({
          pilots: [...state.pilots, newPilot],
          activePilot: newPilot,
        }));
        saveLocalPilots(get().pilots);
        return;
      } catch (err) {
        console.warn('[pilot-store] Supabase create failed, using local:', err);
      }
    }

    // Offline fallback
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
    saveLocalPilots(get().pilots);
  },

  loadPilots: async () => {
    if (isOnline()) {
      try {
        const pilots = await api.fetchPilots();
        set({ pilots });
        saveLocalPilots(pilots);
        return;
      } catch (err) {
        console.warn('[pilot-store] Supabase fetch failed, using local:', err);
      }
    }

    // Offline fallback
    const localPilots = loadLocalPilots();
    set({ pilots: localPilots });
  },

  reset: () => set(defaultState),
}));
