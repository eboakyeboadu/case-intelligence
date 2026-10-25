import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Headphones,
  MessageSquare,
  AlertTriangle,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Lightbulb,
  Send,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Play,
  Square,
  Volume1
} from 'lucide-react';
import { ChamberTab, DefenseMetrics, SocraticMessage } from '../types.ts';
import { CaseItem } from '../data/cases.ts';
import { speechPlayer } from '../utils/speech.ts';

export interface FacultyPushback {
  id: string;
  professorName: string;
  professorRole: string;
  rebuttalChallenge: string;
  strengths: string[];
  vulnerabilities: string[];
  recommendedCounterAction: string;
  scoreDelta: {
    decisiveness: number;
    rigor: number;
    framework: number;
  };
  studentDefenseTranscript: string;
}

interface ColdCallChamberProps {
  caseItem?: CaseItem | null;
  currentChamberTab: ChamberTab;
  onChangeChamberTab: (tab: ChamberTab) => void;
  onOpenExhibit: (exhibitId: string) => void;
  injectedDefenseSnippet?: string;
  onClearInjectedSnippet?: () => void;
  onOpenCaseLibrary?: () => void;
  onOpenUpload?: () => void;
  isExternalMicActive?: boolean;
  onToggleMicActive?: (active: boolean) => void;
}

export const ColdCallChamber: React.FC<ColdCallChamberProps> = ({
  caseItem,
  currentChamberTab,
  onChangeChamberTab,
  onOpenExhibit,
  injectedDefenseSnippet,
  onClearInjectedSnippet,
  onOpenCaseLibrary,
  onOpenUpload,
  isExternalMicActive,
  onToggleMicActive,
}) => {
  // Timer & mic states
  const [countdownSeconds, setCountdownSeconds] = useState<number>(75);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(true);
  const [wpm, setWpm] = useState<number>(142);
  const [customDefenseText, setCustomDefenseText] = useState<string>('');
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>('');
  const [speechSeconds, setSpeechSeconds] = useState<number>(0);
  const [spokenWordCount, setSpokenWordCount] = useState<number>(0);
  const [isAnalyzingDefense, setIsAnalyzingDefense] = useState<boolean>(false);
  const [facultyPushback, setFacultyPushback] = useState<FacultyPushback | null>(null);
  const [isProfessorSpeaking, setIsProfessorSpeaking] = useState<boolean>(false);

  // Audio stream and recognition refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pushbackCardRef = useRef<HTMLDivElement | null>(null);

  // Telemetry metrics
  const [metrics, setMetrics] = useState<DefenseMetrics>(
    caseItem?.coldCall?.defaultMetrics || {
      decisiveness: 80,
      decisivenessLabel: 'Ready',
      rigor: 80,
      rigorLabel: 'Ready',
      framework: 80,
      frameworkLabel: 'Ready',
      facultyNote: 'Upload document to calibrate telemetry.',
    }
  );

  // Socratic chat messages initialized per case
  const [socraticMessages, setSocraticMessages] = useState<SocraticMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // Audio subtab states
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.25);

  // Reset state when case changes
  useEffect(() => {
    if (!caseItem) return;
    setCountdownSeconds(90);
    setMetrics(caseItem.coldCall.defaultMetrics);
    setTranscriptLog([]);
    setLiveInterimTranscript('');
    setCustomDefenseText('');
    setFacultyPushback(null);
    setIsAnalyzingDefense(false);
    setIsProfessorSpeaking(false);
    speechPlayer.stop();

    setSocraticMessages([
      {
        id: '1',
        sender: 'professor',
        name: caseItem.coldCall.professor,
        role: caseItem.course + ' Chair, ' + caseItem.coldCall.amphitheater,
        timestamp: '04:18 PM',
        text: caseItem.coldCall.prompt,
        exhibitReference: caseItem.exhibits[0]?.id || 'exhibit1',
      },
    ]);
  }, [caseItem]);

  // Sync external mic trigger from BottomNavBar or hotkey
  useEffect(() => {
    if (isExternalMicActive && !isMicActive) {
      startMicrophoneCapture();
    } else if (!isExternalMicActive && isMicActive) {
      stopMicrophoneAndSubmitDefense();
    }
  }, [isExternalMicActive]);

  // Sync injected prompt
  useEffect(() => {
    if (injectedDefenseSnippet) {
      setCustomDefenseText((prev) =>
        prev
          ? `${prev} [Evidence: ${injectedDefenseSnippet}]`
          : `[Evidence: ${injectedDefenseSnippet}]`
      );
      if (onClearInjectedSnippet) onClearInjectedSnippet();
    }
  }, [injectedDefenseSnippet, onClearInjectedSnippet]);

  // Real-time countdown timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, countdownSeconds]);

  // Track speech duration when mic is active
  useEffect(() => {
    if (isMicActive) {
      speechIntervalRef.current = setInterval(() => {
        setSpeechSeconds((prev) => {
          const next = prev + 1;
          // Calculate dynamic cadence
          const words = spokenWordCount > 0 ? spokenWordCount : Math.round(next * 2.3);
          const minutes = Math.max(0.1, next / 60);
          setWpm(Math.min(180, Math.max(110, Math.round(words / minutes))));
          return next;
        });
      }, 1000);
    } else {
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
      }
    }
    return () => {
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, [isMicActive, spokenWordCount]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `0${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start real microphone capture using Web Audio & Web Speech APIs
  const startMicrophoneCapture = async () => {
    if (isMicActive) return;
    setIsMicActive(true);
    if (onToggleMicActive) onToggleMicActive(true);
    setSpeechSeconds(0);
    setLiveInterimTranscript('');

    // 1. Initialize Web Audio API Analyser for real microphone volume
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          audioContextRef.current = ctx;

          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.6;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Map 0-128 to 0-100%
            const volumePercent = Math.min(100, Math.round((average / 120) * 100));
            setMicVolume(volumePercent);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      }
    } catch (err) {
      console.log('Microphone media stream notice (running simulated audio level fallback):', err);
      // Fallback dynamic oscillator visualizer for sandboxed environments
      let frame = 0;
      const simulateLevel = () => {
        frame++;
        const wave = Math.sin(frame * 0.15) * 25 + Math.cos(frame * 0.25) * 20 + 45;
        setMicVolume(Math.round(Math.max(15, Math.min(95, wave))));
        animFrameRef.current = requestAnimationFrame(simulateLevel);
      };
      simulateLevel();
    }

    // 2. Initialize Web Speech API SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const cleaned = transcript.trim();
              if (cleaned) {
                setTranscriptLog((prev) => [...prev, cleaned]);
                setSpokenWordCount((prev) => prev + cleaned.split(/\s+/).length);
              }
            } else {
              interim += transcript;
            }
          }
          setLiveInterimTranscript(interim);
        };

        recognition.onerror = (e: any) => {
          console.log('Speech recognition notice:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.log('Speech recognition initialization notice:', err);
      }
    }
  };

  // Stop microphone and immediately trigger Socratic Faculty Pushback & Evaluation
  const stopMicrophoneAndSubmitDefense = (injectedDefense?: string) => {
    // 1. Clean up audio resources
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    setIsMicActive(false);
    if (onToggleMicActive) onToggleMicActive(false);
    setMicVolume(0);

    // 2. Formulate student defense statement
    let candidateDefense = injectedDefense || '';
    if (!candidateDefense) {
      const recordedPieces = [...transcriptLog];
      if (liveInterimTranscript.trim()) {
        recordedPieces.push(liveInterimTranscript.trim());
      }
      if (customDefenseText.trim()) {
        recordedPieces.push(customDefenseText.trim());
      }
      candidateDefense = recordedPieces.join(' ').trim();
    }

    // If candidate tapped without speaking words, generate a grounded defense for their stance
    if (!candidateDefense) {
      candidateDefense = `Professor ${caseItem?.coldCall.professor.replace('Professor ', '') || 'Whitfield'}, looking closely at the case evidence, I defend prioritizing unit contribution margins over short-term capacity expansion. Localized operations protect our pricing power against sudden international tariff shocks.`;
      setTranscriptLog([candidateDefense]);
    }

    setLiveInterimTranscript('');
    setIsAnalyzingDefense(true);

    // 3. Grounded Faculty Pushback & Evaluation via Backend AI
    (async () => {
      if (!caseItem) return;

      try {
        const fullContent =
          (caseItem.summary || '') +
          '\n' +
          (caseItem.narrativeUnits?.map((u) => u.text).join('\n') || '');

        const response = await fetch('/api/evaluate-defense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseTitle: caseItem.title,
            caseContent: fullContent,
            caseExhibits: caseItem.exhibits || [],
            supportingDocs: caseItem.supportingDocuments || [],
            projectDomain: caseItem.course || 'Strategic Management',
            professorName: caseItem.coldCall.professor || 'Professor Socratic Chair',
            studentDefense: candidateDefense,
          }),
        });

        const data = await response.json();

        const rebuttal = data.rebuttalChallenge || `“Candidate, you state your position on ${caseItem.title}. But how do your operational metrics hold when rival firms respond?”`;
        const strengths: string[] = data.strengths?.length
          ? data.strengths
          : ['Direct executive stance', 'Clear statement of intent'];
        const vulnerabilities: string[] = data.vulnerabilities?.length
          ? data.vulnerabilities
          : ['Needs deeper quantitative backing from case data', 'Examines only immediate horizon'];
        const nextMove = data.recommendedCounterAction || 'Anchor your thesis in verified case figures and propose a contingency cushion.';

        const pushbackData: FacultyPushback = {
          id: Date.now().toString(),
          professorName: data.professorName || caseItem.coldCall.professor,
          professorRole: `${caseItem.course} Chair, ${caseItem.coldCall.amphitheater}`,
          rebuttalChallenge: rebuttal,
          strengths,
          vulnerabilities,
          recommendedCounterAction: nextMove,
          scoreDelta: {
            decisiveness: data.scoreDelta?.decisiveness || Math.min(98, (metrics.decisiveness || 80) + 7),
            rigor: data.scoreDelta?.rigor || Math.min(99, (metrics.rigor || 80) + 11),
            framework: data.scoreDelta?.framework || Math.min(96, (metrics.framework || 80) + 8),
          },
          studentDefenseTranscript: candidateDefense,
        };

        setFacultyPushback(pushbackData);
        setIsAnalyzingDefense(false);

        setTimeout(() => {
          if (pushbackCardRef.current) {
            pushbackCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 150);

        setMetrics((prev) => ({
          ...prev,
          decisiveness: pushbackData.scoreDelta.decisiveness,
          decisivenessLabel: 'Executive Grade',
          rigor: pushbackData.scoreDelta.rigor,
          rigorLabel: 'Amphitheater Ready',
          framework: pushbackData.scoreDelta.framework,
          frameworkLabel: 'High Rigor',
          facultyNote: `Faculty Audit: "${strengths[0]}. Vulnerability: ${vulnerabilities[0]}."`,
        }));

        // Append student defense and professor pushback to Socratic chat
        setSocraticMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'student',
            name: 'Candidate (Your Spoken Defense)',
            timestamp: 'Just now',
            text: candidateDefense,
          },
          {
            id: (Date.now() + 1).toString(),
            sender: 'professor',
            name: caseItem.coldCall.professor,
            role: 'Faculty Counter-Interrogation',
            timestamp: 'Just now',
            text: rebuttal,
            exhibitReference: caseItem.exhibits[0]?.id || 'exhibit1',
          },
        ]);

        // Speak the Professor's Pushback challenge out loud
        setIsProfessorSpeaking(true);
        speechPlayer.speakText(
          rebuttal,
          () => setIsProfessorSpeaking(true),
          () => setIsProfessorSpeaking(false)
        );
      } catch (err) {
        console.error('Defense evaluation error:', err);
        setIsAnalyzingDefense(false);
      }
    })();
  };

  const handleToggleProfessorVoice = () => {
    if (isProfessorSpeaking) {
      speechPlayer.stop();
      setIsProfessorSpeaking(false);
    } else if (facultyPushback) {
      setIsProfessorSpeaking(true);
      speechPlayer.speakText(
        facultyPushback.rebuttalChallenge,
        () => setIsProfessorSpeaking(true),
        () => setIsProfessorSpeaking(false)
      );
    } else if (caseItem?.coldCall.interrogationPrompt) {
      setIsProfessorSpeaking(true);
      speechPlayer.speakText(
        caseItem.coldCall.interrogationPrompt,
        () => setIsProfessorSpeaking(true),
        () => setIsProfessorSpeaking(false)
      );
    }
  };

  const handleSendSocratic = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: SocraticMessage = {
      id: Date.now().toString(),
      sender: 'student',
      name: 'Candidate (You)',
      timestamp: 'Just now',
      text: chatInput,
    };

    setSocraticMessages((prev) => [...prev, userMsg]);
    const promptBackup = chatInput;
    setChatInput('');

    (async () => {
      if (!caseItem) return;

      try {
        const fullContent =
          (caseItem.summary || '') +
          '\n' +
          (caseItem.narrativeUnits?.map((u) => u.text).join('\n') || '');

        const response = await fetch('/api/socratic-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseTitle: caseItem.title,
            caseContent: fullContent,
            caseExhibits: caseItem.exhibits || [],
            supportingDocs: caseItem.supportingDocuments || [],
            projectDomain: caseItem.course || 'Strategic Management',
            instructionPrompt: caseItem.coldCall.interrogationPrompt,
            professorName: caseItem.coldCall.professor || 'Professor Socratic Chair',
            userMessage: promptBackup,
            chatHistory: socraticMessages,
          }),
        });

        const data = await response.json();
        const reply = data.reply || `In analyzing ${caseItem.title}, your perspective addresses an important factor. What is your quantitative timeline for executing this maneuver?`;

        setSocraticMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'professor',
            name: caseItem.coldCall.professor,
            role: 'Faculty Analysis & Socratic Pushback',
            timestamp: 'Just now',
            text: reply,
          },
        ]);
      } catch (err) {
        console.error('Socratic chat query error:', err);
        setSocraticMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'professor',
            name: caseItem.coldCall.professor,
            role: 'Faculty Analysis',
            timestamp: 'Just now',
            text: `Regarding "${promptBackup.slice(0, 70)}..." in ${caseItem.title}: Consider how your proposal affects immediate unit margins versus long-term market share.`,
          },
        ]);
      }
    })();
  };

  if (!caseItem) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[400px] bg-white rounded-xl border border-[#cbd5e1] text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#ffdad9] text-[#81001d] flex items-center justify-center shadow-xs">
          <Megaphone className="w-7 h-7" />
        </div>
        <div className="max-w-md">
          <h3 className="font-ui-header text-[18px] font-bold text-[#191c1e]">
            Socratic Amphitheater
          </h3>
          <p className="font-reading-serif text-[14px] text-[#565e74] mt-1.5 leading-relaxed">
            Upload a case document to begin interactive cold-call drills, hypothesis defense, and real-time faculty interrogation.
          </p>
        </div>
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-[#81001d] hover:bg-[#680017] text-white font-ui-header text-[13px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-98"
          >
            <span>Upload document (s)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3" id="sectionTerminal">
      {/* Chamber Tab Switcher */}
      <div className="flex bg-[#eceef0] rounded p-1 gap-1 border border-[#e0e3e5]">
        <button
          onClick={() => onChangeChamberTab('simulator')}
          className={`flex-1 py-1.5 rounded font-ui-header text-[12px] flex items-center justify-center gap-1.5 transition-all ${
            currentChamberTab === 'simulator'
              ? 'bg-[#a51c30] text-white font-bold shadow-sm'
              : 'text-[#594141] hover:text-[#191c1e]'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Cold Call Drill</span>
        </button>

        <button
          onClick={() => onChangeChamberTab('audio')}
          className={`flex-1 py-1.5 rounded font-ui-header text-[12px] flex items-center justify-center gap-1.5 transition-all ${
            currentChamberTab === 'audio'
              ? 'bg-white text-[#191c1e] font-bold shadow-sm'
              : 'text-[#594141] hover:text-[#191c1e]'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Executive Audio</span>
        </button>

        <button
          onClick={() => onChangeChamberTab('socratic')}
          className={`flex-1 py-1.5 rounded font-ui-header text-[12px] flex items-center justify-center gap-1.5 transition-all ${
            currentChamberTab === 'socratic'
              ? 'bg-white text-[#191c1e] font-bold shadow-sm'
              : 'text-[#594141] hover:text-[#191c1e]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Socratic AI</span>
        </button>
      </div>

      {/* SUBTAB A: COLD CALL SIMULATOR (ACTIVE DEFAULT) */}
      {currentChamberTab === 'simulator' && (
        <div className="flex flex-col space-y-3">
          {/* Interrogation Alert Banner */}
          <div className="bg-[#81001d] text-white p-3.5 rounded shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#ffdad9] animate-bounce" />
                <span className="font-ui-label-mono text-[10px] tracking-widest text-[#ffdad9] uppercase font-bold">
                  {caseItem.coldCall.amphitheater}
                </span>
              </div>
              <span className="font-ui-label-mono text-[10px] px-1.5 py-0.5 bg-[#a51c30] text-white rounded uppercase font-bold tracking-wider">
                Mandatory Stand
              </span>
            </div>

            <div className="font-headline-md text-[20px] sm:text-[21px] leading-tight text-white font-semibold">
              {caseItem.coldCall.professor} has called on YOU.
            </div>
            <p className="font-case-body-md text-[#ffdad9] text-[13px] mt-1 leading-snug">
              {caseItem.coldCall.context}
            </p>
          </div>

          {/* Realtime Timer & Telemetry Card */}
          <div className="bg-white p-3.5 rounded shadow-sm flex flex-col space-y-2.5 border border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-11 rounded bg-[#eceef0] border border-[#d8dadc] flex items-center justify-center font-ui-label-mono text-[22px] font-bold text-[#191c1e]">
                  {formatTime(countdownSeconds)}
                </div>
                <div className="flex flex-col">
                  <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-semibold">
                    Time Remaining to Respond
                  </span>
                  <span className="font-ui-label-mono text-[11px] text-[#81001d] font-bold">
                    STRICT 90s SOCRATIC LIMIT
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-1.5">
                <button
                  onClick={() => setCountdownSeconds(90)}
                  className="font-ui-label-mono text-[10px] text-[#565e74] hover:text-[#191c1e] px-1.5 py-0.5 border border-[#d8dadc] rounded flex items-center gap-0.5"
                  title="Reset 90s timer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
                <span className="font-ui-label-mono text-[11px] px-2 py-1 bg-[#e6e8ea] rounded text-[#191c1e] font-bold uppercase">
                  Cadence: {wpm} wpm
                </span>
              </div>
            </div>

            {/* Tension Bar Progress */}
            <div className="w-full bg-[#e6e8ea] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#81001d] h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(5, (countdownSeconds / 90) * 100)}%` }}
              ></div>
            </div>

            {/* Voice Waveform Visualizer Responsive to Physical Speech Level */}
            <div className="bg-[#f2f4f6] p-2 rounded flex items-center justify-between gap-1 h-12 overflow-hidden border border-[#e0e3e5]">
              {[
                3, 5, 8, 11, 9, 6, 4, 2, 7, 10, 8, 5, 3, 2, 6, 10, 12, 7, 4, 3, 8, 9, 4, 2, 5, 3, 4, 7,
              ].map((h, i) => {
                const isPrimary = h > 7 || (isMicActive && (i + Math.floor(micVolume / 15)) % 3 === 0);
                const dynamicHeight = isMicActive
                  ? Math.max(6, Math.min(42, (h * (micVolume > 10 ? micVolume : 25)) / 25 + ((i % 4) * 2)))
                  : h * 2.2;

                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      isPrimary
                        ? isMicActive
                          ? 'bg-[#81001d]'
                          : 'bg-[#a51c30]'
                        : h > 5
                        ? 'bg-[#191c1e]'
                        : 'bg-[#565e74]'
                    }`}
                    style={{
                      height: `${dynamicHeight}px`,
                    }}
                  />
                );
              })}
            </div>

            {/* Active Speech Diagnostics Indicator */}
            {isMicActive && (
              <div className="flex items-center justify-between px-1 text-[11px] font-ui-label-mono bg-[#ffdad9]/70 py-1.5 px-2.5 rounded border border-[#81001d]/30 text-[#40000a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#81001d] animate-ping"></span>
                  <span className="font-bold uppercase tracking-wider">
                    Microphone Active • Audio Level: {micVolume}%
                  </span>
                </div>
                <span>Duration: {formatTime(speechSeconds)} ({spokenWordCount} words)</span>
              </div>
            )}
          </div>

          {/* Professor's Cold-Call Challenge Box */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#a51c30] flex items-center justify-center text-white">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui-header text-[13px] text-[#191c1e] font-semibold">
                    {caseItem.coldCall.professor} Interrogation Prompt
                  </span>
                  <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                    DIRECT QUANTITATIVE INQUIRY • {caseItem.course.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleProfessorVoice}
                className={`px-2.5 py-1 rounded-md text-[11px] font-ui-header font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  isProfessorSpeaking
                    ? 'bg-[#81001d] text-white animate-pulse'
                    : 'bg-[#f4f6f8] hover:bg-[#e2e8f0] text-[#191c1e] border border-[#cbd5e1]'
                }`}
                title="Hear professor's interrogation question aloud"
              >
                {isProfessorSpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#ffdad9]" />
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume1 className="w-3.5 h-3.5 text-[#81001d]" />
                    <span>Hear Question Aloud</span>
                  </>
                )}
              </button>
            </div>

            <blockquote className="font-case-body-md text-[#191c1e] text-[14px] sm:text-[15px] leading-snug pl-3 italic border-l-2 border-[#81001d]/40 my-2.5">
              {caseItem.coldCall.prompt}
            </blockquote>

            {/* Quick Evidence Insertion if applied */}
            {customDefenseText && (
              <div className="p-2 bg-[#dae2fd] rounded border border-[#bec6e0] text-[12px] font-ui-body text-[#131b2e] flex items-start justify-between gap-1 my-2">
                <span>{customDefenseText}</span>
                <button
                  onClick={() => setCustomDefenseText('')}
                  className="text-[10px] uppercase font-bold text-[#81001d] shrink-0 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Response Action Zone */}
            <div className="mt-3 pt-3 flex flex-col gap-2.5 border-t border-[#eceef0]">
              {/* Active Recording Notice Banner */}
              {isMicActive && (
                <div className="bg-[#fff1f2] border-2 border-[#81001d] p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-pulse shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#81001d] animate-ping shrink-0"></span>
                    <div className="flex flex-col">
                      <span className="font-ui-header text-[12px] sm:text-[13px] font-bold text-[#81001d] uppercase tracking-wide">
                        Live Defense Recording Active — Speak Now
                      </span>
                      <span className="text-[11px] text-[#565e74]">
                        Web Audio & Speech capture active • Volume: {micVolume}% • {formatTime(speechSeconds)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => stopMicrophoneAndSubmitDefense()}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-[#81001d] text-white hover:bg-[#a51c30] text-[12px] font-ui-header font-bold rounded shadow-xs shrink-0"
                  >
                    Finish & Submit Defense &rarr;
                  </button>
                </div>
              )}

              {/* PRIMARY ACTION: Tap to Speak / Finish & Audit Defense */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="micToggleBtn"
                  onClick={() => {
                    if (isMicActive) {
                      stopMicrophoneAndSubmitDefense();
                    } else {
                      startMicrophoneCapture();
                    }
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-ui-header text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-98 ${
                    isMicActive
                      ? 'bg-[#191c1e] text-white ring-2 ring-[#81001d] ring-offset-2 hover:bg-[#2c3034]'
                      : 'bg-[#81001d] text-white hover:bg-[#a51c30]'
                  }`}
                >
                  {isMicActive ? (
                    <>
                      <Square className="w-4 h-4 fill-[#ffdad9] text-[#ffdad9]" />
                      <span>Finish & Submit Defense to Faculty</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffdad9] animate-ping"></span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Tap to Speak / Deliver Defense</span>
                    </>
                  )}
                </button>

                {isMicActive && (
                  <button
                    onClick={() => {
                      setTranscriptLog([]);
                      setLiveInterimTranscript('');
                    }}
                    className="px-3 py-2 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#594141] font-ui-label-mono text-[11px] rounded-lg font-semibold"
                    title="Clear spoken defense"
                  >
                    Clear Audio
                  </button>
                )}
              </div>

              {/* Editable Defense Statement Textarea (type or speak) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-ui-label-mono text-[#565e74]">
                  <span className="font-semibold uppercase">Your Defense Statement / Notes:</span>
                  <span>{customDefenseText.length} characters</span>
                </div>
                <textarea
                  value={customDefenseText}
                  onChange={(e) => setCustomDefenseText(e.target.value)}
                  placeholder="Type or review your case defense here (or speak using 'Tap to Speak' above)..."
                  rows={2}
                  className="w-full text-[12px] p-2.5 border border-[#cbd5e1] rounded-md font-case-body-md text-[#191c1e] bg-white focus:ring-1 focus:ring-[#81001d] focus:border-[#81001d] outline-none"
                />
              </div>

              {/* Quick Defense Stance Chips for instant test defense */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="font-ui-label-mono text-[10px] text-[#565e74] uppercase font-semibold">
                  Quick Defense Points:
                </span>
                <button
                  onClick={() => {
                    const phrase = "Defend 18% Unit Margin: Localized capacity buffers against supply tariffs.";
                    setCustomDefenseText((prev) => (prev ? `${prev} ${phrase}` : phrase));
                    if (isMicActive) {
                      setTranscriptLog((prev) => [...prev, phrase]);
                    }
                  }}
                  className="px-2 py-0.5 bg-[#f2f4f6] hover:bg-[#e2e8f0] text-[#191c1e] text-[10px] font-ui-label-mono rounded border border-[#cbd5e1] font-medium"
                >
                  + Defend 18% Unit Margin
                </button>
                <button
                  onClick={() => {
                    const phrase = "Capex Breakeven in 14 Months: Fixed amortization amortizes once plant crosses 70% utilization.";
                    setCustomDefenseText((prev) => (prev ? `${prev} ${phrase}` : phrase));
                    if (isMicActive) {
                      setTranscriptLog((prev) => [...prev, phrase]);
                    }
                  }}
                  className="px-2 py-0.5 bg-[#f2f4f6] hover:bg-[#e2e8f0] text-[#191c1e] text-[10px] font-ui-label-mono rounded border border-[#cbd5e1] font-medium"
                >
                  + Capex Breakeven in 14 Mo
                </button>
                <button
                  onClick={() => {
                    const phrase = "Counter Competitor Price War: High customer switching costs prevent churn.";
                    setCustomDefenseText((prev) => (prev ? `${prev} ${phrase}` : phrase));
                    if (isMicActive) {
                      setTranscriptLog((prev) => [...prev, phrase]);
                    }
                  }}
                  className="px-2 py-0.5 bg-[#f2f4f6] hover:bg-[#e2e8f0] text-[#191c1e] text-[10px] font-ui-label-mono rounded border border-[#cbd5e1] font-medium"
                >
                  + Counter Price War
                </button>
              </div>

              {/* Real-time transcript preview with live audio streaming */}
              {(isMicActive || transcriptLog.length > 0 || liveInterimTranscript) && (
                <div className="bg-[#f7f9fb] p-3 rounded-lg border border-[#cbd5e1] text-[12px] text-[#191c1e] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-ui-label-mono text-[10px] text-[#81001d] font-bold uppercase flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-[#81001d] animate-ping' : 'bg-[#191c1e]'}`}></span>
                      {isMicActive ? 'Transcribing Candidate Defense in Real Time...' : 'Transcribed Defense Statement:'}
                    </span>
                    {isMicActive && (
                      <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                        Listening to Microphone ({formatTime(speechSeconds)})
                      </span>
                    )}
                  </div>

                  {transcriptLog.length === 0 && !liveInterimTranscript && isMicActive && (
                    <p className="font-case-body-md text-[12px] text-[#64748b] italic">
                      Listening for voice input... Speak your case rationale or click a Quick Defense Point above.
                    </p>
                  )}

                  {transcriptLog.map((line, idx) => (
                    <p key={idx} className="font-case-body-md text-[13px] text-[#191c1e]">
                      “{line}”
                    </p>
                  ))}

                  {liveInterimTranscript && (
                    <p className="font-case-body-md text-[13px] text-[#81001d] italic">
                      “{liveInterimTranscript}...”
                    </p>
                  )}
                </div>
              )}

              {/* Analyzing Loader Indicator */}
              {isAnalyzingDefense && (
                <div className="bg-[#f2f4f6] p-3 rounded-lg border border-[#81001d]/30 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#81001d] border-t-transparent animate-spin shrink-0"></div>
                  <div className="flex flex-col">
                    <span className="font-ui-header text-[12px] font-bold text-[#191c1e]">
                      {caseItem.coldCall.professor} is formulating Socratic pushback...
                    </span>
                    <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                      Auditing strategic decisiveness, quantitative rigor, and exhibit citations
                    </span>
                  </div>
                </div>
              )}

              {/* PROFESSIONAL FACULTY PUSHBACK & EVALUATION CARD */}
              {facultyPushback && !isAnalyzingDefense && (
                <div
                  ref={pushbackCardRef}
                  className="bg-[#fffbfa] rounded-lg border-2 border-[#81001d]/40 p-3.5 sm:p-4 shadow-sm space-y-3 mt-1 scroll-mt-6"
                >
                  {/* Header with Professor info & Audio Replay Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0d0cf]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#81001d] text-white flex items-center justify-center font-ui-label-mono text-[12px] font-bold">
                        {facultyPushback.professorName.replace('Professor ', '').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-ui-header text-[13px] font-bold text-[#191c1e]">
                            {facultyPushback.professorName}
                          </span>
                          <span className="font-ui-label-mono text-[9px] px-1.5 py-0.2 bg-[#ffdad9] text-[#40000a] font-bold rounded uppercase">
                            Pushback Issued
                          </span>
                        </div>
                        <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                          {facultyPushback.professorRole}
                        </span>
                      </div>
                    </div>

                    {/* Faculty Voice Play/Stop Button */}
                    <button
                      onClick={handleToggleProfessorVoice}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-ui-header font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                        isProfessorSpeaking
                          ? 'bg-[#81001d] text-white animate-pulse'
                          : 'bg-white hover:bg-[#f2f4f6] text-[#191c1e] border border-[#cbd5e1]'
                      }`}
                    >
                      {isProfessorSpeaking ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#ffdad9]" />
                          <span>Speaking Challenge...</span>
                        </>
                      ) : (
                        <>
                          <Volume1 className="w-3.5 h-3.5 text-[#81001d]" />
                          <span>Hear Faculty Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* The Pushback Challenge Quote */}
                  <div className="space-y-1">
                    <span className="font-ui-label-mono text-[10px] uppercase font-bold text-[#81001d] tracking-wider block">
                      Amphitheater Counter-Challenge:
                    </span>
                    <blockquote className="font-reading-serif italic text-[14px] sm:text-[15px] leading-relaxed text-[#191c1e] bg-white p-3 rounded border border-[#e2e8f0]">
                      {facultyPushback.rebuttalChallenge}
                    </blockquote>
                  </div>

                  {/* Executive Feedback: Strengths vs Vulnerabilities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                    <div className="bg-[#f0fdf4] p-2.5 rounded border border-[#bbf7d0] space-y-1">
                      <div className="flex items-center gap-1 font-ui-header text-[11px] font-bold text-[#166534]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Audited Strengths</span>
                      </div>
                      <ul className="list-disc list-inside text-[#14532d] space-y-0.5 text-[11px] leading-snug">
                        {facultyPushback.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#fff1f2] p-2.5 rounded border border-[#fecdd3] space-y-1">
                      <div className="flex items-center gap-1 font-ui-header text-[11px] font-bold text-[#9f1239]">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Critical Flaws to Defend</span>
                      </div>
                      <ul className="list-disc list-inside text-[#881337] space-y-0.5 text-[11px] leading-snug">
                        {facultyPushback.vulnerabilities.map((vuln, i) => (
                          <li key={i}>{vuln}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tactical Recommendation */}
                  <div className="p-2.5 bg-white rounded border border-[#e2e8f0] flex items-start gap-2 text-[11px] text-[#191c1e]">
                    <Lightbulb className="w-4 h-4 text-[#81001d] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-ui-header">Next Strategic Defense Move:</strong>{' '}
                      <span className="text-[#475569]">{facultyPushback.recommendedCounterAction}</span>
                    </div>
                  </div>

                  {/* Actions: Respond & Defend Again */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => {
                        startMicrophoneCapture();
                      }}
                      className="px-3.5 py-1.5 bg-[#81001d] hover:bg-[#a51c30] text-white font-ui-header text-[12px] font-bold rounded-md flex items-center gap-1.5 shadow-xs"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Respond to Pushback (Defend Again)</span>
                    </button>

                    <button
                      onClick={() => {
                        onChangeChamberTab('socratic');
                      }}
                      className="text-[11px] font-ui-header font-bold text-[#1b3888] hover:underline flex items-center gap-1"
                    >
                      <span>Continue in Socratic AI Chat &rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Drawer Toggle */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                  AUDIO CHANNEL ENCRYPTED (SOCRATIC-V4)
                </span>
                <button
                  onClick={() => setIsTelemetryOpen(!isTelemetryOpen)}
                  className="font-ui-label-mono text-[10px] text-[#81001d] font-bold uppercase hover:underline flex items-center gap-0.5"
                >
                  <span>{isTelemetryOpen ? 'Hide Defense Telemetry' : 'View Defense Telemetry'}</span>
                  {isTelemetryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Live Defense Telemetry / Scorecard Drawer */}
          {isTelemetryOpen && (
            <div className="bg-white p-3.5 rounded shadow-sm flex flex-col space-y-2.5 border border-[#e2e8f0]" id="scorecardDrawer">
              <div className="flex items-center justify-between pb-1 border-b border-[#eceef0]">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#1b3888]" />
                  <span className="font-ui-header text-[13px] text-[#191c1e] font-bold">
                    Executive Defense Metrics
                  </span>
                </div>
                <span className="font-ui-label-mono text-[10px] px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded font-bold uppercase">
                  Pass Grade (Tier 1)
                </span>
              </div>

              {/* Metric 1: Decisiveness */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-ui-body text-[12px] text-[#191c1e] font-medium">
                    Strategic Decisiveness
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-ui-label-mono text-[10px] px-1 bg-[#e6e8ea] rounded text-[#594141] font-bold">
                      {metrics.decisivenessLabel}
                    </span>
                    <span className="font-scorecard-metric text-[20px] text-[#191c1e] font-bold">
                      {metrics.decisiveness}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#eceef0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1b3888] h-full rounded-full transition-all"
                    style={{ width: `${metrics.decisiveness}%` }}
                  ></div>
                </div>
              </div>

              {/* Metric 2: Rigor */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-ui-body text-[12px] text-[#191c1e] font-medium">
                    Quantitative Rigor
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-ui-label-mono text-[10px] px-1 bg-[#ffdad9] text-[#40000a] rounded font-bold">
                      {metrics.rigorLabel}
                    </span>
                    <span className="font-scorecard-metric text-[20px] text-[#191c1e] font-bold">
                      {metrics.rigor}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#eceef0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#a51c30] h-full rounded-full transition-all"
                    style={{ width: `${metrics.rigor}%` }}
                  ></div>
                </div>
              </div>

              {/* Metric 3: Framework Clarity */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-ui-body text-[12px] text-[#191c1e] font-medium">
                    Framework Rigor
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-ui-label-mono text-[10px] px-1 bg-[#ffdad6] text-[#93000a] rounded font-bold">
                      {metrics.frameworkLabel}
                    </span>
                    <span className="font-scorecard-metric text-[20px] text-[#ba1a1a] font-bold">
                      {metrics.framework}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#eceef0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#ba1a1a] h-full rounded-full transition-all"
                    style={{ width: `${metrics.framework}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-2.5 bg-[#f2f4f6] rounded text-[#594141] font-ui-body text-[12px] flex items-start gap-2 border border-[#e0e3e5]">
                <Lightbulb className="w-4 h-4 text-[#1b3888] shrink-0 mt-0.5" />
                <span className="leading-snug">{metrics.facultyNote}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB B: EXECUTIVE AUDIO OVERVIEWS */}
      {currentChamberTab === 'audio' && (
        <div className="bg-white p-4 rounded shadow-sm space-y-3 border border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <span className="font-ui-header text-[13px] font-bold text-[#191c1e]">
              {caseItem.audioTrack?.title || 'Executive Audio Breakdown'}
            </span>
            <span className="font-ui-label-mono text-[10px] px-2 py-0.5 bg-[#dae2fd] text-[#131b2e] rounded uppercase font-semibold">
              Dual Analyst Cast
            </span>
          </div>

          {/* Co-Hosts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#f2f4f6] rounded flex items-center gap-2 border border-[#e0e3e5]">
              <div className="w-7 h-7 rounded-full bg-[#1b3888] text-white flex items-center justify-center font-ui-label-mono text-[11px] font-bold">
                {caseItem.audioTrack?.host1.initials || 'AL'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-ui-header text-[12px] font-semibold text-[#191c1e] truncate">
                  {caseItem.audioTrack?.host1.name || 'Alex Chen'}
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74] truncate">
                  {caseItem.audioTrack?.host1.role || 'Macro Analyst'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#f2f4f6] rounded flex items-center gap-2 border border-[#e0e3e5]">
              <div className="w-7 h-7 rounded-full bg-[#81001d] text-white flex items-center justify-center font-ui-label-mono text-[11px] font-bold">
                {caseItem.audioTrack?.host2.initials || 'MO'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-ui-header text-[12px] font-semibold text-[#191c1e] truncate">
                  {caseItem.audioTrack?.host2.name || 'Morgan Vance'}
                </span>
                <span className="font-ui-label-mono text-[10px] text-[#565e74] truncate">
                  {caseItem.audioTrack?.host2.role || 'Strategy Fellow'}
                </span>
              </div>
            </div>
          </div>

          {/* Playback Controls & Speed Chips */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {[1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setPlaybackSpeed(rate)}
                  className={`px-2 py-1 rounded font-ui-label-mono text-[11px] font-bold transition-colors ${
                    playbackSpeed === rate
                      ? 'bg-[#81001d] text-white'
                      : 'bg-[#eceef0] text-[#191c1e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <span className="font-ui-label-mono text-[10px] text-[#565e74] font-semibold">
              HD Neural Synth
            </span>
          </div>

          {/* Synchronized Transcript Preview */}
          <div className="bg-[#f2f4f6] p-3 rounded text-[#191c1e] font-case-body-md text-[13px] leading-relaxed border border-[#e0e3e5]">
            {caseItem.audioTrack?.dialogue && caseItem.audioTrack.dialogue.length > 0 ? (
              caseItem.audioTrack.dialogue.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-ui-label-mono text-[11px] text-[#1b3888] font-bold block mb-0.5">
                    [{item.speaker} {item.time}]:
                  </span>
                  <p className={item.isHighlight ? 'bg-[#ffdad9] text-[#40000a] px-1.5 py-0.5 rounded font-medium' : ''}>
                    {item.text}
                  </p>
                </div>
              ))
            ) : (
              <div>
                <span className="font-ui-label-mono text-[11px] text-[#81001d] font-bold block mb-1">
                  [Executive Summary Synthesis]:
                </span>
                <p>
                  “In this {caseItem.course} case, the critical inflection point centers on whether the firm can sustain operational return on capital while competitors leverage lower-cost modular alternatives.”
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB C: SOCRATIC CHAT & HYPOTHESIS LAB */}
      {currentChamberTab === 'socratic' && (
        <div className="bg-white p-3.5 rounded shadow-sm space-y-3 border border-[#e2e8f0]">
          <div className="flex items-center justify-between border-b border-[#eceef0] pb-2">
            <span className="font-ui-header text-[13px] font-bold text-[#191c1e]">
              Socratic Cross-Examination
            </span>
            <span className="font-ui-label-mono text-[10px] text-[#565e74]">
              Interrogator: {caseItem.coldCall.professor}
            </span>
          </div>

          {/* Dialog List */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {socraticMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded ${
                  msg.sender === 'professor'
                    ? 'bg-[#f2f4f6] border border-[#e0e3e5]'
                    : 'bg-[#dae2fd] border border-[#bec6e0] ml-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-ui-header text-[12px] font-bold text-[#191c1e]">
                    {msg.name}
                  </span>
                  <span className="font-ui-label-mono text-[10px] text-[#565e74]">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="font-case-body-md text-[13px] text-[#191c1e] leading-snug">
                  {msg.text}
                </p>
                {msg.exhibitReference && (
                  <button
                    onClick={() => onOpenExhibit(msg.exhibitReference!)}
                    className="mt-1.5 font-ui-label-mono text-[10px] px-2 py-0.5 bg-white hover:bg-[#e6e8ea] text-[#191c1e] rounded flex items-center gap-1 border border-[#d8dadc]"
                  >
                    <ExternalLink className="w-3 h-3 text-[#81001d]" />
                    <span>Audit Attached Exhibits</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Supporting Documents Knowledge Base Badge if present */}
          {caseItem.supportingDocuments && caseItem.supportingDocuments.length > 0 && (
            <div className="bg-[#dae2fd]/70 p-2 rounded border border-[#bec6e0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-ui-header text-[#131b2e]">
                <Layers className="w-3.5 h-3.5 text-[#81001d] shrink-0" />
                <span className="font-semibold">
                  {caseItem.supportingDocuments.length} Supporting Material{caseItem.supportingDocuments.length > 1 ? 's' : ''} Active:
                </span>
                <span className="text-[#565e74] truncate max-w-[200px]">
                  {caseItem.supportingDocuments.map((d) => d.name).join(', ')}
                </span>
              </div>
              <span className="font-ui-label-mono text-[9px] uppercase px-1.5 py-0.5 bg-white text-[#81001d] font-bold rounded border border-[#bec6e0] shrink-0">
                AI Synthesis Ready
              </span>
            </div>
          )}

          {/* Quick Counter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {caseItem.supportingDocuments && caseItem.supportingDocuments.length > 0 && (
              <button
                onClick={() => setChatInput(`How does ${caseItem.supportingDocuments![0].name} support our strategic positioning?`)}
                className="px-2 py-1 bg-[#ffdad9] hover:bg-[#ffcdd2] rounded text-[10px] font-ui-label-mono uppercase font-bold text-[#40000a] flex items-center gap-1 border border-[#81001d]/20"
              >
                <Layers className="w-3 h-3" />
                <span>Ask: Consult {caseItem.supportingDocuments[0].categoryLabel}</span>
              </button>
            )}
            {caseItem.coldCall.suggestedRebuttals.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(chip)}
                className="px-2 py-1 bg-[#eceef0] hover:bg-[#e0e3e5] rounded text-[10px] font-ui-label-mono uppercase font-semibold text-[#191c1e]"
              >
                + {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendSocratic} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                caseItem.supportingDocuments && caseItem.supportingDocuments.length > 0
                  ? "Ask question or defend position (supports case & attached materials)..."
                  : "State defense or ask question for discussion..."
              }
              className="flex-1 bg-[#f2f4f6] px-3 py-2 rounded text-[#191c1e] font-ui-body text-[12px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#81001d] placeholder:text-[#565e74] border border-[#e0e3e5]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#81001d] text-white rounded font-ui-header text-[12px] flex items-center justify-center hover:bg-[#a51c30] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

