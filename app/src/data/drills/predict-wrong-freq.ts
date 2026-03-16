// T5.3 — PilotPredict Wrong Frequency trap (SAW, KNO)

import type { DrillDefinition } from '@/types';
import { ktebKpbi } from '@/data/flight-plans/kteb-kpbi';

export const predictWrongFreq: DrillDefinition = {
  id: 'predict-wrong-freq',
  title: 'PilotPredict Wrong Frequency',
  description:
    'PilotPredict suggests switching to an incorrect frequency during a handoff. ' +
    'Tests whether the pilot blindly trusts AI suggestions or verifies against ATC instructions.',
  duration: 180,
  difficulty: 'intermediate',
  competencies: ['SAW', 'KNO'],
  flightPlan: 'kteb-kpbi',
  initialState: {
    flightPlan: ktebKpbi,
    altitude: 24000,
    heading: 190,
    speed: 310,
    activeFrequency: { value: 132.45, label: 'New York Center' },
    standbyFrequency: { value: 128.35, label: 'Washington Center' },
    selectedMode: 'NAV',
  },
  events: [
    {
      type: 'atc_instruction',
      prompt:
        'Hand off the aircraft to Washington Center on 128.35. ' +
        'Instruct them to contact Washington Center.',
      expectedActions: [
        { type: 'set_frequency', value: 128.35 },
      ],
      keywords: ['Washington Center', 'one two eight point three five', 'contact'],
    },
    {
      type: 'predict_suggestion',
      suggestion: 'Switch to Jacksonville Center 134.1',
      correctAction: 'Switch to Washington Center 128.35 as instructed by ATC',
      context:
        'PilotPredict is anticipating a later handoff to Jacksonville Center, ' +
        'but ATC specifically instructed Washington Center 128.35. ' +
        'The pilot should follow ATC instructions, not the AI prediction.',
    },
    {
      type: 'cockpit_action',
      instruction: 'Tune standby frequency to 128.35 and swap to make it active.',
      expectedAction: { type: 'swap_frequencies', value: 0 },
      timeLimitSeconds: 15,
    },
  ],
  atcContext: {
    facility: 'New York Center',
    sector: 'Sector 56',
    callsign: 'November-five-six-seven-eight-bravo',
    traffic: ['American 722 at FL350, opposite direction'],
    weather: 'VMC, scattered clouds at FL180, winds 240/20',
  },
};
