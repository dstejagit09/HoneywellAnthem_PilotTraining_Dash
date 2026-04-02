// Headless flight simulation engine — module-scoped service (AC-1).
// All physics/convergence logic lives here, NOT in React hooks.
// One consolidated tick() handles altitude, speed, and heading convergence (AC-3).
// 50ms tick rate (~20fps) with proportionally small increments (AC-2).

import { useCockpitStore } from '@/stores/cockpit-store';

const TICK_MS = 50;

// Altitude rates (ft/s) — converted to ft/tick by multiplying by TICK_MS/1000
const ALT_RATES: Record<string, number> = {
  VNAV: 200,
  FLCH: 400,
  VS: 300,
};
const ALT_DEFAULT_RATE = 200; // ft/s

// Speed rate: 4 kts/s → 0.2 kts/tick at 50ms
const SPEED_RATE = 4; // kts/s

// Heading rate: 4 deg/s → 0.2 deg/tick at 50ms
const HEADING_RATE = 4; // deg/s

// Module-scoped interval handle — survives component unmount/re-render
let simIntervalId: ReturnType<typeof setInterval> | null = null;

function tick() {
  const state = useCockpitStore.getState();

  // ── Altitude convergence ──
  const altRate = (ALT_RATES[state.selectedMode] ?? ALT_DEFAULT_RATE) * (TICK_MS / 1000);
  if (state.altitude !== state.desiredAltitude) {
    let target = state.desiredAltitude;

    // VNAV respects the constraint floor
    if (state.selectedMode === 'VNAV' && state.vnavConstraint > 0) {
      target = Math.max(state.vnavConstraint, state.desiredAltitude);
    }

    if (state.altitude !== target) {
      const newAlt = state.altitude > target
        ? Math.max(target, state.altitude - altRate)
        : Math.min(target, state.altitude + altRate);
      state.setAltitude(newAlt);
    }
  }

  // ── Speed convergence (gated by autoThrottle) ──
  if (state.autoThrottle && state.speed !== state.desiredSpeed) {
    const spdRate = SPEED_RATE * (TICK_MS / 1000); // 0.2 kts/tick
    const newSpd = state.speed > state.desiredSpeed
      ? Math.max(state.desiredSpeed, state.speed - spdRate)
      : Math.min(state.desiredSpeed, state.speed + spdRate);
    state.setSpeed(newSpd);
  }

  // ── Heading convergence (gated by HDG mode, shortest-arc turning) ──
  if (state.selectedMode === 'HDG' && state.heading !== state.selectedHeading) {
    const hdgRate = HEADING_RATE * (TICK_MS / 1000); // 0.2 deg/tick

    // Shortest-arc signed difference
    let diff = state.selectedHeading - state.heading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    let newHdg: number;
    if (Math.abs(diff) <= hdgRate) {
      newHdg = state.selectedHeading;
    } else {
      newHdg = state.heading + (diff > 0 ? hdgRate : -hdgRate);
    }

    // Normalize 0-360
    newHdg = ((newHdg % 360) + 360) % 360;
    state.setHeading(newHdg);
  }
}

export function startSimulation() {
  if (simIntervalId !== null) return; // already running
  simIntervalId = setInterval(tick, TICK_MS);
}

export function stopSimulation() {
  if (simIntervalId !== null) {
    clearInterval(simIntervalId);
    simIntervalId = null;
  }
}
