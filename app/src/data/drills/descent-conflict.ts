// T5.1 — Descent with Traffic Conflict (SAW, PSD, COM)

import type { DrillDefinition } from '@/types';
import { kjfkKbos } from '@/data/flight-plans/kjfk-kbos';

export const descentConflict: DrillDefinition = {
  id: 'descent-conflict',
  title: 'Descent with Traffic Conflict',
  description:
    'ATC clears descent to FL240 while TCAS shows traffic at FL340. ' +
    'Tests situational awareness, problem solving, and communication.',
  duration: 240,
  difficulty: 'intermediate',
  competencies: ['SAW', 'PSD', 'COM'],
  flightPlan: 'kjfk-kbos',
  initialState: {
    flightPlan: kjfkKbos,
    altitude: 36000,
    heading: 45,
    speed: 280,
    activeFrequency: { value: 124.35, label: 'Boston Center' },
    standbyFrequency: { value: 120.6, label: 'Boston Approach' },
    selectedMode: 'NAV',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt:
        'Clear the aircraft to descend and maintain FL240. ' +
        'There is traffic at FL340 that the pilot should be aware of.',
      expectedActions: [{ type: 'set_altitude', value: 24000 }],
      keywords: ['flight level two four zero', 'FL240', 'traffic'],
    },
    {
      type: 'decision_point',
      prompt:
        'TCAS shows traffic at FL340, 12nm ahead, same track. ' +
        'ATC has cleared you to FL240. What do you do?',
      options: [
        { id: 'a', text: 'Begin descent immediately as cleared' },
        { id: 'b', text: 'Query ATC about traffic before descending' },
        { id: 'c', text: 'Ignore ATC clearance and maintain FL360' },
        { id: 'd', text: 'Request a lateral offset to avoid traffic' },
      ],
      correctOptionId: 'b',
      timeLimitSeconds: 20,
    },
    {
      type: 'atc_instruction',
      prompt: 'Confirm traffic is no factor and re-clear the descent to FL240.',
      expectedActions: [
        { type: 'set_altitude', value: 24000 },
        { type: 'set_mode', value: 'VS' },
      ],
      keywords: ['traffic no factor', 'FL240'],
    },
  ],
  atcContext: {
    facility: 'Boston Center',
    sector: 'Sector 33',
    callsign: 'November-one-two-three-four-alpha',
    traffic: ['Delta 1492 at FL340, 12nm ahead, same track'],
    weather: 'VMC, clear skies, winds 270/35',
  },
};
