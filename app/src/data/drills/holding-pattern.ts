// T5.5 — Holding Pattern Entry (KNO, FPM, COM)

import type { DrillDefinition } from '@/types';
import { kjfkKbos } from '@/data/flight-plans/kjfk-kbos';

export const holdingPattern: DrillDefinition = {
  id: 'holding-pattern',
  title: 'Holding Pattern Entry',
  description:
    'ATC issues unexpected holding instructions. Pilot must determine correct entry, ' +
    'set up the hold, and communicate intentions. Tests knowledge, flight path management, and communication.',
  duration: 240,
  difficulty: 'intermediate',
  competencies: ['KNO', 'FPM', 'COM'],
  flightPlan: 'kjfk-kbos',
  initialState: {
    flightPlan: kjfkKbos,
    altitude: 18000,
    heading: 45,
    speed: 230,
    activeFrequency: { value: 124.35, label: 'Boston Center' },
    standbyFrequency: { value: 120.6, label: 'Boston Approach' },
    selectedMode: 'NAV',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt:
        'Issue holding instructions: Hold at BOSOX on the 045 radial, ' +
        'right turns, expect further clearance in 20 minutes. Maintain FL180.',
      expectedActions: [
        { type: 'set_altitude', value: 18000 },
      ],
      keywords: [
        'hold at BOSOX', 'zero four five radial', 'right turns',
        'expect further clearance', 'flight level one eight zero',
      ],
    },
    {
      type: 'decision_point',
      prompt:
        'You are inbound to BOSOX on a heading of 045. ATC instructs you to hold at BOSOX ' +
        'on the 045 radial, right turns. What is the correct holding entry?',
      options: [
        { id: 'a', text: 'Direct entry' },
        { id: 'b', text: 'Teardrop entry' },
        { id: 'c', text: 'Parallel entry' },
        { id: 'd', text: 'No entry needed — continue on course' },
      ],
      correctOptionId: 'a',
      timeLimitSeconds: 20,
    },
    {
      type: 'cockpit_action',
      instruction:
        'Set up the hold: switch to HDG mode and set heading 225 for the outbound leg.',
      expectedAction: { type: 'set_mode', value: 'HDG' },
      timeLimitSeconds: 15,
    },
    {
      type: 'atc_instruction',
      prompt:
        'After one turn in holding, clear the aircraft to continue as filed. ' +
        'Descend to 12000 for the approach into Boston.',
      expectedActions: [
        { type: 'set_altitude', value: 12000 },
        { type: 'set_mode', value: 'NAV' },
      ],
      keywords: ['cleared as filed', 'descend', 'one two thousand', 'continue'],
    },
  ],
  atcContext: {
    facility: 'Boston Center',
    sector: 'Sector 33',
    callsign: 'November-one-two-three-four-alpha',
    traffic: ['Multiple aircraft holding at BOSOX, stacked FL160-FL220'],
    weather: 'IFR conditions at KBOS, ceiling 400 OVC, visibility 1SM fog, ILS approaches in use',
  },
};
