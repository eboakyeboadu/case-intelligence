import React, { useEffect } from 'react';
import { Play, Pause, Keyboard, BookOpen, Volume2 } from 'lucide-react';
import { CaseItem } from '../data/cases.ts';
import { speechPlayer } from '../utils/speech.ts';

interface AudioControllerStripProps {
  onTogglePlay?: () => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  onOpenExhibit?: (exhibitId: string) => void;
  activeExhibitId?: string;
  onTriggerMic?: () => void;
  activeCase?: CaseItem | null;
  currentReadingIndex?: number;
  hasAudioStarted?: boolean;
  elapsedSeconds?: number;
  totalSeconds?: number;
  totalUnitsCount?: number;
  activeUnitLabel?: string;
  onSeekUnit?: (unitIndex: number) => void;
  onSeekSecond?: (second: number) => void;
  playbackSpeed?: number;
  onChangePlaybackSpeed?: (speed: number) => void;
}

function formatAudioDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioControllerStrip: React.FC<AudioControllerStripProps> = ({
  onTogglePlay,
  isPlaying = false,
  isPaused = false,
  onOpenExhibit,
  activeExhibitId,
  onTriggerMic,
  activeCase,
  currentReadingIndex = 0,
  hasAudioStarted = false,
  elapsedSeconds = 0,
  totalSeconds = 120,
  totalUnitsCount = 1,
  activeUnitLabel,
  onSeekUnit,
  onSeekSecond,
  playbackSpeed = 1.0,
  onChangePlaybackSpeed,
}) => {
  // Spacebar hotkey listener to play / pause narration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)
      ) {
        if (activeCase && onTogglePlay) {
          e.preventDefault();
          speechPlayer.unlockAudio();
          onTogglePlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCase, onTogglePlay]);

  const exhibits = activeCase?.exhibits || [];
  const safeTotalUnits = Math.max(1, totalUnitsCount);
  const safeTotalSeconds = Math.max(1, totalSeconds);

  // Strict second-by-second calculation starting from 0%
  const isStarted = hasAudioStarted || isPlaying || isPaused;
  const progressPercent = isStarted && safeTotalSeconds > 0
    ? Math.min(100, Math.max(0, Math.round((elapsedSeconds / safeTotalSeconds) * 100)))
    : 0;

  const handlePlayClick = () => {
    speechPlayer.unlockAudio();
    if (onTogglePlay) onTogglePlay();
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSecond = Math.round(fraction * safeTotalSeconds);

    if (onSeekSecond) {
      onSeekSecond(targetSecond);
    } else if (onSeekUnit) {
      const targetIndex = Math.min(safeTotalUnits - 1, Math.floor(fraction * safeTotalUnits));
      onSeekUnit(targetIndex);
    }
  };

  return (
    <div className="bg-[#e6e8ea] p-2.5 rounded shadow-md flex flex-col space-y-2 sticky bottom-0 z-20 border border-[#d8dadc]">
      <div className="flex items-center justify-between gap-2">
        {/* Scrub Bar & Track Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            id="globalPlayPauseBtn"
            onClick={handlePlayClick}
            disabled={!activeCase}
            aria-label={isPlaying ? 'Pause reading aloud' : isPaused ? 'Resume reading case' : 'Play & Read case aloud'}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isPlaying
                ? 'bg-[#81001d] text-white animate-pulse ring-2 ring-[#81001d]/30'
                : isPaused
                ? 'bg-[#d97706] text-white hover:bg-[#b45309]'
                : 'bg-[#191c1e] text-white hover:bg-[#81001d]'
            }`}
            title={!activeCase ? 'Upload document (s) to read aloud' : isPlaying ? 'Pause reading' : isPaused ? 'Resume reading' : 'Play & Read case aloud'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </button>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex justify-between items-center text-[#191c1e]">
              <div className="flex items-center gap-1.5 truncate">
                {isPlaying && <Volume2 className="w-3.5 h-3.5 text-[#81001d] animate-bounce shrink-0" />}
                <span className="font-ui-header text-[11px] sm:text-[12px] font-semibold truncate">
                  {isPlaying ? 'Reading: ' : isPaused ? 'Paused: ' : 'Audio: '}
                  {activeUnitLabel ? `${activeUnitLabel} • ` : ''}
                  {activeCase ? activeCase.title : 'No document uploaded'}
                </span>
              </div>
              <span
                id="audioTimeline"
                className="font-ui-label-mono text-[9px] sm:text-[10px] text-[#565e74] shrink-0 ml-1.5 sm:ml-2 font-semibold"
              >
                {activeCase
                  ? `${formatAudioDuration(elapsedSeconds)} / ${formatAudioDuration(safeTotalSeconds)} (${progressPercent}%)`
                  : '0% • 0:00 (Upload document (s) to begin)'}
              </span>
            </div>

            {/* Clickable Progress Scrub Bar (Syncs second by second) */}
            <div
              className="w-full bg-[#cbd5e1] hover:bg-[#b8c2cf] h-2.5 sm:h-2 rounded-full overflow-hidden mt-1 cursor-pointer transition-colors"
              onClick={handleScrubClick}
              title="Click to seek second-by-second position"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isPaused ? 'bg-[#d97706]' : 'bg-[#81001d]'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Speed Selector Pills */}
        <div className="flex items-center gap-1 shrink-0 bg-[#d8dadc] p-0.5 rounded border border-[#cbd5e1]">
          {[1.0, 1.25, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangePlaybackSpeed && onChangePlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-ui-label-mono font-bold transition-all ${
                playbackSpeed === spd
                  ? 'bg-[#81001d] text-white shadow-xs'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-white/60'
              }`}
              title={`Set speech speed to ${spd}x`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Dynamic Exhibit Docking Pills */}
        {exhibits.length > 0 && onOpenExhibit ? (
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-[100px] sm:max-w-none">
            {exhibits.map((ex, idx) => (
              <button
                key={ex.id}
                onClick={() => onOpenExhibit(ex.id)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-ui-label-mono font-bold transition-colors shrink-0 ${
                  activeExhibitId === ex.id
                    ? 'bg-[#81001d] text-white'
                    : 'bg-[#eceef0] text-[#191c1e] hover:bg-[#d8dadc]'
                }`}
                title={ex?.title || 'Exhibit'}
              >
                Ex {idx + 1}
              </button>
            ))}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 shrink-0 text-[#565e74] font-ui-label-mono text-[10px]">
            <BookOpen className="w-3.5 h-3.5 text-[#81001d]" />
            <span>Document Centric</span>
          </div>
        )}
      </div>

      {/* Reading Aloud Control Hint */}
      <div className="hidden sm:flex items-center justify-between text-[10px] font-ui-label-mono text-[#565e74] border-t border-[#d8dadc]/60 pt-1">
        <div className="flex items-center gap-1">
          <Keyboard className="w-3 h-3 text-[#81001d]" />
          <span>Press [Space] to Play / Pause reading aloud</span>
        </div>
        <span className="text-[#81001d] font-bold">
          {isPlaying ? 'Narration Active' : isPaused ? 'Narration Paused' : activeCase ? 'Ready to Read' : 'Upload Document to Read'}
        </span>
      </div>
    </div>
  );
};

