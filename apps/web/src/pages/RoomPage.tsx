import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useLiveKit } from '../hooks/useLiveKit';
import { roomApi } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { BottomControlBar } from '../components/BottomControlBar';
import { Sidebar } from '../components/Sidebar';
import { LocalVideoPlayer } from '../components/LocalVideoPlayer';
import { ScreenSharePlayer } from '../components/ScreenSharePlayer';
import { FilePickerModal } from '../components/FilePickerModal';
import { InviteModal } from '../components/InviteModal';
import { Users, AlertOctagon, Loader2 } from 'lucide-react';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || undefined;
  const navigate = useNavigate();

  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { room, setRoom, initWs, disconnectWs } = useRoomStore();

  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // LiveKit hook for voice chat and screen-share transport
  const {
    speakingUserIds,
    screenShareTrack,
    screenShareAudioTrack,
    isSharingScreen,
    stats,
    startScreenShare,
    stopScreenShare,
  } = useLiveKit(roomId);

  // 1. Authenticate check & Room Join
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate(`/login?redirect=/rooms/${roomId}${inviteToken ? `?invite=${inviteToken}` : ''}`);
      return;
    }

    if (!roomId) return;

    let isMounted = true;
    async function loadRoom() {
      setIsLoadingRoom(true);
      setRoomError(null);
      try {
        // Attempt to join room
        const roomData = await roomApi.joinRoom(roomId!, inviteToken);
        if (isMounted) {
          setRoom(roomData);
          initWs(roomId!);
          setIsLoadingRoom(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error joining room:', err);
          setRoomError(err.message || 'Could not join room');
          setIsLoadingRoom(false);
        }
      }
    }

    loadRoom();

    return () => {
      isMounted = false;
      disconnectWs();
    };
  }, [roomId, user, isAuthLoading, inviteToken]);

  // Loading state
  if (isAuthLoading || isLoadingRoom) {
    return (
      <div className="min-h-screen bg-graphite-950 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-graphite-400 font-mono">Entering Watch Party...</p>
      </div>
    );
  }

  // Room Error / Capacity Rejection State
  if (roomError) {
    const isFull = roomError.toLowerCase().includes('capacity') || roomError.toLowerCase().includes('full');
    return (
      <div className="min-h-screen bg-graphite-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-graphite-900 border border-graphite-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            {isFull ? <Users className="w-7 h-7" /> : <AlertOctagon className="w-7 h-7" />}
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {isFull ? 'Room Full' : 'Cannot Enter Party'}
          </h2>
          <p className="text-xs text-graphite-400 leading-relaxed mb-6">
            {roomError}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-graphite-800 hover:bg-graphite-700 text-white text-xs font-semibold py-3 rounded-xl transition border border-graphite-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Active Presentation Mode
  const isScreenShareMode = room?.mediaMode === 'SCREEN_SHARE' || isSharingScreen || !!screenShareTrack;

  return (
    <div className="h-screen w-screen bg-graphite-950 flex flex-col overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar onOpenInviteModal={() => setIsInviteModalOpen(true)} />

      {/* Main Workspace (Player Area + Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Dominating Media Player */}
        <div className="flex-1 h-full bg-black flex items-center justify-center overflow-hidden">
          {isScreenShareMode ? (
            <ScreenSharePlayer
              videoTrack={screenShareTrack}
              audioTrack={screenShareAudioTrack}
              isSharingScreen={isSharingScreen}
              onStopSharing={stopScreenShare}
              stats={stats}
            />
          ) : (
            <LocalVideoPlayer onOpenFilePicker={() => setIsFilePickerOpen(true)} />
          )}
        </div>

        {/* Collapsible Right Sidebar */}
        <Sidebar speakingUserIds={speakingUserIds} />
      </div>

      {/* Bottom Control Bar */}
      <BottomControlBar
        isSharingScreen={isSharingScreen}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onOpenFilePicker={() => setIsFilePickerOpen(true)}
      />

      {/* Modals */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};
