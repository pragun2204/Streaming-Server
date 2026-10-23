import React from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  VolumeX,
  ScreenShare,
  StopCircle,
  FolderOpen,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';

interface BottomControlBarProps {
  isSharingScreen: boolean;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onOpenFilePicker: () => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  isSharingScreen,
  onStartScreenShare,
  onStopScreenShare,
  onOpenFilePicker,
}) => {
  const {
    isMicMuted,
    toggleMic,
    isDeafened,
    toggleDeafen,
    isPushToTalk,
  } = useVoiceStore();

  const {
    room,
    isSidebarOpen,
    toggleSidebar,
    activeSidebarTab,
    setActiveSidebarTab,
    participants,
  } = useRoomStore();

  const { user } = useAuthStore();
  const isHost = room && user ? room.hostUserId === user.id : false;

  return (
    <footer className="h-16 border-t border-graphite-800 bg-graphite-900/95 px-4 flex items-center justify-between z-20 backdrop-blur">
      {/* Left: Voice Controls */}
      <div className="flex items-center space-x-2">
        {/* Microphone Button */}
        <button
          onClick={toggleMic}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium text-xs transition ${
            isMicMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
              : 'bg-graphite-800 hover:bg-graphite-700 text-graphite-100 border border-graphite-700'
          }`}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mute'}</span>
        </button>

        {/* Deafen Button */}
        <button
          onClick={toggleDeafen}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium text-xs transition ${
            isDeafened
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
              : 'bg-graphite-800 hover:bg-graphite-700 text-graphite-100 border border-graphite-700'
          }`}
          title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
          <span className="hidden sm:inline">{isDeafened ? 'Deafened' : 'Deafen'}</span>
        </button>

        {isPushToTalk && (
          <span className="hidden md:inline text-[11px] font-mono bg-graphite-850 text-indigo-400 border border-graphite-800 px-2 py-1 rounded">
            PTT: [Space]
          </span>
        )}
      </div>

      {/* Center: Media Presentation Actions */}
      <div className="flex items-center space-x-2">
        {/* Screen Share Action (Host) */}
        {isHost && (
          <button
            onClick={isSharingScreen ? onStopScreenShare : onStartScreenShare}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-sm ${
              isSharingScreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isSharingScreen ? <StopCircle className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isSharingScreen ? 'Stop Screen' : 'Share Screen (1080p60)'}
            </span>
          </button>
        )}

        {/* Local Video File Action */}
        <button
          onClick={onOpenFilePicker}
          className="flex items-center space-x-2 bg-graphite-800 hover:bg-graphite-700 text-graphite-200 border border-graphite-700 px-3.5 py-2 rounded-lg text-xs font-medium transition"
          title="Select Local Movie File"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Local Movie</span>
        </button>
      </div>

      {/* Right: Sidebar Toggles */}
      <div className="flex items-center space-x-2">
        {/* Participants Tab Button */}
        <button
          onClick={() => {
            if (isSidebarOpen && activeSidebarTab === 'participants') {
              toggleSidebar();
            } else {
              setActiveSidebarTab('participants');
            }
          }}
          className={`flex items-center space-x-1.5 p-2 rounded-lg transition ${
            isSidebarOpen && activeSidebarTab === 'participants'
              ? 'bg-indigo-600 text-white'
              : 'text-graphite-400 hover:text-white hover:bg-graphite-800'
          }`}
          title="Participants"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs font-bold">{participants.length}</span>
        </button>

        {/* Chat Tab Button */}
        <button
          onClick={() => {
            if (isSidebarOpen && activeSidebarTab === 'chat') {
              toggleSidebar();
            } else {
              setActiveSidebarTab('chat');
            }
          }}
          className={`p-2 rounded-lg transition ${
            isSidebarOpen && activeSidebarTab === 'chat'
              ? 'bg-indigo-600 text-white'
              : 'text-graphite-400 hover:text-white hover:bg-graphite-800'
          }`}
          title="Toggle Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
