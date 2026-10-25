import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Layers,
  ScrollText,
  Check,
  X,
  FileText,
  ExternalLink,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Quote,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { CaseItem } from '../data/cases.ts';
import { paginateText } from '../utils/documentParser.ts';
import {
  speechPlayer,
  SPEAKER_PERSONAS,
  SpeakerPersonaId,
  PLAYBACK_SPEEDS,
} from '../utils/speech.ts';
import {
  getSmartCaseReadingUnits,
  CaseNarrativeUnit,
  isMetadataOrCopyright,
} from '../utils/caseNarrative.ts';
import { NativePdfCanvasViewer } from './NativePdfCanvasViewer.tsx';

interface CaseReaderProps {
  caseItem?: CaseItem | null;
  onOpenExhibit: (exhibitId: string) => void;
  onChallengeHypothesis: (prompt: string) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  onTogglePlay?: () => void;
  currentReadingIndex?: number;
  onReadFromParagraph?: (globalIndex: number) => void;
  onOpenUpload?: () => void;
  playbackSpeed?: number;
  onChangePlaybackSpeed?: (speed: number) => void;
}

export const CaseReader: React.FC<CaseReaderProps> = ({
  caseItem,
  onOpenExhibit,
  onChallengeHypothesis,
  focusMode,
  onToggleFocusMode,
  isPlaying = false,
  isPaused = false,
  onTogglePlay,
  currentReadingIndex = 0,
  onReadFromParagraph,
  onOpenUpload,
  playbackSpeed: externalSpeed = 1.0,
  onChangePlaybackSpeed,
}) => {
  // Modes: 'pdf' (PDF Reader layout) or 'structured' (Structured Extracted Text)
  const [docViewMode, setDocViewMode] = useState<'pdf' | 'structured'>('pdf');
  const [textLayoutMode, setTextLayoutMode] = useState<'singlePage' | 'continuous'>('continuous');
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedPersonaId, setSelectedPersonaId] = useState<SpeakerPersonaId>(
    speechPlayer.getPersona().id
  );
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(externalSpeed || speechPlayer.getSpeed());

  // Sync external speed if changed
  useEffect(() => {
    if (externalSpeed && externalSpeed !== playbackSpeed) {
      setPlaybackSpeed(externalSpeed);
    }
  }, [externalSpeed, playbackSpeed]);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Popover menus
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState<boolean>(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState<boolean>(false);

  const activeUnitRef = useRef<HTMLDivElement>(null);
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setIsVoiceMenuOpen(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute smart reading units (order: Title -> Quotes -> Page by page Headings & pure Paragraphs)
  // Filters out all unwanted headers, footers, and copyright/author metadata
  const readingUnits: CaseNarrativeUnit[] = useMemo(() => {
    return getSmartCaseReadingUnits(caseItem);
  }, [caseItem]);

  // Derive pages for structured pagination
  const pages = useMemo(() => {
    if (!caseItem) return [];

    if (caseItem.pages && caseItem.pages.length > 0) {
      return caseItem.pages.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        title: p.title || `Section ${idx + 1}`,
        header: p.header || `${caseItem.course || 'MBA'} • Case ${caseItem.caseNumber || '1'}`,
        footer: p.footer || `Page ${p.pageNumber || idx + 1} • Educational Case Material`,
        // Filter out copyright and boilerplate from body paragraphs
        paragraphs: (p.paragraphs || []).filter((para) => !isMetadataOrCopyright(para)),
        wordCount: (p.paragraphs || []).join(' ').split(/\s+/).filter(Boolean).length,
      }));
    }

    const fullText = (caseItem.paragraphs || []).join('\n\n');
    const paginated = paginateText(fullText, undefined, caseItem.title || 'Case Document');
    return paginated.map((p, idx) => ({
      pageNumber: p.pageNumber || idx + 1,
      title: p.title || `Section ${idx + 1}`,
      header: p.header || `${caseItem.course || 'MBA'} • Case ${caseItem.caseNumber || '1'}`,
      footer: p.footer || `Page ${idx + 1} of ${paginated.length} • Case Material`,
      paragraphs: (p.paragraphs || []).filter((para) => !isMetadataOrCopyright(para)),
      wordCount: p.wordCount || 300,
    }));
  }, [caseItem]);

  const totalPages = Math.max(1, pages.length);

  // Active reading unit
  const activeUnit = readingUnits[currentReadingIndex] || readingUnits[0];

  // Auto-follow speaker: flip page when reading unit reaches a different page
  useEffect(() => {
    if (isPlaying && activeUnit && activeUnit.pageNumber !== currentPageNumber) {
      setCurrentPageNumber(activeUnit.pageNumber);
    }
  }, [activeUnit?.pageNumber, isPlaying]);

  // Smooth scroll active reading unit into view
  useEffect(() => {
    if (isPlaying && activeUnitRef.current) {
      activeUnitRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentReadingIndex, isPlaying]);

  const currentPageData =
    pages.find((p) => p.pageNumber === currentPageNumber) || pages[0] || {
      pageNumber: 1,
      title: 'Section 1: Case Background',
      header: `${caseItem?.course || 'MBA'} • ${caseItem?.caseNumber || 'CASE'}`,
      footer: 'Academic Case Material',
      paragraphs: caseItem?.paragraphs || ['No text content available.'],
      wordCount: 50,
    };

  const handleSelectPersona = (id: SpeakerPersonaId) => {
    setSelectedPersonaId(id);
    speechPlayer.setPersona(id);
    setIsVoiceMenuOpen(false);
    if (isPlaying && onReadFromParagraph) {
      onReadFromParagraph(currentReadingIndex);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (onChangePlaybackSpeed) {
      onChangePlaybackSpeed(speed);
    } else {
      speechPlayer.setSpeed(speed);
    }
    setIsSpeedMenuOpen(false);
  };

  const handlePlayClick = () => {
    speechPlayer.unlockAudio();
    if (onTogglePlay) {
      onTogglePlay();
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(175, Math.max(70, prev + delta)));
  };

  const currentPersona =
    SPEAKER_PERSONAS.find((p) => p.id === selectedPersonaId) || SPEAKER_PERSONAS[0];

  const fontSizeClasses = {
    normal: 'text-[15px] sm:text-[16px] leading-[1.75]',
    large: 'text-[17px] sm:text-[18px] leading-[1.85]',
    xlarge: 'text-[19px] sm:text-[20px] leading-[1.95]',
  };

  const pdfFileName =
    caseItem?.originalFileName ||
    `${caseItem?.caseNumber || 'CASE'}_${(caseItem?.title || 'Case').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  // Find index in readingUnits for a given page paragraph
  const getUnitIndexForParagraph = (pageNum: number, paraText: string): number => {
    const foundIdx = readingUnits.findIndex(
      (u) =>
        u.type === 'paragraph' &&
        u.pageNumber === pageNum &&
        (u.displayText.includes(paraText.slice(0, 30)) || paraText.includes(u.displayText.slice(0, 30)))
    );
    return foundIdx !== -1 ? foundIdx : 0;
  };

  // Find index in readingUnits for a section heading
  const getUnitIndexForHeading = (pageNum: number): number => {
    const foundIdx = readingUnits.findIndex(
      (u) => u.type === 'heading' && u.pageNumber === pageNum
    );
    return foundIdx !== -1 ? foundIdx : 0;
  };

  if (!caseItem) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-16 min-h-[360px] sm:min-h-[500px] bg-white rounded-xl border border-[#cbd5e1] shadow-xs text-center space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#ffdad9] text-[#81001d] flex items-center justify-center shadow-xs">
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="max-w-md px-2">
          <h3 className="font-ui-header text-[18px] sm:text-[20px] font-bold text-[#191c1e]">
            Upload document (s)
          </h3>
          <p className="font-reading-serif text-[13px] sm:text-[14px] text-[#565e74] mt-1.5 leading-relaxed">
            No document uploaded yet. Upload a case study (PDF, Word, or text) to begin reading, synchronized audio narration, and interactive case analysis.
          </p>
        </div>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[12px] sm:text-[13px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-98"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload document (s)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3" id="sectionCaseReader">
      {/* Top View Mode Navigation: Adobe/Foxit PDF Reader vs Structured Extracted Text */}
      <div className="bg-white p-2 sm:p-3 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f1f5f9] p-0.5 sm:p-1 rounded-lg border border-[#cbd5e1]">
            <button
              onClick={() => setDocViewMode('pdf')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-[12px] font-ui-header font-bold flex items-center gap-1.5 transition-all ${
                docViewMode === 'pdf'
                  ? 'bg-white text-[#81001d] shadow-xs'
                  : 'text-[#64748b] hover:text-[#191c1e]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF Document Reader</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={() => setDocViewMode('structured')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-[12px] font-ui-header font-bold flex items-center gap-1.5 transition-all ${
                docViewMode === 'structured'
                  ? 'bg-white text-[#81001d] shadow-xs'
                  : 'text-[#64748b] hover:text-[#191c1e]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Extracted Structured Text</span>
              <span className="sm:hidden">Text</span>
            </button>
          </div>
        </div>

        {/* Global Case Read Aloud Play Button with Instant Initiation & Pause Support */}
        <div className="flex items-center gap-2">
          {onTogglePlay && (
            <button
              onClick={handlePlayClick}
              className={`px-3.5 py-1.5 rounded-lg font-ui-header text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                isPlaying
                  ? 'bg-[#81001d] text-white animate-pulse'
                  : isPaused
                  ? 'bg-[#d97706] text-white hover:bg-[#b45309]'
                  : 'bg-[#dae2fd] hover:bg-[#bec6e0] text-[#131b2e]'
              }`}
              title={
                isPlaying
                  ? 'Pause reading aloud'
                  : isPaused
                  ? 'Resume reading case aloud'
                  : 'Start reading case aloud immediately'
              }
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Reading</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Resume Reading</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Play & Read Aloud</span>
                </>
              )}
            </button>
          )}

          {/* Voice selector */}
          <div className="relative" ref={voiceMenuRef}>
            <button
              onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
              className="px-2.5 py-1.5 bg-[#f8f9fa] hover:bg-[#f1f5f9] rounded-lg border border-[#cbd5e1] text-[11px] font-ui-header font-bold text-[#191c1e] flex items-center gap-1.5 transition-colors"
              title="Select reading voice"
            >
              <Volume2 className="w-3 h-3 text-[#81001d]" />
              <span className="hidden sm:inline">Voice:</span>
              <span>{currentPersona.name}</span>
              <ChevronDown className="w-3 h-3 text-[#64748b]" />
            </button>

            {isVoiceMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-[#cbd5e1] p-2 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-ui-label-mono font-bold text-[#64748b] uppercase border-b border-[#f1f5f9] mb-1">
                  Select Reading Voice
                </div>
                {SPEAKER_PERSONAS.map((persona) => {
                  const isSelected = selectedPersonaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`w-full text-left p-2 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#fff5f5] text-[#81001d] font-bold border border-[#81001d]/20'
                          : 'text-[#191c1e] hover:bg-[#f8f9fa]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-ui-header">{persona.name}</span>
                        <span className="font-ui-label-mono text-[9px] text-[#64748b] capitalize">
                          ({persona.gender === 'female' ? 'Natural British' : 'Socratic Professor'})
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#81001d]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Playback speed selector */}
          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
              className="px-2 py-1.5 bg-[#f8f9fa] hover:bg-[#f1f5f9] rounded-lg border border-[#cbd5e1] text-[11px] font-ui-label-mono font-bold text-[#191c1e] flex items-center gap-1 transition-colors"
              title="Playback speed"
            >
              <span>{playbackSpeed}x</span>
              <ChevronDown className="w-3 h-3 text-[#64748b]" />
            </button>

            {isSpeedMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl shadow-xl border border-[#cbd5e1] p-1.5 z-50">
                {PLAYBACK_SPEEDS.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] font-ui-label-mono flex items-center justify-between ${
                      playbackSpeed === spd
                        ? 'bg-[#81001d] text-white font-bold'
                        : 'text-[#191c1e] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <span>{spd}x</span>
                    {playbackSpeed === spd && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================================
          VIEW 1: ADOBE / FOXIT PDF READER EXPERIENCE (Canvas-based & Unblocked)
      ======================================================================= */}
      {docViewMode === 'pdf' && (
        <div className="bg-[#2c3033] rounded-xl overflow-hidden shadow-xl border border-[#1f2326] flex flex-col">
          {/* Adobe / Foxit Reader Top Command Ribbon */}
          <div className="bg-[#383d42] text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#25282c]">
            {/* Document Details & Icon */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-[#d32f2f] text-white flex items-center justify-center font-bold text-[10px] font-ui-label-mono shrink-0 shadow-xs">
                PDF
              </div>
              <div className="truncate">
                <span className="font-ui-header text-[12px] font-semibold text-gray-100 truncate block">
                  {pdfFileName}
                </span>
                <span className="font-ui-label-mono text-[10px] text-gray-400 block">
                  {caseItem.course} • Case {caseItem.caseNumber} • {totalPages} Pages
                </span>
              </div>
            </div>

            {/* Foxit / Adobe Middle Navigation & Zoom Bar */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#2a2e33] px-2.5 py-1 rounded-lg border border-[#454a50]">
              {/* Page Navigator */}
              <div className="flex items-center gap-1 font-ui-label-mono text-[11px]">
                <button
                  disabled={currentPageNumber <= 1}
                  onClick={() => setCurrentPageNumber((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-[#3f444a] text-gray-200 disabled:opacity-30 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-gray-300 px-1">
                  Page <strong className="text-white">{currentPageNumber}</strong> / {totalPages}
                </span>

                <button
                  disabled={currentPageNumber >= totalPages}
                  onClick={() => setCurrentPageNumber((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-[#3f444a] text-gray-200 disabled:opacity-30 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-px h-4 bg-gray-600"></div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 font-ui-label-mono text-[11px]">
                <button
                  onClick={() => handleZoom(-15)}
                  className="p-1 rounded hover:bg-[#3f444a] text-gray-200"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-gray-200 w-10 text-center font-bold">{zoomLevel}%</span>
                <button
                  onClick={() => handleZoom(15)}
                  className="p-1 rounded hover:bg-[#3f444a] text-gray-200"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-[9px] rounded bg-[#3f444a] hover:bg-[#4d535a] text-gray-300 font-semibold"
                  title="Reset to 100%"
                >
                  Fit
                </button>
              </div>

              <div className="w-px h-4 bg-gray-600"></div>

              {/* Page View Layout */}
              <div className="flex items-center bg-[#1e2124] p-0.5 rounded">
                <button
                  onClick={() => setTextLayoutMode('singlePage')}
                  className={`px-2 py-0.5 rounded text-[10px] font-ui-label-mono font-semibold transition-colors ${
                    textLayoutMode === 'singlePage'
                      ? 'bg-[#d32f2f] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Single Page Book Layout"
                >
                  Single
                </button>
                <button
                  onClick={() => setTextLayoutMode('continuous')}
                  className={`px-2 py-0.5 rounded text-[10px] font-ui-label-mono font-semibold transition-colors ${
                    textLayoutMode === 'continuous'
                      ? 'bg-[#d32f2f] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Continuous Scroll Layout"
                >
                  Scroll
                </button>
              </div>
            </div>

            {/* Document Actions */}
            <div className="flex items-center gap-1.5">
              {caseItem.originalFileUrl && (
                <a
                  href={caseItem.originalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-[#2a2e33] hover:bg-[#3f444a] text-gray-200 rounded text-[11px] font-ui-header flex items-center gap-1 border border-[#454a50] transition-colors"
                  title="Open source file in new browser tab"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Tab</span>
                </a>
              )}
            </div>
          </div>

          {/* PDF Viewer Canvas */}
          <div className="bg-[#525659] p-4 sm:p-8 min-h-[650px] max-h-[850px] overflow-y-auto overflow-x-auto flex justify-center">
            {caseItem.originalFileUrl ? (
              // CANVAS-BASED PDF VIEWER: Completely immune to Chrome iframe blocking
              <div className="w-full flex flex-col items-center">
                <NativePdfCanvasViewer
                  fileUrl={caseItem.originalFileUrl}
                  fileName={pdfFileName}
                  zoomLevel={zoomLevel}
                  initialPage={currentPageNumber}
                  layoutMode={textLayoutMode}
                  onPageChange={(p) => setCurrentPageNumber(p)}
                  onOpenUpload={onOpenUpload}
                />
              </div>
            ) : (!caseItem.paragraphs || caseItem.paragraphs.length === 0 || (caseItem.paragraphs.length === 1 && caseItem.paragraphs[0].includes('No document uploaded'))) ? (
              <div className="bg-white rounded-xl p-8 max-w-md shadow-xl text-center space-y-4 m-auto border border-[#e2e8f0]">
                <div className="w-12 h-12 rounded-full bg-[#ffdad9] text-[#81001d] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-ui-header text-[16px] font-bold text-gray-900">
                    Upload document (s)
                  </h4>
                  <p className="font-reading-serif text-[13px] text-gray-600 leading-relaxed mt-1">
                    Upload document (s) to start reading and audio narration.
                  </p>
                </div>
                {onOpenUpload && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={onOpenUpload}
                      className="px-5 py-2.5 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[12px] font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors active:scale-98"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload documents</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Authentic PDF Letterhead Sheets rendered with synchronized audio narration
              <div
                className="w-full max-w-3xl space-y-8 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                {textLayoutMode === 'singlePage' ? (
                  // SINGLE PAGE PDF SHEET
                  <div className="bg-white rounded-sm shadow-2xl p-8 sm:p-14 border border-[#d1d5db] font-reading-serif text-[#111827] relative min-h-[920px] flex flex-col justify-between">
                    <div>
                      {/* Running Header */}
                      <div className="border-b-2 border-[#81001d] pb-2.5 mb-6 flex items-center justify-between text-[11px] font-ui-label-mono text-[#81001d] font-bold">
                        <span className="uppercase tracking-wider">
                          {currentPageData.header || `${caseItem.course} • ${caseItem.caseNumber}`}
                        </span>
                        <span className="text-[#64748b]">
                          PAGE {currentPageData.pageNumber} OF {totalPages}
                        </span>
                      </div>

                      {/* Main Title & Opening Quote (Page 1) */}
                      {currentPageData.pageNumber === 1 && (
                        <div className="mb-6 space-y-3">
                          <span className="font-ui-label-mono text-[11px] font-bold text-[#81001d] tracking-widest uppercase block">
                            EXECUTIVE CASE STUDY
                          </span>

                          {/* Interactive Title reading block */}
                          <div
                            ref={activeUnit?.type === 'title' ? activeUnitRef : undefined}
                            onClick={() => onReadFromParagraph && onReadFromParagraph(0)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              isPlaying && activeUnit?.type === 'title'
                                ? 'bg-[#fef9c3] ring-2 ring-[#eab308] shadow-sm'
                                : 'hover:bg-[#f8f9fa]'
                            }`}
                            title="Click to start reading from Case Title"
                          >
                            <h1 className="font-headline-md text-[24px] sm:text-[28px] font-bold text-[#191c1e] leading-tight">
                              {caseItem.title}
                            </h1>
                            {caseItem.subtitle && (
                              <p className="text-[13px] text-[#565e74] italic mt-1 font-serif">
                                {caseItem.subtitle}
                              </p>
                            )}
                            {isPlaying && activeUnit?.type === 'title' && (
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-ui-label-mono font-bold text-[#854d0e]">
                                <Volume2 className="w-3 h-3 animate-pulse text-[#ca8a04]" />
                                <span>Reading Aloud: Case Title</span>
                              </div>
                            )}
                          </div>

                          {/* Key Opening Quote (if present) */}
                          {caseItem.keyDefenseSnippet && (
                            <div
                              ref={activeUnit?.type === 'quote' ? activeUnitRef : undefined}
                              onClick={() => {
                                const quoteIdx = readingUnits.findIndex((u) => u.type === 'quote');
                                if (quoteIdx !== -1 && onReadFromParagraph) {
                                  onReadFromParagraph(quoteIdx);
                                }
                              }}
                              className={`p-3.5 rounded-lg border-l-4 border-[#81001d] bg-[#f8f9fa] cursor-pointer transition-all ${
                                isPlaying && activeUnit?.type === 'quote'
                                  ? 'bg-[#fef9c3] ring-2 ring-[#eab308] shadow-sm'
                                  : 'hover:bg-[#f1f5f9]'
                              }`}
                              title="Click to start reading from Opening Quote"
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-ui-label-mono font-bold text-[#81001d] uppercase mb-1">
                                <Quote className="w-3 h-3" />
                                <span>Key Opening Case Quote</span>
                              </div>
                              <p className="italic text-[14px] text-[#191c1e] leading-relaxed font-serif">
                                "{caseItem.keyDefenseSnippet}"
                              </p>
                              {isPlaying && activeUnit?.type === 'quote' && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-ui-label-mono font-bold text-[#854d0e]">
                                  <Volume2 className="w-3 h-3 animate-pulse text-[#ca8a04]" />
                                  <span>Reading Aloud: Opening Quote</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section Heading */}
                      <div
                        ref={
                          activeUnit?.type === 'heading' && activeUnit.pageNumber === currentPageData.pageNumber
                            ? activeUnitRef
                            : undefined
                        }
                        onClick={() => {
                          const hIdx = getUnitIndexForHeading(currentPageData.pageNumber);
                          if (onReadFromParagraph) onReadFromParagraph(hIdx);
                        }}
                        className={`p-2 rounded mb-4 cursor-pointer transition-all ${
                          isPlaying &&
                          activeUnit?.type === 'heading' &&
                          activeUnit.pageNumber === currentPageData.pageNumber
                            ? 'bg-[#fef9c3] ring-2 ring-[#eab308] shadow-sm'
                            : 'hover:bg-[#f8f9fa]'
                        }`}
                        title="Click to start reading from this Section Heading"
                      >
                        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#191c1e] tracking-tight pb-1 border-b border-[#e5e7eb]">
                          {currentPageData.title}
                        </h2>
                      </div>

                      {/* Pure Substantive Paragraphs */}
                      <div className="space-y-4">
                        {currentPageData.paragraphs.map((text, pIdx) => {
                          const unitIdx = getUnitIndexForParagraph(currentPageData.pageNumber, text);
                          const isCurrentlyReadingThis =
                            isPlaying && currentReadingIndex === unitIdx;

                          return (
                            <div
                              key={pIdx}
                              ref={isCurrentlyReadingThis ? activeUnitRef : undefined}
                              onClick={() => {
                                if (onReadFromParagraph) {
                                  onReadFromParagraph(unitIdx);
                                }
                              }}
                              className={`p-3 rounded transition-all cursor-pointer ${fontSizeClasses[fontSize]} ${
                                isCurrentlyReadingThis
                                  ? 'bg-[#fef9c3] text-[#191c1e] ring-2 ring-[#eab308] shadow-sm'
                                  : 'hover:bg-[#f8f9fa]'
                              }`}
                              title="Click to start reading from this paragraph"
                            >
                              <p className="leading-relaxed indent-4">{text}</p>
                              {isCurrentlyReadingThis && (
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-ui-label-mono font-bold text-[#854d0e]">
                                  <Volume2 className="w-3 h-3 animate-pulse text-[#ca8a04]" />
                                  <span>Reading Aloud: {currentPersona.name}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Running Footer */}
                    <div className="border-t border-[#cbd5e1] pt-3 mt-8 flex items-center justify-between text-[10px] font-ui-label-mono text-[#64748b]">
                      <span>
                        {currentPageData.footer || 'Academic Case Document • Authorized for Course Study'}
                      </span>
                      <span className="font-bold text-[#191c1e]">
                        PAGE {currentPageData.pageNumber} OF {totalPages}
                      </span>
                    </div>
                  </div>
                ) : (
                  // CONTINUOUS SCROLL PDF SHEETS
                  pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      className="bg-white rounded-sm shadow-2xl p-8 sm:p-14 border border-[#d1d5db] font-reading-serif text-[#111827] relative min-h-[850px] flex flex-col justify-between mb-8"
                    >
                      <div>
                        {/* Page Running Header */}
                        <div className="border-b-2 border-[#81001d] pb-2.5 mb-6 flex items-center justify-between text-[11px] font-ui-label-mono text-[#81001d] font-bold">
                          <span className="uppercase tracking-wider">
                            {p.header || `${caseItem.course} • ${caseItem.caseNumber}`}
                          </span>
                          <span className="text-[#64748b]">PAGE {p.pageNumber} OF {totalPages}</span>
                        </div>

                        {p.pageNumber === 1 && (
                          <div className="mb-6">
                            <h1 className="font-headline-md text-[24px] font-bold text-[#191c1e]">
                              {caseItem.title}
                            </h1>
                            {caseItem.subtitle && (
                              <p className="text-[13px] text-[#565e74] italic mt-0.5">
                                {caseItem.subtitle}
                              </p>
                            )}
                          </div>
                        )}

                        <h2 className="text-[17px] font-bold text-[#191c1e] pb-1 border-b border-[#e5e7eb] mb-4">
                          {p.title}
                        </h2>

                        <div className="space-y-4">
                          {p.paragraphs.map((text, pIdx) => {
                            const unitIdx = getUnitIndexForParagraph(p.pageNumber, text);
                            const isCurrentlyReadingThis =
                              isPlaying && currentReadingIndex === unitIdx;

                            return (
                              <div
                                key={pIdx}
                                ref={isCurrentlyReadingThis ? activeUnitRef : undefined}
                                onClick={() => {
                                  if (onReadFromParagraph) {
                                    onReadFromParagraph(unitIdx);
                                  }
                                }}
                                className={`p-3 rounded transition-all cursor-pointer ${fontSizeClasses[fontSize]} ${
                                  isCurrentlyReadingThis
                                    ? 'bg-[#fef9c3] text-[#191c1e] ring-2 ring-[#eab308] shadow-sm'
                                    : 'hover:bg-[#f8f9fa]'
                                }`}
                              >
                                <p className="leading-relaxed indent-4">{text}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-[#cbd5e1] pt-3 mt-8 flex items-center justify-between text-[10px] font-ui-label-mono text-[#64748b]">
                        <span>{p.footer || 'Academic Case Document • Authorized for Course Study'}</span>
                        <span className="font-bold text-[#191c1e]">PAGE {p.pageNumber} OF {totalPages}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          VIEW 2: EXTRACTED STRUCTURED TEXT (Clearly Structured Content)
      ======================================================================= */}
      {docViewMode === 'structured' && (
        <div className="space-y-4">
          {/* A. CLEAR HEADER CARD */}
          <div className="bg-[#f8f9fa] border-2 border-[#81001d]/30 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#81001d] text-white rounded font-ui-label-mono text-[10px] font-bold uppercase tracking-wider">
                  PAGE HEADER
                </span>
                <span className="font-ui-label-mono text-[11px] font-bold text-[#191c1e]">
                  {currentPageData.header}
                </span>
              </div>
              <span className="font-ui-label-mono text-[11px] font-bold text-[#81001d]">
                PAGE {currentPageData.pageNumber} OF {totalPages}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-[11px] font-ui-label-mono text-[#565e74]">
              <div>
                <span className="block text-[9px] uppercase font-bold text-[#94a3b8]">Course:</span>
                <span className="font-bold text-[#191c1e]">{caseItem.course}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-[#94a3b8]">Case No:</span>
                <span className="font-bold text-[#191c1e]">{caseItem.caseNumber}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-[#94a3b8]">Est. Read Time:</span>
                <span className="font-bold text-[#191c1e]">{caseItem.estimatedReadTime}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-[#94a3b8]">Exhibits:</span>
                <span className="font-bold text-[#191c1e]">{caseItem.exhibits?.length || 0} Attached</span>
              </div>
            </div>
          </div>

          {/* B. CLEAR HEADINGS & MAIN TEXTS WITH PARAGRAPH STRUCTURE */}
          <div className="bg-white rounded-xl border border-[#cbd5e1] p-5 sm:p-7 shadow-sm space-y-6">
            {/* Clear Heading Banner */}
            <div className="border-l-4 border-[#81001d] pl-4 py-1">
              <span className="font-ui-label-mono text-[10px] font-bold text-[#81001d] uppercase tracking-widest block">
                SECTION HEADING
              </span>
              <h2 className="font-headline-md text-[20px] sm:text-[22px] font-bold text-[#191c1e] mt-0.5">
                {currentPageData.title}
              </h2>
              <p className="text-[12px] text-[#565e74] mt-0.5">
                Contains {currentPageData.paragraphs.length} distinct paragraphs • {currentPageData.wordCount} words
              </p>
            </div>

            {/* Clear Paragraphs Structure */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#e2e8f0]">
                <span className="font-ui-label-mono text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                  PARAGRAPHS OF MAIN TEXT (CLICK TO READ ALOUD)
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#64748b]">
                  {currentPageData.paragraphs.length} Paragraphs
                </span>
              </div>

              {currentPageData.paragraphs.map((paraText, pIdx) => {
                const unitIdx = getUnitIndexForParagraph(currentPageData.pageNumber, paraText);
                const isCurrentlyReadingThis =
                  isPlaying && currentReadingIndex === unitIdx;

                return (
                  <div
                    key={pIdx}
                    ref={isCurrentlyReadingThis ? activeUnitRef : undefined}
                    onClick={() => {
                      if (onReadFromParagraph) {
                        onReadFromParagraph(unitIdx);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isCurrentlyReadingThis
                        ? 'bg-[#fef9c3] border-[#ca8a04] shadow-md ring-2 ring-[#eab308]/40'
                        : 'bg-[#ffffff] border-[#e2e8f0] hover:border-[#94a3b8] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 font-ui-label-mono text-[10px] font-bold text-[#81001d] bg-[#ffdad9] px-2 py-0.5 rounded">
                        ¶ Paragraph {pIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {isCurrentlyReadingThis ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-ui-label-mono font-bold text-[#854d0e] bg-[#fef08a] px-2 py-0.5 rounded">
                            <Volume2 className="w-3 h-3 animate-pulse" /> Reading Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-ui-label-mono text-[#94a3b8]">
                            Click to play
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={`font-reading-serif text-[#191c1e] ${fontSizeClasses[fontSize]}`}>
                      {paraText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. CLEAR FOOTER CARD */}
          <div className="bg-[#f8f9fa] border-2 border-[#cbd5e1] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="px-2 py-0.5 bg-[#565e74] text-white rounded font-ui-label-mono text-[10px] font-bold uppercase tracking-wider block sm:inline-block mr-2">
                PAGE FOOTER
              </span>
              <span className="font-ui-label-mono text-[11px] text-[#565e74]">
                {currentPageData.footer}
              </span>
            </div>

            {/* Bottom Page Navigation */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={currentPageNumber <= 1}
                onClick={() => setCurrentPageNumber((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white hover:bg-[#e2e8f0] text-[#191c1e] rounded-lg text-[11px] font-ui-header font-bold flex items-center gap-1 border border-[#cbd5e1] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Page</span>
              </button>

              <span className="font-ui-label-mono text-[11px] font-bold text-[#191c1e] px-2">
                {currentPageNumber} / {totalPages}
              </span>

              <button
                disabled={currentPageNumber >= totalPages}
                onClick={() => setCurrentPageNumber((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white hover:bg-[#e2e8f0] text-[#191c1e] rounded-lg text-[11px] font-ui-header font-bold flex items-center gap-1 border border-[#cbd5e1] disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Next Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

