import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Activity,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useVoiceStore } from '../stores/voiceStore';
import { usePlaybackSync } from '../hooks/usePlaybackSync';
import { formatTime, formatFileSize } from '../lib/utils';
import { DiagnosticsPanel } from './DiagnosticsPanel';

interface LocalVideoPlayerProps {
  onOpenFilePicker: () => void;
}

export const LocalVideoPlayer: React.FC<LocalVideoPlayerProps> = ({ onOpenFilePicker }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    playbackState,
    localFile,
    isCompatible,
    driftMs,
  } = usePlaybackStore();

  const { mediaVolume, setMediaVolume } = useVoiceStore();

  const { handleHostPlay, handleHostPause, handleHostSeek, isHost } =
    usePlaybackSync(videoRef);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Create ObjectURL for local video file
  useEffect(() => {
    if (localFile) {
      const url = URL.createObjectURL(localFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoSrc(null);
    }
  }, [localFile]);

  // Volume synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = mediaVolume;
    }
  }, [mediaVolume]);

  const onTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const isPlaying = playbackState.status === 'PLAYING';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group select-none"
    >
      {/* HTML5 Video Element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          playsInline
        />
      ) : (
        /* Empty State / Select File Prompt */
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-graphite-800 border border-graphite-700 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {playbackState.mediaName
              ? `Select "${playbackState.mediaName}"`
              : 'No Local Video Selected'}
          </h3>
          <p className="text-xs text-graphite-400 mb-6 leading-relaxed">
            {playbackState.mediaName
              ? `The host selected a movie (${formatFileSize(playbackState.mediaSize || 0)}). Select the matching file on your computer to watch in synchronized lockstep.`
              : 'Select any local video file (MP4, WebM, MKV) to play in synchronized high-fidelity across all participants.'}
          </p>
          <button
            onClick={onOpenFilePicker}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Select Local Movie File</span>
          </button>
        </div>
      )}

      {/* Incompatible File Warning */}
      {videoSrc && playbackState.mediaId && !isCompatible && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-1.5 rounded-lg backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>File mismatch: Your selected file does not match the host's video fingerprint.</span>
          <button
            onClick={onOpenFilePicker}
            className="underline font-semibold ml-2 text-amber-300 hover:text-white"
          >
            Change
          </button>
        </div>
      )}

      {/* Compatible indicator */}
      {videoSrc && playbackState.mediaId && isCompatible && (
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium text-[11px]">Synchronized</span>
        </div>
      )}

      {/* Diagnostics Panel */}
      <DiagnosticsPanel
        stats={null}
        driftMs={driftMs}
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />

      {/* Bottom Floating Timeline Controls */}
      {videoSrc && (
        <div className="absolute bottom-4 left-4 right-4 bg-graphite-900/90 border border-graphite-700/80 rounded-xl px-4 py-3 backdrop-blur-md flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-2xl">
          {/* Progress Slider */}
          <div className="flex items-center space-x-3 text-xs font-mono text-graphite-300">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              disabled={!isHost}
              onChange={(e) => {
                if (isHost) {
                  handleHostSeek(parseFloat(e.target.value));
                }
              }}
              className={`flex-1 h-1.5 rounded-lg appearance-none bg-graphite-700 accent-indigo-500 ${
                isHost ? 'cursor-pointer' : 'cursor-default opacity-80'
              }`}
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Button Row */}
          <div className="flex items-center justify-between">
            {/* Play/Pause & Media Volume */}
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? handleHostPause : handleHostPlay}
                disabled={!isHost}
                className={`p-2 rounded-lg transition ${
                  isHost
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-graphite-800 text-graphite-400 cursor-not-allowed'
                }`}
                title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Host controls playback'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Volume */}
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
                  title="Media Volume"
                />
              </div>

              {!isHost && (
                <span className="text-[11px] text-graphite-400 hidden sm:inline italic">
                  (Controlled by Host)
                </span>
              )}
            </div>

            {/* Actions: Diagnostics & Fullscreen */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className={`p-1.5 rounded-lg transition ${
                  showDiagnostics ? 'text-indigo-400 bg-indigo-500/20' : 'text-graphite-400 hover:text-white hover:bg-graphite-800'
                }`}
                title="Toggle Diagnostics"
              >
                <Activity className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-graphite-400 hover:text-white p-1.5 hover:bg-graphite-800 rounded-lg transition"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
