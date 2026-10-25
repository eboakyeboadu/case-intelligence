import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Check,
  X,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  Edit3,
  Trash2,
  Calendar,
  BookOpen
} from 'lucide-react';
import { CloudProject } from '../types.ts';
import { SUGGESTED_COURSE_DOMAINS } from '../data/projects.ts';

interface CloudProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: CloudProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (project: Omit<CloudProject, 'id' | 'createdAt'>) => void;
  onUpdateProjectPrompt: (projectId: string, prompt: string) => void;
  onStartNewCaseInProject: (projectId: string) => void;
}

export const CloudProjectManagerModal: React.FC<CloudProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProjectPrompt,
  onStartNewCaseInProject,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'editPrompt'>('switch');

  // Create Project Form State
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDomain, setNewProjectDomain] = useState<string>(SUGGESTED_COURSE_DOMAINS[0].domain);
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(false);
  const [customDomainText, setCustomDomainText] = useState<string>('');
  const [newProjectCode, setNewProjectCode] = useState<string>(`${SUGGESTED_COURSE_DOMAINS[0].codePrefix}-01`);
  const [newProjectDesc, setNewProjectDesc] = useState<string>(SUGGESTED_COURSE_DOMAINS[0].description);
  const [newProjectPrompt, setNewProjectPrompt] = useState<string>(SUGGESTED_COURSE_DOMAINS[0].defaultPrompt);

  // Edit Prompt State
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const [editingPrompt, setEditingPrompt] = useState<string>(activeProject?.instructionPrompt || '');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const finalDomain = isCustomDomain ? (customDomainText.trim() || 'General Management') : newProjectDomain;

    onCreateProject({
      name: newProjectName.trim(),
      domain: finalDomain,
      code: newProjectCode.trim() || `${finalDomain.slice(0, 4).toUpperCase()}-01`,
      description: newProjectDesc.trim() || `${finalDomain} focused analysis workspace.`,
      instructionPrompt: newProjectPrompt.trim(),
      supportingDocuments: [],
      exhibits: [],
      caseIds: [],
      activeCaseId: '',
    });

    setNewProjectName('');
    setNewProjectDesc('');
    setCustomDomainText('');
    setIsCustomDomain(false);
    setActiveTab('switch');
  };

  const handleSavePrompt = () => {
    if (activeProject) {
      onUpdateProjectPrompt(activeProject.id, editingPrompt);
      setActiveTab('switch');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-[#cbd5e1] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#81001d] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-ui-header text-[17px] font-bold tracking-tight">
                Cloud Projects Directory
              </h2>
              <p className="font-ui-label-mono text-[11px] text-white/80">
                Manage high-level case projects, instruction prompts & conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#e2e8f0] bg-[#f8f9fa] px-6">
          <button
            onClick={() => setActiveTab('switch')}
            className={`py-3 px-4 text-[13px] font-ui-header font-bold border-b-2 transition-all ${
              activeTab === 'switch'
                ? 'border-[#81001d] text-[#81001d]'
                : 'border-transparent text-[#565e74] hover:text-[#191c1e]'
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-[13px] font-ui-header font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-[#81001d] text-[#81001d]'
                : 'border-transparent text-[#565e74] hover:text-[#191c1e]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
          {activeProject && (
            <button
              onClick={() => {
                setEditingPrompt(activeProject.instructionPrompt);
                setActiveTab('editPrompt');
              }}
              className={`py-3 px-4 text-[13px] font-ui-header font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'editPrompt'
                  ? 'border-[#81001d] text-[#81001d]'
                  : 'border-transparent text-[#565e74] hover:text-[#191c1e]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Project Instructions</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Projects Switcher */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-ui-label-mono text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Select Active Cloud Project
                </span>
                <span className="text-[12px] text-[#565e74]">
                  Each project houses its own instructions, supporting materials & case conversations.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {projects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const casesCount = proj.caseIds ? proj.caseIds.length : 0;
                  const docsCount = proj.supportingDocuments ? proj.supportingDocuments.length : 0;
                  const exhibitsCount = proj.exhibits ? proj.exhibits.length : 0;

                  return (
                    <div
                      key={proj.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-[#81001d] bg-[#fff5f5] shadow-xs ring-1 ring-[#81001d]/20'
                          : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-ui-label-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#dae2fd] text-[#131b2e]">
                              {proj.code}
                            </span>
                            <span className="font-ui-label-mono text-[10px] px-2 py-0.5 rounded font-medium bg-[#eceef0] text-[#565e74]">
                              {proj.domain}
                            </span>
                            {isActive && (
                              <span className="font-ui-label-mono text-[10px] px-2 py-0.5 rounded font-bold bg-[#81001d] text-white flex items-center gap-1">
                                <Check className="w-3 h-3" /> ACTIVE PROJECT
                              </span>
                            )}
                          </div>
                          <h3 className="font-ui-header text-[15px] font-bold text-[#191c1e]">
                            {proj.name}
                          </h3>
                          <p className="text-[12px] text-[#594141] line-clamp-1">
                            {proj.description}
                          </p>

                          {/* Instruction Prompt Preview */}
                          <div className="mt-2 p-2 bg-white rounded border border-[#e2e8f0] text-[11px] text-[#475569] italic line-clamp-2">
                            "{proj.instructionPrompt}"
                          </div>

                          {/* Counts */}
                          <div className="flex items-center gap-4 pt-1 font-ui-label-mono text-[11px] text-[#565e74]">
                            <span>💬 {casesCount} {casesCount === 1 ? 'Case' : 'Cases'}</span>
                            <span>📎 {docsCount} Supporting {docsCount === 1 ? 'Doc' : 'Docs'}</span>
                            <span>📊 {exhibitsCount} {exhibitsCount === 1 ? 'Exhibit' : 'Exhibits'}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-end gap-2 shrink-0">
                          {!isActive ? (
                            <button
                              onClick={() => {
                                onSelectProject(proj.id);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[12px] font-ui-header font-bold shadow-xs transition-colors"
                            >
                              Switch to Project
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onStartNewCaseInProject(proj.id);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 bg-[#dae2fd] hover:bg-[#bec6e0] text-[#131b2e] rounded-lg text-[12px] font-ui-header font-bold flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#81001d]" />
                              <span>New Case in Project</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Create New Project */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="bg-[#dae2fd]/30 p-3 rounded-lg border border-[#dae2fd] text-[12px] text-[#131b2e]">
                <strong>Cloud Project Architecture:</strong> Create a focused project (e.g. "Strategy Only", "Valuation", or "Healthcare Strategy"). You can attach specific instruction prompts and project-wide supporting materials that automatically ground every case conversation started in this project.
              </div>

              <div>
                <label className="block font-ui-header text-[12px] font-bold text-[#191c1e] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitive Strategy & Moats"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-ui-header text-[12px] font-bold text-[#191c1e] mb-1">
                    Academic Domain / Course
                  </label>
                  <select
                    value={isCustomDomain ? '__custom__' : newProjectDomain}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomDomain(true);
                      } else {
                        setIsCustomDomain(false);
                        const selectedVal = e.target.value;
                        setNewProjectDomain(selectedVal);
                        const match = SUGGESTED_COURSE_DOMAINS.find((d) => d.domain === selectedVal);
                        if (match) {
                          setNewProjectCode(`${match.codePrefix}-01`);
                          setNewProjectDesc(match.description);
                          setNewProjectPrompt(match.defaultPrompt);
                        } else {
                          setNewProjectCode(`${selectedVal.slice(0, 4).toUpperCase()}-01`);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d] bg-white"
                  >
                    {SUGGESTED_COURSE_DOMAINS.map((dom) => (
                      <option key={dom.domain} value={dom.domain}>
                        {dom.domain}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Custom / Other Course...</option>
                  </select>

                  {isCustomDomain && (
                    <input
                      type="text"
                      placeholder="Type custom course / domain..."
                      value={customDomainText}
                      onChange={(e) => {
                        setCustomDomainText(e.target.value);
                        if (e.target.value.trim()) {
                          setNewProjectCode(`${e.target.value.trim().slice(0, 4).toUpperCase()}-01`);
                        }
                      }}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg border border-[#81001d] text-[12px] font-ui-body bg-[#f8f9fa] focus:outline-none"
                      autoFocus
                    />
                  )}
                </div>

                <div>
                  <label className="block font-ui-header text-[12px] font-bold text-[#191c1e] mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-label-mono focus:outline-none focus:ring-2 focus:ring-[#81001d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-ui-header text-[12px] font-bold text-[#191c1e] mb-1">
                  Project Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on pricing moats, unit cost economics, and barrier to entry."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-ui-header text-[12px] font-bold text-[#191c1e]">
                    Project Instruction Prompt (Socratic Faculty Persona) *
                  </label>
                  <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                    Guides all Socratic cold-calls in this project
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newProjectPrompt}
                  onChange={(e) => setNewProjectPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-[12px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2 text-[12px] font-ui-header font-bold text-[#565e74] hover:text-[#191c1e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[12px] font-ui-header font-bold shadow-xs transition-colors"
                >
                  Create Project & Open
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Edit Project Instruction Prompt */}
          {activeTab === 'editPrompt' && activeProject && (
            <div className="space-y-4">
              <div className="bg-[#fff5f5] p-3 rounded-lg border border-[#81001d]/20 text-[12px] text-[#81001d]">
                <strong>Customizing Project Instruction Prompt:</strong>
                <p className="mt-0.5 text-[#594141]">
                  This prompt controls the persona, rigor, and pedagogical style of the Socratic Professor across all conversations and cases in <strong>{activeProject.name}</strong>.
                </p>
              </div>

              <div>
                <label className="block font-ui-header text-[12px] font-bold text-[#191c1e] mb-1">
                  Instruction Prompt for {activeProject.name}
                </label>
                <textarea
                  rows={8}
                  value={editingPrompt}
                  onChange={(e) => setEditingPrompt(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#cbd5e1] text-[13px] font-ui-body focus:outline-none focus:ring-2 focus:ring-[#81001d] leading-relaxed"
                  placeholder="Enter custom prompt instructions for this project..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2 text-[12px] font-ui-header font-bold text-[#565e74] hover:text-[#191c1e]"
                >
                  Back to Projects
                </button>
                <button
                  onClick={handleSavePrompt}
                  className="px-5 py-2 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[12px] font-ui-header font-bold shadow-xs transition-colors"
                >
                  Save Project Instructions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

