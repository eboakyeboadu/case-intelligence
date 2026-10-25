import React, { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  ChevronDown,
  BookOpen,
  Play,
  Pause,
  Megaphone,
  Layers,
  ShieldCheck,
  Check
} from 'lucide-react';
import { NavigationTab, CloudProject } from '../types.ts';
import { CaseItem } from '../data/cases.ts';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeProject?: CloudProject;
  activeCase: CaseItem | null;
  casesInProject: CaseItem[];
  onSelectCase: (caseId: string) => void;
  onOpenProjectsModal: () => void;
  onOpenUpload: () => void;
  totalProjectsCount: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeProject,
  activeCase,
  casesInProject,
  onSelectCase,
  onOpenProjectsModal,
  onOpenUpload,
  totalProjectsCount,
  isPlaying = false,
  onTogglePlay,
}) => {
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState<boolean>(false);
  const caseMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (caseMenuRef.current && !caseMenuRef.current.contains(e.target as Node)) {
        setIsCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTogglePlayClick = () => {
    if (onTogglePlay) onTogglePlay();
  };

  const supportingCount = activeProject?.supportingDocuments?.length || 0;
  const exhibitsCount = activeProject?.exhibits?.length || 0;

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e6e8ea]">
      <div className="px-3 sm:px-4 flex flex-col justify-between py-2 max-w-7xl mx-auto space-y-2">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Cloud Project Selector (Google Cloud Console style) */}
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#81001d] animate-pulse shrink-0"></span>

            {/* Project Switcher Pill */}
            <button
              onClick={onOpenProjectsModal}
              className="flex items-center gap-1.5 font-ui-header text-[12px] text-[#191c1e] font-bold truncate hover:bg-[#f1f5f9] px-2.5 py-1 rounded-lg transition-colors border border-[#cbd5e1] bg-white shadow-2xs group"
              title="Switch Cloud Project or manage instruction prompts"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#81001d]" />
              <span className="text-[10px] px-1.5 py-0.2 bg-[#dae2fd] text-[#131b2e] rounded font-ui-label-mono font-bold">
                {activeProject?.code || 'PROJECT'}
              </span>
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {activeProject?.name || 'Strategy Workspace'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#64748b] group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Case / Conversation Switcher in this Project */}
            <div className="relative" ref={caseMenuRef}>
              <button
                onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
                className="flex items-center gap-1.5 font-ui-header text-[12px] text-[#475569] hover:text-[#191c1e] hover:bg-[#f8f9fa] px-2.5 py-1 rounded-lg transition-colors border border-[#e2e8f0] bg-white/80"
                title="Switch case conversation within this project"
              >
                <span className="text-[10px] px-1.5 py-0.2 bg-[#f1f5f9] text-[#475569] rounded font-ui-label-mono">
                  CASE
                </span>
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {activeCase?.title || 'Select Case'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
              </button>

              {isCaseMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-[#cbd5e1] p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-ui-label-mono font-bold text-[#64748b] uppercase border-b border-[#f1f5f9] flex justify-between items-center">
                    <span>Conversations in {activeProject?.name || 'Project'}</span>
                    <span>{casesInProject.length} Total</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                    {casesInProject.map((c) => {
                      const isSelected = activeCase ? c.id === activeCase.id : false;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectCase(c.id);
                            setIsCaseMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-[12px] flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#fff5f5] text-[#81001d] font-bold border border-[#81001d]/20'
                              : 'text-[#191c1e] hover:bg-[#f8f9fa]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-ui-label-mono text-[9px] text-[#64748b] block">
                              {c.caseNumber}
                            </span>
                            <span className="truncate block">{c.title}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#81001d] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#f1f5f9]">
                    <button
                      onClick={() => {
                        setIsCaseMenuOpen(false);
                        onOpenUpload();
                      }}
                      className="w-full py-1.5 px-2 bg-[#dae2fd] hover:bg-[#bec6e0] text-[#131b2e] rounded-lg text-[11px] font-ui-header font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#81001d]" />
                      <span>Upload document (s)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Upload Case Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#81001d] hover:bg-[#680017] text-white text-[11px] font-ui-header font-bold transition-colors shadow-xs"
              title="Upload document(s) to this project"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Upload document (s)</span>
            </button>

            {/* Projects Directory Trigger */}
            <button
              onClick={onOpenProjectsModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f2f4f6] text-[#191c1e] text-[11px] font-ui-header font-bold hover:bg-[#e0e3e5] transition-colors border border-[#d8dadc]"
              title="Switch Cloud Project"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#81001d]" />
              <span className="hidden sm:inline">Projects ({totalProjectsCount})</span>
              <span className="sm:hidden">({totalProjectsCount})</span>
            </button>
          </div>
        </div>

        {/* Title & Section - Compact and sleek */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0 flex-1">
            <h1 className="font-headline-md text-[15px] sm:text-[18px] text-[#191c1e] font-semibold truncate leading-tight">
              {activeCase?.title || 'Case Analysis & Strategy'}
            </h1>
          </div>
          <span className="font-ui-label-mono text-[9px] sm:text-[10px] text-[#565e74] shrink-0 uppercase font-medium">
            {activeCase?.section || 'SECTION 1'}
          </span>
        </div>

        {/* Navigation Tabs: Read Case, Cold-Call, Project Materials, Defense */}
        <div className="flex w-full bg-[#f2f4f6] rounded-lg p-0.5 sm:p-1 gap-0.5 sm:gap-1 border border-[#e2e8f0]">
          {/* Read Case Tab */}
          <button
            onClick={() => onSelectTab('reader')}
            className={`flex-1 py-1.5 text-center font-ui-header text-[11px] sm:text-[12px] rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
              currentTab === 'reader'
                ? 'bg-white text-[#191c1e] font-bold shadow-xs border border-[#d8dadc]'
                : 'text-[#594141] hover:text-[#191c1e]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#81001d] shrink-0" />
            <span className="hidden sm:inline">📖 Read Case</span>
            <span className="sm:hidden">Read</span>
          </button>

          {/* Cold-Call Intelligence Tab */}
          <button
            onClick={() => onSelectTab('intel')}
            className={`flex-1 py-1.5 text-center font-ui-header text-[11px] sm:text-[12px] rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
              currentTab === 'intel'
                ? 'bg-white text-[#191c1e] font-bold shadow-xs border border-[#d8dadc]'
                : 'text-[#594141] hover:text-[#191c1e]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-[#81001d] shrink-0" />
            <span className="hidden sm:inline">⚡ Cold Call</span>
            <span className="sm:hidden">Cold Call</span>
          </button>

          {/* Project Workspace & Materials Tab */}
          <button
            onClick={() => onSelectTab('project')}
            className={`flex-1 py-1.5 text-center font-ui-header text-[11px] sm:text-[12px] rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
              currentTab === 'project' || currentTab === 'supporting' || currentTab === 'exhibits'
                ? 'bg-white text-[#191c1e] font-bold shadow-xs border border-[#d8dadc]'
                : 'text-[#594141] hover:text-[#191c1e]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#81001d] shrink-0" />
            <span className="hidden sm:inline">📁 Project Materials {supportingCount + exhibitsCount > 0 ? `(${supportingCount + exhibitsCount})` : ''}</span>
            <span className="sm:hidden">Materials{supportingCount + exhibitsCount > 0 ? ` (${supportingCount + exhibitsCount})` : ''}</span>
          </button>

          {/* Defense Scorecard Tab */}
          <button
            onClick={() => onSelectTab('defense')}
            className={`flex-1 py-1.5 text-center font-ui-header text-[11px] sm:text-[12px] rounded-md flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
              currentTab === 'defense'
                ? 'bg-white text-[#191c1e] font-bold shadow-xs border border-[#d8dadc]'
                : 'text-[#594141] hover:text-[#191c1e]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">🛡️ Defense Scorecard</span>
            <span className="sm:hidden">Defense</span>
          </button>
        </div>
      </div>
    </header>
  );
};

