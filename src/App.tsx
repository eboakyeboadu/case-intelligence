import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Radio,
  Paperclip,
  Table,
  CheckCircle2,
  X,
  FolderKanban,
  Plus,
  Quote,
  Sparkles,
  ExternalLink,
  Play,
  RotateCcw
} from 'lucide-react';
import { NavigationTab, ChamberTab, CloudProject, SupportingDocument } from './types.ts';
import { INITIAL_CASES, DEFAULT_FALLBACK_CASE, CaseItem, CaseExhibit } from './data/cases.ts';
import { DEFAULT_PROJECTS } from './data/projects.ts';
import { Header } from './components/Header.tsx';
import { CaseReader } from './components/CaseReader.tsx';
import { ColdCallChamber } from './components/ColdCallChamber.tsx';
import { ExhibitInspector } from './components/ExhibitInspector.tsx';
import { AudioControllerStrip } from './components/AudioControllerStrip.tsx';
import { BottomNavBar } from './components/BottomNavBar.tsx';
import { DefenseScorecardView } from './components/DefenseScorecardView.tsx';
import { CaseLibraryModal } from './components/CaseLibraryModal.tsx';
import { CaseUploadModal } from './components/CaseUploadModal.tsx';
import { CloudProjectManagerModal } from './components/CloudProjectManagerModal.tsx';
import { ProjectWorkspaceView } from './components/ProjectWorkspaceView.tsx';
import { UnifiedDocumentUploadHero } from './components/UnifiedDocumentUploadHero.tsx';
import { speechPlayer } from './utils/speech.ts';
import {
  getSmartCaseReadingUnits,
  CaseNarrativeUnit,
  getTotalCaseDuration,
  getSecondOffsetForUnit,
  getUnitIndexForSecond,
} from './utils/caseNarrative.ts';

const STORAGE_KEY_PROJECTS = 'case_cloud_projects_v7';
const STORAGE_KEY_ACTIVE_PROJECT_ID = 'case_active_project_id_v7';
const STORAGE_KEY_CASES = 'case_project_library_v7';
const STORAGE_KEY_ACTIVE_CASE_ID = 'case_active_case_id_v7';

export default function App() {
  // 1. Cloud Projects state
  const [projects, setProjects] = useState<CloudProject[]>(() => {
    try {
      localStorage.removeItem('case_cloud_projects_v6');
      localStorage.removeItem('case_active_project_id_v6');
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            supportingDocuments: Array.isArray(p.supportingDocuments)
              ? p.supportingDocuments.filter(
                  (d: any) =>
                    !d.id?.startsWith('supp-strat') &&
                    !d.id?.startsWith('supp-fin') &&
                    !d.id?.startsWith('supp-ops')
                )
              : [],
            exhibits: Array.isArray(p.exhibits)
              ? p.exhibits.filter(
                  (e: any) =>
                    !e.id?.startsWith('exhibit-strat') &&
                    !e.id?.startsWith('exhibit-fin')
                )
              : []
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage:', e);
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT_ID);
      if (savedId && projects.some((p) => p.id === savedId)) return savedId;
    } catch (e) {
      console.error('Failed to load active project ID:', e);
    }
    return projects[0]?.id || 'proj-strategy';
  });

  // 2. Cases state (clean empty by default: no mock documents unless uploaded by user)
  const [cases, setCases] = useState<CaseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load cases from localStorage:', e);
    }
    return [];
  });

  // 3. Active case ID
  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_CASE_ID);
      if (savedId) return savedId;
    } catch (e) {
      console.error('Failed to load active case ID:', e);
    }
    return '';
  });

  const fallbackProject: CloudProject = {
    id: 'default-workspace',
    name: 'Academic Workspace',
    domain: 'Management Strategy',
    code: 'MGMT-01',
    description: 'Workspace for user uploaded cases and analysis.',
    instructionPrompt:
      'You are a distinguished business school Socratic professor. Demand empirical data, unit economics, and framework citations for every assertion.',
    supportingDocuments: [],
    exhibits: [],
    caseIds: [],
    activeCaseId: '',
    createdAt: new Date().toISOString(),
  };

  // Computed active project and its cases
  const activeProject: CloudProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || fallbackProject;

  const casesInProject: CaseItem[] = cases.filter(
    (c) =>
      c.projectId === activeProjectId ||
      (!c.projectId && (activeProjectId === 'proj-strategy' || projects.length === 0))
  );

  const activeCase: CaseItem | null =
    casesInProject.find((c) => c.id === activeCaseId) ||
    casesInProject[0] ||
    cases.find((c) => c.id === activeCaseId) ||
    cases[0] ||
    null;

  // Navigation & UI tabs
  const [currentTab, setCurrentTab] = useState<NavigationTab>('reader');
  const [chamberTab, setChamberTab] = useState<ChamberTab>('simulator');
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [activeExhibitId, setActiveExhibitId] = useState<string>('');
  const [injectedDefenseSnippet, setInjectedDefenseSnippet] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentReadingIndex, setCurrentReadingIndex] = useState<number>(0);
  const [hasAudioStarted, setHasAudioStarted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [activeIntelView, setActiveIntelView] = useState<'reader' | 'terminal'>('terminal');

  const skipNextCaseResetRef = useRef<boolean>(false);
  const prevActiveCaseIdRef = useRef<string>('');

  // Computed smart reading units for the active case
  // Guaranteed sequence: Title -> Key Quote (if any) -> Section Headings & Substantive Paragraphs page by page
  // Strips all copyright, headers, and footers from voice playback
  const readingUnits: CaseNarrativeUnit[] = useMemo(() => {
    return activeCase ? getSmartCaseReadingUnits(activeCase) : [];
  }, [activeCase]);

  const totalCaseSeconds = useMemo(() => {
    return getTotalCaseDuration(readingUnits);
  }, [readingUnits]);

  const activeReadingUnit = readingUnits[currentReadingIndex] || readingUnits[0];

  // Modals
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [crossCaseToast, setCrossCaseToast] = useState<string | null>(null);

  const exhibitSectionRef = useRef<HTMLDivElement>(null);
  const terminalSectionRef = useRef<HTMLDivElement>(null);
  const readerSectionRef = useRef<HTMLDivElement>(null);

  // Reading elapsed seconds timer - perfectly synchronized with playback speed
  useEffect(() => {
    let interval: any;
    if (isPlaying && !isPaused) {
      const tickMs = Math.max(200, Math.round(1000 / playbackSpeed));
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (totalCaseSeconds > 0 && prev >= totalCaseSeconds) {
            return totalCaseSeconds;
          }
          return prev + 1;
        });
      }, tickMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, totalCaseSeconds, playbackSpeed]);

  // Sync activeExhibitId when activeCase changes
  useEffect(() => {
    if (activeCase && activeCase.exhibits && activeCase.exhibits.length > 0) {
      setActiveExhibitId(activeCase.exhibits[0].id);
    } else {
      setActiveExhibitId('');
    }

    if (skipNextCaseResetRef.current) {
      skipNextCaseResetRef.current = false;
      prevActiveCaseIdRef.current = activeCase?.id || '';
      return;
    }

    if (prevActiveCaseIdRef.current === (activeCase?.id || '')) {
      return;
    }
    prevActiveCaseIdRef.current = activeCase?.id || '';

    // Stop reading when switching cases and reset progress to zero
    speechPlayer.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setHasAudioStarted(false);
    setCurrentReadingIndex(0);
    setElapsedSeconds(0);
  }, [activeCase?.id]);

  // Persist projects and activeProjectId
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT_ID, activeProjectId);
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }, [projects, activeProjectId]);

  // Persist cases and activeCaseId
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
      if (activeCaseId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_CASE_ID, activeCaseId);
      }
    } catch (e) {
      console.error('Failed to save cases to localStorage:', e);
    }
  }, [cases, activeCaseId]);

  // Text-To-Speech Playback Engine (instant initiation, smart sequential narrative)
  const speakParagraphAtIndex = (index: number, caseObj?: CaseItem) => {
    const targetCase = caseObj || activeCase;
    if (!targetCase) return;

    speechPlayer.unlockAudio();

    const units = getSmartCaseReadingUnits(targetCase);

    if (units.length === 0) {
      setIsPlaying(false);
      setIsPaused(false);
      speechPlayer.stop();
      setCurrentReadingIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, units.length - 1));
    if (index >= units.length) {
      setIsPlaying(false);
      setIsPaused(false);
      speechPlayer.stop();
      setCurrentReadingIndex(0);
      setElapsedSeconds(0);
      return;
    }

    setCurrentReadingIndex(safeIndex);
    setElapsedSeconds(getSecondOffsetForUnit(units, safeIndex));
    setHasAudioStarted(true);
    setIsPlaying(true);
    setIsPaused(false);

    speechPlayer.speakText(
      units[safeIndex].text,
      () => {
        setHasAudioStarted(true);
        setIsPlaying(true);
        setIsPaused(false);
      },
      () => {
        // Automatically proceed to next narrative unit
        if (safeIndex + 1 < units.length) {
          speakParagraphAtIndex(safeIndex + 1, targetCase);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setElapsedSeconds(getTotalCaseDuration(units));
        }
      }
    );
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    // speechPlayer.setSpeed seamlessly updates playback speed and continues from
    // the exact word being spoken without restarting the case or paragraph
    speechPlayer.setSpeed(newSpeed);
  };

  const toggleGlobalPlay = () => {
    speechPlayer.unlockAudio();
    if (!activeCase) {
      setIsUploadOpen(true);
      return;
    }
    if (isPlaying) {
      // Deterministic pause: stops audio immediately
      speechPlayer.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else if (isPaused) {
      // Resume reading from exact current position
      setIsPaused(false);
      setIsPlaying(true);
      if (speechPlayer.isPausedActive()) {
        speechPlayer.resume();
      } else {
        speakParagraphAtIndex(currentReadingIndex);
      }
    } else {
      setHasAudioStarted(true);
      speakParagraphAtIndex(currentReadingIndex);
    }
  };

  const handleSeekSecond = (second: number) => {
    if (!activeCase || readingUnits.length === 0) return;
    const boundedSecond = Math.max(0, Math.min(second, totalCaseSeconds));
    setElapsedSeconds(boundedSecond);
    const targetUnitIdx = getUnitIndexForSecond(readingUnits, boundedSecond);
    speakParagraphAtIndex(targetUnitIdx);
  };

  const handleReadFromParagraph = (index: number) => {
    speakParagraphAtIndex(index);
  };

  const handleOpenExhibit = (exId: string) => {
    setActiveExhibitId(exId);
    if (currentTab !== 'intel' && currentTab !== 'project') {
      setCurrentTab('project');
    } else if (currentTab === 'intel') {
      if (exhibitSectionRef.current) {
        exhibitSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleChallengeHypothesis = (prompt: string) => {
    setCurrentTab('intel');
    setChamberTab('simulator');
    setActiveIntelView('terminal');
    setInjectedDefenseSnippet(prompt);
    if (terminalSectionRef.current) {
      terminalSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInsertIntoDefense = (findingText: string) => {
    setCurrentTab('intel');
    setChamberTab('simulator');
    setActiveIntelView('terminal');
    setInjectedDefenseSnippet(findingText);
    if (terminalSectionRef.current) {
      terminalSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Project Management Handlers
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const projCases = cases.filter(
      (c) => c.projectId === projectId || (!c.projectId && projectId === 'proj-strategy')
    );
    if (projCases.length > 0) {
      setActiveCaseId(projCases[0].id);
    } else {
      setActiveCaseId('');
    }
    speechPlayer.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentReadingIndex(0);
    setElapsedSeconds(0);
  };

  const handleCreateProject = (newProjectData: Omit<CloudProject, 'id' | 'createdAt'>) => {
    const newProj: CloudProject = {
      ...newProjectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
  };

  const handleUpdateProjectPrompt = (projectId: string, prompt: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, instructionPrompt: prompt } : p))
    );
  };

  const handleAddSupportingDocToProject = (doc: SupportingDocument) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, supportingDocuments: [doc, ...(p.supportingDocuments || [])] }
          : p
      )
    );
  };

  const handleDeleteSupportingDocFromProject = (docId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              supportingDocuments: (p.supportingDocuments || []).filter((d) => d.id !== docId),
            }
          : p
      )
    );
  };

  const handleStartNewCaseInProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsUploadOpen(true);
  };

  // Case Handlers
  const handleSelectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    speechPlayer.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setHasAudioStarted(false);
    setElapsedSeconds(0);
    setCurrentReadingIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSample = (sample: CaseItem) => {
    if (cases.some((c) => c.id === sample.id)) {
      setActiveCaseId(sample.id);
      setCurrentTab('reader');
      return;
    }
    handleCaseCreated({ ...sample, projectId: activeProjectId }, 'reader');
  };

  const handleCaseCreated = (
    newCase: CaseItem,
    initialAction: 'reader' | 'play' | 'intel' | 'exhibits'
  ) => {
    // Ensure case is bound to the active project
    const caseWithProject: CaseItem = {
      ...newCase,
      projectId: activeProjectId,
    };

    setCases((prev) => [caseWithProject, ...prev]);
    setActiveCaseId(caseWithProject.id);

    // Update project caseIds
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              caseIds: Array.from(new Set([...(p.caseIds || []), caseWithProject.id])),
              activeCaseId: caseWithProject.id,
            }
          : p
      )
    );

    if (initialAction === 'intel') {
      setCurrentTab('intel');
      setChamberTab('simulator');
      setActiveIntelView('terminal');
    } else if (initialAction === 'exhibits') {
      setCurrentTab('project');
    } else {
      setCurrentTab('reader');
      if (initialAction === 'play') {
        skipNextCaseResetRef.current = true;
        speakParagraphAtIndex(0, caseWithProject);
      }
    }
  };

  const handleDeleteCase = (caseId: string) => {
    if (cases.length <= 1) return;
    const remaining = cases.filter((c) => c.id !== caseId);
    setCases(remaining);
    if (activeCaseId === caseId) {
      setActiveCaseId(remaining[0].id);
    }
  };

  const handleWipeAllCases = () => {
    setCases([]);
    setActiveCaseId('');
    try {
      localStorage.removeItem(STORAGE_KEY_CASES);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CASE_ID);
    } catch (e) {
      // Ignore
    }
    speechPlayer.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentReadingIndex(0);
    setElapsedSeconds(0);
  };

  const toggleMicrophone = () => {
    setIsMicActive((prev) => !prev);
    if (currentTab !== 'intel') {
      setCurrentTab('intel');
      setChamberTab('simulator');
      setActiveIntelView('terminal');
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-ui-body flex flex-col antialiased min-h-screen">
      {/* Top Fixed Header with Cloud Project & Case Switcher */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeProject={activeProject}
        activeCase={activeCase}
        casesInProject={casesInProject}
        onSelectCase={handleSelectCase}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        totalProjectsCount={projects.length}
        isPlaying={isPlaying}
        onTogglePlay={toggleGlobalPlay}
      />

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full px-2.5 sm:px-4 pt-24 sm:pt-28 md:pt-32 pb-32 sm:pb-36 max-w-7xl mx-auto min-h-screen">
        {/* VIEW 1: READ CASE */}
        {currentTab === 'reader' && (
          <div className="w-full max-w-3xl mx-auto space-y-4">
            {!activeCase ? (
              <UnifiedDocumentUploadHero
                activeProject={activeProject}
                onCaseCreated={handleCaseCreated}
                onOpenUploadModal={() => setIsUploadOpen(true)}
                onLoadSample={handleLoadSample}
                onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
                contextMessage="Upload your case study document (PDF, Word, or text) to begin reading, synchronized audio narration, and Socratic analysis."
              />
            ) : (
              <>
                {/* Context bar */}
                <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded text-[10px] font-ui-label-mono font-bold uppercase">
                      {activeProject.code}
                    </span>
                    <span className="font-ui-header text-[12px] sm:text-[13px] font-bold text-[#191c1e] truncate max-w-xs sm:max-w-md">
                      {activeCase.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-2.5 py-1 bg-[#f2f4f6] hover:bg-[#e0e3e5] rounded-lg text-[11px] font-ui-header font-bold text-[#191c1e] flex items-center gap-1 border border-[#cbd5e1]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#81001d]" />
                      <span>Upload document (s)</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTab('intel');
                        setChamberTab('simulator');
                        setActiveIntelView('terminal');
                      }}
                      className="px-2.5 py-1 bg-[#81001d] hover:bg-[#a51c30] text-white rounded-lg text-[11px] font-ui-header font-bold flex items-center gap-1 shadow-xs"
                    >
                      <span>Cold-Call Drill &rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Editorial Case Reader Component */}
                <CaseReader
                  caseItem={activeCase}
                  onOpenExhibit={handleOpenExhibit}
                  onChallengeHypothesis={handleChallengeHypothesis}
                  focusMode={focusMode}
                  onToggleFocusMode={() => setFocusMode((prev) => !prev)}
                  isPlaying={isPlaying}
                  isPaused={isPaused}
                  onTogglePlay={toggleGlobalPlay}
                  currentReadingIndex={currentReadingIndex}
                  onReadFromParagraph={handleReadFromParagraph}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  playbackSpeed={playbackSpeed}
                  onChangePlaybackSpeed={handleSpeedChange}
                />
              </>
            )}
          </div>
        )}

        {/* VIEW 2: COLD-CALL INTELLIGENCE */}
        {currentTab === 'intel' && (
          <div className="flex flex-col w-full space-y-4">
            {!activeCase ? (
              <div className="max-w-3xl mx-auto w-full">
                <UnifiedDocumentUploadHero
                  activeProject={activeProject}
                  onCaseCreated={handleCaseCreated}
                  onOpenUploadModal={() => setIsUploadOpen(true)}
                onLoadSample={handleLoadSample}
                  onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
                  contextMessage="Upload your case study document (PDF, Word, or text) to calibrate the Socratic Amphitheater and begin interactive cold-call simulations."
                />
              </div>
            ) : (
              <>
                {/* View Switcher Controls */}
                <div className="flex flex-col space-y-2">
                  <div className="bg-[#eceef0] p-1 rounded-lg flex gap-1 shadow-xs border border-[#e0e3e5]">
                    <button
                      onClick={() => {
                        setActiveIntelView('reader');
                        if (readerSectionRef.current) {
                          readerSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md font-ui-header text-[12px] flex items-center justify-center gap-1.5 transition-all ${
                        activeIntelView === 'reader'
                          ? 'bg-white text-[#191c1e] font-bold shadow-xs'
                          : 'text-[#594141] hover:text-[#191c1e]'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-[#81001d]" />
                      <span>Case Document Reader</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveIntelView('terminal');
                        if (terminalSectionRef.current) {
                          terminalSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-md font-ui-header text-[12px] flex items-center justify-center gap-1.5 transition-all ${
                        activeIntelView === 'terminal'
                          ? 'bg-white text-[#191c1e] font-bold shadow-xs'
                          : 'text-[#594141] hover:text-[#191c1e]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#a51c30] animate-ping"></span>
                      <span>Socratic Amphitheater</span>
                      <span className="font-ui-label-mono text-[9px] px-1 py-0.5 bg-[#ffdad9] text-[#40000a] rounded font-bold">
                        LIVE
                      </span>
                    </button>
                  </div>

                  {/* Project Persona Badge */}
                  <div className="bg-white p-2.5 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-2 border border-[#e2e8f0]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#81001d]"></span>
                      <span className="font-ui-label-mono text-[11px] text-[#594141]">
                        Project: <strong className="text-[#191c1e]">{activeProject.name}</strong> • Socratic rules active
                      </span>
                    </div>
                    <button
                      onClick={() => setCurrentTab('project')}
                      className="text-[11px] font-ui-header font-bold text-[#81001d] hover:underline"
                    >
                      Edit Project Prompt &rarr;
                    </button>
                  </div>
                </div>

                {/* Split Screen on Desktop & Stack on Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Reader */}
                  <div
                    ref={readerSectionRef}
                    className={`lg:col-span-7 space-y-3 ${
                      activeIntelView === 'terminal' ? 'hidden lg:block' : 'block'
                    }`}
                  >
                    <CaseReader
                      caseItem={activeCase}
                      onOpenExhibit={handleOpenExhibit}
                      onChallengeHypothesis={handleChallengeHypothesis}
                      focusMode={focusMode}
                      onToggleFocusMode={() => setFocusMode((prev) => !prev)}
                      isPlaying={isPlaying}
                      isPaused={isPaused}
                      onTogglePlay={toggleGlobalPlay}
                      currentReadingIndex={currentReadingIndex}
                      onReadFromParagraph={handleReadFromParagraph}
                      onOpenUpload={() => setIsUploadOpen(true)}
                      playbackSpeed={playbackSpeed}
                      onChangePlaybackSpeed={handleSpeedChange}
                    />
                  </div>

                  {/* Right Column: Socratic Cold-Call */}
                  <div
                    ref={terminalSectionRef}
                    className={`lg:col-span-5 space-y-3 ${
                      activeIntelView === 'reader' ? 'hidden lg:block' : 'block'
                    }`}
                  >
                    <ColdCallChamber
                      caseItem={activeCase}
                      currentChamberTab={chamberTab}
                      onChangeChamberTab={setChamberTab}
                      onOpenExhibit={handleOpenExhibit}
                      injectedDefenseSnippet={injectedDefenseSnippet}
                      onClearInjectedSnippet={() => setInjectedDefenseSnippet('')}
                      onOpenCaseLibrary={() => setIsProjectsModalOpen(true)}
                      onOpenUpload={() => setIsUploadOpen(true)}
                      isExternalMicActive={isMicActive}
                      onToggleMicActive={setIsMicActive}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 3: PROJECT WORKSPACE & MATERIALS */}
        {(currentTab === 'project' || currentTab === 'supporting' || currentTab === 'exhibits') && (
          <div className="w-full max-w-5xl mx-auto space-y-4">
            <ProjectWorkspaceView
              project={activeProject}
              activeCase={activeCase}
              casesInProject={casesInProject}
              onSelectCase={handleSelectCase}
              onStartNewCase={() => setIsUploadOpen(true)}
              onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
              onUpdatePrompt={(newPrompt) => handleUpdateProjectPrompt(activeProject.id, newPrompt)}
              onAddSupportingDoc={handleAddSupportingDocToProject}
              onDeleteSupportingDoc={handleDeleteSupportingDocFromProject}
              onOpenCaseReader={() => setCurrentTab('reader')}
              onOpenColdCall={() => {
                setCurrentTab('intel');
                setChamberTab('simulator');
                setActiveIntelView('terminal');
              }}
            />
          </div>
        )}

        {/* VIEW 4: DEFENSE SCORECARD */}
        {currentTab === 'defense' && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            {!activeCase ? (
              <UnifiedDocumentUploadHero
                activeProject={activeProject}
                onCaseCreated={handleCaseCreated}
                onOpenUploadModal={() => setIsUploadOpen(true)}
                onLoadSample={handleLoadSample}
                onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
                contextMessage="Upload your case study document (PDF, Word, or text) to generate quantitative defense analytics, verbal telemetry, and executive scorecards."
              />
            ) : (
              <DefenseScorecardView
                caseItem={activeCase}
                metrics={activeCase?.coldCall?.defaultMetrics}
                onNavigateToChamber={() => {
                  setCurrentTab('intel');
                  setChamberTab('simulator');
                  setActiveIntelView('terminal');
                }}
                onReturnToDrill={() => {
                  setCurrentTab('intel');
                  setChamberTab('simulator');
                  setActiveIntelView('terminal');
                }}
                onOpenExhibit={handleOpenExhibit}
                onOpenReader={() => setCurrentTab('reader')}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Dynamic Bottom Audio Controller Strip */}
      <div className="fixed bottom-13 md:bottom-3 w-full z-40 px-2 sm:px-4 max-w-7xl mx-auto left-0 right-0 pointer-events-none">
        <div className="pointer-events-auto">
          <AudioControllerStrip
            onTogglePlay={toggleGlobalPlay}
            isPlaying={isPlaying}
            isPaused={isPaused}
            onOpenExhibit={handleOpenExhibit}
            activeExhibitId={activeExhibitId}
            onTriggerMic={toggleMicrophone}
            activeCase={activeCase}
            currentReadingIndex={currentReadingIndex}
            hasAudioStarted={hasAudioStarted}
            elapsedSeconds={elapsedSeconds}
            totalSeconds={totalCaseSeconds}
            totalUnitsCount={readingUnits.length}
            activeUnitLabel={activeReadingUnit?.label}
            onSeekUnit={(seekIdx) => {
              speakParagraphAtIndex(seekIdx);
            }}
            onSeekSecond={handleSeekSecond}
            playbackSpeed={playbackSpeed}
            onChangePlaybackSpeed={handleSpeedChange}
          />
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onQuickPlay={toggleGlobalPlay}
        onQuickMic={toggleMicrophone}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        isPlaying={isPlaying}
        isMicActive={isMicActive}
        activeProjectCode={activeProject.code}
        activeCaseNumber={activeCase?.caseNumber || 'No Document'}
      />

      {/* Cloud Projects Manager Drawer / Modal */}
      <CloudProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onUpdateProjectPrompt={handleUpdateProjectPrompt}
        onStartNewCaseInProject={handleStartNewCaseInProject}
      />

      {/* Case Library Drawer / Modal */}
      <CaseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        cases={cases}
        activeCaseId={activeCase?.id || ''}
        onSelectCase={handleSelectCase}
        onOpenUploadModal={() => {
          setIsLibraryOpen(false);
          setIsUploadOpen(true);
        }}
        onReferenceCaseInDefense={(snippet) => {
          handleInsertIntoDefense(snippet);
          setIsLibraryOpen(false);
        }}
        onDeleteCase={handleDeleteCase}
        onWipeAllCases={handleWipeAllCases}
      />

      {/* Case Upload Modal */}
      <CaseUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCaseCreated={handleCaseCreated}
        existingCasesCount={cases.length}
        activeProjectId={activeProjectId}
        activeProjectName={activeProject.name}
      />
    </div>
  );
}

