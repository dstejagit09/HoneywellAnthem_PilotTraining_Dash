// T1.11 — Cockpit store: aircraft state, frequency management, mode selection

import { create } from 'zustand';
import type { CockpitMode, Waypoint, Frequency } from '@/types';

interface CockpitStore {
  flightPlan: Waypoint[];
  activeFrequency: Frequency;
  standbyFrequency: Frequency;
  selectedMode: CockpitMode;
  altitude: number;
  heading: number;
  speed: number;

  setFrequency: (freq: Frequency, slot: 'active' | 'standby') => void;
  swapFrequencies: () => void;
  updateWaypoint: (index: number, waypoint: Partial<Waypoint>) => void;
  setMode: (mode: CockpitMode) => void;
  setAltitude: (alt: number) => void;
  setHeading: (hdg: number) => void;
  setSpeed: (spd: number) => void;
  loadFlightPlan: (plan: Waypoint[]) => void;
  reset: () => void;
}

const defaultState = {
  flightPlan: [] as Waypoint[],
  activeFrequency: { value: 121.5, label: 'Guard' } as Frequency,
  standbyFrequency: { value: 124.35, label: 'Boston Center' } as Frequency,
  selectedMode: 'NAV' as CockpitMode,
  altitude: 36000,
  heading: 360,
  speed: 280,
};

export const useCockpitStore = create<CockpitStore>((set) => ({
  ...defaultState,

  setFrequency: (freq, slot) =>
    set(slot === 'active' ? { activeFrequency: freq } : { standbyFrequency: freq }),

  swapFrequencies: () =>
    set((state) => ({
      activeFrequency: state.standbyFrequency,
      standbyFrequency: state.activeFrequency,
    })),

  updateWaypoint: (index, update) =>
    set((state) => ({
      flightPlan: state.flightPlan.map((wp, i) =>
        i === index ? { ...wp, ...update } : wp,
      ),
    })),

  setMode: (mode) => set({ selectedMode: mode }),

  setAltitude: (alt) => set({ altitude: alt }),

  setHeading: (hdg) => set({ heading: hdg }),

  setSpeed: (spd) => set({ speed: spd }),

  loadFlightPlan: (plan) => set({ flightPlan: plan }),

  reset: () => set(defaultState),
}));
