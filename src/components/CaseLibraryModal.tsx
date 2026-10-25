import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  BookOpen,
  Play,
  Megaphone,
  Table,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  X,
  ExternalLink,
  Quote,
  Clock,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { CaseItem } from '../data/cases.ts';

interface CaseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseItem[];
  activeCaseId: string;
  onSelectCase: (caseItem: CaseItem, initialView: 'reader' | 'play' | 'intel' | 'exhibits') => void;
  onOpenUploadModal: () => void;
  onReferenceCaseInDefense?: (caseItem: CaseItem) => void;
  onDeleteCase?: (caseId: string) => void;
  onWipeAllCases?: () => void;
}

export const CaseLibraryModal: React.FC<CaseLibraryModalProps> = ({
  isOpen,
  onClose,
  cases,
  activeCaseId,
  onSelectCase,
  onOpenUploadModal,
  onReferenceCaseInDefense,
  onDeleteCase,
  onWipeAllCases,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const courses = ['All', 'Strategy', 'Financial Accounting', 'Operations', 'Corporate Finance', 'Leadership'];

  const filteredCases = cases.filter((c) => {
    const matchesCourse = selectedCourse === 'All' || c.course === selectedCourse;
    const matchesSearch =
      searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCourse && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#cbd5e1] w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#81001d] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#a51c30]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-[#a51c30] flex items-center justify-center text-white shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-ui-header text-[16px] font-bold text-white leading-tight">
                Case Library & Project Workspace
              </h2>
              <span className="font-ui-label-mono text-[11px] text-[#ffdad9] uppercase">
                {cases.length} Cases in Workspace • Document Centered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onWipeAllCases && cases.length > 0 && (
              <button
                onClick={onWipeAllCases}
                className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[#ffdad9] hover:text-white text-[11px] font-ui-label-mono font-bold flex items-center gap-1 transition-colors border border-white/20"
                title="Wipe all cases and start with a completely clean workspace"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Start Clean</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenUploadModal();
              }}
              className="px-3 py-1.5 rounded bg-white hover:bg-[#f7f9fb] text-[#81001d] text-[12px] font-ui-header font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Case</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#f8f9fa] p-3 border-b border-[#e2e8f0] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Module Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {courses.map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`px-2.5 py-1 rounded text-[11px] font-ui-label-mono font-bold whitespace-nowrap transition-colors ${
                  selectedCourse === course
                    ? 'bg-[#81001d] text-white shadow-xs'
                    : 'bg-[#eceef0] text-[#191c1e] hover:bg-[#e0e3e5]'
                }`}
              >
                {course}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#565e74] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or case #..."
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded text-[#191c1e] text-[11px] font-ui-label-mono border border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#81001d]"
            />
          </div>
        </div>

        {/* Case List Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#f1f5f9]">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[#e2e8f0] p-6">
              <FolderKanban className="w-10 h-10 text-[#cbd5e1] mx-auto mb-2" />
              <h3 className="font-ui-header text-[15px] font-bold text-[#191c1e]">
                No Cases in Library
              </h3>
              <p className="font-case-body-md text-[13px] text-[#565e74] mt-1 max-w-md mx-auto">
                {cases.length === 0
                  ? 'Your workspace is completely clean with no predefined items. Upload your case document to get started.'
                  : 'No cases match your search filter.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadModal();
                }}
                className="mt-4 px-4 py-2 bg-[#81001d] text-white rounded font-ui-header text-[12px] font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#a51c30] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Case Document</span>
              </button>
            </div>
          ) : (
            filteredCases.map((caseItem) => {
              const isActive = caseItem.id === activeCaseId;
              const hasExhibits = caseItem.exhibits && caseItem.exhibits.length > 0;

              return (
                <div
                  key={caseItem.id}
                  className={`bg-white rounded-lg p-4 border transition-all ${
                    isActive
                      ? 'border-2 border-[#81001d] shadow-md ring-1 ring-[#81001d]/20'
                      : 'border-[#cbd5e1] hover:border-[#94a3b8] shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-ui-label-mono text-[11px] font-bold text-[#81001d] bg-[#ffdad9] px-2 py-0.5 rounded">
                        {caseItem.course}
                      </span>
                      <span className="font-ui-label-mono text-[11px] text-[#565e74]">
                        {caseItem.caseNumber}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-ui-label-mono font-bold bg-[#13803d] text-white px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE CASE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-ui-label-mono text-[10px] text-[#565e74] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {caseItem.estimatedReadTime}
                      </span>
                      {onDeleteCase && (
                        <button
                          onClick={() => onDeleteCase(caseItem.id)}
                          className="p-1 text-[#565e74] hover:text-[#ba1a1a] rounded hover:bg-[#ffdad9]/40 transition-colors"
                          title="Delete this case from workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-headline-md text-[17px] font-bold text-[#191c1e] mt-1.5 leading-snug">
                    {caseItem.title}
                  </h3>
                  <p className="font-ui-body text-[12px] text-[#594141] font-medium mt-0.5">
                    {caseItem.subtitle}
                  </p>

                  <p className="font-case-body-md text-[13px] text-[#475569] leading-relaxed my-2 line-clamp-2">
                    {caseItem.summary}
                  </p>

                  {/* Attached Documents & Materials */}
                  <div className="flex flex-wrap items-center gap-1.5 py-1.5 border-y border-[#eceef0] my-2">
                    <span className="font-ui-label-mono text-[10px] text-[#565e74] font-bold uppercase mr-1">
                      Materials:
                    </span>
                    {caseItem.uploadedFiles && caseItem.uploadedFiles.length > 0 ? (
                      caseItem.uploadedFiles.map((file, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-ui-label-mono font-medium ${
                            file.type === 'excel_model'
                              ? 'bg-[#dae2fd] text-[#131b2e]'
                              : 'bg-[#f2f4f6] text-[#191c1e]'
                          }`}
                        >
                          {file.type === 'excel_model' ? (
                            <FileSpreadsheet className="w-3 h-3 text-[#1b3888]" />
                          ) : (
                            <FileText className="w-3 h-3 text-[#81001d]" />
                          )}
                          <span>{file.name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-ui-label-mono text-[#565e74]">
                        Case Document Only
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Explicit Read, Play, Drill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Read Button */}
                      <button
                        onClick={() => {
                          onSelectCase(caseItem, 'reader');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#f2f4f6] text-[#191c1e] font-ui-header text-[11px] font-bold rounded border-2 border-[#81001d] shadow-xs flex items-center gap-1"
                        title="Open this case in Reader mode"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#81001d]" />
                        <span>Read Case</span>
                      </button>

                      {/* Play Button */}
                      <button
                        onClick={() => {
                          onSelectCase(caseItem, 'play');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-[#dae2fd] hover:bg-[#bec6e0] text-[#131b2e] font-ui-header text-[11px] font-bold rounded shadow-xs flex items-center gap-1"
                        title="Start reading this case aloud"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-[#131b2e]" />
                        <span>Play Case</span>
                      </button>

                      {/* Cold Call Button */}
                      <button
                        onClick={() => {
                          onSelectCase(caseItem, 'intel');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-[#81001d] hover:bg-[#a51c30] text-white font-ui-header text-[11px] font-bold rounded shadow-xs flex items-center gap-1"
                        title="Launch Cold-Call drill for this case"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Cold-Call Drill</span>
                      </button>

                      {/* Exhibits Button if any */}
                      {hasExhibits && (
                        <button
                          onClick={() => {
                            onSelectCase(caseItem, 'exhibits');
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-ui-header text-[11px] font-bold rounded border border-[#d8dadc] flex items-center gap-1"
                          title="Inspect financial exhibits"
                        >
                          <Table className="w-3.5 h-3.5 text-[#1b3888]" />
                          <span>Exhibits ({caseItem.exhibits.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Cross-case reference option */}
                    {onReferenceCaseInDefense && (
                      <button
                        onClick={() => {
                          onReferenceCaseInDefense(caseItem);
                          onClose();
                        }}
                        className="text-[11px] font-ui-label-mono text-[#81001d] hover:underline font-bold flex items-center gap-1"
                        title="Reference this case in active Cold-Call defense"
                      >
                        <Quote className="w-3 h-3" />
                        <span>Cross-Reference Case</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

