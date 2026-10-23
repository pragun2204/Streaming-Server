import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Info,
  Send,
  Crown,
  Volume2,
  UserX,
  ChevronRight,
} from 'lucide-react';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';
import { usePlaybackStore } from '../stores/playbackStore';
import { useVoiceStore } from '../stores/voiceStore';
import { roomApi } from '../lib/api';
import { formatFileSize } from '../lib/utils';

interface SidebarProps {
  speakingUserIds: Set<string>;
}

export const Sidebar: React.FC<SidebarProps> = ({ speakingUserIds }) => {
  const {
    room,
    participants,
    chatMessages,
    sendChatMessage,
    activeSidebarTab,
    setActiveSidebarTab,
    isSidebarOpen,
    toggleSidebar,
  } = useRoomStore();

  const { user } = useAuthStore();
  const { playbackState, localFile, isCompatible } = usePlaybackStore();
  const { participantVolumes, setParticipantVolume } = useVoiceStore();

  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = room && user ? room.hostUserId === user.id : false;

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeSidebarTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeSidebarTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendChatMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleTransferHost = async (targetUserId: string) => {
    if (!room) return;
    try {
      await roomApi.transferHost(room.id, targetUserId);
    } catch (err: any) {
      alert(err.message || 'Failed to transfer host');
    }
  };

  const handleKick = async (targetUserId: string) => {
    if (!room) return;
    if (confirm('Are you sure you want to remove this participant?')) {
      try {
        await roomApi.kickParticipant(room.id, targetUserId);
      } catch (err: any) {
        alert(err.message || 'Failed to kick participant');
      }
    }
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-80 h-full border-l border-graphite-800 bg-graphite-900 flex flex-col z-10 shrink-0">
      {/* Header Tabs */}
      <div className="h-12 border-b border-graphite-800 flex items-center justify-between px-2 bg-graphite-900/50">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSidebarTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSidebarTab === 'chat'
                ? 'bg-graphite-800 text-white'
                : 'text-graphite-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('participants')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSidebarTab === 'participants'
                ? 'bg-graphite-800 text-white'
                : 'text-graphite-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People ({participants.length})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('media')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSidebarTab === 'media'
                ? 'bg-graphite-800 text-white'
                : 'text-graphite-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Media</span>
          </button>
        </div>

        <button
          onClick={toggleSidebar}
          className="text-graphite-400 hover:text-white p-1 rounded hover:bg-graphite-800 transition"
          title="Close Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Chat Stream */}
      {activeSidebarTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-xs text-graphite-500 py-8">
                No messages yet. Say hello to the room!
              </div>
            ) : (
              chatMessages.map((msg) =>
                msg.isSystem ? (
                  <div key={msg.id} className="text-center py-1 text-[11px] text-graphite-500 italic">
                    {msg.message}
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col space-y-0.5 text-xs">
                    <div className="flex items-baseline space-x-2">
                      <span className={`font-semibold ${msg.senderUserId === user?.id ? 'text-indigo-400' : 'text-graphite-200'}`}>
                        {msg.senderDisplayName}
                      </span>
                      <span className="text-[10px] text-graphite-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-graphite-300 break-words leading-relaxed">{msg.message}</p>
                  </div>
                )
              )
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-graphite-800 bg-graphite-850 flex items-center space-x-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Send message to room..."
              className="flex-1 bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-xs text-white placeholder-graphite-500 focus:outline-none focus:border-indigo-500 transition"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Participants */}
      {activeSidebarTab === 'participants' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider mb-2">
            In Room ({participants.length}/10)
          </div>

          {participants.map((p) => {
            const isSelf = p.userId === user?.id;
            const isSpeaker = speakingUserIds.has(p.userId);
            const userVol = participantVolumes[p.userId] ?? 1.0;

            return (
              <div
                key={p.userId}
                className="bg-graphite-850 border border-graphite-800 rounded-lg p-2.5 flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Avatar with speaking indicator */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isSpeaker
                          ? 'ring-2 ring-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'bg-graphite-700 text-graphite-300'
                      }`}
                    >
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-medium text-white">{p.displayName}</span>
                        {isSelf && <span className="text-[10px] text-graphite-400">(You)</span>}
                        {p.role === 'HOST' && (
                          <span title="Room Host">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-graphite-400">
                        {p.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Host Moderation Actions */}
                  {isHost && !isSelf && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleTransferHost(p.userId)}
                        className="text-graphite-400 hover:text-amber-400 p-1 rounded hover:bg-graphite-800 transition text-[10px]"
                        title="Make Room Host"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleKick(p.userId)}
                        className="text-graphite-400 hover:text-rose-400 p-1 rounded hover:bg-graphite-800 transition"
                        title="Remove Participant"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Individual Participant Volume Slider */}
                {!isSelf && (
                  <div className="flex items-center space-x-2 pt-1 border-t border-graphite-800/60">
                    <Volume2 className="w-3 h-3 text-graphite-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={userVol}
                      onChange={(e) => setParticipantVolume(p.userId, parseFloat(e.target.value))}
                      className="w-full h-1 bg-graphite-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      title={`${p.displayName}'s Volume`}
                    />
                    <span className="text-[10px] font-mono text-graphite-400 w-7 text-right">
                      {Math.round(userVol * 100)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Media Info */}
      {activeSidebarTab === 'media' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider block mb-2">
              Active Media Presentation
            </span>
            <div className="bg-graphite-850 border border-graphite-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-graphite-400">Mode</span>
                <span className="font-semibold text-white">
                  {room?.mediaMode === 'SCREEN_SHARE'
                    ? '1080p60 Screen Share'
                    : room?.mediaMode === 'LOCAL_FILE'
                    ? 'Synchronized Local Video'
                    : 'Idle (No Stream)'}
                </span>
              </div>

              {playbackState.mediaName && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-graphite-400">File Name</span>
                    <span className="text-indigo-300 font-mono truncate max-w-[140px]" title={playbackState.mediaName}>
                      {playbackState.mediaName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-graphite-400">Size</span>
                    <span className="text-graphite-300 font-mono">
                      {formatFileSize(playbackState.mediaSize || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-graphite-400">Fingerprint</span>
                    <span className="text-graphite-400 font-mono text-[10px] truncate max-w-[120px]" title={playbackState.mediaId || ''}>
                      {playbackState.mediaId?.substring(0, 16)}...
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-graphite-400 uppercase tracking-wider block mb-2">
              Sync Compatibility
            </span>
            <div className="bg-graphite-850 border border-graphite-800 rounded-lg p-3">
              {localFile ? (
                isCompatible ? (
                  <p className="text-emerald-400 leading-relaxed">
                    ✓ Your local copy matches the host. You are synchronized frame-for-frame.
                  </p>
                ) : (
                  <p className="text-amber-400 leading-relaxed">
                    ⚠ File mismatch: Your selected file does not match the room media fingerprint.
                  </p>
                )
              ) : (
                <p className="text-graphite-400 leading-relaxed">
                  No local file selected yet. Click "Local Movie" in the bottom toolbar to load your copy.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
