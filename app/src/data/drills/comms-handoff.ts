// T5.6 — Comms Handoff (COM, WLM)

import type { DrillDefinition } from '@/types';
import { ktebKpbi } from '@/data/flight-plans/kteb-kpbi';

export const commsHandoff: DrillDefinition = {
  id: 'comms-handoff',
  title: 'Communications Handoff',
  description:
    'Multiple rapid frequency changes during sector transitions. ' +
    'Tests communication discipline and workload management under time pressure.',
  duration: 180,
  difficulty: 'beginner',
  competencies: ['COM', 'WLM'],
  flightPlan: 'kteb-kpbi',
  initialState: {
    flightPlan: ktebKpbi,
    altitude: 36000,
    heading: 190,
    speed: 320,
    activeFrequency: { value: 132.45, label: 'New York Center' },
    standbyFrequency: { value: 128.35, label: 'Washington Center' },
    selectedMode: 'NAV',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt:
        'Hand off the aircraft to Washington Center on 128.35. ' +
        'Standard sector handoff, no changes to altitude or route.',
      expectedActions: [
        { type: 'set_frequency', value: 128.35 },
      ],
      keywords: ['Washington Center', 'one two eight point three five', 'contact', 'good day'],
    },
    {
      type: 'cockpit_action',
      instruction: 'Swap frequencies to contact Washington Center on 128.35.',
      expectedAction: { type: 'swap_frequencies', value: 0 },
      timeLimitSeconds: 10,
    },
    {
      type: 'atc_instruction',
      prompt:
        'As Washington Center, acknowledge the check-in. Then after a brief pause, ' +
        'hand off to Jacksonville Center on 134.1. Instruct frequency change.',
      expectedActions: [
        { type: 'set_frequency', value: 134.1 },
      ],
      keywords: [
        'Jacksonville Center', 'one three four point one',
        'radar contact', 'good day',
      ],
    },
    {
      type: 'cockpit_action',
      instruction: 'Tune standby to 134.1 (Jacksonville Center) and swap frequencies.',
      expectedAction: { type: 'set_frequency', value: 134.1 },
      timeLimitSeconds: 15,
    },
  ],
  atcContext: {
    facility: 'New York Center',
    sector: 'Sector 56',
    callsign: 'November-five-six-seven-eight-bravo',
    traffic: ['FedEx 423 at FL340, crossing traffic'],
    weather: 'VMC, clear skies, winds 260/25',
  },
};
