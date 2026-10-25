import React from 'react';
import {
  ShieldCheck,
  Brain,
  RotateCcw,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import { CaseItem } from '../data/cases.ts';

interface DefenseScorecardViewProps {
  caseItem?: CaseItem | null;
  metrics?: any;
  onNavigateToChamber?: () => void;
  onReturnToDrill?: () => void;
  onOpenExhibit: (exhibitId: string) => void;
  onOpenReader?: () => void;
  onOpenUpload?: () => void;
}

export const DefenseScorecardView: React.FC<DefenseScorecardViewProps> = ({
  caseItem,
  onNavigateToChamber,
  onReturnToDrill,
  onOpenExhibit,
  onOpenReader,
  onOpenUpload,
}) => {
  if (!caseItem) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[400px] bg-white rounded-xl border border-[#cbd5e1] text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#ffdad9] text-[#81001d] flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="font-ui-header text-[18px] font-bold text-[#191c1e]">
            Defense Scorecard
          </h3>
          <p className="font-reading-serif text-[14px] text-[#565e74] mt-1.5 leading-relaxed">
            Upload a case document to generate quantitative defense analytics, verbal telemetry, and executive scorecards.
          </p>
        </div>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[13px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-98"
          >
            <span>Upload document (s)</span>
          </button>
        )}
      </div>
    );
  }

  const metrics = caseItem.coldCall.defaultMetrics;
  const hasExhibits = caseItem.exhibits && caseItem.exhibits.length > 0;

  return (
    <div className="flex flex-col space-y-4 max-w-4xl mx-auto pb-6">
      {/* Title Card */}
      <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-ui-label-mono text-[10px] px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded font-bold uppercase">
              Socratic Case Evaluation Protocol v4.2
            </span>
            <span className="font-ui-label-mono text-[11px] text-[#565e74]">
              {caseItem.caseNumber} • {caseItem.course}
            </span>
          </div>
          <h2 className="font-headline-md text-[22px] sm:text-[24px] font-bold text-[#191c1e]">
            {caseItem.coldCall.amphitheater} Executive Scorecard
          </h2>
          <p className="font-case-body-md text-[14px] text-[#594141] mt-0.5">
            Sample scorecard layout for {caseItem.title}. Scores shown are illustrative sample data created for demonstration, not results from a real session.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#f2f4f6] p-3 rounded border border-[#e0e3e5] shrink-0">
          <div className="flex flex-col items-center">
            <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase">
              Composite Grade
            </span>
            <span className="font-scorecard-metric text-[32px] font-bold text-[#81001d] leading-none">
              A-
            </span>
            <span className="font-ui-label-mono text-[10px] text-[#13803d] font-bold mt-1">
              Illustrative sample
            </span>
          </div>
        </div>
      </div>

      {/* 3 Pillar Framework Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pillar 1 */}
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-ui-header text-[12px] font-bold text-[#191c1e] uppercase">
                {hasExhibits ? 'Quantitative Rigor' : 'Evidence Rigor'}
              </span>
              <span className="font-ui-label-mono text-[10px] px-1.5 py-0.5 bg-[#ffdad9] text-[#40000a] font-bold rounded">
                {hasExhibits ? 'Exhibits Cited' : 'Narrative Grounded'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-scorecard-metric text-[30px] font-bold text-[#a51c30]">
                {metrics.rigor}%
              </span>
              <span className="font-ui-label-mono text-[11px] text-[#13803d] font-bold">
                {metrics.rigorLabel}
              </span>
            </div>
            <p className="font-case-body-md text-[13px] text-[#594141] leading-snug">
              {hasExhibits
                ? 'Successfully grounded defense in Exhibit data tables and localized unit contribution margins.'
                : 'Successfully defended stance with concrete facts and strategic trade-offs from the case document.'}
            </p>
          </div>

          {hasExhibits ? (
            <button
              onClick={() => onOpenExhibit(caseItem.exhibits[0].id)}
              className="mt-3 text-[11px] font-ui-label-mono text-[#81001d] font-bold uppercase hover:underline text-left flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#1b3888]" />
              <span>Review Cited Exhibits &rarr;</span>
            </button>
          ) : (
            <button
              onClick={onOpenReader}
              className="mt-3 text-[11px] font-ui-label-mono text-[#81001d] font-bold uppercase hover:underline text-left flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-[#81001d]" />
              <span>Review Case Narrative &rarr;</span>
            </button>
          )}
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-ui-header text-[12px] font-bold text-[#191c1e] uppercase">
                Executive Stance
              </span>
              <span className="font-ui-label-mono text-[10px] px-1.5 py-0.5 bg-[#dae2fd] text-[#131b2e] font-bold rounded">
                Tier 1 Decisive
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-scorecard-metric text-[30px] font-bold text-[#1b3888]">
                {metrics.decisiveness}%
              </span>
              <span className="font-ui-label-mono text-[11px] text-[#1b3888] font-bold">
                {metrics.decisivenessLabel}
              </span>
            </div>
            <p className="font-case-body-md text-[13px] text-[#594141] leading-snug">
              Took a clear, unambiguous stance without wavering when challenged by {caseItem.coldCall.professor}.
            </p>
          </div>
          <span className="mt-3 text-[11px] font-ui-label-mono text-[#565e74]">
            Podium Response Time: 34s of 90s
          </span>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-ui-header text-[12px] font-bold text-[#191c1e] uppercase">
                Strategic Framework
              </span>
              <span className="font-ui-label-mono text-[10px] px-1.5 py-0.5 bg-[#ffdad6] text-[#93000a] font-bold rounded">
                Framework Tested
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-scorecard-metric text-[30px] font-bold text-[#ba1a1a]">
                {metrics.framework}%
              </span>
              <span className="font-ui-label-mono text-[11px] text-[#ba1a1a] font-bold">
                {metrics.frameworkLabel}
              </span>
            </div>
            <p className="font-case-body-md text-[13px] text-[#594141] leading-snug">
              Addressed core competitive tension and cost elasticity under macroeconomic pressure.
            </p>
          </div>
          <span className="mt-3 text-[11px] font-ui-label-mono text-[#ba1a1a] font-semibold">
            Action: Deepen cross-case comparison
          </span>
        </div>
      </div>

      {/* Faculty Critique Block */}
      <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#eceef0] pb-2">
          <h3 className="font-ui-header text-[14px] font-bold text-[#191c1e] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#81001d]" />
            <span>{caseItem.coldCall.professor} Socratic Debrief</span>
          </h3>
          <span className="font-ui-label-mono text-[11px] text-[#565e74]">
            Live Session Audio Transcript
          </span>
        </div>

        <blockquote className="font-case-body-md text-[15px] italic text-[#191c1e] pl-3 border-l-3 border-[#81001d] leading-relaxed">
          “{caseItem.coldCall.defaultMetrics.facultyNote || 'Ground your opening thesis directly in the core facts from the case document before addressing macroeconomic shifts.'}”
        </blockquote>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#eceef0]">
          <span className="font-ui-label-mono text-[11px] text-[#594141]">
            Active Module: {caseItem.course} • {caseItem.caseNumber}
          </span>
          <button
            onClick={onReturnToDrill || onNavigateToChamber}
            className="px-3 py-1.5 bg-[#81001d] text-white rounded font-ui-header text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#a51c30] transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Cold-Call Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

