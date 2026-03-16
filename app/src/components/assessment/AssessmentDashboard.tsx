// T8.1 — Assessment dashboard grid layout
// Radar top-left, KPIs top-right, trends + history bottom,
// cohort + cognitive load bottom

import { useEffect, useState } from 'react';
import { useAssessmentStore } from '@/stores/assessment-store';
import { usePilotStore } from '@/stores/pilot-store';
import * as api from '@/services/api-client';
import { CBTARadar } from './CBTARadar';
import { SessionSummary } from './SessionSummary';
import { DrillHistory } from './DrillHistory';
import { TrendChart } from './TrendChart';
import { CohortCompare } from './CohortCompare';
import { CognitiveLoadIndicator } from './CognitiveLoadIndicator';
import { ExportButton } from './ExportButton';
import { ConcordanceRate } from './ConcordanceRate';
import type { PopulationBaseline } from '@/types';

function DashboardCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-anthem-border bg-anthem-bg-secondary p-4 ${className}`}
    >
      <h3 className="text-xs font-mono font-bold text-anthem-text-secondary uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AssessmentDashboard() {
  const cbta = useAssessmentStore((s) => s.cbta);
  const pilot = usePilotStore((s) => s.activePilot);
  const [population, setPopulation] = useState<PopulationBaseline[]>([]);

  // Load population baseline for radar overlay
  useEffect(() => {
    if (!pilot) return;

    api
      .fetchPopulationBaseline(pilot.accentGroup, pilot.experienceLevel)
      .then(setPopulation)
      .catch((err) => console.warn('[Dashboard] Population load failed:', err));
  }, [pilot]);

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-anthem-text-primary">
            Assessment Dashboard
          </h2>
          {pilot && (
            <p className="text-xs text-anthem-text-secondary">
              {pilot.name} — {pilot.accentGroup} / {pilot.experienceLevel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ConcordanceRate />
          <ExportButton />
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Row 1: Radar + KPIs */}
        <DashboardCard title="CBTA Competency Profile">
          <CBTARadar scores={cbta} population={population} />
        </DashboardCard>

        <DashboardCard title="Session Summary">
          <SessionSummary />
        </DashboardCard>

        {/* Row 2: Trends + History */}
        <DashboardCard title="Competency Trends">
          <TrendChart />
        </DashboardCard>

        <DashboardCard title="Drill History">
          <DrillHistory />
        </DashboardCard>

        {/* Row 3: Cohort + Cognitive Load */}
        <DashboardCard title="Cohort Comparison">
          <CohortCompare />
        </DashboardCard>

        <DashboardCard title="Cognitive Load">
          <CognitiveLoadIndicator />
        </DashboardCard>
      </div>
    </div>
  );
}
