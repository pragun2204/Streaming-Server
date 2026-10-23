import React, { useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Activity,
  StopCircle,
} from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { WebRTCStats } from '../types';

interface ScreenSharePlayerProps {
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  isSharingScreen: boolean;
  onStopSharing: () => void;
  stats: WebRTCStats | null;
}

export const ScreenSharePlayer: React.FC<ScreenSharePlayerProps> = ({
  videoTrack,
  audioTrack,
  isSharingScreen,
  onStopSharing,
  stats,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const { mediaVolume, setMediaVolume } = useVoiceStore();

  // Attach video track
  useEffect(() => {
    if (!videoRef.current) return;
    if (videoTrack) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [videoTrack]);

  // Attach audio track
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioTrack) {
      const stream = new MediaStream([audioTrack]);
      audioRef.current.srcObject = stream;
      audioRef.current.autoplay = true;
      audioRef.current.volume = mediaVolume;
      void audioRef.current.play().catch(() => {
        console.warn('Screen-share audio is waiting for browser playback permission');
      });
    } else {
      audioRef.current.srcObject = null;
    }
  }, [audioTrack, mediaVolume]);

  // Sync volume with mediaVolume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = mediaVolume;
    }
  }, [mediaVolume]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Hidden Audio Element for Screen-Share Audio */}
      <audio ref={audioRef} autoPlay />

      {/* Real-time Diagnostics HUD */}
      <DiagnosticsPanel
        stats={stats}
        driftMs={0}
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />

      {/* Overlay Badge for Screen Share */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10 opacity-70 group-hover:opacity-100 transition">
        <div className="flex items-center space-x-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">LIVE SCREEN</span>
        </div>
      </div>

      {/* Bottom Floating Control Bar for Screen Sharing (Controls volume, fullscreen, diagnostics) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-graphite-900/90 border border-graphite-700/80 rounded-xl px-4 py-2.5 backdrop-blur-md flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-2xl">
        {/* Diagnostics Button */}
        <button
          onClick={() => setShowDiagnostics((prev) => !prev)}
          className={`p-1.5 rounded-lg transition ${
            showDiagnostics ? 'text-indigo-400 bg-indigo-500/20' : 'text-graphite-400 hover:text-white hover:bg-graphite-800'
          }`}
          title="Toggle Diagnostics"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Media Volume Slider */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMediaVolume(mediaVolume === 0 ? 0.8 : 0)}
            className="text-graphite-400 hover:text-white transition"
          >
            {mediaVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={mediaVolume}
            onChange={(e) => setMediaVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-graphite-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title="Screen Audio Volume"
          />
        </div>

        {/* Host Stop Sharing Button */}
        {isSharingScreen && (
          <button
            onClick={onStopSharing}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-md"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Stop Sharing</span>
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="text-graphite-400 hover:text-white p-1.5 hover:bg-graphite-800 rounded-lg transition"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
