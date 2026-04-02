// Thin lifecycle bridge — delegates to the headless flight-simulation service (AC-5).
// Keeps the useAltitudeSimulation(active) signature so call sites don't change.

import { useEffect } from 'react';
import { startSimulation, stopSimulation } from '@/services/flight-simulation';

export function useAltitudeSimulation(active: boolean) {
  useEffect(() => {
    if (active) {
      startSimulation();
    } else {
      stopSimulation();
    }
    return () => stopSimulation();
  }, [active]);
}
