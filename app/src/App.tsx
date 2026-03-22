// Single-screen cockpit application — no top-level tab routing.
// The cockpit is always visible. Drills are launched from the MFD Home tab.
// Assessment is accessible as a fullscreen overlay.

import { AmbientCockpitView } from '@/components/cockpit/AmbientCockpitView';
import { StatusBar } from '@/components/layout/StatusBar';
import { AssessmentOverlay } from '@/components/assessment/AssessmentOverlay';
import { useUIStore } from '@/stores/ui-store';
import { useLiveKit } from '@/hooks/useLiveKit';

export function App() {
  const showAssessment = useUIStore((s) => s.showAssessment);

  // Mount LiveKit hook — auto-connects when drill phase becomes 'active'
  useLiveKit();

  return (
    <div className="flex flex-col h-screen bg-anthem-bg-primary text-anthem-text-primary font-sans">
      <main className="flex-1 flex flex-col overflow-hidden">
        <AmbientCockpitView />
      </main>
      <StatusBar />
      {showAssessment && <AssessmentOverlay />}
    </div>
  );
}
