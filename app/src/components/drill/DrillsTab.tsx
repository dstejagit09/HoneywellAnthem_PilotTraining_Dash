// Drills tab — orchestrates drill lifecycle phases

import { useDrillRunner } from '@/hooks/useDrillRunner';
import { DrillSelector } from './DrillSelector';
import { DrillBriefing } from './DrillBriefing';
import { DrillActiveView } from './DrillActiveView';
import { DrillOutcome } from './DrillOutcome';

export function DrillsTab() {
  const { phase } = useDrillRunner();

  switch (phase) {
    case 'idle':
      return <DrillSelector />;
    case 'briefing':
      return <DrillBriefing />;
    case 'active':
    case 'decision':
      return <DrillActiveView />;
    case 'outcome':
      return <DrillOutcome />;
    default:
      return <DrillSelector />;
  }
}
