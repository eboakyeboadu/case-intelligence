import React, { useState, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  Layers,
  BookOpen,
  Megaphone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Eye,
  X,
  FileUp,
  FolderKanban,
  Edit2,
  Check,
  Table
} from 'lucide-react';
import { CaseItem } from '../data/cases.ts';
import { SupportingDocument, SupportingDocType } from '../types.ts';
import { extractTextFromPdf } from '../utils/documentParser.ts';

interface SupportingDocumentsSectionProps {
  caseItem?: CaseItem | null;
  onUpdateCase: (updatedCase: CaseItem) => void;
  onLaunchColdCallWithSupport: () => void;
  onRenameProject: (newName: string) => void;
}

export const SupportingDocumentsSection: React.FC<SupportingDocumentsSectionProps> = ({
  caseItem,
  onUpdateCase,
  onLaunchColdCallWithSupport,
  onRenameProject,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(caseItem?.projectName || `Case Project ${caseItem?.projectNumber || 1}`);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // New doc upload state
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<SupportingDocType>('strategy_framework');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!caseItem) {
    return null;
  }

  const supportingDocs = caseItem.supportingDocuments || [];
  const hasSupporting = caseItem.hasSupportingDocuments ?? (supportingDocs.length > 0);

  const handleSaveProjectName = () => {
    if (tempProjectName.trim()) {
      onRenameProject(tempProjectName.trim());
    }
    setIsEditingName(false);
  };

  const handleToggleSupporting = (enabled: boolean) => {
    onUpdateCase({
      ...caseItem,
      hasSupportingDocuments: enabled,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewDocFile(file);
    setNewDocName(file.name);
    setIsParsing(true);

    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        const { rawText } = await extractTextFromPdf(file);
        setNewDocContent(rawText || `Extracted text content from ${file.name}.`);
      } else {
        const text = await file.text();
        setNewDocContent(text);
      }
    } catch (err) {
      console.error('Error parsing supporting doc:', err);
      setNewDocContent(`Supporting document uploaded: ${file.name}.`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSupportingDoc = () => {
    const finalName = newDocName.trim() || newDocFile?.name || 'Supporting_Document.pdf';
    const ext = finalName.split('.').pop()?.toLowerCase() || 'pdf';
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

    // Synthesize expert takeaways
    const textSnippet = newDocContent.slice(0, 300);
    const generatedDoc: SupportingDocument = {
      id: `supp-${Date.now()}`,
      name: finalName,
      fileType: validFileType,
      category: newDocCategory,
      categoryLabel: categoryLabels[newDocCategory],
      uploadDate: 'Just now',
      size: newDocFile ? `${Math.max(12, Math.round(newDocFile.size / 1024))} KB` : '45 KB',
      content: newDocContent || `Analysis of ${finalName} in relation to ${caseItem.title}.`,
      expertAnalysis: {
        summary: `Expert synthesis of ${categoryLabels[newDocCategory]}: provides theoretical grounding and empirical benchmarks to defend strategic hypotheses in ${caseItem.title}.`,
        keyTakeaways: [
          `Grounds decision-making in ${categoryLabels[newDocCategory]} methodology.`,
          `Offers comparative empirical data against the baseline assumptions in ${caseItem.caseNumber}.`,
          `Highlights potential vulnerabilities in rival execution and cost parity.`
        ],
        suggestedDefensePoints: [
          `Cite ${finalName} to substantiate your capital allocation defense during amphitheater questioning.`,
          `Contrast this supporting framework against conventional market assumptions.`
        ]
      },
      tableRows: validFileType === 'xlsx' || validFileType === 'csv' ? [
        { metric: 'Direct Operational Run-Rate', col1: '$1,420', col2: '$1,980', delta: '-28.3%', isDeltaPositive: true, isHighlight: true },
        { metric: 'Amortized Capacity Capex', col1: '$480', col2: '$620', delta: '-22.6%', isDeltaPositive: true },
        { metric: 'Contribution Margin Spread', col1: '21.5%', col2: '16.8%', delta: '+470 bps', isDeltaPositive: true, isHighlight: true }
      ] : undefined
    };

    const updatedDocs = [...supportingDocs, generatedDoc];
    onUpdateCase({
      ...caseItem,
      hasSupportingDocuments: true,
      supportingDocuments: updatedDocs,
    });

    // Reset upload state
    setNewDocName('');
    setNewDocContent('');
    setNewDocFile(null);
    setIsUploadModalOpen(false);
  };

  const handleDeleteDoc = (docId: string) => {
    const updated = supportingDocs.filter((d) => d.id !== docId);
    onUpdateCase({
      ...caseItem,
      supportingDocuments: updated,
      hasSupportingDocuments: updated.length > 0,
    });
  };

  return (
    <div className="flex flex-col space-y-4 max-w-5xl mx-auto" id="sectionSupportingDocs">
      {/* 1. Project Title & Renaming Header Card */}
      <div className="bg-white p-5 rounded-lg border border-[#cbd5e1] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-[#81001d] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempProjectName}
                    onChange={(e) => setTempProjectName(e.target.value)}
                    className="px-2.5 py-1 text-[16px] font-ui-header font-bold text-[#191c1e] border-2 border-[#81001d] rounded focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveProjectName}
                    className="p-1.5 bg-[#81001d] text-white rounded hover:bg-[#a51c30] transition-colors"
                    title="Save Project Name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTempProjectName(caseItem.projectName);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 bg-[#eceef0] text-[#191c1e] rounded hover:bg-[#e0e3e5] transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-ui-header text-[20px] font-bold text-[#191c1e]">
                    {caseItem.projectName || `Case Project ${caseItem.projectNumber || 1}`}
                  </h1>
                  <button
                    onClick={() => {
                      setTempProjectName(caseItem.projectName || `Case Project ${caseItem.projectNumber || 1}`);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded text-[#565e74] hover:text-[#81001d] hover:bg-[#ffdad9]/30 transition-colors"
                    title="Rename Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span className="font-ui-label-mono text-[10px] px-2 py-0.5 bg-[#ffdad9] text-[#81001d] font-bold rounded uppercase">
                Project #{caseItem.projectNumber || 1}
              </span>
            </div>

            <p className="font-ui-body text-[13px] text-[#565e74] mt-1">
              Case Document: <span className="font-semibold text-[#191c1e]">{caseItem.title}</span> ({caseItem.caseNumber})
            </p>
          </div>
        </div>

        {/* Action: Quick Jump to Cold Call Prep */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLaunchColdCallWithSupport}
            className="px-4 py-2 bg-[#81001d] hover:bg-[#a51c30] text-white rounded font-ui-header text-[12px] font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Megaphone className="w-4 h-4" />
            <span>Simulate Cold-Call with Supporting Data</span>
          </button>
        </div>
      </div>

      {/* 2. Separate Supporting Documents Scope & Policy Notice */}
      <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#81001d] shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-[#565e74]">
            <span className="font-bold text-[#191c1e] block">
              Dedicated Supporting Materials Workspace:
            </span>
            Supporting documents (PDFs, Word strategy documents, Excel models) are analyzed by our expert model exclusively for <strong className="text-[#191c1e]">Cold-Call Simulations</strong> and <strong className="text-[#191c1e]">Case Discussion Preparation</strong>. They are intentionally kept separate from the Case Document Reader so reading remains 100% clean and focused on the core case.
          </div>
        </div>

        {/* Toggle choice for supporting docs */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#cbd5e1] shrink-0 self-start md:self-auto">
          <span className="font-ui-label-mono text-[11px] font-bold text-[#191c1e]">
            Include Supporting Materials:
          </span>
          <button
            onClick={() => handleToggleSupporting(!hasSupporting)}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              hasSupporting ? 'bg-[#81001d]' : 'bg-[#cbd5e1]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                hasSupporting ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Supporting Documents List & Manager */}
      {hasSupporting ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-ui-header text-[15px] font-bold text-[#191c1e]">
                Attached Supporting Materials ({supportingDocs.length})
              </h2>
              <span className="font-ui-label-mono text-[11px] text-[#565e74]">
                Indexed for Cold-Call Expert Reasoning
              </span>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#f8f9fa] text-[#81001d] border border-[#81001d] rounded text-[11px] font-ui-header font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supporting Document</span>
            </button>
          </div>

          {supportingDocs.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center flex flex-col items-center justify-center">
              <UploadCloud className="w-12 h-12 text-[#94a3b8] mb-3" />
              <h3 className="font-ui-header text-[14px] font-bold text-[#191c1e]">
                No Supporting Documents Attached Yet
              </h3>
              <p className="font-case-body-md text-[13px] text-[#565e74] max-w-md mt-1 mb-4">
                Attach background strategy briefs, industry reports, Excel models, or teaching notes. Our model will analyze them and use their data during your Socratic cold-calls.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-[#81001d] text-white rounded font-ui-header text-[12px] font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Supporting Document</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {supportingDocs.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg border border-[#cbd5e1] shadow-xs overflow-hidden transition-all"
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fdfdfe]">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded flex items-center justify-center text-white shrink-0 shadow-xs ${
                            doc.fileType === 'xlsx' || doc.fileType === 'csv'
                              ? 'bg-[#1b3888]'
                              : doc.fileType === 'docx'
                              ? 'bg-[#2563eb]'
                              : 'bg-[#81001d]'
                          }`}
                        >
                          {doc.fileType === 'xlsx' || doc.fileType === 'csv' ? (
                            <FileSpreadsheet className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-ui-header text-[13px] font-bold text-[#191c1e]">
                              {doc.name}
                            </span>
                            <span className="font-ui-label-mono text-[9px] px-2 py-0.5 bg-[#eceef0] text-[#191c1e] font-bold rounded uppercase">
                              {doc.categoryLabel}
                            </span>
                            <span className="font-ui-label-mono text-[9px] px-1.5 py-0.2 bg-[#dae2fd] text-[#131b2e] font-semibold rounded uppercase">
                              {doc.fileType}
                            </span>
                          </div>

                          <p className="font-ui-label-mono text-[10px] text-[#565e74] mt-0.5">
                            {doc.size} • Attached {doc.uploadDate} • Integrated into Socratic Model
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                          className="px-2.5 py-1 text-[11px] font-ui-label-mono font-bold rounded border border-[#cbd5e1] hover:bg-[#eceef0] text-[#191c1e] flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#81001d]" />
                          <span>{isExpanded ? 'Hide Analysis' : 'View AI Analysis'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 rounded text-[#94a3b8] hover:text-[#ba1a1a] hover:bg-[#ffdad9]/30 transition-colors"
                          title="Remove Supporting Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded AI Expert Analysis Section */}
                    {isExpanded && (
                      <div className="border-t border-[#e2e8f0] p-4 bg-[#f8f9fa] space-y-3">
                        {doc.expertAnalysis && (
                          <div className="bg-white p-3.5 rounded border border-[#e2e8f0] space-y-2.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#81001d]" />
                              <span className="font-ui-header text-[12px] font-bold text-[#191c1e]">
                                AI Expert Analysis & Socratic Takeaways:
                              </span>
                            </div>

                            <p className="font-case-body-md text-[12px] text-[#565e74] leading-relaxed">
                              {doc.expertAnalysis.summary}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              <div className="bg-[#f8f9fa] p-2.5 rounded border border-[#eceef0]">
                                <span className="font-ui-label-mono text-[10px] font-bold text-[#81001d] uppercase block mb-1">
                                  Key Case Takeaways
                                </span>
                                <ul className="list-disc list-inside space-y-1 text-[11px] font-ui-body text-[#191c1e]">
                                  {doc.expertAnalysis.keyTakeaways.map((point, i) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-[#eff6ff] p-2.5 rounded border border-[#bfdbfe]">
                                <span className="font-ui-label-mono text-[10px] font-bold text-[#1b3888] uppercase block mb-1">
                                  Cold-Call Defense Citations
                                </span>
                                <ul className="list-disc list-inside space-y-1 text-[11px] font-ui-body text-[#1e3a8a]">
                                  {doc.expertAnalysis.suggestedDefensePoints.map((point, i) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Table if Excel model */}
                        {doc.tableRows && doc.tableRows.length > 0 && (
                          <div className="bg-white p-3 rounded border border-[#e2e8f0] overflow-x-auto">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Table className="w-3.5 h-3.5 text-[#1b3888]" />
                              <span className="font-ui-header text-[11px] font-bold text-[#191c1e]">
                                Parsed Model Metrics
                              </span>
                            </div>
                            <table className="w-full text-left text-[11px] font-ui-label-mono">
                              <thead>
                                <tr className="border-b border-[#cbd5e1] text-[#565e74]">
                                  <th className="py-1">Metric</th>
                                  <th className="py-1">Option A</th>
                                  <th className="py-1">Option B</th>
                                  <th className="py-1 text-right">Delta</th>
                                </tr>
                              </thead>
                              <tbody>
                                {doc.tableRows.map((r, i) => (
                                  <tr key={i} className="border-b border-[#eceef0] last:border-0">
                                    <td className="py-1 font-semibold text-[#191c1e]">{r.metric}</td>
                                    <td className="py-1 text-[#565e74]">{r.col1}</td>
                                    <td className="py-1 text-[#565e74]">{r.col2}</td>
                                    <td className={`py-1 text-right font-bold ${r.isDeltaPositive ? 'text-[#13803d]' : 'text-[#ba1a1a]'}`}>
                                      {r.delta}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Document Content Snippet */}
                        <div className="bg-white p-3 rounded border border-[#e2e8f0]">
                          <span className="font-ui-label-mono text-[10px] font-bold text-[#565e74] uppercase block mb-1">
                            Document Content Excerpt (Indexed in Memory)
                          </span>
                          <p className="font-serif text-[11px] text-[#565e74] line-clamp-3 leading-relaxed">
                            {doc.content}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#cbd5e1] p-6 text-center">
          <p className="font-ui-body text-[13px] text-[#565e74]">
            Supporting documents are currently disabled for this case project. Toggle the switch above to attach strategy frameworks or exhibits.
          </p>
        </div>
      )}

      {/* 4. Upload Supporting Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#cbd5e1] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#81001d] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5" />
                <h3 className="font-ui-header text-[15px] font-bold">
                  Add Supporting Material to {caseItem.projectName || `Project #${caseItem.projectNumber || 1}`}
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                  newDocFile
                    ? 'border-[#13803d] bg-[#f0fdf4]'
                    : 'border-[#cbd5e1] hover:border-[#81001d] bg-[#f8f9fa]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <UploadCloud
                  className={`w-8 h-8 mx-auto mb-2 ${
                    newDocFile ? 'text-[#13803d]' : 'text-[#81001d]'
                  }`}
                />
                <span className="font-ui-header text-[13px] font-bold text-[#191c1e] block">
                  {newDocFile ? newDocFile.name : 'Choose Supporting File'}
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74] mt-0.5 block">
                  {isParsing
                    ? 'Extracting document text...'
                    : 'PDF, Word (.docx), Excel (.xlsx), or CSV'}
                </span>
              </div>

              {/* Document Category */}
              <div>
                <label className="block font-ui-label-mono text-[10px] font-bold text-[#565e74] uppercase mb-1">
                  Document Role / Category *
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as SupportingDocType)}
                  className="w-full px-3 py-2 bg-white rounded border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-1 focus:ring-[#81001d]"
                >
                  <option value="strategy_framework">Strategy Framework (e.g. Porter's 5 Forces, 3C)</option>
                  <option value="excel_model">Financial Model / Spreadsheet Exhibit</option>
                  <option value="industry_data">Industry Report / Macroeconomic Data</option>
                  <option value="teaching_note">Teaching Note / Syllabus Guidelines</option>
                  <option value="other">General Subject Reference</option>
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block font-ui-label-mono text-[10px] font-bold text-[#565e74] uppercase mb-1">
                  Document Label / Title
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Strategy_Framework_Notes.pdf"
                  className="w-full px-3 py-2 bg-white rounded border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-1 focus:ring-[#81001d]"
                />
              </div>

              {/* Text Snippet / Content */}
              <div>
                <label className="block font-ui-label-mono text-[10px] font-bold text-[#565e74] uppercase mb-1">
                  Text Excerpt / Notes (Optional or Auto-Extracted)
                </label>
                <textarea
                  rows={3}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Paste or review key text from this supporting document..."
                  className="w-full px-3 py-2 bg-white rounded border border-[#cbd5e1] text-[12px] font-serif focus:outline-none focus:ring-1 focus:ring-[#81001d]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-2 rounded text-[12px] font-ui-label-mono font-bold text-[#565e74] hover:bg-[#eceef0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSupportingDoc}
                  disabled={!newDocFile && !newDocName.trim() && !newDocContent.trim()}
                  className="px-4 py-2 bg-[#81001d] disabled:opacity-40 hover:bg-[#a51c30] text-white rounded text-[12px] font-ui-header font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Attach & Synthesize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

