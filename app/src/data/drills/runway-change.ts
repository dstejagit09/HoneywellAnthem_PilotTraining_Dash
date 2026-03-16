// T5.4 — Runway Change (FPM, COM, WLM)

import type { DrillDefinition } from '@/types';
import { kjfkKbos } from '@/data/flight-plans/kjfk-kbos';

export const runwayChange: DrillDefinition = {
  id: 'runway-change',
  title: 'Runway Change',
  description:
    'ATC changes the arrival runway late in the approach. ' +
    'Tests flight path management, communication under time pressure, and workload management.',
  duration: 240,
  difficulty: 'advanced',
  competencies: ['FPM', 'COM', 'WLM'],
  flightPlan: 'kjfk-kbos',
  initialState: {
    flightPlan: kjfkKbos,
    altitude: 6000,
    heading: 40,
    speed: 180,
    activeFrequency: { value: 120.6, label: 'Boston Approach' },
    standbyFrequency: { value: 128.8, label: 'Boston Tower' },
    selectedMode: 'APR',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt:
        'Inform the aircraft that runway 04R is now closed due to a disabled aircraft. ' +
        'Assign runway 33L instead. Give vectors: turn left heading 330, descend to 3000.',
      expectedActions: [
        { type: 'set_heading', value: 330 },
        { type: 'set_altitude', value: 3000 },
        { type: 'set_mode', value: 'HDG' },
      ],
      keywords: ['runway three three left', '33L', 'heading three three zero', 'three thousand'],
    },
    {
      type: 'decision_point',
      prompt:
        'ATC changes your runway from 04R to 33L. You are currently on the ILS 04R approach ' +
        'at 6000ft. What is your immediate priority?',
      options: [
        { id: 'a', text: 'Continue the ILS 04R approach and sort it out later' },
        { id: 'b', text: 'Read back the new clearance and fly assigned heading/altitude' },
        { id: 'c', text: 'Request a hold to reprogram the FMS' },
        { id: 'd', text: 'Declare unable and request the original runway' },
      ],
      correctOptionId: 'b',
      timeLimitSeconds: 15,
    },
    {
      type: 'cockpit_action',
      instruction: 'Set heading to 330 and switch to HDG mode for vectors to runway 33L.',
      expectedAction: { type: 'set_heading', value: 330 },
      timeLimitSeconds: 15,
    },
    {
      type: 'atc_instruction',
      prompt:
        'Clear the aircraft for the ILS runway 33L approach. ' +
        'Contact Boston Tower on 128.8.',
      expectedActions: [
        { type: 'set_mode', value: 'APR' },
        { type: 'set_frequency', value: 128.8 },
      ],
      keywords: ['ILS runway three three left', 'cleared approach', 'Boston Tower', 'one two eight point eight'],
    },
  ],
  atcContext: {
    facility: 'Boston Approach',
    sector: 'Final Approach',
    callsign: 'November-one-two-three-four-alpha',
    traffic: ['JetBlue 602 on ILS 33L, 8nm final'],
    weather: 'Ceiling 800 OVC, visibility 3SM, winds 340/15G22, ILS approaches in use',
  },
};
