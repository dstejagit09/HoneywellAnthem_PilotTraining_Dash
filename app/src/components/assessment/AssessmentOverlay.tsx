// Fullscreen overlay for the assessment dashboard.
// Rendered on top of the cockpit when triggered from the Home tab or drill outcome.

import { useUIStore } from '@/stores/ui-store';
import { AssessmentDashboard } from './AssessmentDashboard';

export function AssessmentOverlay() {
  const setShowAssessment = useUIStore((s) => s.setShowAssessment);

  return (
    <div className="fixed inset-0 z-50 bg-anthem-bg-primary/95 flex flex-col overflow-hidden">
      {/* Close bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-anthem-border shrink-0">
        <span className="text-anthem-cyan font-mono text-sm tracking-wider font-bold">
          Assessment Dashboard
        </span>
        <button
          onClick={() => setShowAssessment(false)}
          className="text-anthem-text-secondary hover:text-anthem-text-primary text-sm font-mono px-3 py-1.5 rounded border border-anthem-border hover:border-anthem-cyan/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          Close
        </button>
      </div>

      {/* Dashboard content */}
      <div className="flex-1 overflow-auto">
        <AssessmentDashboard />
      </div>
    </div>
  );
}
