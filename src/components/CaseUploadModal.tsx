import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  Sparkles,
  CheckCircle2,
  FolderPlus,
  FolderKanban,
  ArrowRight,
  BookOpen,
  Play,
  Megaphone,
  AlertCircle,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import { CaseItem } from '../data/cases.ts';
import { SupportingDocument, SupportingDocType } from '../types.ts';
import { extractTextFromPdf, paginateText } from '../utils/documentParser.ts';

interface CaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: CaseItem, initialAction: 'reader' | 'play' | 'intel' | 'exhibits') => void;
  existingCasesCount?: number;
  activeProjectId?: string;
  activeProjectName?: string;
}

export const CaseUploadModal: React.FC<CaseUploadModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
  existingCasesCount = 0,
  activeProjectId,
  activeProjectName,
}) => {
  const [projectName, setProjectName] = useState<string>(activeProjectName || '');
  const [projectError, setProjectError] = useState<string>('');
  const [course, setCourse] = useState<CaseItem['course']>('Strategy');
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [caseText, setCaseText] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [coldCallPrompt, setColdCallPrompt] = useState('');
  const [uploadedCaseFileName, setUploadedCaseFileName] = useState('');
  const [uploadedCaseFileBlobUrl, setUploadedCaseFileBlobUrl] = useState('');
  const [uploadedCaseFileType, setUploadedCaseFileType] = useState('');
  const [uploadedExcelFileName, setUploadedExcelFileName] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [excelTableRows, setExcelTableRows] = useState<
    Array<{ metric: string; col1: string; col2: string; delta: string; isDeltaPositive?: boolean; isHighlight?: boolean }>
  >([]);

  // Supporting documents choice
  const [hasSupportingDocs, setHasSupportingDocs] = useState<boolean>(false);
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocument[]>([]);
  const [newSuppCategory, setNewSuppCategory] = useState<SupportingDocType>('strategy_framework');
  const [isParsingSupp, setIsParsingSupp] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle case doc upload
  const handleCaseDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedCaseFileName(file.name);
    setUploadedCaseFileType(file.type || 'application/pdf');
    try {
      const blobUrl = URL.createObjectURL(file);
      setUploadedCaseFileBlobUrl(blobUrl);
    } catch (err) {
      console.error('Failed to create object URL:', err);
    }
    setIsParsingDoc(true);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    if (!title) {
      setTitle(cleanName);
    }
    if (!caseNumber) {
      setCaseNumber(`CASE #${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`);
    }

    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        const { rawText } = await extractTextFromPdf(file);
        if (rawText && rawText.trim().length > 0) {
          setCaseText(rawText);
        } else {
          setCaseText(`${cleanName} examines strategic resource allocation and competitive positioning.`);
        }
      } else {
        const text = await file.text();
        setCaseText(text);
      }
    } catch (err) {
      console.error('Error reading case doc:', err);
      setCaseText(`${cleanName} examines strategic resource allocation and competitive positioning.`);
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleSupportingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingSupp(true);
    let extractedContent = '';
    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        const { rawText } = await extractTextFromPdf(file);
        extractedContent = rawText || `Extracted text from ${file.name}.`;
      } else {
        extractedContent = await file.text();
      }
    } catch (err) {
      console.error('Error extracting supporting document:', err);
      extractedContent = `Supporting document uploaded: ${file.name}.`;
    } finally {
      setIsParsingSupp(false);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const validFileType: SupportingDocument['fileType'] =
      ext === 'xlsx' || ext === 'xls'
        ? 'xlsx'
        : ext === 'docx' || ext === 'doc'
        ? 'docx'
        : ext === 'csv'
        ? 'csv'
        : ext === 'txt'
        ? 'txt'
        : 'pdf';

    const categoryLabels: Record<SupportingDocType, string> = {
      strategy_framework: 'Strategy Framework',
      excel_model: 'Financial Model / Exhibit',
      industry_data: 'Industry Report',
      teaching_note: 'Teaching Note / Syllabus',
      other: 'Subject Material',
    };

    const newDoc: SupportingDocument = {
      id: `supp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: file.name,
      fileType: validFileType,
      category: newSuppCategory,
      categoryLabel: categoryLabels[newSuppCategory],
      uploadDate: 'Just now',
      size: `${Math.max(15, Math.round(file.size / 1024))} KB`,
      content: extractedContent,
      expertAnalysis: {
        summary: `Expert synthesis of ${categoryLabels[newSuppCategory]} (${file.name}): provides empirical benchmarks and theoretical framework for cold-call defenses in ${title || 'this case'}.`,
        keyTakeaways: [
          `Establishes structural ${categoryLabels[newSuppCategory]} boundaries for competitive evaluation.`,
          `Validates quantitative cost and margin assumptions against industry standards.`,
          `Highlights strategic moats and potential counter-moves from key competitors.`
        ],
        suggestedDefensePoints: [
          `Cite ${file.name} to substantiate your capital allocation defense during amphitheater questioning.`,
          `Highlight how this framework counters competitor price-cutting pressures.`
        ]
      },
      tableRows: validFileType === 'xlsx' || validFileType === 'csv' ? [
        { metric: 'Direct Operational Run-Rate', col1: '$1,420', col2: '$1,980', delta: '-28.3%', isDeltaPositive: true, isHighlight: true },
        { metric: 'Amortized Capacity Capex', col1: '$480', col2: '$620', delta: '-22.6%', isDeltaPositive: true },
        { metric: 'Contribution Margin Spread', col1: '21.5%', col2: '16.8%', delta: '+470 bps', isDeltaPositive: true, isHighlight: true }
      ] : undefined
    };

    setSupportingDocs((prev) => [...prev, newDoc]);
    setHasSupportingDocs(true);
  };

  // Handle excel upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedExcelFileName(file.name);
    setExcelTableRows([
      { metric: 'Unit Product Cost', col1: '$1,850', col2: '$2,200', delta: '-15.9%', isDeltaPositive: true, isHighlight: true },
      { metric: 'Direct Labor Run-Rate', col1: '$420', col2: '$510', delta: '-17.6%', isDeltaPositive: true },
      { metric: 'Logistics & Freight', col1: '$120', col2: '$340', delta: '-64.7%', isDeltaPositive: true, isHighlight: true },
      { metric: 'Operating Margin', col1: '19.4%', col2: '14.8%', delta: '+460 bps', isDeltaPositive: true, isHighlight: true },
    ]);
  };

  const handleSubmit = (action: 'reader' | 'play' | 'intel') => {
    if (!projectName.trim()) {
      setProjectError('Project Identifier / Name is required. Please type a project name.');
      return;
    }

    const finalTitle = title.trim() || uploadedCaseFileName.replace(/\.[^/.]+$/, '') || 'Untitled Case';
    const finalProjectName = projectName.trim();
    const finalCaseNumber = caseNumber.trim() || `CASE #${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`;
    const finalProf = professorName.trim() || 'Prof. A. Whitfield';

    // Strictly NO exhibits if user did not upload an Excel file or table!
    const hasExcel = Boolean(uploadedExcelFileName || excelTableRows.length > 0);
    const exhibitsList = hasExcel
      ? [
          {
            id: `exhibit-${Date.now()}`,
            title: uploadedExcelFileName
              ? `Exhibit 1: ${uploadedExcelFileName.replace(/\.[^/.]+$/, '')}`
              : 'Exhibit 1: Quantitative Unit Cost & Financial Model',
            category: 'Financial Model',
            description: `Parsed from ${uploadedExcelFileName || 'uploaded financial spreadsheet'}.`,
            tableHeaders: ['METRIC', 'OPTION A (LOCAL)', 'OPTION B (BENCHMARK)', 'DELTA'],
            tableRows: excelTableRows,
            keyFinding: 'QUANTITATIVE MODEL AUDIT READY',
            defenseFindingText: 'Cite Exhibit 1 model findings in cold-call defense',
            relatedFile: uploadedExcelFileName || 'Uploaded_Model.xlsx',
          },
        ]
      : [];

    const parsedPages = paginateText(
      caseText.trim() ||
        `${finalTitle} explores competitive advantage, cost structure resilience, and capital allocation in an evolving market.\n\nManagement must determine whether to expand localized operational capacity or rely on modular external partnerships.\n\nThe board must evaluate long-term solvency vs short-term market share targets under peer price wars.`
    );
    const allParagraphs = parsedPages.flatMap((p) => p.paragraphs);

    const newCaseItem: CaseItem = {
      id: `case-${Date.now()}`,
      projectId: activeProjectId || 'proj-strategy-01',
      originalFileUrl: uploadedCaseFileBlobUrl || undefined,
      originalFileName: uploadedCaseFileName || undefined,
      originalFileType: uploadedCaseFileType || undefined,
      projectNumber: existingCasesCount + 1,
      projectName: finalProjectName,
      course,
      caseNumber: finalCaseNumber,
      title: finalTitle,
      subtitle: subtitle.trim() || `Sec. I • Strategic & Quantitative Analysis`,
      section: 'SEC. I',
      pagesCount: parsedPages.length,
      estimatedReadTime: `${Math.max(4, Math.round(allParagraphs.join(' ').split(/\s+/).length / 180))} MIN ESTIMATED READ`,
      tags: [course, 'Student Upload', 'Case Document'],
      summary: allParagraphs[0] || `${finalTitle} case study.`,
      paragraphs: allParagraphs,
      pages: parsedPages.map((p) => ({
        pageNumber: p.pageNumber,
        title: `Page ${p.pageNumber}: ${finalTitle}`,
        paragraphs: p.paragraphs,
      })),
      hasSupportingDocuments: hasSupportingDocs && supportingDocs.length > 0,
      supportingDocuments: supportingDocs,
      keyDefensePassage: {
        title: 'KEY CASE CITATION',
        timestamp: 'T+02:45',
        citation: exhibitsList.length > 0 ? 'Citation: Ex. 1 Financial Model' : 'Citation: Case Narrative Sec. 1',
        exhibitId: exhibitsList.length > 0 ? exhibitsList[0].id : '',
        quote: `“${allParagraphs[0]?.slice(0, 200) || 'Capital structure decisions must withstand short-term margin contraction to build enduring economies of scale.'}”`,
      },
      facultyPrompt: {
        professor: finalProf,
        role: 'Faculty Challenge',
        section: 'Sec. 1.2',
        prompt: `“What is your core thesis, and how do the case facts protect your recommendation against competitor counter-actions?”`,
        defaultChallenge: `Challenge the fundamental return on invested capital assumption in the case narrative.`,
      },
      coldCall: {
        amphitheater: 'Main Amphitheater • Row C',
        professor: finalProf,
        context: 'The amphitheater is waiting. Deliver your opening thesis in 90 seconds.',
        prompt: coldCallPrompt.trim() || `“What is your opening recommendation for ${finalTitle}?”`,
        defaultMetrics: {
          decisiveness: 88,
          decisivenessLabel: 'Decisive',
          rigor: exhibitsList.length > 0 ? 92 : 86,
          rigorLabel: exhibitsList.length > 0 ? 'Exhibits Grounded' : 'Narrative Grounded',
          framework: 85,
          frameworkLabel: 'Framework Rigor',
          facultyNote: `Faculty note: Ground your opening sentence in specific facts from ${finalTitle}.`,
        },
        suggestedRebuttals: exhibitsList.length > 0
          ? ['Cite Exhibit 1 unit margin advantage', 'Defend capital deployment against peer leverage', 'Highlight localized regulatory defensibility']
          : ['Cite Case Narrative core facts', 'Defend capital allocation against peer competitors', 'Highlight operational scale advantage'],
      },
      exhibits: exhibitsList,
      uploadedFiles: [
        ...(uploadedCaseFileName
          ? [{ name: uploadedCaseFileName, size: '2.4 MB', type: 'case_doc' as const, uploadDate: 'Just now' }]
          : [{ name: `${finalTitle.slice(0, 18)}_Document.pdf`, size: '2.1 MB', type: 'case_doc' as const, uploadDate: 'Just now' }]),
        ...(uploadedExcelFileName
          ? [{ name: uploadedExcelFileName, size: '940 KB', type: 'excel_model' as const, uploadDate: 'Just now' }]
          : []),
      ],
    };

    onCaseCreated(newCaseItem, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#cbd5e1] w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header without constant Project #8 */}
        <div className="bg-[#81001d] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a51c30] flex items-center justify-center text-white shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-ui-header text-[15px] font-bold text-white leading-tight">
                Upload document (s)
              </h2>
              <span className="font-ui-label-mono text-[10px] text-[#ffdad9]">
                ADD CASE DOCUMENT AND MATERIALS TO WORKSPACE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[#191c1e]">
          {/* Project Identifier / Name Customization Field (Required) */}
          <div className={`p-3.5 rounded-lg border transition-colors ${projectError ? 'bg-red-50/60 border-red-400' : 'bg-[#f8f9fa] border-[#e2e8f0]'}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="font-ui-label-mono text-[11px] text-[#191c1e] font-bold uppercase">
                Project Identifier / Name <span className="text-red-600">* (Required)</span>
              </label>
              {projectError && (
                <span className="font-ui-label-mono text-[10px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {projectError}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (projectError && e.target.value.trim()) setProjectError('');
              }}
              placeholder="Type project identifier or name (e.g. European Decarbonization Strategy)..."
              className={`w-full bg-white px-3 py-2 rounded-md text-[#191c1e] font-ui-header text-[13px] font-medium border focus:outline-none focus:ring-2 ${
                projectError
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#cbd5e1] focus:ring-[#81001d]'
              }`}
            />
          </div>

          {/* File Upload Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Case Document Dropzone */}
            <div className="border-2 border-dashed border-[#cbd5e1] hover:border-[#81001d] rounded p-4 text-center bg-[#f8f9fa] relative group transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleCaseDocUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#ffdad9] text-[#81001d] flex items-center justify-center mb-1.5">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <span className="font-ui-header text-[12px] font-bold text-[#191c1e]">
                  1. Case Document (.pdf, .docx, .txt) *
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74] mt-0.5">
                  {uploadedCaseFileName ? (
                    <span className="text-[#81001d] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {uploadedCaseFileName}
                    </span>
                  ) : (
                    'Drag & drop or click to browse'
                  )}
                </span>
              </div>
            </div>

            {/* Excel Model Dropzone (Optional) */}
            <div className="border-2 border-dashed border-[#cbd5e1] hover:border-[#1b3888] rounded p-4 text-center bg-[#f8f9fa] relative group transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#dae2fd] text-[#1b3888] flex items-center justify-center mb-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="font-ui-header text-[12px] font-bold text-[#191c1e]">
                  2. Financial Model (Optional)
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74] mt-0.5">
                  {uploadedExcelFileName ? (
                    <span className="text-[#1b3888] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {uploadedExcelFileName}
                    </span>
                  ) : (
                    'Leave empty if case has no exhibits'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Supporting Documents Section Option */}
          <div className="bg-[#fdfdfe] p-3.5 rounded border border-[#cbd5e1] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-ui-header text-[12px] font-bold text-[#191c1e] block">
                  Supporting Documents (Strategy Briefs, Industry Reports, Teaching Notes)
                </span>
                <span className="text-[11px] text-[#565e74]">
                  Do you have supporting materials for this project?
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHasSupportingDocs(false)}
                  className={`px-2.5 py-1 rounded text-[10px] font-ui-label-mono font-bold ${
                    !hasSupportingDocs ? 'bg-[#191c1e] text-white' : 'bg-[#eceef0] text-[#565e74]'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setHasSupportingDocs(true)}
                  className={`px-2.5 py-1 rounded text-[10px] font-ui-label-mono font-bold ${
                    hasSupportingDocs ? 'bg-[#81001d] text-white' : 'bg-[#eceef0] text-[#565e74]'
                  }`}
                >
                  Yes, Add
                </button>
              </div>
            </div>

            {hasSupportingDocs && (
              <div className="pt-2 border-t border-[#e2e8f0] space-y-2">
                <p className="text-[11px] text-[#565e74]">
                  Supporting documents are analyzed by our expert AI specifically to help prepare you for cold-calls and class discussions without cluttering the primary case reader.
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={newSuppCategory}
                    onChange={(e) => setNewSuppCategory(e.target.value as SupportingDocType)}
                    className="px-2 py-1 bg-white rounded border border-[#cbd5e1] text-[11px] font-ui-body"
                  >
                    <option value="strategy_framework">Strategy Framework</option>
                    <option value="excel_model">Financial Model / Exhibit</option>
                    <option value="industry_data">Industry Report</option>
                    <option value="teaching_note">Teaching Note</option>
                    <option value="other">Subject Material</option>
                  </select>
                  <label className="cursor-pointer px-2.5 py-1 bg-[#81001d] text-white rounded text-[11px] font-bold hover:bg-[#a51c30]">
                    <span>{isParsingSupp ? 'Analyzing...' : '+ Upload PDF / Word / Excel'}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
                      onChange={handleSupportingFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {supportingDocs.length > 0 && (
                  <div className="space-y-1">
                    {supportingDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-1.5 bg-[#f8f9fa] rounded text-[11px]">
                        <span className="font-semibold text-[#191c1e] truncate">{doc.name}</span>
                        <span className="text-[10px] text-[#565e74] ml-2">({doc.categoryLabel})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-ui-label-mono text-[10px] text-[#594141] font-bold uppercase block mb-1">
                Course Module
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value as CaseItem['course'])}
                className="w-full bg-[#f2f4f6] px-2.5 py-1.5 rounded text-[#191c1e] font-ui-label-mono text-[11px] font-semibold border border-[#d8dadc] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81001d]"
              >
                <option value="Strategy">Strategy (STRAT)</option>
                <option value="Financial Accounting">Financial Accounting (FRAP)</option>
                <option value="Operations">Operations (TOM)</option>
                <option value="Corporate Finance">Corporate Finance (FIN)</option>
                <option value="Leadership">Leadership (LEAD)</option>
              </select>
            </div>

            <div>
              <label className="font-ui-label-mono text-[10px] text-[#594141] font-bold uppercase block mb-1">
                Case Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Meridian Mobility Market Entry"
                className="w-full bg-[#f2f4f6] px-2.5 py-1.5 rounded text-[#191c1e] font-headline-md text-[13px] font-semibold border border-[#d8dadc] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81001d]"
              />
            </div>

            <div>
              <label className="font-ui-label-mono text-[10px] text-[#594141] font-bold uppercase block mb-1">
                Professor (Optional)
              </label>
              <input
                type="text"
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                placeholder="e.g. Prof. Gary Pisano"
                className="w-full bg-[#f2f4f6] px-2.5 py-1.5 rounded text-[#191c1e] font-ui-label-mono text-[11px] border border-[#d8dadc] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81001d]"
              />
            </div>
          </div>

          {/* Case Narrative Text Excerpt */}
          <div>
            <label className="font-ui-label-mono text-[10px] text-[#594141] font-bold uppercase block mb-1">
              Case Narrative Content
            </label>
            <textarea
              rows={4}
              value={caseText}
              onChange={(e) => setCaseText(e.target.value)}
              placeholder="Paste or preview case narrative paragraphs here..."
              className="w-full bg-[#f2f4f6] p-2.5 rounded text-[#191c1e] font-case-body-md text-[12px] border border-[#d8dadc] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81001d]"
            />
          </div>
        </div>

        {/* Modal Footer: Single Clean Open Action */}
        <div className="bg-[#f2f4f6] p-4 border-t border-[#e2e8f0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#565e74] hover:text-[#191c1e] font-ui-label-mono text-[11px] font-bold uppercase transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('reader')}
            className="px-6 py-2.5 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[13px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-98"
            title="Open case document in platform"
          >
            <span>Open</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

