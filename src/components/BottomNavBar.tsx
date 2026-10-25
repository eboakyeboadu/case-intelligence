import React from 'react';
import {
  BookOpen,
  BarChart3,
  ShieldCheck,
  Table,
  Play,
  Pause,
  Mic,
  FolderKanban,
  Layers
} from 'lucide-react';
import { NavigationTab } from '../types.ts';

interface BottomNavBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onQuickPlay: () => void;
  onQuickMic: () => void;
  onOpenProjectsModal?: () => void;
  isPlaying: boolean;
  isMicActive: boolean;
  activeProjectCode?: string;
  activeCaseNumber?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  onQuickPlay,
  onQuickMic,
  onOpenProjectsModal,
  isPlaying,
  isMicActive,
  activeProjectCode = 'PROJECT',
  activeCaseNumber = 'Case Item',
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-white/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-[#e2e8f0]">
      <div className="flex items-center justify-around h-13 px-2 max-w-lg mx-auto">
        <button
          onClick={() => onSelectTab('reader')}
          className={`flex flex-col items-center justify-center flex-1 h-11 transition-all rounded-lg py-1 ${
            currentTab === 'reader'
              ? 'bg-[#fff0f2] text-[#81001d] font-bold'
              : 'text-[#64748b] hover:text-[#191c1e]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-ui-label-mono text-[9px] mt-0.5 font-semibold">Read</span>
        </button>

        <button
          onClick={() => onSelectTab('intel')}
          className={`flex flex-col items-center justify-center flex-1 h-11 transition-all rounded-lg py-1 ${
            currentTab === 'intel'
              ? 'bg-[#fff0f2] text-[#81001d] font-bold'
              : 'text-[#64748b] hover:text-[#191c1e]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="font-ui-label-mono text-[9px] mt-0.5 font-semibold">Cold Call</span>
        </button>

        <button
          onClick={() => onSelectTab('project')}
          className={`flex flex-col items-center justify-center flex-1 h-11 transition-all rounded-lg py-1 ${
            currentTab === 'project' || currentTab === 'supporting' || currentTab === 'exhibits'
              ? 'bg-[#fff0f2] text-[#81001d] font-bold'
              : 'text-[#64748b] hover:text-[#191c1e]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="font-ui-label-mono text-[9px] mt-0.5 font-semibold">Materials</span>
        </button>

        <button
          onClick={() => onSelectTab('defense')}
          className={`flex flex-col items-center justify-center flex-1 h-11 transition-all rounded-lg py-1 ${
            currentTab === 'defense'
              ? 'bg-[#fff0f2] text-[#81001d] font-bold'
              : 'text-[#64748b] hover:text-[#191c1e]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="font-ui-label-mono text-[9px] mt-0.5 font-semibold">Defense</span>
        </button>

        <button
          onClick={() => {
            if (onOpenProjectsModal) onOpenProjectsModal();
          }}
          className="flex flex-col items-center justify-center flex-1 h-11 transition-all rounded-lg py-1 text-[#64748b] hover:text-[#81001d] hover:bg-[#ffdad9]/30"
          title="Browse all Cloud Projects"
        >
          <FolderKanban className="w-4 h-4 text-[#81001d]" />
          <span className="font-ui-label-mono text-[9px] mt-0.5 font-semibold">Projects</span>
        </button>
      </div>
    </nav>
  );
};

