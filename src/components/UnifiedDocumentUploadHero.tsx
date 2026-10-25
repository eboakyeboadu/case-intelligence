import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FolderKanban,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { extractTextFromPdf, paginateText } from '../utils/documentParser.ts';
import { CaseItem, SAMPLE_CASES } from '../data/cases.ts';
import { CloudProject } from '../types.ts';

interface UnifiedDocumentUploadHeroProps {
  onCaseCreated: (newCase: CaseItem, initialAction: 'reader' | 'play' | 'intel') => void;
  onOpenUploadModal: () => void;
  onOpenProjectsModal?: () => void;
  onLoadSample?: (sampleCase: CaseItem) => void;
  activeProject?: CloudProject;
  contextMessage?: string;
}

export const UnifiedDocumentUploadHero: React.FC<UnifiedDocumentUploadHeroProps> = ({
  onCaseCreated,
  onOpenUploadModal,
  onOpenProjectsModal,
  onLoadSample,
  activeProject,
  contextMessage,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Parsing ${file.name}...`);

    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
    let rawText = '';
    let blobUrl = '';

    try {
      blobUrl = URL.createObjectURL(file);
    } catch (e) {
      console.error('Failed to create object URL for file:', e);
    }

    try {
      if (isPdf) {
        setStatusMessage('Extracting PDF text, structure, and letterhead pages...');
        const parsed = await extractTextFromPdf(file);
        rawText = parsed.rawText;
      } else {
        setStatusMessage('Reading document content...');
        rawText = await file.text();
      }
    } catch (err) {
      console.warn('Direct file read note:', err);
      rawText = `${cleanName} examines executive strategic resource allocation and competitive defensibility.`;
    }

    if (!rawText || rawText.trim().length === 0) {
      rawText = `${cleanName} examines executive strategic resource allocation and competitive defensibility.`;
    }

    // Paginate extracted text
    const paginated = paginateText(rawText, undefined, cleanName);
    const bodyParagraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const newCaseItem: CaseItem = {
      id: `case_${Date.now()}`,
      projectId: activeProject?.id,
      projectNumber: 1,
      projectName: activeProject?.name || `Strategy Workspace`,
      caseNumber: `CASE #${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
      title: cleanName,
      subtitle: 'Executive Socratic Preparation & Synchronized Case Reader',
      course: 'Strategy',
      section: 'SECTION 1',
      tags: ['Strategy', 'Executive Case', 'Uploaded Document'],
      pagesCount: paginated.length || 1,
      summary: rawText.slice(0, 320) + (rawText.length > 320 ? '...' : ''),
      paragraphs: bodyParagraphs.length > 0 ? bodyParagraphs : [rawText],
      pages: paginated.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        title: p.title || `Section ${idx + 1}`,
        header: `STRATEGY • ${cleanName}`,
        footer: `Page ${idx + 1} of ${paginated.length} • Case Material`,
        paragraphs: p.paragraphs,
        wordCount: p.wordCount,
      })),
      estimatedReadTime: `${Math.max(6, Math.ceil(rawText.split(/\s+/).length / 150))} min`,
      originalFileName: file.name,
      originalFileUrl: blobUrl || undefined,
      originalFileType: isPdf ? 'pdf' : 'txt',
      coldCall: {
        professor: 'Professor Whitfield',
        amphitheater: 'Room 112',
        prompt: `Based on ${cleanName}, what is your strategic diagnosis of the firm's competitive defensibility and capital deployment?`,
        context: `The faculty opens the case discussion immediately with a direct quantitative challenge on the underlying operational hypothesis.`,
        defaultMetrics: {
          decisiveness: 88,
          decisivenessLabel: 'Decisive Opening Stance',
          rigor: 90,
          rigorLabel: 'Fact-Grounded Rigor',
          framework: 86,
          frameworkLabel: 'Competitive Framework',
          facultyNote: `Ground your opening thesis directly in the core facts from ${cleanName}.`,
        },
        suggestedRebuttals: [
          'Cite core operational advantages from the case document',
          'Defend capital allocation against peer competitors',
          'Highlight sustainable unit economics and scale barriers',
        ],
      },
      exhibits: [],
      supportingDocuments: activeProject?.supportingDocuments || [],
    };

    setIsProcessing(false);
    setStatusMessage('');
    onCaseCreated(newCaseItem, 'reader');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-4 sm:my-8 px-2 sm:px-0 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#cbd5e1] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#81001d] to-[#9b152d] text-white p-5 sm:p-7 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 mx-auto sm:mx-0">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-ui-header text-[18px] sm:text-[20px] font-bold text-white tracking-tight leading-tight">
                Upload document (s)
              </h2>
              <span className="font-ui-label-mono text-[11px] text-[#ffdad9] uppercase tracking-wider block mt-0.5">
                {activeProject?.name || 'Workspace'}
              </span>
            </div>
          </div>

          {onOpenProjectsModal && (
            <button
              onClick={onOpenProjectsModal}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-ui-header font-semibold backdrop-blur-sm transition-colors self-center sm:self-auto border border-white/20"
              title="Switch Workspace Project"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#ffdad9]" />
              <span>Switch Project</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          <p className="font-reading-serif text-[14px] sm:text-[15px] text-[#475569] leading-relaxed text-center sm:text-left">
            {contextMessage ||
              'Upload your case study document (PDF, Word, or text file) to begin instant synchronized audio narration, document reading, and interactive Socratic cold-call drills.'}
          </p>

          {/* Interactive Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3 relative ${
              isDragging
                ? 'border-[#81001d] bg-[#fff5f5] scale-[1.01]'
                : 'border-[#cbd5e1] hover:border-[#81001d] bg-[#f8fafc] hover:bg-[#fef7f7]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#81001d]" />
                <span className="font-ui-header text-[14px] font-bold text-[#191c1e]">
                  {statusMessage || 'Processing document...'}
                </span>
                <span className="text-[12px] text-[#64748b]">
                  Extracting sections, structure, and text
                </span>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#ffdad9] text-[#81001d] flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-ui-header text-[15px] font-bold text-[#191c1e]">
                    Drag and drop your case file here, or <span className="text-[#81001d] underline decoration-[#81001d]/40">browse</span>
                  </p>
                  <p className="font-ui-label-mono text-[11px] text-[#64748b]">
                    Supports PDF (.pdf), Microsoft Word (.docx), or plain text (.txt)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#64748b] bg-white px-3 py-1 rounded-full border border-[#e2e8f0] mt-1 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-[#81001d]" />
                  <span>Instant Audio Narration &amp; Socratic Analysis</span>
                </div>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="w-full sm:w-auto text-[12px] font-ui-header font-bold text-[#81001d] hover:underline text-center sm:text-left py-1"
            >
              Advanced document &amp; exhibits options &rarr;
            </button>

            {onLoadSample && (
              <button
                type="button"
                onClick={() => onLoadSample(SAMPLE_CASES[0])}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#fff5f5] disabled:bg-gray-200 text-[#81001d] border border-[#81001d]/40 font-ui-header text-[13px] font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Try a sample case</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-[#81001d] hover:bg-[#680017] disabled:bg-gray-400 text-white font-ui-header text-[13px] font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Upload document (s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

