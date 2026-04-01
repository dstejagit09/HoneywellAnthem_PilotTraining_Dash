// T1.11 — Cockpit store: aircraft state, frequency management, mode selection
// Implements "Hostile UI" constraint enforcement per arch-stores.md.

import { create } from 'zustand';
import type { CockpitMode, CockpitState, Waypoint, Frequency, ConstraintViolation } from '@/types';

interface CockpitStore {
  flightPlan: Waypoint[];
  activeRouteId: string;
  selectedWaypointId: string | null;
  activeFrequency: Frequency;
  standbyFrequency: Frequency;
  selectedMode: CockpitMode;
  altitude: number;
  heading: number;
  speed: number;
  desiredAltitude: number;
  vnavConstraint: number;
  autopilot: boolean;
  autoThrottle: boolean;

  // Hostile UI — constraint violation tracking
  lastConstraintViolation: ConstraintViolation | null;
  constraintViolationCount: number;

  // Actions
  setFrequency: (freq: Frequency, slot: 'active' | 'standby') => void;
  swapFrequencies: () => void;
  updateWaypoint: (index: number, waypoint: Partial<Waypoint>) => void;
  setMode: (mode: CockpitMode) => void;
  setAltitude: (alt: number) => void;
  setHeading: (hdg: number) => void;
  setSpeed: (spd: number) => void;
  requestAltitudeChange: (alt: number) => void;
  adjustDesiredAltitude: (direction: 'up' | 'down', step?: number) => void;
  setVnavConstraint: (alt: number) => void;
  setAutopilot: (on: boolean) => void;
  setAutoThrottle: (on: boolean) => void;
  loadFlightPlan: (plan: Waypoint[]) => void;
  setActiveRouteId: (id: string) => void;
  setSelectedWaypointId: (id: string | null) => void;
  clearConstraintViolation: () => void;

  // Atomic initial condition methods (bypass constraints — authored data is trusted)
  applyCockpitState: (state: CockpitState) => void;
  applyCockpitOverrides: (overrides: Partial<CockpitState>) => void;

  reset: () => void;
}

const defaultState = {
  flightPlan: [] as Waypoint[],
  activeRouteId: 'kteb-kpbi',
  selectedWaypointId: null as string | null,
  activeFrequency: { value: 121.5, label: 'Guard' } as Frequency,
  standbyFrequency: { value: 124.35, label: 'Boston Center' } as Frequency,
  selectedMode: 'NAV' as CockpitMode,
  altitude: 36000,
  heading: 360,
  speed: 280,
  desiredAltitude: 36000,
  vnavConstraint: 0,
  autopilot: true,
  autoThrottle: true,
  lastConstraintViolation: null as ConstraintViolation | null,
  constraintViolationCount: 0,
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

  // Clears constraint violations on mode switch — pilot resolved the conflict
  setMode: (mode) => set({ selectedMode: mode, lastConstraintViolation: null }),

  setAltitude: (alt) => set({ altitude: alt }),

  setHeading: (hdg) => set({ heading: hdg }),

  setSpeed: (spd) => set({ speed: spd }),

  // Hostile UI: pilot input is a REQUEST. VNAV constraint rejects + snaps to floor.
  requestAltitudeChange: (alt) =>
    set((state) => {
      if (
        state.selectedMode === 'VNAV' &&
        state.vnavConstraint > 0 &&
        alt < state.vnavConstraint
      ) {
        return {
          desiredAltitude: state.vnavConstraint,
          lastConstraintViolation: {
            type: 'vnav_altitude_floor',
            requestedValue: alt,
            constraintValue: state.vnavConstraint,
            currentValue: state.desiredAltitude,
            timestamp: Date.now(),
            message: `VNAV constraint: cannot set altitude below ${state.vnavConstraint.toLocaleString()} ft`,
          },
          constraintViolationCount: state.constraintViolationCount + 1,
        };
      }
      return { desiredAltitude: alt, lastConstraintViolation: null };
    }),

  // Hostile UI: clamp to constraint floor — MCP knob stops at the floor (snap-back)
  adjustDesiredAltitude: (direction, step = 1000) =>
    set((state) => {
      const change = direction === 'up' ? step : -step;
      const proposed = Math.max(0, Math.min(50000, state.desiredAltitude + change));

      if (
        state.selectedMode === 'VNAV' &&
        state.vnavConstraint > 0 &&
        proposed < state.vnavConstraint
      ) {
        const clamped = state.vnavConstraint;
        return {
          desiredAltitude: clamped,
          lastConstraintViolation: {
            type: 'vnav_altitude_floor',
            requestedValue: proposed,
            constraintValue: state.vnavConstraint,
            currentValue: state.desiredAltitude,
            timestamp: Date.now(),
            message: `VNAV floor: altitude clamped at ${state.vnavConstraint.toLocaleString()} ft`,
          },
          constraintViolationCount: state.constraintViolationCount + 1,
        };
      }

      return { desiredAltitude: proposed, lastConstraintViolation: null };
    }),

  setVnavConstraint: (alt) => set({ vnavConstraint: alt }),

  setAutopilot: (on) => set({ autopilot: on }),

  setAutoThrottle: (on) => set({ autoThrottle: on }),

  loadFlightPlan: (plan) => set({ flightPlan: plan }),

  setActiveRouteId: (id) => set({ activeRouteId: id }),

  setSelectedWaypointId: (id) => set({ selectedWaypointId: id }),

  clearConstraintViolation: () => set({ lastConstraintViolation: null }),

  // Atomic initial condition — bypasses all constraints (authored data is trusted)
  applyCockpitState: (cs: CockpitState) =>
    set({
      flightPlan: cs.flightPlan,
      activeFrequency: cs.activeFrequency,
      standbyFrequency: cs.standbyFrequency,
      selectedMode: cs.selectedMode,
      altitude: cs.altitude,
      heading: cs.heading,
      speed: cs.speed,
      desiredAltitude: cs.desiredAltitude ?? cs.altitude,
      vnavConstraint: cs.vnavConstraint ?? 0,
      autopilot: cs.autopilot ?? true,
      autoThrottle: cs.autoThrottle ?? true,
      lastConstraintViolation: null,
      constraintViolationCount: 0,
    }),

  // Partial overrides — bypasses constraints via Zustand shallow merge
  applyCockpitOverrides: (overrides: Partial<CockpitState>) =>
    set({ ...overrides, lastConstraintViolation: null }),

  reset: () => set(defaultState),
}));
