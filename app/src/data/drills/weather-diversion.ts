// T5.2 — Weather Diversion (PSD, COM, WLM)

import type { DrillDefinition } from '@/types';
import { kjfkKbos } from '@/data/flight-plans/kjfk-kbos';

export const weatherDiversion: DrillDefinition = {
  id: 'weather-diversion',
  title: 'Weather Diversion',
  description:
    'Thunderstorms develop along your route, requiring a diversion. ' +
    'Tests problem solving, communication under pressure, and workload management.',
  duration: 300,
  difficulty: 'advanced',
  competencies: ['PSD', 'COM', 'WLM'],
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
        'Advise the aircraft of convective SIGMET along their route between GREKI and JUDDS. ' +
        'Suggest a heading of 090 for weather deviation.',
      expectedActions: [
        { type: 'set_heading', value: 90 },
        { type: 'set_mode', value: 'HDG' },
      ],
      keywords: ['convective SIGMET', 'heading zero nine zero', 'weather deviation'],
    },
    {
      type: 'decision_point',
      prompt:
        'Weather radar shows a line of thunderstorms 40nm ahead along your route. ' +
        'ATC offers heading 090 for deviation. Your alternate is Bradley (KBDL), 60nm southwest. ' +
        'What is your best course of action?',
      options: [
        { id: 'a', text: 'Accept heading 090 and continue to Boston' },
        { id: 'b', text: 'Request direct KBDL and declare diversion' },
        { id: 'c', text: 'Climb above the weather to FL410' },
        { id: 'd', text: 'Accept heading 090, then reassess and request direct KBDL if needed' },
      ],
      correctOptionId: 'd',
      timeLimitSeconds: 25,
    },
    {
      type: 'cockpit_action',
      instruction: 'Set heading 090 and switch to HDG mode for weather deviation.',
      expectedAction: { type: 'set_mode', value: 'HDG' },
      timeLimitSeconds: 15,
    },
    {
      type: 'atc_instruction',
      prompt:
        'Clear the aircraft direct to KBDL when ready. ' +
        'Hand off to Bradley Approach on 120.3.',
      expectedActions: [
        { type: 'set_frequency', value: 120.3 },
      ],
      keywords: ['Bradley', 'KBDL', 'one two zero point three', 'direct'],
    },
  ],
  atcContext: {
    facility: 'Boston Center',
    sector: 'Sector 33',
    callsign: 'November-one-two-three-four-alpha',
    traffic: ['United 445 deviating north of weather, FL380'],
    weather: 'Convective SIGMET W-52, line of TS from GREKI to JUDDS, tops FL450, moving east at 25kt',
  },
};
