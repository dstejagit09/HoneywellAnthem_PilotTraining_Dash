// T8.8 — Export button for drill history + metrics

import { useAssessmentStore } from '@/stores/assessment-store';
import { usePilotStore } from '@/stores/pilot-store';
import { AnthemButton } from '@/components/shared/AnthemButton';

export function ExportButton() {
  const history = useAssessmentStore((s) => s.sessionHistory);
  const cbta = useAssessmentStore((s) => s.cbta);
  const baseline = useAssessmentStore((s) => s.cognitiveLoadBaseline);
  const pilot = usePilotStore((s) => s.activePilot);

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      pilot: pilot
        ? { id: pilot.id, name: pilot.name, accentGroup: pilot.accentGroup }
        : null,
      cbta,
      cognitiveLoadBaseline: baseline,
      drillHistory: history.map((r) => ({
        drillId: r.drillId,
        overallScore: r.metrics.overallScore,
        cbta: r.cbta,
        readbackScores: r.metrics.readbackScores.map((s) => ({
          accuracy: s.confidenceAdjustedAccuracy,
          wer: s.estimatedWER,
          basis: s.scoringBasis,
          latencyMs: s.latency.totalPilotLatencyMs,
        })),
        cognitiveLoad: r.metrics.cognitiveLoadScores.map((c) => ({
          load: c.compositeLoad,
          confidence: c.confidence,
          calibration: c.calibrationStatus,
        })),
        completedAt: new Date(r.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `pilot-assessment-${Date.now()}.json`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Drill',
      'Overall Score',
      'COM',
      'WLM',
      'SAW',
      'KNO',
      'PSD',
      'FPM',
      'Readback Accuracy',
      'Est. WER',
      'Scoring Basis',
      'Latency (ms)',
      'Cognitive Load',
      'Completed At',
    ];

    const rows = history.map((r) => {
      const firstReadback = r.metrics.readbackScores[0];
      const firstCogLoad = r.metrics.cognitiveLoadScores[0];
      return [
        r.drillId,
        r.metrics.overallScore,
        r.cbta.COM,
        r.cbta.WLM,
        r.cbta.SAW,
        r.cbta.KNO,
        r.cbta.PSD,
        r.cbta.FPM,
        firstReadback?.confidenceAdjustedAccuracy.toFixed(1) ?? '',
        firstReadback ? (firstReadback.estimatedWER * 100).toFixed(1) : '',
        firstReadback?.scoringBasis ?? '',
        firstReadback?.latency.totalPilotLatencyMs.toFixed(0) ?? '',
        firstCogLoad?.compositeLoad.toFixed(1) ?? '',
        new Date(r.timestamp).toISOString(),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `pilot-assessment-${Date.now()}.csv`);
  };

  if (history.length === 0) return null;

  return (
    <div className="flex gap-2">
      <AnthemButton variant="primary" compact className="text-xs" onClick={handleExportJSON}>
        Export JSON
      </AnthemButton>
      <AnthemButton variant="primary" compact className="text-xs" onClick={handleExportCSV}>
        Export CSV
      </AnthemButton>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
