import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Quote,
  Plus,
  Info
} from 'lucide-react';
import { CaseItem, CaseExhibit } from '../data/cases.ts';

interface ExhibitInspectorProps {
  caseItem?: CaseItem | null;
  activeExhibitId?: string;
  onSelectExhibit?: (id: string) => void;
  onInsertIntoDefense: (findingText: string) => void;
  onOpenUpload?: () => void;
}

export const ExhibitInspector: React.FC<ExhibitInspectorProps> = ({
  caseItem,
  activeExhibitId,
  onSelectExhibit,
  onInsertIntoDefense,
  onOpenUpload,
}) => {
  const exhibits = caseItem?.exhibits || [];

  const [selectedExId, setSelectedExId] = useState<string>(
    activeExhibitId || exhibits[0]?.id || ''
  );

  useEffect(() => {
    if (activeExhibitId) {
      setSelectedExId(activeExhibitId);
    } else if (exhibits[0]) {
      setSelectedExId(exhibits[0].id);
    }
  }, [activeExhibitId, exhibits]);

  // Clean empty state if no exhibits were uploaded
  if (!caseItem || exhibits.length === 0) {
    return (
      <div
        className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center space-y-3 border border-[#e2e8f0]"
        id="sectionExhibits"
      >
        <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#565e74]">
          <FileSpreadsheet className="w-6 h-6 text-[#81001d]" />
        </div>
        <div className="max-w-md">
          <h3 className="font-ui-header text-[15px] font-bold text-[#191c1e]">
            No Exhibits or Spreadsheets Attached
          </h3>
          <p className="font-case-body-md text-[13px] text-[#565e74] mt-1 leading-relaxed">
            This case was created from your case document without supplementary Excel models. The case text and cold-call defense are fully active.
          </p>
        </div>

        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-2 bg-[#81001d] text-white hover:bg-[#a51c30] rounded font-ui-header text-[12px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Attach Excel Model or Spreadsheet</span>
          </button>
        )}
      </div>
    );
  }

  const activeExhibit: CaseExhibit =
    exhibits.find((e) => e.id === selectedExId) || exhibits[0];

  const headers = activeExhibit.tableHeaders || [
    'METRIC',
    'INTERNAL TARGET',
    'COMPETITIVE PEER',
    'DELTA / IMPACT',
  ];

  const rows = activeExhibit.tableRows || [];

  return (
    <div
      className="bg-white p-3.5 md:p-4 rounded-lg shadow-sm flex flex-col space-y-3 border border-[#e2e8f0]"
      id="sectionExhibits"
    >
      {/* Header & Attached File Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceef0] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#dae2fd] text-[#131b2e] flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-[#1b3888]" />
          </div>
          <div>
            <h2 className="font-ui-header text-[14px] font-bold text-[#191c1e] leading-tight">
              {caseItem.caseNumber} Exhibits & Quantitative Models
            </h2>
            <span className="font-ui-label-mono text-[10px] text-[#565e74]">
              FINANCIAL AUDIT • {caseItem.course.toUpperCase()}
            </span>
          </div>
        </div>

        {activeExhibit.relatedFile && (
          <span className="px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded text-[10px] font-ui-label-mono font-bold flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-[#1b3888]" />
            <span>{activeExhibit.relatedFile}</span>
          </span>
        )}
      </div>

      {/* Exhibit Sub-Tabs */}
      {exhibits.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {exhibits.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setSelectedExId(ex.id);
                if (onSelectExhibit) onSelectExhibit(ex.id);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-ui-label-mono font-bold whitespace-nowrap transition-colors ${
                selectedExId === ex.id
                  ? 'bg-[#81001d] text-white shadow-xs'
                  : 'bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e0e3e5]'
              }`}
            >
              {ex.title.split(':')[0] || ex.id}
            </button>
          ))}
        </div>
      )}

      {/* Exhibit Title & Description */}
      <div className="bg-[#f7f9fb] p-2.5 rounded border border-[#e2e8f0]">
        <h3 className="font-ui-header text-[13px] font-bold text-[#191c1e]">
          {activeExhibit.title}
        </h3>
        <p className="font-case-body-md text-[12px] text-[#565e74] mt-0.5">
          {activeExhibit.description}
        </p>
      </div>

      {/* Financial Table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-[#d8dadc]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eceef0] border-b border-[#d8dadc]">
                <th className="p-2 font-ui-label-mono text-[10px] font-bold text-[#191c1e] uppercase">
                  {headers[0]}
                </th>
                <th className="p-2 font-ui-label-mono text-[10px] font-bold text-[#191c1e] uppercase">
                  {headers[1]}
                </th>
                <th className="p-2 font-ui-label-mono text-[10px] font-bold text-[#191c1e] uppercase">
                  {headers[2]}
                </th>
                <th className="p-2 font-ui-label-mono text-[10px] font-bold text-[#191c1e] uppercase text-right">
                  {headers[3]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0] font-ui-body text-[12px]">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#f2f4f6] transition-colors ${
                    row.isHighlight ? 'bg-[#ffdad9]/30 font-semibold' : ''
                  }`}
                >
                  <td className="p-2 text-[#191c1e]">{row.metric}</td>
                  <td className="p-2 text-[#191c1e] font-ui-label-mono text-[11px]">
                    {row.col1}
                  </td>
                  <td className="p-2 text-[#191c1e] font-ui-label-mono text-[11px]">
                    {row.col2}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-ui-label-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        row.isDeltaPositive
                          ? 'bg-[#dae2fd] text-[#131b2e]'
                          : 'bg-[#ffdad9] text-[#40000a]'
                      }`}
                    >
                      {row.isDeltaPositive ? (
                        <TrendingUp className="w-3 h-3 text-[#1b3888]" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[#ba1a1a]" />
                      )}
                      <span>{row.delta}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Key Finding Box with 1-Click Defense Citation Action */}
      {activeExhibit.keyFinding && (
        <div className="p-3 bg-[#f2f4f6] rounded border border-[#e0e3e5] space-y-2">
          <div className="flex items-center gap-1.5 text-[#81001d] font-ui-label-mono text-[10px] font-bold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Key Quantitative Finding:</span>
          </div>

          <p className="font-ui-label-mono text-[11px] text-[#191c1e] font-bold leading-tight">
            {activeExhibit.keyFinding}
          </p>

          <button
            onClick={() =>
              onInsertIntoDefense(
                activeExhibit.defenseFindingText ||
                  `${activeExhibit.title}: ${activeExhibit.keyFinding}`
              )
            }
            className="w-full py-2 bg-[#81001d] hover:bg-[#a51c30] text-white rounded font-ui-header text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Inject Into Cold-Call Defense Speech</span>
          </button>
        </div>
      )}
    </div>
  );
};

