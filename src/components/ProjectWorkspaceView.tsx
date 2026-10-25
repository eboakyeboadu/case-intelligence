import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  FileText,
  Plus,
  Edit3,
  Layers,
  FileSpreadsheet,
  BookOpen,
  Megaphone,
  Check,
  ChevronRight,
  Upload,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info,
  Sliders,
  Trash2
} from 'lucide-react';
import { CloudProject, SupportingDocument } from '../types.ts';
import { CaseItem, CaseExhibit } from '../data/cases.ts';

interface ProjectWorkspaceViewProps {
  project: CloudProject;
  activeCase?: CaseItem | null;
  casesInProject: CaseItem[];
  onSelectCase: (caseId: string) => void;
  onStartNewCase: () => void;
  onOpenProjectsModal: () => void;
  onUpdatePrompt: (newPrompt: string) => void;
  onAddSupportingDoc: (doc: SupportingDocument) => void;
  onDeleteSupportingDoc?: (docId: string) => void;
  onOpenExhibitModal?: (exhibit: CaseExhibit) => void;
  onOpenCaseReader: () => void;
  onOpenColdCall: () => void;
}

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  project,
  activeCase,
  casesInProject,
  onSelectCase,
  onStartNewCase,
  onOpenProjectsModal,
  onUpdatePrompt,
  onAddSupportingDoc,
  onDeleteSupportingDoc,
  onOpenExhibitModal,
  onOpenCaseReader,
  onOpenColdCall,
}) => {
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);
  const [promptText, setPromptText] = useState<string>(project.instructionPrompt);
  const [selectedDocPreview, setSelectedDocPreview] = useState<SupportingDocument | null>(
    project.supportingDocuments[0] || null
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocType, setNewDocType] = useState<SupportingDocument['fileType']>('pdf');
  const [newDocCategory, setNewDocCategory] = useState<SupportingDocument['category']>('strategy_framework');
  const [newDocContent, setNewDocContent] = useState<string>('');

  const allSupportingDocs = project.supportingDocuments || [];
  const allExhibits = project.exhibits || [];

  useEffect(() => {
    if (selectedDocPreview && !allSupportingDocs.some((d) => d.id === selectedDocPreview.id)) {
      setSelectedDocPreview(allSupportingDocs[0] || null);
    } else if (!selectedDocPreview && allSupportingDocs.length > 0) {
      setSelectedDocPreview(allSupportingDocs[0]);
    }
  }, [allSupportingDocs]);

  const handleSavePrompt = () => {
    onUpdatePrompt(promptText);
    setIsEditingPrompt(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewDocName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setNewDocType('pdf');
    else if (ext === 'docx') setNewDocType('docx');
    else if (ext === 'xlsx' || ext === 'csv') setNewDocType('xlsx');
    else setNewDocType('txt');

    // Read text sample
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      setNewDocContent(text.slice(0, 3000));
    };
    reader.readAsText(file);
    setIsUploadingDoc(true);
  };

  const handleSaveNewDoc = () => {
    if (!newDocName.trim()) return;

    const newDoc: SupportingDocument = {
      id: `supp-proj-${Date.now()}`,
      name: newDocName.trim(),
      fileType: newDocType,
      category: newDocCategory,
      categoryLabel: newDocCategory === 'strategy_framework' ? 'Strategy Framework' : 'Financial Model',
      uploadDate: 'Just now',
      size: '1.1 MB',
      content: newDocContent || 'Supporting reference material for project cases.',
      expertAnalysis: {
        summary: `Project reference framework: ${newDocName}.`,
        keyTakeaways: [
          'Directly applicable across all conversations in this project.',
          'Provides factual benchmarks for Socratic defense.'
        ],
        suggestedDefensePoints: [
          `Cite ${newDocName} when responding to faculty probes.`
        ]
      }
    };

    onAddSupportingDoc(newDoc);
    setSelectedDocPreview(newDoc);
    setIsUploadingDoc(false);
    setNewDocName('');
    setNewDocContent('');
  };

  return (
    <div className="space-y-4" id="projectWorkspaceView">
      {/* 1. Project Master Header Bar */}
      <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#81001d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-ui-label-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#dae2fd] text-[#131b2e]">
                  {project.code}
                </span>
                <span className="font-ui-label-mono text-[10px] px-2 py-0.5 rounded font-medium bg-[#eceef0] text-[#565e74]">
                  {project.domain}
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="font-ui-header text-[20px] sm:text-[22px] font-bold text-[#191c1e] mt-1">
                {project.name}
              </h1>
              <p className="text-[13px] text-[#594141] mt-0.5 max-w-2xl">
                {project.description}
              </p>
            </div>
          </div>

          {/* Quick Project Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenProjectsModal}
              className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] rounded-lg text-[12px] font-ui-header font-bold border border-[#cbd5e1] flex items-center gap-1.5 transition-colors"
              title="Switch Cloud Project"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[#81001d]" />
              <span>Switch Project</span>
            </button>
            <button
              onClick={onStartNewCase}
              className="px-3.5 py-1.5 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[12px] font-ui-header font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Case in {project.name}</span>
            </button>
          </div>
        </div>

        {/* Project Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e2e8f0]">
            <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-bold block">
              Conversations / Cases
            </span>
            <span className="font-ui-header text-[16px] font-bold text-[#191c1e] mt-0.5 block">
              {casesInProject.length} Active {casesInProject.length === 1 ? 'Case' : 'Cases'}
            </span>
          </div>

          <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e2e8f0]">
            <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-bold block">
              Supporting Materials
            </span>
            <span className="font-ui-header text-[16px] font-bold text-[#191c1e] mt-0.5 block">
              {allSupportingDocs.length} Attached {allSupportingDocs.length === 1 ? 'Doc' : 'Docs'}
            </span>
          </div>

          <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e2e8f0]">
            <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-bold block">
              Financial Exhibits
            </span>
            <span className="font-ui-header text-[16px] font-bold text-[#191c1e] mt-0.5 block">
              {allExhibits.length} Models & Tables
            </span>
          </div>

          <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e2e8f0]">
            <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-bold block">
              Instruction Prompt
            </span>
            <span className="font-ui-header text-[14px] font-bold text-[#81001d] mt-0.5 block truncate">
              Custom Socratic Persona Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. Instruction Prompt Section */}
      <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#81001d]" />
            <h2 className="font-ui-header text-[14px] font-bold text-[#191c1e]">
              Project Instruction Prompt (Socratic Faculty Rules)
            </h2>
          </div>
          {!isEditingPrompt ? (
            <button
              onClick={() => {
                setPromptText(project.instructionPrompt);
                setIsEditingPrompt(true);
              }}
              className="px-2.5 py-1 text-[11px] font-ui-header font-bold text-[#81001d] hover:bg-[#fff5f5] rounded border border-[#81001d]/20 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Instructions</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="px-2.5 py-1 text-[11px] font-ui-header text-[#565e74] hover:text-[#191c1e]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-3 py-1 bg-[#81001d] hover:bg-[#a51c30] text-white rounded text-[11px] font-ui-header font-bold flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Save Prompt</span>
              </button>
            </div>
          )}
        </div>

        {isEditingPrompt ? (
          <div className="space-y-2">
            <textarea
              rows={5}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d] leading-relaxed"
              placeholder="Enter custom instructions for how the AI Socratic Professor will drill students in this project..."
            />
            <p className="text-[11px] text-[#565e74]">
              Tip: You can instruct the professor to focus strictly on strategy frameworks (e.g. Porter's 5 Forces, moats, unit cost economics) or demand empirical citations from the project exhibits.
            </p>
          </div>
        ) : (
          <div className="bg-[#f8f9fa] p-3.5 rounded-lg border border-[#e2e8f0] text-[13px] text-[#334155] leading-relaxed font-ui-body whitespace-pre-line">
            {project.instructionPrompt}
          </div>
        )}
      </div>

      {/* 3. Conversations & Cases under this Project */}
      <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#81001d]" />
            <h2 className="font-ui-header text-[14px] font-bold text-[#191c1e]">
              Cases & Conversations in {project.name} ({casesInProject.length})
            </h2>
          </div>
          <button
            onClick={onStartNewCase}
            className="px-3 py-1 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[11px] font-ui-header font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>New Conversation / Upload Case</span>
          </button>
        </div>

        {casesInProject.length === 0 ? (
          <div className="text-center py-8 bg-[#f8f9fa] rounded-lg border border-dashed border-[#cbd5e1]">
            <BookOpen className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="font-ui-header text-[13px] font-bold text-[#191c1e]">
              No case conversations in this project yet
            </p>
            <p className="text-[12px] text-[#565e74] mt-0.5">
              Upload a case document (PDF, Word, TXT) to start a new Socratic study session.
            </p>
            <button
              onClick={onStartNewCase}
              className="mt-3 px-4 py-2 bg-[#81001d] text-white rounded-lg text-[12px] font-ui-header font-bold shadow-xs hover:bg-[#a51c30]"
            >
              Upload First Case in {project.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {casesInProject.map((c) => {
              const isSelected = activeCase?.id === c.id;
              const pagesCount = c.pagesCount || (c.pages ? c.pages.length : 1);

              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-[#81001d] bg-[#fff5f5] ring-1 ring-[#81001d]/20 shadow-xs'
                      : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui-label-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#dae2fd] text-[#131b2e]">
                          {c.caseNumber}
                        </span>
                        {isSelected && (
                          <span className="font-ui-label-mono text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#81001d] text-white">
                            ACTIVE CASE
                          </span>
                        )}
                      </div>
                      <h3 className="font-ui-header text-[14px] font-bold text-[#191c1e] mt-1 line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-[12px] text-[#565e74] line-clamp-1 mt-0.5">
                        {c.subtitle || c.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-ui-label-mono text-[#565e74]">
                        <span>{pagesCount} Pages</span>
                        <span>{c.estimatedReadTime || '15 Min'}</span>
                        <span>{c.exhibits?.length || 0} Exhibits</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[#e2e8f0]">
                    <button
                      onClick={() => {
                        onSelectCase(c.id);
                        onOpenCaseReader();
                      }}
                      className="px-2.5 py-1 text-[11px] font-ui-header font-bold text-[#81001d] hover:bg-white rounded border border-[#81001d]/20 flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Read Document</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCase(c.id);
                        onOpenColdCall();
                      }}
                      className="px-2.5 py-1 text-[11px] font-ui-header font-bold bg-[#dae2fd] text-[#131b2e] hover:bg-[#bec6e0] rounded flex items-center gap-1"
                    >
                      <Megaphone className="w-3 h-3 text-[#81001d]" />
                      <span>Cold Call</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Project Supporting Materials Section */}
      <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#81001d]" />
              <h2 className="font-ui-header text-[14px] font-bold text-[#191c1e]">
                Project Supporting Materials & Frameworks ({allSupportingDocs.length})
              </h2>
            </div>
            <p className="text-[12px] text-[#565e74] mt-0.5">
              Reference materials attached to this project are accessible to every conversation and case.
            </p>
          </div>

          <label className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] rounded-lg text-[11px] font-ui-header font-bold border border-[#cbd5e1] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
            <Upload className="w-3.5 h-3.5 text-[#81001d]" />
            <span>Attach Supporting File</span>
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Modal Drawer if file was picked */}
        {isUploadingDoc && (
          <div className="p-4 bg-[#f8f9fa] rounded-lg border border-[#cbd5e1] mb-4 space-y-3">
            <h3 className="font-ui-header text-[13px] font-bold text-[#191c1e]">
              Confirm Supporting Document Upload
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-ui-header font-bold text-[#191c1e] mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#cbd5e1] text-[12px] font-ui-body"
                />
              </div>
              <div>
                <label className="block text-[11px] font-ui-header font-bold text-[#191c1e] mb-1">
                  Category
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded border border-[#cbd5e1] text-[12px] font-ui-body bg-white"
                >
                  <option value="strategy_framework">Strategy Framework</option>
                  <option value="industry_data">Industry Report</option>
                  <option value="excel_model">Financial Model</option>
                  <option value="teaching_note">Faculty Note</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUploadingDoc(false)}
                className="px-3 py-1 text-[11px] font-ui-header text-[#565e74]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewDoc}
                className="px-4 py-1 bg-[#81001d] text-white rounded text-[11px] font-ui-header font-bold shadow-xs hover:bg-[#a51c30]"
              >
                Attach to {project.name}
              </button>
            </div>
          </div>
        )}

        {/* Documents Grid & Preview */}
        {allSupportingDocs.length === 0 ? (
          <div className="text-center py-6 bg-[#f8f9fa] rounded-lg border border-dashed border-[#cbd5e1]">
            <p className="text-[12px] text-[#565e74]">
              No supporting documents attached to this project yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="space-y-2 lg:col-span-1">
              {allSupportingDocs.map((doc) => {
                const isSelected = selectedDocPreview?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocPreview(doc)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#81001d] bg-[#fff5f5] shadow-xs'
                        : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#81001d] shrink-0" />
                      <span className="font-ui-header text-[12px] font-bold text-[#191c1e] truncate">
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-ui-label-mono text-[#565e74]">
                      <span>{doc.categoryLabel}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-2 bg-[#f8f9fa] rounded-lg border border-[#e2e8f0] p-4">
              {selectedDocPreview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                    <div>
                      <h4 className="font-ui-header text-[13px] font-bold text-[#191c1e]">
                        {selectedDocPreview.name}
                      </h4>
                      <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                        {selectedDocPreview.categoryLabel} • {selectedDocPreview.size}
                      </span>
                    </div>

                    {onDeleteSupportingDoc && (
                      <button
                        onClick={() => {
                          onDeleteSupportingDoc(selectedDocPreview.id);
                          setSelectedDocPreview(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-ui-header font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded border border-[#ba1a1a]/20 flex items-center gap-1 transition-colors"
                        title="Remove supporting document from project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Material</span>
                      </button>
                    )}
                  </div>

                  {selectedDocPreview.expertAnalysis && (
                    <div className="space-y-2">
                      <div className="bg-white p-2.5 rounded border border-[#e2e8f0]">
                        <span className="font-ui-label-mono text-[10px] font-bold text-[#81001d] uppercase block">
                          Executive Summary
                        </span>
                        <p className="text-[12px] text-[#334155] mt-0.5 leading-relaxed">
                          {selectedDocPreview.expertAnalysis.summary}
                        </p>
                      </div>

                      {selectedDocPreview.expertAnalysis.keyTakeaways.length > 0 && (
                        <div className="bg-white p-2.5 rounded border border-[#e2e8f0]">
                          <span className="font-ui-label-mono text-[10px] font-bold text-[#565e74] uppercase block">
                            Key Strategic Takeaways
                          </span>
                          <ul className="list-disc list-inside text-[12px] text-[#334155] mt-1 space-y-0.5">
                            {selectedDocPreview.expertAnalysis.keyTakeaways.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedDocPreview.expertAnalysis.suggestedDefensePoints.length > 0 && (
                        <div className="bg-[#dae2fd]/30 p-2.5 rounded border border-[#dae2fd]">
                          <span className="font-ui-label-mono text-[10px] font-bold text-[#131b2e] uppercase block">
                            Recommended Socratic Defense Citations
                          </span>
                          <ul className="list-disc list-inside text-[12px] text-[#131b2e] mt-1 space-y-0.5">
                            {selectedDocPreview.expertAnalysis.suggestedDefensePoints.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw content preview */}
                  <div className="mt-2 pt-2 border-t border-[#e2e8f0]">
                    <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-bold block mb-1">
                      Material Content Excerpt
                    </span>
                    <div className="bg-white p-3 rounded border border-[#e2e8f0] text-[12px] text-[#475569] font-ui-body max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed">
                      {selectedDocPreview.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#565e74] text-[12px]">
                  Select a supporting document from the list to preview details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Project Financial Exhibits & Models */}
      {allExhibits.length > 0 && (
        <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#81001d]" />
              <h2 className="font-ui-header text-[14px] font-bold text-[#191c1e]">
                Project Exhibits & Financial Spreadsheets ({allExhibits.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {allExhibits.map((ex) => (
              <div key={ex.id} className="p-4 bg-[#f8f9fa] rounded-lg border border-[#cbd5e1]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-ui-header text-[13px] font-bold text-[#191c1e]">
                    {ex.title}
                  </h4>
                  <span className="font-ui-label-mono text-[10px] px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded font-bold">
                    {ex.category}
                  </span>
                </div>
                <p className="text-[12px] text-[#565e74] mb-3">
                  {ex.description}
                </p>

                {/* Table */}
                {ex.tableRows && ex.tableRows.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded border border-[#e2e8f0]">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-[#f1f5f9] text-[#475569] font-ui-label-mono text-[11px] uppercase">
                        <tr>
                          {ex.tableHeaders.map((h: string, idx: number) => (
                            <th key={idx} className="p-2.5 font-bold border-b border-[#e2e8f0]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {ex.tableRows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className={row.isHighlight ? 'bg-[#fff5f5]' : ''}>
                            <td className="p-2.5 font-medium text-[#191c1e]">{row.metric}</td>
                            <td className="p-2.5 font-ui-label-mono">{row.col1}</td>
                            <td className="p-2.5 font-ui-label-mono">{row.col2}</td>
                            <td className={`p-2.5 font-ui-label-mono font-bold ${
                              row.isDeltaPositive ? 'text-emerald-700' : 'text-[#81001d]'
                            }`}>
                              {row.delta}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {ex.keyFinding && (
                  <div className="mt-3 p-2 bg-[#dae2fd]/40 rounded border border-[#dae2fd] text-[11px] font-ui-label-mono text-[#131b2e] font-bold">
                    💡 Key Finding: {ex.keyFinding}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

