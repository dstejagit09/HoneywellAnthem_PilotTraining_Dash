// T2.8 — Tab-based routing using ui-store.activeTab

import { TopNavBar } from '@/components/layout/TopNavBar';
import { CockpitShell } from '@/components/layout/CockpitShell';
import { StatusBar } from '@/components/layout/StatusBar';
import { AnthemCard } from '@/components/shared/AnthemCard';
import { DrillsTab } from '@/components/drill/DrillsTab';
import { useUIStore } from '@/stores/ui-store';

function AssessmentPlaceholder() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <AnthemCard title="Assessment Dashboard">
        <p className="text-anthem-text-muted text-sm">
          Assessment dashboard — implemented in Phase 8
        </p>
      </AnthemCard>
    </div>
  );
}

export function App() {
  const activeTab = useUIStore((s) => s.activeTab);

  return (
    <div className="flex flex-col h-screen bg-anthem-bg-primary text-anthem-text-primary font-sans">
      <TopNavBar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'cockpit' && <CockpitShell />}
        {activeTab === 'drills' && <DrillsTab />}
        {activeTab === 'assessment' && <AssessmentPlaceholder />}
      </main>
      <StatusBar />
    </div>
  );
}
